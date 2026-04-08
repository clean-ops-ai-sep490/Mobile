// src/screens/TaskExecutionScreen.tsx

import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import EquipmentRequestModal from "@/components/modals/EquipmentRequestModal";
import IssueReportModal from "@/components/modals/IssueReportModal";
import {
  StepRenderer,
  buildInitialState,
  getStepLabel,
  isStepFulfilled,
  serializeStepData,
} from "@/components/task/StepRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { useSteps } from "@/hooks/useStep";
import { useTaskAssignments } from "@/hooks/useTaskAssignment";
import { useTaskSchedules } from "@/hooks/useTaskSchedule";
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface RouteParams {
  id: string;
}

enum StepStatus {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Completed = "Completed",
}

interface StepItem {
  id: string;
  name: string;
  stepOrder: number;
  config: any;
  status: StepStatus;
  stepState: any;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TaskExecutionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const taskAssignmentId = params?.id;

  const { completeStep } = useTaskStepExecution();
  const { completeTask, getTaskAssignmentById } = useTaskAssignments();
  const { getTaskScheduleById } = useTaskSchedules();
  const { getWorkerProfile } = useAuth();

  const [steps, setSteps] = useState<StepItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const { getSteps, buildStepConfig } = useSteps();

  // ─── Load worker ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const profile = await getWorkerProfile();
        setWorkerId(profile?.id ?? null);
      } catch {}
    })();
  }, []);

  // ─── Load task data ──────────────────────────────────────────────────────

  // useEffect(() => {
  //   if (!taskAssignmentId) return;

  //   const loadData = async () => {
  //     setLoading(true);
  //     try {
  //       // 1. TaskAssignment
  //       const task = await getTaskAssignmentById(taskAssignmentId);
  //       if (!task) throw new Error("Task not found");

  //       // 2. TaskSchedule → steps (mỗi step có .stepId và .configDetail)
  //       const { schedule, steps: sopSteps } = await getTaskScheduleById(
  //         task.taskScheduleId,
  //       );
  //       if (!schedule) throw new Error("Schedule not found");

  //       // 3. Load tất cả step definitions một lần
  //       const stepDefinitions = await getSteps();
  //       // Map by stepId để lookup O(1)
  //       const stepDefMap = new Map(stepDefinitions.map((d) => [d.id, d]));

  //       // 4. Sort + build config
  //       const sorted = [...sopSteps].sort((a, b) => a.stepOrder - b.stepOrder);

  //       const mapped: StepItem[] = sorted.map((s, index) => {
  //         const def = stepDefMap.get(s.stepId); // ← dùng stepId, không phải id

  //         // Merge: runtime values + x-behavior từ step definition
  //         const config = {
  //           ...s.configDetail, // phase, minPhotos, method, items, ...
  //           "x-behavior": def?.configSchema?.["x-behavior"], // checkin / photo-capture / ...
  //           actionKey: def?.actionKey, // optional, để debug
  //         };
  //         return {
  //           id: s.id,
  //           name: def?.name || `Step ${s.stepOrder}`,
  //           stepOrder: s.stepOrder,
  //           config,
  //           status: index === 0 ? StepStatus.InProgress : StepStatus.NotStarted,
  //           stepState: buildInitialState(config),
  //         };
  //       });

  //       // 5. Restore persisted progress
  //       const raw = await AsyncStorage.getItem(
  //         `taskProgress:${taskAssignmentId}`,
  //       );
  //       if (raw) {
  //         const saved: Partial<StepItem>[] = JSON.parse(raw);
  //         setSteps(
  //           mapped.map((s) => {
  //             const match = saved.find((x) => x.id === s.id);
  //             return match ? { ...s, ...match, config: s.config } : s;
  //           }),
  //         );
  //       } else {
  //         setSteps(mapped);
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       Alert.alert("Error", "Failed to load task");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadData();
  // }, [taskAssignmentId]);

  // ─── Derived ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!taskAssignmentId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const task = await getTaskAssignmentById(taskAssignmentId);
        if (!task) throw new Error("Task not found");

        const sorted = [...task.steps].sort(
          (a, b) => a.stepOrder - b.stepOrder,
        );

        const mapped: StepItem[] = sorted.map((s) => {
          const detail = s.configSnapshot?.detail ?? {};
          const schema = s.configSnapshot?.schema ?? {};

          const config = {
            ...detail, // method, minPhotos, items, ...
            "x-behavior": schema["x-behavior"], // checkin / photo-capture / ...
            actionKey: s.sopStepId, // để debug nếu cần
          };

          return {
            id: s.id, // ✅ TaskStepExecution ID
            name: schema?.title || `Step ${s.stepOrder}`,
            stepOrder: s.stepOrder,
            config,
            status:
              s.status === "Completed"
                ? StepStatus.Completed
                : s.status === "InProgress"
                  ? StepStatus.InProgress
                  : StepStatus.NotStarted,
            stepState: buildInitialState(config),
          };
        });

        // Restore persisted progress
        const raw = await AsyncStorage.getItem(
          `taskProgress:${taskAssignmentId}`,
        );
        if (raw) {
          const saved: Partial<StepItem>[] = JSON.parse(raw);
          setSteps(
            mapped.map((s) => {
              const match = saved.find((x) => x.id === s.id);
              return match
                ? { ...s, ...match, config: s.config, status: s.status }
                : s;
            }),
          );
        } else {
          setSteps(mapped);
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

  const currentStepIndex = steps.findIndex(
    (s) => s.status === StepStatus.InProgress,
  );
  const completedCount = steps.filter(
    (s) => s.status === StepStatus.Completed,
  ).length;
  const allCompleted =
    steps.length > 0 && steps.every((s) => s.status === StepStatus.Completed);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleStepStateChange = (stepId: string, newState: any) => {
    setSteps((prev) => {
      const updated = prev.map((s) =>
        s.id === stepId ? { ...s, stepState: newState } : s,
      );
      AsyncStorage.setItem(
        `taskProgress:${taskAssignmentId}`,
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const handleCompleteStep = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    if (!isStepFulfilled(step.stepState, step.config)) {
      Alert.alert("Chưa hoàn thành", getIncompleteMessage(step.config));
      return;
    }

    // Guard: workerId chưa load xong
    if (!workerId) {
      Alert.alert("Lỗi", "Không xác định được worker. Vui lòng thử lại.");
      return;
    }

    try {
      setSubmitting(true);

      const res: any = await completeStep(step.id, {
        workerId,
        resultData: serializeStepData(step.stepState, step.config) ?? {},
      });

      const nextId = res?.nextStepId ?? null;

      setSteps((prev) => {
        const updated = prev.map((s) => {
          if (s.id === stepId) return { ...s, status: StepStatus.Completed };
          if (nextId && s.id === nextId)
            return { ...s, status: StepStatus.InProgress };
          return s;
        });
        AsyncStorage.setItem(
          `taskProgress:${taskAssignmentId}`,
          JSON.stringify(updated),
        );
        return updated;
      });
    } catch (err: any) {
      Alert.alert("Error", "Failed to complete step: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // const processStepSuccess = (
  //   completedStepId: string,
  //   nextId?: string | null,
  // ) => {
  //   setSteps((prev) => {
  //     const updated = prev.map((s) => {
  //       if (s.id === completedStepId)
  //         return { ...s, status: StepStatus.Completed };
  //       if (nextId && s.id === nextId)
  //         return { ...s, status: StepStatus.InProgress };
  //       return s;
  //     });
  //     AsyncStorage.setItem(
  //       `taskProgress:${taskAssignmentId}`,
  //       JSON.stringify(updated),
  //     );
  //     return updated;
  //   });
  // };

  // const handleCompleteStep = async (stepId: string) => {
  //   const step = steps.find((s) => s.id === stepId);
  //   if (!step) return;

  //   if (!isStepFulfilled(step.stepState, step.config)) {
  //     Alert.alert("Chưa hoàn thành", getIncompleteMessage(step.config));
  //     return;
  //   }

  //   if (!workerId) {
  //     Alert.alert("Lỗi", "Không xác định được worker. Vui lòng thử lại.");
  //     return;
  //   }

  //   try {
  //     setSubmitting(true);

  //     const res: any = await completeStep(step.id, {
  //       workerId,
  //       resultData: serializeStepData(step.stepState, step.config),
  //     });

  //     // 1. HAPPY PATH: Nếu BE hết lỗi và trả về 200 OK mượt mà
  //     processStepSuccess(stepId, res?.nextStepId);
  //   } catch (err: any) {
  //     // 2. 🚨 FAIL-SAFE (PHÒNG THỦ): Xử lý lỗi BE 500 JSON Serialization
  //     console.warn(
  //       "⚠️ Bắt được lỗi, đang verify xem DB thực sự đã lưu chưa...",
  //     );

  //     try {
  //       // Fetch lại data mới nhất của task
  //       const verifyTask = await getTaskAssignmentById(taskAssignmentId);
  //       const currentStepFresh = verifyTask?.steps.find((s) => s.id === stepId);

  //       // BE thực ra đã lưu thành công ở DB, chỉ bị crash khúc trả JSON
  //       if (currentStepFresh?.status === "Completed") {
  //         console.log("✅ Dù có lỗi nhưng DB đã lưu Completed, cho qua luôn!");

  //         // Tính toán logic lấy step tiếp theo
  //         const sortedSteps = [...(verifyTask?.steps || [])].sort(
  //           (a, b) => a.stepOrder - b.stepOrder,
  //         );
  //         const nextPendingStep = sortedSteps.find(
  //           (s) => s.status !== "Completed",
  //         );

  //         processStepSuccess(stepId, nextPendingStep?.id);
  //         return;
  //       }
  //     } catch (verifyErr) {
  //       console.warn("Verify thất bại", verifyErr);
  //     }

  //     // Nếu thực sự lỗi (DB chưa cập nhật)
  //     Alert.alert("Error", "Failed to complete step: " + err?.message);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleFinishTask = async () => {
    // 1. Guard check: Phải có workerId
    if (!workerId) {
      Alert.alert("Lỗi", "Không xác định được worker. Vui lòng thử lại.");
      return;
    }

    try {
      // Dùng chung state submitting để khóa UI lại
      setSubmitting(true);

      // Gọi API
      const result = await completeTask(taskAssignmentId, workerId);

      // 2. Xử lý kết quả trả về
      if (result) {
        // Thành công: Xóa cache và điều hướng
        await AsyncStorage.removeItem(`taskProgress:${taskAssignmentId}`);
        Alert.alert("Thành công", "Task đã được hoàn thành!", [
          { text: "OK", onPress: () => navigation.navigate("Tasks" as never) },
        ]);
      } else {
        // API trả về null (lỗi từ BE)
        Alert.alert(
          "Lỗi",
          "Không thể hoàn thành Task. Vui lòng kiểm tra lại kết nối.",
        );
      }
    } catch (err) {
      console.error("Lỗi khi kết thúc task:", err);
      Alert.alert("Lỗi hệ thống", "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Header right ────────────────────────────────────────────────────────
  const headerRight = (
    <View style={s.headerActions}>
      <TouchableOpacity
        style={s.headerBtn}
        onPress={() => setEquipmentModalVisible(true)}
      >
        <Ionicons name="construct-outline" size={22} color="#1E293B" />
      </TouchableOpacity>
      <TouchableOpacity
        style={s.headerBtn}
        onPress={() => setIssueModalVisible(true)}
      >
        <Ionicons name="warning-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      <Header
        title="Task Execution"
        onBack={() => navigation.goBack()}
        rightElement={headerRight}
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Progress */}
        <View style={s.progressRow}>
          <Text style={s.progressText}>
            {completedCount}/{steps.length} steps completed
          </Text>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                {
                  width:
                    steps.length > 0
                      ? `${(completedCount / steps.length) * 100}%`
                      : "0%",
                },
              ]}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          steps.map((step, index) => {
            const isActive = step.status === StepStatus.InProgress;
            const isDone = step.status === StepStatus.Completed;
            const fulfilled = isStepFulfilled(step.stepState, step.config);

            return (
              <View
                key={step.id}
                style={[s.card, isDone && s.cardDone, isActive && s.cardActive]}
              >
                {/* Step header row */}
                <View style={s.stepHeader}>
                  <View
                    style={[
                      s.badge,
                      isDone && s.badgeDone,
                      isActive && s.badgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.badgeText,
                        isDone && s.badgeTextDone,
                        isActive && s.badgeTextActive,
                      ]}
                    >
                      {isDone ? "✓" : index + 1}
                    </Text>
                  </View>

                  <View style={s.stepInfo}>
                    <Text style={[s.stepName, isDone && s.stepNameDone]}>
                      {step.name}
                    </Text>
                    <Text style={s.stepType}>{getStepLabel(step.config)}</Text>
                  </View>

                  {isDone && (
                    <View style={s.donePill}>
                      <Text style={s.donePillText}>Done</Text>
                    </View>
                  )}
                </View>

                {/* Dynamic UI — chỉ hiện khi active */}
                {isActive && (
                  <>
                    <View style={s.divider} />
                    <StepRenderer
                      stepName={step.name}
                      config={step.config}
                      state={step.stepState}
                      onChange={(newState) =>
                        handleStepStateChange(step.id, newState)
                      }
                    />
                    <View style={s.completeBtn}>
                      <AppButton
                        label={submitting ? "Đang xử lý..." : "Complete Step"}
                        onPress={() => handleCompleteStep(step.id)}
                        disabled={!fulfilled || submitting}
                      />
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}

        {allCompleted && (
          <View style={s.finishWrap}>
            <AppButton
              label={submitting ? "Đang xử lý..." : "Finish Task"}
              onPress={handleFinishTask}
              disabled={submitting}
            />
          </View>
        )}
      </ScrollView>

      <IssueReportModal
        visible={issueModalVisible}
        onClose={() => setIssueModalVisible(false)}
        taskAssignmentId={taskAssignmentId}
      />
      <EquipmentRequestModal
        visible={equipmentModalVisible}
        onClose={() => setEquipmentModalVisible(false)}
        taskAssignmentId={taskAssignmentId}
      />
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIncompleteMessage(config: any): string {
  const msgs: Record<string, string> = {
    checkin: "Vui lòng hoàn thành check-in trước.",
    "ai-ppe-check": "Vui lòng xác nhận đã mặc đủ đồ bảo hộ.",
    "equipment-check": "Vui lòng xác nhận đủ thiết bị.",
    "photo-capture": "Vui lòng chụp đủ số ảnh yêu cầu.",
    checklist: "Vui lòng hoàn thành tất cả mục trong checklist.",
    list: "Vui lòng xác nhận đã đọc danh sách.",
    finish: "Vui lòng nhập ghi chú hoàn thành.",
  };
  return (
    msgs[config?.["x-behavior"]] ??
    "Vui lòng hoàn thành tất cả yêu cầu của bước này."
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerBtn: { padding: 6, borderRadius: 8 },

  progressRow: { marginBottom: 16 },
  progressText: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  progressTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 2,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    opacity: 0.6,
  },
  cardActive: { opacity: 1, borderColor: "#0F172A", borderWidth: 1.5 },
  cardDone: { opacity: 0.75, backgroundColor: "#F8FAFC" },

  stepHeader: { flexDirection: "row", alignItems: "center" },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  badgeActive: { backgroundColor: "#0F172A" },
  badgeDone: { backgroundColor: "#DCFCE7" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  badgeTextActive: { color: "#FFF" },
  badgeTextDone: { color: "#166534" },

  stepInfo: { flex: 1 },
  stepName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  stepNameDone: { color: "#94A3B8" },
  stepType: { fontSize: 12, color: "#64748B", marginTop: 1 },

  donePill: {
    backgroundColor: "#DCFCE7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  donePillText: { fontSize: 12, color: "#166534", fontWeight: "600" },

  divider: { height: 0.5, backgroundColor: "#E2E8F0", marginVertical: 12 },
  completeBtn: { marginTop: 14 },
  finishWrap: { marginTop: 8 },
});
