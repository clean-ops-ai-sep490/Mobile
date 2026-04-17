import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
  TaskAssignmentDto,
  TaskAssignmentStatus,
  useTaskAssignments,
} from "@/hooks/useTaskAssignment";
import { useTaskSchedules } from "@/hooks/useTaskSchedule";
import { sendWorkerGps } from "@/hooks/useWorkerGps";
import { getCurrentLocation } from "@/services/workergps.service";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const TODAY = new Date();
const getDays = () => {
  return [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + offset);
    return {
      offset,
      label: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      date: d.getDate(),
      full: d.toISOString().split("T")[0],
    };
  });
};

type TaskStatus = "in_progress" | "not_started" | "completed" | "block";

interface Task {
  id: string;
  title: string;
  location: string;
  sublocation: string;
  status: TaskStatus;
  startTime: string;
  endTime?: string;
  finishedAt?: string;
  tags: string[];
  dayOffset: number;
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  in_progress: {
    label: "Đang thực hiện",
    color: "#F59E0B",
    bg: "#FEF3C7",
    dot: "#F59E0B",
  },
  not_started: {
    label: "Chưa bắt đầu",
    color: "#3B82F6",
    bg: "#EFF6FF",
    dot: "#3B82F6",
  },
  completed: {
    label: "Đã hoàn thành",
    color: "#10B981",
    bg: "#ECFDF5",
    dot: "#10B981",
  },
  block: {
    label: "Bị chặn",
    color: "#DC2626",
    bg: "#FEF2F2",
    dot: "#DC2626",
  },
};

const TAG_CONFIG: Record<
  string,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Biohazard: { color: "#EF4444", bg: "#FEE2E2", icon: "warning-outline" },
  "High-Traffic": { color: "#8B5CF6", bg: "#EDE9FE", icon: "people-outline" },
  "High-Rise": { color: "#0EA5E9", bg: "#E0F2FE", icon: "arrow-up-outline" },
};

