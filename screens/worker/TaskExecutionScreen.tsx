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
import { sendWorkerGps } from "@/hooks/useWorkerGps";
import { getCurrentLocation } from "@/services/workergps.service";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 👉 1. IMPORT THƯ VIỆN Ở ĐÂY
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface RouteParams {
  id: string;
  qrResult?: {
    valid: boolean;
    raw?: string;
    stepId?: string;
    checkinPointId?: string;
    workareaId?: string;
    code?: string;

    checkinRecordId?: string;
    checkinAt?: string;

    verifiedAt?: string;
    message?: string;
  };
  selfieResult?: {
    uri: string;
  };
  stepId?: string;

  bleResult?: {
    valid: boolean;
    stepId?: string;
    deviceId?: string;
    deviceName?: string;
    deviceUuid?: string;
    checkinRecordId?: string;
    checkinAt?: string;
    workareaId?: string;
    code?: string;
    checkinPointId?: string;
    verifiedAt?: string;
    message?: string;
  };
}

enum StepStatus {
  NotStarted = "Chưa bắt đầu",
  InProgress = "Đang thực hiện",
  Completed = "Hoàn thành",
}

interface StepItem {
  id: string;
  name: string;
  stepOrder: number;
  config: any;
  status: StepStatus;
  stepState: any;
}

