import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
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
import { useEmergencyLeaveRequest } from "@/hooks/useEmergencyLeave";
import {
  TaskAssignmentDto,
  TaskAssignmentStatus,
  useTaskAssignments,
} from "@/hooks/useTaskAssignment";
import { useTaskSchedules } from "@/hooks/useTaskSchedule";
import { sendWorkerGps } from "@/hooks/useWorkerGps";
import { getCurrentLocation } from "@/services/workergps.service";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "pendingLeaveRanges";

// ─── Types ────────────────────────────────────────────────────────────────────
const TODAY = new Date();

export interface PendingLeaveRange {
  id: string;
  from: string | null; // ISO date string "2025-05-01" hoặc null nếu TH1
  to: string | null; // ISO date string "2025-05-03" hoặc null nếu TH1
  taskAssignmentId: string | null; // null = TH2, có giá trị = TH1
  status: "Pending" | "Approved" | "Rejected";
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
export const savePendingLeave = async (range: PendingLeaveRange) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing: PendingLeaveRange[] = raw ? JSON.parse(raw) : [];
    // Tránh duplicate
    const filtered = existing.filter((r) => r.id !== range.id);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...filtered, range]),
    );
  } catch (e) {
    console.warn("[PendingLeave] savePendingLeave error:", e);
  }
};

export const updatePendingLeaveStatus = async (
  id: string,
  status: PendingLeaveRange["status"],
) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing: PendingLeaveRange[] = raw ? JSON.parse(raw) : [];
    const updated = existing.map((r) => (r.id === id ? { ...r, status } : r));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("[PendingLeave] updatePendingLeaveStatus error:", e);
  }
};

const loadPendingLeaves = async (): Promise<PendingLeaveRange[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const getDays = () =>
  [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + offset);
    return {
      offset,
      label: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      date: d.getDate(),
      full: d.toISOString().split("T")[0],
    };
  });