// ─── Components ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const TagBadge = ({ tag }: { tag: string }) => {
  const cfg = TAG_CONFIG[tag] ?? {
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "pricetag-outline" as keyof typeof Ionicons.glyphMap,
  };
  return (
    <View style={[styles.tag, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={10} color={cfg.color} />
      <Text style={[styles.tagText, { color: cfg.color }]}>{tag}</Text>
    </View>
  );
};

const TaskCard = ({
  task,
  onStart,
  onContinue,
  canAct = true,
}: {
  task: Task;
  onStart?: (id: string) => void;
  onContinue?: (id: string) => void;
  canAct?: boolean;
}) => {
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isNotStarted = task.status === "not_started";

  // Only allow actions (Start/Continue) when the screen allows acting
  // (e.g., selected day is today). This prevents starting/continuing
  // tasks on past/future days where buttons should be view-only.
  const hasActions = canAct && (isInProgress || isNotStarted);

  return (
    <View style={[styles.card, isInProgress && styles.cardActive]}>
      {/* Top row: badges + time */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardBadges}>
          <StatusBadge status={task.status} />
          {task.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </View>
        <Text style={styles.cardTime}>
          {isCompleted
            ? `Hoàn thành ${task.finishedAt || ""}`
            : `${task.startTime} ${task.endTime ? `– ${task.endTime}` : ""}`}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{task.title}</Text>

      {/* Location */}
      <View style={styles.cardLocation}>
        <Ionicons name="location-outline" size={13} color="#94A3B8" />
        <Text style={styles.locationText}>
          {task.location} {task.sublocation ? `• ${task.sublocation}` : ""}
        </Text>
      </View>

      {/* 🚀 Action buttons: Chỉ hiển thị khi task In Progress hoặc Not Started */}
      {hasActions && (
        <View style={styles.cardActions}>
          {isInProgress && (
            <AppButton
              label="Tiếp tục"
              onPress={() => onContinue && onContinue(task.id)}
              iconLeft="play"
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
          )}
          {isNotStarted && (
            <AppButton
              label="Bắt đầu công việc"
              onPress={() => onStart && onStart(task.id)}
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
type FilterType = "all" | TaskStatus;

export default function TaskListScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const days = getDays();
  const navigation = useNavigation();
  const { getWorkerProfile } = useAuth();
  const {
    getTaskAssignments,
    startTask,
    loading: hookLoading,
    getTaskAssignmentById,
  } = useTaskAssignments();
  const [tasks, setTasks] = useState<TaskAssignmentDto[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(false);
  const { getTaskScheduleById } = useTaskSchedules();

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

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const buildDateForOffset = (offset: number) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + offset);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const mapStatusToTaskStatus = (
    s: TaskAssignmentStatus | string | number,
  ): TaskStatus => {
    const val = String(s);
    switch (val) {
      case "InProgress":
      case "1":
        return "in_progress";
      case "Completed":
      case "2":
        return "completed";
      case "Block":
      case "3":
        return "block";
      case "NotStarted":
      case "0":
      default:
        return "not_started";
    }
  };

  const fetchTasks = async () => {
    if (!workerId) return;
    setLoadingTasks(true);

    const baseDate = buildDateForOffset(selectedDay);
    const filterReq: any = {
      assigneeId: workerId,
      fromDate: `${baseDate}T00:00:00Z`,
      toDate: `${baseDate}T23:59:59Z`,
    };

    if (filter !== "all") {
      if (filter === "in_progress") filterReq.status = "InProgress";
      if (filter === "completed") filterReq.status = "Completed";
      if (filter === "not_started") filterReq.status = "NotStarted";
      if (filter === "block") filterReq.status = "Block";
    }

    const resp = await getTaskAssignments(filterReq, {
      pageNumber: 1,
      pageSize: 20,
    });

    if (resp && resp.content) {
      setTasks(resp.content);
    } else {
      setTasks([]);
    }
    setLoadingTasks(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDay, filter, workerId]);

  const handleStartTask = async (id: string) => {
    if (!workerId) {
      Alert.alert(
        "Người lao động không có sẵn",
        "Không thể bắt đầu công việc khi thiếu ID người lao động.",
      );
      return;
    }

    try {
      setLoadingTasks(true);

      let latitude: number | null = null;
      let longitude: number | null = null;
      let isConfirmed = true;

      // 🔥 1. Lấy GPS
      try {
        const location = await getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (gpsError) {
        console.warn("⚠️ Không lấy được GPS:", gpsError);

        // 👉 fallback UX (rất quan trọng)
        isConfirmed = false;

        Alert.alert(
          "Không lấy được GPS",
          "Vẫn tiếp tục nhưng sẽ lưu vị trí chưa xác nhận.",
        );
      }

      // 🔥 2. Gửi GPS lên backend
      try {
        await sendWorkerGps(workerId, latitude, longitude, isConfirmed);
      } catch (gpsApiError) {
        console.warn("⚠️ Gửi GPS thất bại:", gpsApiError);
        // 👉 không block user
      }

      // 🔥 3. Start task
      const res = await startTask(id, workerId);

      console.log("DỮ LIỆU API TRẢ VỀ KHI START:", res);

      (navigation as any).navigate("TaskExecution", {
        id,
        steps: res?.steps || [],
      });
    } catch (e: any) {
      Alert.alert(
        "Bắt đầu thất bại",
        e?.message || "Không thể bắt đầu công việc.",
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleContinue = async (taskId: string) => {
    if (!workerId) {
      Alert.alert(
        "Người lao động không có sẵn",
        "Không thể tiếp tục công việc khi thiếu ID người lao động.",
      );
      return;
    }

    try {
      setLoadingTasks(true);

      // 1️⃣ Lấy task assignment
      const task = await getTaskAssignmentById(taskId);
      if (!task) throw new Error("Task not found");

      const taskScheduleId = task.taskScheduleId;
      if (!taskScheduleId) throw new Error("Task schedule ID missing");

      // 2️⃣ Lấy schedule + steps từ hook useTaskSchedules
      const { schedule, steps } = await getTaskScheduleById(taskScheduleId);
      if (!schedule) throw new Error("Task schedule not found");

      // 3️⃣ Navigate sang màn TaskExecution/ConfigDetail
      (navigation as any).navigate("TaskExecution", {
        id: taskId,
        schedule, // gửi luôn schedule để build UI chi tiết nếu cần
        steps,
      });
    } catch (e: any) {
      Alert.alert(
        "Tiếp tục thất bại",
        e?.message || "Không thể tiếp tục công việc.",
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  const mappedTasks: Task[] = tasks.map((t) => {
    const startsAt = t.scheduledStartAt;
    const dateObj = new Date(startsAt);
    const time = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      id: t.id,
      title: t.isAdhocTask
        ? t.nameAdhocTask || "Công việc linh động"
        : `Công việc ${t.taskScheduleId.slice(0, 8).toUpperCase()}`,
      location: t.displayLocation || "Không rõ địa điểm",
      sublocation: "",
      status: mapStatusToTaskStatus(t.status),
      startTime: time,
      tags: [],
      dayOffset: 0,
    };
  });

  const filtered = mappedTasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const todayTasks = mappedTasks;
  const remaining = todayTasks.filter((t) => t.status !== "completed").length;

  // ✅ Đã cập nhật lại tên và thêm đầy đủ các trạng thái Block, Not Started
  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "not_started", label: "Chưa bắt đầu" },
    { key: "in_progress", label: "Đang thực hiện" },
    { key: "completed", label: "Đã hoàn thành" },
    { key: "block", label: "Bị chặn" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      <Header
        title="Công việc của tôi"
        onBack={() => handleNavigate("Home")}
        style={{ backgroundColor: "#F5F6FA" }}
      />
      {/* ── Day Selector ── */}
      <View style={styles.dayRow}>
        {days.map((d) => {
          const isSelected = d.offset === selectedDay;
          return (
            <TouchableOpacity
              key={d.offset}
              style={[styles.dayItem, isSelected && styles.dayItemActive]}
              onPress={() => setSelectedDay(d.offset)}
            >
              <Text
                style={[styles.dayLabel, isSelected && styles.dayLabelActive]}
              >
                {d.label}
              </Text>
              <Text
                style={[styles.dayDate, isSelected && styles.dayDateActive]}
              >
                {d.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
          />
        }
      >
        {/* ── Schedule Title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDay === 0
              ? "Lịch hôm nay"
              : selectedDay < 0
                ? "Lịch trước"
                : "Lịch sắp tới"}
          </Text>
          <Text style={styles.sectionSub}>
            {remaining > 0
              ? `${remaining} công việc còn lại`
              : "Tất cả công việc đã hoàn thành"}
          </Text>
        </View>

        {/* ── Filter Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? todayTasks.length
                : todayTasks.filter((t) => t.status === f.key).length;
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    active && styles.filterCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      active && styles.filterCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Task Cards ── */}
        <View style={styles.taskList}>
          {loadingTasks || hookLoading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="clipboard-outline" size={36} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy công việc</Text>
              <Text style={styles.emptyText}>
                Không có công việc phù hợp với bộ lọc cho ngày đã chọn.
              </Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStartTask}
                onContinue={handleContinue}
                canAct={selectedDay === 0}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomTabBar activeTab="Tasks" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },

  // ── Day Selector ─────────────────────────────────────────
  dayRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
    paddingTop: 12,
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  dayItemActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayLabelActive: { color: "#BFDBFE" },
  dayDate: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 2,
  },
  dayDateActive: { color: "#FFFFFF" },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },

  // ── Section Header ────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  // ── Filter Pills ─────────────────────────────────────────
  filterRow: { marginTop: 12 },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTextActive: { color: "#FFFFFF" },
  filterCount: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  filterCountActive: { backgroundColor: "#1D4ED8" },
  filterCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  filterCountTextActive: { color: "#BFDBFE" },

  // ── Task List ────────────────────────────────────────────
  taskList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },

  // ── Task Card ────────────────────────────────────────────
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  cardActive: {
    borderColor: "#F59E0B",
    borderLeftWidth: 4,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  cardBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  cardTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    lineHeight: 22,
  },
  cardLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  btnCamera: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },

  // ── Status Badge ─────────────────────────────────────────
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Tag Badge ────────────────────────────────────────────
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Empty State ──────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIconWrap: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