export default function TaskExecutionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
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

  const requiredEquipment = useMemo(() => {
    const equipmentStep = steps.find(
      (s) => s.config?.["x-behavior"] === "equipment-check",
    );

    const allEquipment =
      (equipmentStep?.config?.requiredEquipment as {
        id: string;
        name: string;
      }[]) ?? [];

    // Lấy state của step đó để biết cái nào đã tick
    const stepState = equipmentStep?.stepState ?? {};

    // Lọc ra những cái CHƯA được tick
    return allEquipment.filter((eq) => !stepState[eq.id]);
  }, [steps]);

  // ─── Load worker ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const profile = await getWorkerProfile();
        setWorkerId(profile?.id ?? null);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!workerId || !taskAssignmentId) return;

    const sendGps = async () => {
      try {
        const loc = await getCurrentLocation();
        await sendWorkerGps(workerId, loc.latitude, loc.longitude, true);
      } catch {
        // Không lấy được vị trí, vẫn ping để BE biết worker online
        try {
          await sendWorkerGps(workerId, null, null, false);
        } catch {}
      }
    };

    sendGps(); // Gửi ngay khi vào màn

    const interval = setInterval(sendGps, 3 * 60 * 1000); // 3 phút
    return () => clearInterval(interval); // Cleanup khi rời màn
  }, [workerId, taskAssignmentId]);

  // ─── Load task data ───────────────────────────────────────────────────────
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
            ...detail,
            "x-behavior": schema["x-behavior"],
            actionKey: s.sopStepId,
            workerId: workerId ?? "",
            checkinPointId: detail?.checkinPointId,
            identifier: detail?.identifier,
          };

          return {
            id: s.id,
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
        Alert.alert("Lỗi", "Tải công việc thất bại");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskAssignmentId]);

  // ─── Nhận kết quả QR từ QRScannerScreen ──────────────────────────────────
  useEffect(() => {
    const qrResult = params?.qrResult;
    if (!qrResult?.valid || !qrResult?.stepId) return;

    setSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== qrResult.stepId) return s;

        return {
          ...s,
          stepState: {
            ...s.stepState,
            checkedIn: true,
            verified: true,
            method: "qr",

            qrRaw: qrResult.raw,
            checkinPointId: qrResult.checkinPointId,
            workareaId: qrResult.workareaId,
            code: qrResult.code,

            checkinRecordId: qrResult.checkinRecordId,
            checkinAt: qrResult.checkinAt,
            verifiedAt: qrResult.verifiedAt,
          },
        };
      });

      AsyncStorage.setItem(
        `taskProgress:${taskAssignmentId}`,
        JSON.stringify(updated),
      );

      return updated;
    });

    navigation.setParams({ qrResult: undefined });
  }, [params?.qrResult, taskAssignmentId]);

  // ─── Nhận kết quả selfie từ InspectionCameraScreen ───────────────────────
  useEffect(() => {
    const selfieResult = params?.selfieResult;
    const stepId = params?.stepId;
    if (!selfieResult?.uri || !stepId) return;

    setSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          stepState: {
            ...s.stepState,
            checkedIn: true,
            method: "selfie",
            photoUri: selfieResult.uri,
            capturedAt: new Date().toISOString(),
          },
        };
      });
      AsyncStorage.setItem(
        `taskProgress:${taskAssignmentId}`,
        JSON.stringify(updated),
      );
      return updated;
    });

    navigation.setParams({ selfieResult: undefined, stepId: undefined });
  }, [params?.selfieResult]);

  // Phần useEffect xử lý bleResult GIỮ NGUYÊN như code cũ
  // useEffect(() => {
  //   const bleResult = params?.bleResult;
  //   if (!bleResult?.valid || !bleResult?.stepId) return;

  //   const stepId = bleResult.stepId;

  //   setSteps((prev) => {
  //     const updated = prev.map((s) => {
  //       if (s.id !== stepId) return s;

  //       return {
  //         ...s,
  //         stepState: {
  //           ...s.stepState,
  //           checkedIn: true,
  //           verified: true,
  //           method: "ble",

  //           deviceId: bleResult.deviceId,
  //           deviceName: bleResult.deviceName,
  //           deviceUuid: bleResult.deviceUuid,
  //           checkinRecordId: bleResult.checkinRecordId,
  //           checkinAt: bleResult.checkinAt,
  //           workareaId: bleResult.workareaId,
  //         },
  //       };
  //     });

  //     AsyncStorage.setItem(
  //       `taskProgress:${taskAssignmentId}`,
  //       JSON.stringify(updated),
  //     );

  //     return updated;
  //   });

  //   navigation.setParams({ bleResult: undefined });
  // }, [params?.bleResult]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const completedCount = steps.filter(
    (s) => s.status === StepStatus.Completed,
  ).length;
  const allCompleted =
    steps.length > 0 && steps.every((s) => s.status === StepStatus.Completed);

  // ─── Handlers ─────────────────────────────────────────────────────────────
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
      Alert.alert("Lỗi", "Hoàn thành bước thất bại: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishTask = async () => {
    if (!workerId) {
      Alert.alert("Lỗi", "Không xác định được worker. Vui lòng thử lại.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await completeTask(taskAssignmentId, workerId);

      if (result) {
        await AsyncStorage.removeItem(`taskProgress:${taskAssignmentId}`);
        Alert.alert("Thành công", "Công việc đã được hoàn thành!", [
          { text: "OK", onPress: () => navigation.navigate("Tasks" as never) },
        ]);
      } else {
        Alert.alert(
          "Lỗi",
          "Không thể hoàn thành công việc. Vui lòng kiểm tra lại kết nối.",
        );
      }
    } catch (err) {
      console.error("Lỗi khi kết thúc task:", err);
      Alert.alert("Lỗi hệ thống", "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Header right ─────────────────────────────────────────────────────────
  const headerRight = (
    <View style={s.headerActions}>
      <TouchableOpacity
        style={s.headerBtn}
        onPress={() =>
          navigation.navigate(
            "EmergencyLeave" as never,
            {
              taskAssignmentId: taskAssignmentId ?? null, // TH1: có id, TH2: null
            } as never,
          )
        }
      >
        <Ionicons name="medkit-outline" size={22} color="#db0614" />
      </TouchableOpacity>
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
        title="Thực thi công việc"
        onBack={() => navigation.goBack()}
        rightElement={headerRight}
      />

      {/* 👉 2. THAY THẾ SCROLLVIEW THÀNH KEYBOARDAWARESCROLLVIEW */}
      <KeyboardAwareScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={80} // Đẩy input lên cao thêm 80px để nhìn rõ nút Complete bên dưới
        keyboardShouldPersistTaps="handled" // Giúp bấm nút ko cần 2 lần chạm khi bàn phím đang bật
        showsVerticalScrollIndicator={false}
      >
        <View style={s.progressRow}>
          <Text style={s.progressText}>
            {completedCount}/{steps.length} bước đã hoàn thành
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
                      <Text style={s.donePillText}>Hoàn thành</Text>
                    </View>
                  )}
                </View>

                {isActive && (
                  <>
                    <View style={s.divider} />
                    <StepRenderer
                      stepName={step.name}
                      config={step.config}
                      state={{
                        ...step.stepState,
                        __stepId: step.id,
                        __taskAssignmentId: taskAssignmentId,
                      }}
                      onChange={(newState) =>
                        handleStepStateChange(step.id, newState)
                      }
                    />
                    <View style={s.completeBtn}>
                      <AppButton
                        label={submitting ? "Đang xử lý..." : "Hoàn thành bước"}
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
              label={submitting ? "Đang xử lý..." : "Hoàn tất công việc"}
              onPress={handleFinishTask}
              disabled={submitting}
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      <IssueReportModal
        visible={issueModalVisible}
        onClose={() => setIssueModalVisible(false)}
        taskAssignmentId={taskAssignmentId}
      />
      <EquipmentRequestModal
        visible={equipmentModalVisible}
        onClose={() => setEquipmentModalVisible(false)}
        taskAssignmentId={taskAssignmentId}
        requiredEquipment={requiredEquipment}
      />
    </SafeAreaView>
  );
}

// Hàm getIncompleteMessage và StyleSheet giữ nguyên...
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
  progressFill: { height: "100%", backgroundColor: "#0F172A", borderRadius: 2 },

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
