import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import useTaskStepExecution from "@/hooks/useTaskStepExecution";
import { Ionicons } from "@expo/vector-icons";
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
import {
  TaskStepExecutionDto,
  useTaskAssignments,
} from "@/hooks/useTaskAssignment";

// ─── Types ───────────────────────────────────────────────────────────────────
interface RouteParams {
  id: string; // taskAssignmentId
  steps: TaskStepExecutionDto[];
}

enum StepStatus {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Completed = "Completed",
}

// ─── Status Configuration ────────────────────────────────────────────────────
const STEP_STATUS_CONFIG: Record<
  StepStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  [StepStatus.NotStarted]: {
    label: "Not Started",
    color: "#94A3B8",
    bg: "#F1F5F9",
    icon: "radio-button-off",
  },
  [StepStatus.InProgress]: {
    label: "In Progress",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "time-outline",
  },
  [StepStatus.Completed]: {
    label: "Completed",
    color: "#10B981",
    bg: "#ECFDF5",
    icon: "checkmark-circle",
  },
};

// ─── Components ──────────────────────────────────────────────────────────────
const StepCard = ({
  step,
  stepNumber,
  isActive,
  onComplete,
  onToggleSubtask,
  onPress,
}: {
  step: TaskStepExecutionDto;
  stepNumber: number;
  isActive: boolean;
  onComplete?: () => void;
  onToggleSubtask?: (taskId: string) => void;
  onPress?: () => void;
}) => {
  const status = step.status as StepStatus;
  const cfg = STEP_STATUS_CONFIG[status];
  const isCompleted = status === StepStatus.Completed;
  const subtasks = (step as any).tasks || [];
  const subtasksDone =
    subtasks.length > 0 && subtasks.every((t: any) => t.done);
  const isInProgress = status === StepStatus.InProgress;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress && onPress()}
      style={[styles.stepCard, isActive && styles.stepCardActive]}
    >
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepHeaderLeft}>
          <View
            style={[
              styles.stepNumber,
              isCompleted && styles.stepNumberCompleted,
              isInProgress && styles.stepNumberInProgress,
            ]}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text
                style={[
                  styles.stepNumberText,
                  isInProgress && styles.stepNumberTextActive,
                ]}
              >
                {stepNumber}
              </Text>
            )}
          </View>
          <Text style={styles.stepTitle}>Step {stepNumber}</Text>
        </View>

        <View style={[styles.stepBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={14} color={cfg.color} />
          <Text style={[styles.stepBadgeText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* Step description - In real app, fetch from SOP details */}
      <Text style={styles.stepDescription}>
        Complete the task according to standard operating procedure.
      </Text>

      {/* Action buttons - only show for active step */}
      {isActive && isInProgress && (
        <View style={styles.stepActions}>
          {subtasksDone ? (
            <AppButton
              label="Mark Complete"
              onPress={onComplete}
              iconLeft="checkmark-circle-outline"
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ color: "#6B7280", fontSize: 13 }}>
                Complete all subtasks to enable
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Subtasks list for active step */}
      {isActive &&
        (step as any).tasks &&
        Array.isArray((step as any).tasks) && (
          <View style={{ marginTop: 12 }}>
            {(step as any).tasks.map((t: any) => (
              <TouchableOpacity
                key={t.id}
                style={styles.subtaskRow}
                onPress={() => onToggleSubtask && onToggleSubtask(t.id)}
              >
                <Text style={styles.subtaskText}>{t.title}</Text>
                <View
                  style={[
                    styles.subtaskCheckbox,
                    t.done && styles.subtaskCheckboxChecked,
                  ]}
                >
                  {t.done ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      {/* Additional actions for in-progress step */}
      {isActive && isInProgress && (
        <View style={styles.stepExtras}>
          <TouchableOpacity style={styles.extraBtn}>
            <Ionicons name="camera-outline" size={18} color="#2563EB" />
            <Text style={styles.extraBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn}>
            <Ionicons name="chatbubble-outline" size={18} color="#2563EB" />
            <Text style={styles.extraBtnText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Progress: {current} of {total} completed
        </Text>
        <Text style={styles.progressPercent}>{Math.round(percentage)}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TaskExecutionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { updateTaskAssignmentStatus } = useTaskAssignments();
  const { completeStep } = useTaskStepExecution();
  const { getWorkerProfile } = useAuth();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(false);

  const params = route.params as RouteParams;
  const taskAssignmentId = params?.id;
  const initialSteps = params?.steps || [];

  const [steps, setSteps] = useState<TaskStepExecutionDto[]>(initialSteps);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWorkerId = async () => {
      try {
        setLoadingWorker(true);
        const profile = await getWorkerProfile();

        if (profile && profile.id) {
          setWorkerId(profile.id);
        }
      } catch (error) {
        console.error("Lỗi khi lấy worker profile:", error);
      } finally {
        setLoadingWorker(false);
      }
    };

    fetchWorkerId();
  }, []);
  useEffect(() => {
    const load = async () => {
      // enrich initial steps with demo subtasks if missing
      const enriched = initialSteps.map((s) => {
        if ((s as any).tasks && Array.isArray((s as any).tasks)) return s;
        const demoTasks = [
          { id: `${s.id}-t1`, title: "Inspect area", done: false },
          { id: `${s.id}-t2`, title: "Perform cleaning", done: false },
          { id: `${s.id}-t3`, title: "Verify results", done: false },
        ];
        return { ...s, tasks: demoTasks };
      });

      // try to restore saved progress
      try {
        if (taskAssignmentId) {
          const raw = await AsyncStorage.getItem(
            `taskProgress:${taskAssignmentId}`,
          );
          if (raw) {
            const saved = JSON.parse(raw) as any[];
            // merge saved statuses/tasks into enriched steps by id
            const merged = enriched.map((s) => {
              const match = saved.find((x) => x.id === s.id);
              return match ? { ...s, ...match } : s;
            });
            setSteps(merged);
            return;
          }
        }
      } catch (e) {
        // ignore storage errors
      }

      setSteps(enriched);
    };

    load();
  }, [taskAssignmentId]);

  // Find current active step
  const currentStepIndex = steps.findIndex(
    (s) => s.status === StepStatus.InProgress,
  );

  const arePreviousStepsCompleted = (index: number) => {
    if (index <= 0) return true;
    for (let i = 0; i < index; i++) {
      if (steps[i].status !== StepStatus.Completed) return false;
    }
    return true;
  };

  const selectStep = (stepId: string) => {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    if (!arePreviousStepsCompleted(idx)) {
      Alert.alert("Cannot open step", "Please complete previous steps first.");
      return;
    }

    setSteps((prev) =>
      prev.map((s, i) => {
        if (s.id === stepId) return { ...s, status: StepStatus.InProgress };
        if (s.status === StepStatus.InProgress)
          return { ...s, status: StepStatus.NotStarted };
        return s;
      }),
    );
  };

  const completedCount = steps.filter(
    (s) => s.status === StepStatus.Completed,
  ).length;

  const allCompleted = steps.every((s) => s.status === StepStatus.Completed);

  useEffect(() => {
    if (!taskAssignmentId || steps.length === 0) {
      Alert.alert("Error", "No task data available");
      navigation.goBack();
    }
  }, []);

  const handleCompleteStep = async (stepId: string) => {
    // Ensure all subtasks in this step are completed first
    const step = steps.find((s) => s.id === stepId) as any;
    if (step && Array.isArray(step.tasks)) {
      const allDone =
        step.tasks.length > 0 && step.tasks.every((t: any) => t.done);
      if (!allDone) {
        Alert.alert(
          "Complete subtasks",
          "Please finish all subtasks in this step before marking it complete.",
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Build result data (include subtasks state)
      const step = steps.find((s) => s.id === stepId) as any;
      const resultData = {
        subtasks: Array.isArray(step?.tasks)
          ? step.tasks.map((t: any) => ({ id: t.id, done: t.done }))
          : [],
      };

      // Call backend to complete step via hook
      const returned: any = await completeStep(stepId, {
        workerId: workerId || "unknown",
        resultData,
      });

      // Update local steps based on server response (mark completed and activate next)
      const nextStepId: string | null =
        returned.nextStepId ?? returned.NextStepId ?? null;

      const updatedSteps = steps.map((s) => {
        if (s.id === stepId) return { ...s, status: StepStatus.Completed };
        if (nextStepId && s.id === nextStepId)
          return { ...s, status: StepStatus.InProgress };
        return s;
      });

      setSteps(updatedSteps);

      // persist progress
      try {
        if (taskAssignmentId) {
          await AsyncStorage.setItem(
            `taskProgress:${taskAssignmentId}`,
            JSON.stringify(updatedSteps),
          );
        }
      } catch (e) {
        // ignore
      }

      const allDone = updatedSteps.every(
        (s) => s.status === StepStatus.Completed,
      );
      if (allDone) {
        Alert.alert(
          "Task Completed",
          "All steps have been completed. Would you like to finish this task?",
          [
            { text: "Not Yet", style: "cancel" },
            { text: "Finish Task", onPress: handleFinishTask },
          ],
        );
      }
    } catch (err: any) {
      console.error("Complete step failed:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to complete step",
      );
    } finally {
      setLoading(false);
    }
  };

  // Skipping steps removed - users must complete all subtasks and steps in order

  const handleFinishTask = async () => {
    try {
      setLoading(true);

      // Update task assignment status to Completed
      const success = await updateTaskAssignmentStatus(
        taskAssignmentId,
        2, // TaskAssignmentStatus.Completed
      );

      if (success) {
        Alert.alert("Success", "Task has been completed successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Tasks" as never),
          },
        ]);
        // clear persisted progress
        try {
          if (taskAssignmentId)
            await AsyncStorage.removeItem(`taskProgress:${taskAssignmentId}`);
        } catch (e) {
          // ignore
        }
      } else {
        Alert.alert("Error", "Failed to complete task. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseTask = () => {
    Alert.alert(
      "Pause Task",
      "Do you want to pause this task? You can resume it later.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Pause",
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const toggleSubtask = (stepId: string, taskId: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const tasks = (s as any).tasks || [];
        const updatedTasks = tasks.map((t: any) =>
          t.id === taskId ? { ...t, done: !t.done } : t,
        );
        return { ...s, tasks: updatedTasks };
      }),
    );
    // persist change
    (async () => {
      try {
        if (taskAssignmentId) {
          const next = steps.map((s) => (s.id === stepId ? { ...s } : s));
          // apply toggle locally for save snapshot
          const saved = next.map((s) => {
            if (s.id !== stepId) return s;
            const tasks = (s as any).tasks || [];
            return {
              ...s,
              tasks: tasks.map((t: any) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            };
          });
          await AsyncStorage.setItem(
            `taskProgress:${taskAssignmentId}`,
            JSON.stringify(saved),
          );
        }
      } catch (e) {
        // ignore
      }
    })();
  };

  // also persist whenever steps change (debounced simple)
  useEffect(() => {
    const save = setTimeout(async () => {
      try {
        if (taskAssignmentId)
          await AsyncStorage.setItem(
            `taskProgress:${taskAssignmentId}`,
            JSON.stringify(steps),
          );
      } catch (e) {
        // ignore
      }
    }, 300);
    return () => clearTimeout(save);
  }, [steps]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header
        title="Task Execution"
        onBack={() => handlePauseTask()}
        rightElement={
          <TouchableOpacity onPress={handlePauseTask}>
            <Ionicons name="pause-circle-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <ProgressBar current={completedCount} total={steps.length} />

        {/* Task Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="clipboard-outline" size={20} color="#64748B" />
            <Text style={styles.infoLabel}>Task ID:</Text>
            <Text style={styles.infoValue}>
              {taskAssignmentId.slice(0, 8)}...
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="clipboard-outline" size={20} color="#64748B" />
            <Text style={styles.infoLabel}>Task Name:</Text>
            <Text
              style={styles.infoValue}
            >{`Task for ${"Minh Luan" || "-------"}`}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#64748B" />
            <Text style={styles.infoLabel}>Started:</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Task Steps</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : (
            steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                stepNumber={index + 1}
                isActive={index === currentStepIndex}
                onComplete={() => handleCompleteStep(step.id)}
                onToggleSubtask={(taskId) => toggleSubtask(step.id, taskId)}
                onPress={() => selectStep(step.id)}
              />
            ))
          )}
        </View>

        {/* Finish button - show when all completed */}
        {allCompleted && (
          <View style={styles.finishSection}>
            <AppButton
              label="Finish Task"
              onPress={handleFinishTask}
              iconLeft="checkmark-done-outline"
              size="lg"
              disabled={loading}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Progress
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },

  // Steps Section
  stepsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },

  // Step Card
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepCardActive: {
    borderColor: "#2563EB",
    borderWidth: 2,
    backgroundColor: "#F8FAFC",
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberCompleted: {
    backgroundColor: "#10B981",
  },
  stepNumberInProgress: {
    backgroundColor: "#2563EB",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  stepNumberTextActive: {
    color: "#fff",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  stepDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },

  // Step Actions
  stepActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  // Extra Actions
  stepExtras: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  extraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
  },
  extraBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },

  // Subtasks
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  subtaskText: {
    fontSize: 14,
    color: "#0F172A",
    flex: 1,
  },
  subtaskCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  subtaskCheckboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },

  // Finish Section
  finishSection: {
    marginTop: 24,
  },
});