const buildDateForOffset = (offset: number): string => {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─── Task types ───────────────────────────────────────────────────────────────
type TaskStatus = "in_progress" | "not_started" | "completed" | "block";
type FilterType = "all" | TaskStatus;

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

// ─── Status / Tag config ──────────────────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────
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

// ─── Pending Leave Banner ─────────────────────────────────────────────────────
const PendingLeaveBanner = ({ isTH1 }: { isTH1: boolean }) => (
  <View style={styles.pendingLeaveBanner}>
    <Ionicons name="time-outline" size={15} color="#92400E" />
    <Text style={styles.pendingLeaveText}>
      {isTH1
        ? "Công việc đang chờ quản lý duyệt yêu cầu nghỉ khẩn cấp"
        : "Bạn có yêu cầu nghỉ đang chờ duyệt cho ngày này"}
    </Text>
  </View>
);

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({
  task,
  onStart,
  onContinue,
  canAct = true,
  hasPendingLeave = false,
}: {
  task: Task;
  onStart?: (id: string) => void;
  onContinue?: (id: string) => void;
  canAct?: boolean;
  hasPendingLeave?: boolean;
}) => {
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isNotStarted = task.status === "not_started";
  const isBlock = task.status === "block";
  const hasActions =
    canAct && (isInProgress || isNotStarted) && !hasPendingLeave;

  return (
    <View
      style={[
        styles.card,
        isInProgress && styles.cardActive,
        isBlock && hasPendingLeave && styles.cardPendingLeave,
      ]}
    >
      {/* Banner TH1: task bị Block do pending leave */}
      {isBlock && hasPendingLeave && <PendingLeaveBanner isTH1={true} />}

      {/* Top row */}
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

      <Text style={styles.cardTitle}>{task.title}</Text>

      <View style={styles.cardLocation}>
        <Ionicons name="location-outline" size={13} color="#94A3B8" />
        <Text style={styles.locationText}>
          {task.location}
          {task.sublocation ? ` • ${task.sublocation}` : ""}
        </Text>
      </View>

      {hasActions && (
        <View style={styles.cardActions}>
          {isInProgress && (
            <AppButton
              label="Tiếp tục"
              onPress={() => onContinue?.(task.id)}
              iconLeft="play"
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
          )}
          {isNotStarted && (
            <AppButton
              label="Bắt đầu công việc"
              onPress={() => onStart?.(task.id)}
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
          )}
        </View>
      )}
    </View>
  );
};

// ─── Empty Day (TH2: toàn bộ ngày bị pending leave) ──────────────────────────
const PendingLeaveDayNotice = () => (
  <View style={styles.pendingLeaveDayNotice}>
    <View style={styles.pendingLeaveDayIcon}>
      <Ionicons name="medkit-outline" size={28} color="#db0614" />
    </View>
    <Text style={styles.pendingLeaveDayTitle}>Yêu cầu nghỉ đang chờ duyệt</Text>
    <Text style={styles.pendingLeaveDayText}>
      Các công việc của ngày này sẽ hiện lại nếu quản lý từ chối yêu cầu.
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TaskListScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<TaskAssignmentDto[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(false);

  // ── Pending leave state ──
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeaveRange[]>([]);

  const days = getDays();
  const navigation = useNavigation();
  const { getWorkerProfile } = useAuth();
  const {
    getTaskAssignments,
    startTask,
    loading: hookLoading,
    getTaskAssignmentById,
  } = useTaskAssignments();
  const { getTaskScheduleById } = useTaskSchedules();
  const { getById: getLeaveRequestById, getListByWorkerId } =
    useEmergencyLeaveRequest();

  // ── Load workerId ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWorkerId = async () => {
      try {
        setLoadingWorker(true);
        const profile = await getWorkerProfile();
        if (profile?.id) setWorkerId(profile.id);
      } catch (e) {
        console.error("Error fetching worker profile:", e);
      } finally {
        setLoadingWorker(false);
      }
    };
    fetchWorkerId();
  }, []);

  const hasPendingLeaveForToday = pendingLeaves.some(
    (r) =>
      r.status === "Pending" &&
      r.from !== null &&
      r.to !== null &&
      currentDateStr >= r.from! &&
      currentDateStr <= r.to!,
  );

  // ── Load + sync pending leaves ────────────────────────────────────────────
  // Hàm này load từ AsyncStorage và poll API để cập nhật status
  const syncPendingLeaves = useCallback(async () => {
    const leaves = await loadPendingLeaves();

    // Fetch từ backend theo workerId — source of truth
    if (workerId) {
      try {
        const res = await getListByWorkerId(workerId, {
          pageNumber: 1,
          pageSize: 50,
        });

        const pendingFromServer: PendingLeaveRange[] = res.content
          .filter((r) => r.status === "Pending")
          .map((r) => ({
            id: r.id,
            from: r.leaveDateFrom?.split("T")[0] ?? null, // "2026-04-28"
            to: r.leaveDateTo?.split("T")[0] ?? null,
            taskAssignmentId: r.taskAssignmentId ?? null,
            status: "Pending" as const,
          }));

        // Merge: server là source of truth cho Pending
        // Giữ local những cái Approved/Rejected (để cleanup 7 ngày vẫn hoạt động)
        const localNonPending = leaves.filter((l) => l.status !== "Pending");
        const merged = [...pendingFromServer, ...localNonPending];

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setPendingLeaves(merged);
        return;
      } catch (e) {
        console.warn(
          "[PendingLeave] fetch from server failed, fallback local",
          e,
        );
      }
    }

    // Fallback: dùng local nếu fetch server lỗi hoặc chưa có workerId
    setPendingLeaves(leaves);
  }, [workerId, getListByWorkerId]);

  useEffect(() => {
    syncPendingLeaves();
  }, [syncPendingLeaves]);

  useEffect(() => {
    // Poll mỗi 30 giây khi màn đang active
    const interval = setInterval(() => {
      syncPendingLeaves();
    }, 15_000);

    return () => clearInterval(interval);
  }, [syncPendingLeaves]);

  // Sync lại khi app trở lại foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") syncPendingLeaves();
    });
    return () => sub.remove();
  }, [syncPendingLeaves]);

  // ── Helpers: check pending leave cho ngày/task cụ thể ────────────────────
  const currentDateStr = buildDateForOffset(selectedDay);

  /**
   * TH2: Ngày đang xem có pending leave không có taskAssignmentId
   * → ẩn toàn bộ task list của ngày đó
   */
  const pendingLeaveForDay = pendingLeaves.find(
    (r) =>
      r.status === "Pending" &&
      r.taskAssignmentId === null &&
      r.from !== null &&
      r.to !== null &&
      currentDateStr >= r.from! &&
      currentDateStr <= r.to!,
  );

  /**
   * TH1: Kiểm tra 1 taskAssignmentId cụ thể có pending leave không
   * → hiển thị banner trên task card
   */
  const isTaskPendingLeave = (taskId: string): boolean =>
    pendingLeaves.some(
      (r) => r.status === "Pending" && r.taskAssignmentId === taskId,
    );

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!workerId) return;
    setLoadingTasks(true);

    const baseDate = buildDateForOffset(selectedDay);
    const filterReq: any = {
      assigneeId: workerId,
      fromDate: `${baseDate}T00:00:00Z`,
      toDate: `${baseDate}T23:59:59Z`,
    };

    if (filter !== "all") {
      const statusMap: Record<string, string> = {
        in_progress: "InProgress",
        completed: "Completed",
        not_started: "NotStarted",
        block: "Block",
      };
      if (statusMap[filter]) filterReq.status = statusMap[filter];
    }

    const resp = await getTaskAssignments(filterReq, {
      pageNumber: 1,
      pageSize: 20,
    });
    setTasks(resp?.content ?? []);
    setLoadingTasks(false);
  }, [workerId, selectedDay, filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), syncPendingLeaves()]);
    setRefreshing(false);
  };

  // ── Map status ─────────────────────────────────────────────────────────────
  const mapStatus = (s: TaskAssignmentStatus | string | number): TaskStatus => {
    switch (String(s)) {
      case "InProgress":
      case "1":
        return "in_progress";
      case "Completed":
      case "2":
        return "completed";
      case "Block":
      case "3":
        return "block";
      default:
        return "not_started";
    }
  };

  // ── Map tasks ──────────────────────────────────────────────────────────────
  const mappedTasks: Task[] = tasks.map((t) => {
    const dateObj = new Date(t.scheduledStartAt);
    const time = dateObj.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
    return {
      id: t.id,
      title:
        t.taskName ||
        (t.isAdhocTask
          ? t.nameAdhocTask || "Công việc linh động"
          : `Công việc ${t.taskScheduleId.slice(0, 8).toUpperCase()}`),
      location: t.displayLocation || "Không rõ địa điểm",
      sublocation: "",
      status: mapStatus(t.status),
      startTime: time,
      tags: [],
      dayOffset: 0,
    };
  });

  // TH2: nếu ngày này có pending leave (không có taskAssignmentId) → ẩn hết
  const visibleTasks = pendingLeaveForDay
    ? []
    : mappedTasks.filter((t) => filter === "all" || t.status === filter);

  const remaining = mappedTasks.filter((t) => t.status !== "completed").length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNavigate = (screen: TabKey) =>
    navigation.navigate(screen as never);

  const handleStartTask = async (id: string) => {
    if (!workerId) {
      Alert.alert(
        "Lỗi",
        "Không thể bắt đầu công việc khi thiếu ID người lao động.",
      );
      return;
    }
    try {
      setLoadingTasks(true);
      let latitude: number | null = null;
      let longitude: number | null = null;
      let isConfirmed = true;
      try {
        const location = await getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      } catch {
        isConfirmed = false;
        Alert.alert(
          "Không lấy được GPS",
          "Vẫn tiếp tục nhưng sẽ lưu vị trí chưa xác nhận.",
        );
      }
      try {
        await sendWorkerGps(workerId, latitude, longitude, isConfirmed);
      } catch {}
      const res = await startTask(id, workerId);
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
        "Lỗi",
        "Không thể tiếp tục công việc khi thiếu ID người lao động.",
      );
      return;
    }
    try {
      setLoadingTasks(true);
      const task = await getTaskAssignmentById(taskId);
      if (!task) throw new Error("Task not found");
      const { schedule, steps } = await getTaskScheduleById(
        task.taskScheduleId,
      );
      if (!schedule) throw new Error("Task schedule not found");
      (navigation as any).navigate("TaskExecution", {
        id: taskId,
        schedule,
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

  // ── Filter pills ───────────────────────────────────────────────────────────
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
          // Kiểm tra ngày này có pending leave TH2 không (để hiện dấu chấm đỏ)
          const hasPendingDot = pendingLeaves.some(
            (r) =>
              r.status === "Pending" &&
              r.taskAssignmentId === null &&
              r.from !== null &&
              r.to !== null &&
              d.full >= r.from! &&
              d.full <= r.to!,
          );
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
              {/* Chấm đỏ nếu ngày có pending leave TH2 */}
              {hasPendingDot && (
                <View
                  style={[
                    styles.pendingDot,
                    isSelected && styles.pendingDotSelected,
                  ]}
                />
              )}
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
        {/* ── Section header ── */}
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
                ? mappedTasks.length
                : mappedTasks.filter((t) => t.status === f.key).length;
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

        {/* ── Task list ── */}
        <View style={styles.taskList}>
          {loadingTasks || hookLoading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : pendingLeaveForDay ? (
            // TH2: ẩn task, hiện notice
            <PendingLeaveDayNotice />
          ) : visibleTasks.length === 0 ? (
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
            visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStartTask}
                onContinue={handleContinue}
                canAct={selectedDay === 0 && !hasPendingLeaveForToday}
                // TH1: truyền flag nếu task này có pending leave
                hasPendingLeave={isTaskPendingLeave(task.id)}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar
        activeTab="Tasks"
        onNavigate={handleNavigate}
        onEmergencyPress={() =>
          navigation.navigate(
            "EmergencyLeave" as never,
            { taskAssignmentId: null } as never,
          )
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },

  // Day selector
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
  dayDate: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginTop: 2 },
  dayDateActive: { color: "#FFFFFF" },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#db0614",
    marginTop: 3,
  },
  pendingDotSelected: {
    backgroundColor: "#FFFFFF",
  },

  // Scroll
  scroll: { flex: 1 },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sectionSub: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // Filter pills
  filterRow: { marginTop: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
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
  filterPillActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
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
  filterCountText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  filterCountTextActive: { color: "#BFDBFE" },

  // Task list
  taskList: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },

  // Task card
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
  cardPendingLeave: {
    borderColor: "#db0614",
    borderLeftWidth: 4,
    shadowColor: "#db0614",
    shadowOpacity: 0.08,
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
  cardBadges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  cardTime: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
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
  locationText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  cardActions: { flexDirection: "row", gap: 10 },

  // Badges
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 11, fontWeight: "600" },

  // Pending leave banner (TH1 - trên task card)
  pendingLeaveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  pendingLeaveText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
  },

  // Pending leave day notice (TH2 - thay toàn bộ list)
  pendingLeaveDayNotice: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  pendingLeaveDayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pendingLeaveDayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  pendingLeaveDayText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIconWrap: { marginBottom: 12 },
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
