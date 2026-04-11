import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import FormattedDate from "@/components/common/FormattedDate";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskAssignments } from "@/hooks/useTaskAssignment";
import { useTaskSwap } from "@/hooks/useTaskSwap";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = NativeStackScreenProps<WorkerStackParamList, "SwapTask">;

export default function SwapTaskScreen({ navigation, route }: Props) {
  const { create, loading, getSwapCandidates } = useTaskSwap();
  const { user } = useAuth();
  const { getTaskAssignments } = useTaskAssignments();

  const currentTaskId = route.params?.taskAssignmentId;
  const { getWorkerProfile } = useAuth();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(false);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [currentTask, setCurrentTask] = useState<any>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchCandidates();
  }, [currentTaskId]);

  useEffect(() => {
    if (!currentTaskId || !workerId) return;

    const fetchCurrentTask = async () => {
      try {
        // Lấy task assignments của chính worker
        const res = await getTaskAssignments(
          {
            assigneeId: workerId,
            fromDate: "1970-01-01T00:00:00Z", // hoặc range rộng
          },
          {
            pageNumber: 1,
            pageSize: 100,
            sortBy: "scheduledStartAt",
            sortDescending: false,
          },
        );

        const task = res.content.find((t: any) => t.id === currentTaskId);
        setCurrentTask(task || null);
      } catch (err) {
        console.error("Failed to fetch current task", err);
        setCurrentTask(null);
      }
    };

    fetchCurrentTask();
  }, [currentTaskId, workerId]);

  useEffect(() => {
    const fetchWorkerId = async () => {
      try {
        setLoadingWorker(true);
        const profile = await getWorkerProfile();

        if (profile && profile.id) {
          setWorkerId(profile.id);
        }
      } catch (error) {
        console.error("Error fetching worker profile:", error);
      } finally {
        setLoadingWorker(false);
      }
    };

    fetchWorkerId();
  }, []);

  const fetchCandidates = async () => {
    if (!currentTaskId) return;

    setLoadingCandidates(true);

    try {
      const res = await getSwapCandidates(currentTaskId);

      console.log("Swap candidates:", res);

      setCandidates(res?.content || []);
    } catch (err) {
      console.log("Failed to fetch candidates", err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  /* ================= RULE ================= */

  const validateCandidate = (task: any) => {
    const now = new Date();
    const start = new Date(task.scheduledStartAt);

    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 12) {
      return { valid: false, reason: "Ít hơn 12 giờ" };
    }

    return { valid: true };
  };

  /* ================= ANIMATION ================= */

  const handleSelect = (item: any) => {
    setSelected(item);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = () => {
    if (!selected) return;

    if (!reason.trim()) {
      Alert.alert("Thiếu lý do", "Vui lòng nhập lý do.");
      return;
    }

    Alert.alert("Xác nhận đổi ca", `Đổi với ${selected.assigneeName}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          try {
            await create({
              taskAssignmentId: currentTaskId,
              targetTaskAssignmentId: selected.task.taskAssignmentId,
              requesterId: workerId || "",
              targetWorkerId: selected.workerId,
              requesterNote: reason,
            });

            Alert.alert("Thành công", "Yêu cầu đổi ca đã được gửi.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (e: any) {
            console.error(
              "Error submitting swap request:",
              e.response?.data || "Unknown error",
            );
            Alert.alert(
              "Lỗi",
              e.response?.data?.message ||
                "Gửi yêu cầu đổi ca thất bại. Vui lòng thử lại.",
            );
          }
        },
      },
    ]);
  };

  /* ================= RENDER ================= */

  const renderCandidate = (item: any) => {
    const isSelected =
      selected?.task.taskAssignmentId === item.task.taskAssignmentId;

    const validation = validateCandidate(item.task);

    return (
      <Animated.View
        key={item.task.taskAssignmentId}
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <TouchableOpacity
          style={[
            styles.card,
            isSelected && styles.cardSelected,
            !validation.valid && styles.cardDisabled,
          ]}
          disabled={!validation.valid}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.name}>{item.assigneeName}</Text>
              <Text style={styles.location}>{item.task.displayLocation}</Text>
              <Text style={styles.time}>
                <FormattedDate
                  dateString={item.task.scheduledStartAt}
                  style={styles.time}
                />{" "}
                -{" "}
                <FormattedDate
                  dateString={item.task.scheduledEndAt}
                  style={styles.time}
                />
              </Text>

              {!validation.valid && (
                <Text style={styles.badge}>{validation.reason}</Text>
              )}
            </View>

            {isSelected && (
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <Header
        title="Yêu cầu đổi công việc"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* YOUR TASK */}
        <Text style={styles.section}>Công việc của bạn</Text>
        {currentTask ? (
          <View style={styles.taskCard}>
            <Text style={styles.rowTitle}>
              {currentTask.isAdhocTask && currentTask.nameAdhocTask
                ? `Ad-hoc: ${currentTask.nameAdhocTask}`
                : `Schedule: `}
              <FormattedDate
                dateString={currentTask.scheduledStartAt}
                style={styles.rowTitle}
              />
            </Text>
            <Text style={styles.rowSub}>
              {currentTask.displayLocation || "No location assigned"}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{currentTask.status}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>Loading task...</Text>
        )}

        {/* SELECT */}
        <Text style={styles.section}>Chọn công việc thay thế</Text>

        {loadingCandidates ? (
          <>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </>
        ) : candidates.length === 0 ? (
          <Text style={styles.empty}>Không có công việc khả dụng để đổi</Text>
        ) : (
          candidates.map(renderCandidate)
        )}

        {/* REASON */}
        <Text style={styles.section}>Lý do</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập lý do..."
          value={reason}
          onChangeText={setReason}
          multiline
        />

        {/* ACTION */}
        <AppButton
          label="Gửi yêu cầu đổi"
          onPress={handleSubmit}
          loading={loading}
          disabled={!selected || !reason.trim() || loading}
          iconLeft="send"
        />
      </ScrollView>

      <BottomTabBar onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

/* ================= STYLE ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },
  container: { padding: 16 },

  section: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 16,
  },

  yourTask: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#ECFDF5",
  },

  cardDisabled: {
    opacity: 0.5,
  },

  badge: {
    marginTop: 6,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: { fontSize: 15, fontWeight: "600" },
  location: { color: "#64748B", marginTop: 4 },
  time: { color: "#94A3B8", marginTop: 2 },

  preview: {
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  previewTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
  },

  empty: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 20,
  },

  skeleton: {
    height: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 12,
  },

  bold: { fontWeight: "700" },
  taskCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  rowSub: { fontSize: 13, color: "#64748b", marginTop: 6 },
  statusBadge: {
    marginTop: 10,
    backgroundColor: "#f0f9ff",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  statusText: { fontSize: 11, fontWeight: "600", color: "#0369a1" },
  empty: { padding: 20, textAlign: "center", color: "#94a3b8" },
});
