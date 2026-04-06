import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import useTaskStepExecution from "@/hooks/useTaskStepExecution";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useTaskAssignments } from "@/hooks/useTaskAssignment";
import { useTaskSchedules } from "@/hooks/useTaskSchedule";

// ─── Types ───────────────────────────────────────────────────────────────────
interface RouteParams {
  id: string;
}

enum StepStatus {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Completed = "Completed",
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TaskExecutionScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { completeStep } = useTaskStepExecution();
  const { updateTaskAssignmentStatus, getTaskAssignmentById } =
    useTaskAssignments();
  const { getTaskScheduleById } = useTaskSchedules();
  const { getWorkerProfile } = useAuth();

  const params = route.params as RouteParams;
  const taskAssignmentId = params?.id;

  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // ─── LOAD WORKER ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const profile = await getWorkerProfile();
        setWorkerId(profile?.id);
      } catch {}
    })();
  }, []);

  // ─── LOAD REAL DATA ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (!taskAssignmentId) return;

      setLoading(true);
      try {
        // 1. Get TaskAssignment
        const task = await getTaskAssignmentById(taskAssignmentId);
        if (!task) throw new Error("Task not found");

        // 2. Get TaskSchedule + steps (đã parse sẵn)
        const { schedule, steps: sopSteps } = await getTaskScheduleById(
          task.taskScheduleId,
        );

        if (!schedule) throw new Error("Schedule not found");

        // 3. Sort theo StepOrder
        const sortedSteps = [...sopSteps].sort(
          (a: any, b: any) => a.stepOrder - b.stepOrder,
        );

        // 4. Map UI
        const mappedSteps = sortedSteps.map((s: any, index: number) => {
          const config = s.config || {};

          let tasks: any[] = [];
          let description = "";

          // ✅ Checklist
          if (config.items) {
            tasks = config.items.map((item: string, i: number) => ({
              id: `${s.id}-${i}`,
              title: item,
              done: false,
            }));
          }

          // ✅ PPE
          if (config.requiredPPE) {
            description = `PPE: ${config.requiredPPE.join(", ")}`;
          }

          // ✅ Equipment
          if (config.requiredEquipment) {
            description =
              "Equipment: " +
              config.requiredEquipment.map((e: any) => e.name).join(", ");
          }

          // ✅ Photo
          if (config.phase) {
            description = `${config.phase.toUpperCase()} - Min photos: ${config.minPhotos}`;
          }

          // ✅ QR / method
          if (config.method) {
            description = `Method: ${config.method}`;
          }

          // ✅ Note
          if (config.requireNote) {
            description = "Require note";
          }

          return {
            id: s.id,
            name: s.name || `Step ${s.stepOrder}`,
            description,
            status: index === 0 ? StepStatus.InProgress : StepStatus.NotStarted,
            tasks,
          };
        });

        // 5. Restore progress
        const raw = await AsyncStorage.getItem(
          `taskProgress:${taskAssignmentId}`,
        );

        if (raw) {
          const saved = JSON.parse(raw);
          const merged = mappedSteps.map((s: any) => {
            const match = saved.find((x: any) => x.id === s.id);
            return match ? { ...s, ...match } : s;
          });
          setSteps(merged);
        } else {
          setSteps(mappedSteps);
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskAssignmentId]);

  // ─── LOGIC ─────────────────────────────────────────────────────────────────
  const currentStepIndex = steps.findIndex(
    (s) => s.status === StepStatus.InProgress,
  );

  const completedCount = steps.filter(
    (s) => s.status === StepStatus.Completed,
  ).length;

  const allCompleted = steps.every((s) => s.status === StepStatus.Completed);

  const toggleSubtask = (stepId: string, taskId: string) => {
    const updated = steps.map((s) => {
      if (s.id !== stepId) return s;
      return {
        ...s,
        tasks: s.tasks.map((t: any) =>
          t.id === taskId ? { ...t, done: !t.done } : t,
        ),
      };
    });

    setSteps(updated);

    AsyncStorage.setItem(
      `taskProgress:${taskAssignmentId}`,
      JSON.stringify(updated),
    );
  };

  const handleCompleteStep = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);

    if (!step.tasks.every((t: any) => t.done)) {
      Alert.alert("Complete subtasks first");
      return;
    }

    try {
      setLoading(true);

      const res: any = await completeStep(stepId, {
        workerId,
      });

      const nextId = res?.nextStepId;

      const updated = steps.map((s) => {
        if (s.id === stepId) return { ...s, status: StepStatus.Completed };
        if (s.id === nextId) return { ...s, status: StepStatus.InProgress };
        return s;
      });

      setSteps(updated);

      await AsyncStorage.setItem(
        `taskProgress:${taskAssignmentId}`,
        JSON.stringify(updated),
      );
    } catch {
      Alert.alert("Error", "Complete step failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTask = async () => {
    const success = await updateTaskAssignmentStatus(taskAssignmentId, 2);

    if (success) {
      await AsyncStorage.removeItem(`taskProgress:${taskAssignmentId}`);

      navigation.navigate("Tasks" as never);
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <Header title="Task Execution" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll}>
        {/* Progress */}
        <Text style={styles.progress}>
          {completedCount}/{steps.length} completed
        </Text>

        {loading ? (
          <ActivityIndicator />
        ) : (
          steps.map((step, index) => (
            <View key={step.id} style={styles.card}>
              <Text style={styles.title}>
                {step.name || `Step ${index + 1}`}
              </Text>

              <Text style={styles.desc}>{step.description}</Text>

              {/* Subtasks */}
              {step.tasks.map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => toggleSubtask(step.id, t.id)}
                  style={styles.subtask}
                >
                  <Text>{t.title}</Text>
                  <Text>{t.done ? "✅" : "⬜"}</Text>
                </TouchableOpacity>
              ))}

              {index === currentStepIndex && (
                <AppButton
                  label="Complete Step"
                  onPress={() => handleCompleteStep(step.id)}
                />
              )}
            </View>
          ))
        )}

        {allCompleted && (
          <AppButton label="Finish Task" onPress={handleFinishTask} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 16 },
  progress: { marginBottom: 12 },
  card: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: { fontWeight: "700" },
  desc: { color: "#64748B", marginVertical: 6 },
  subtask: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});
