import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import useEquipment from "@/hooks/useEquipment";
import { useIssueReport } from "@/hooks/useIssueReport";
import {
  TaskAssignmentDto,
  TaskAssignmentStatus,
  useTaskAssignments,
} from "@/hooks/useTaskAssignment";
import { useTaskSchedules } from "@/hooks/useTaskSchedule";
import { sendWorkerGps } from "@/hooks/useWorkerGps";
import { getCurrentLocation } from "@/services/workergps.service";

const STORAGE_KEY = "pendingLeaveRanges";

// ── TODAY đã bị xoá khỏi module level ────────────────────────────────────────

export interface PendingLeaveRange {
  id: string;
  from: string | null;
  to: string | null;
  taskAssignmentId: string | null;
  status: "Pending";
}

type BlockReason =
  | "emergency_leave_pending"
  | "issue_report_pending"
  | "issue_report_approved"
  | "equipment_request_pending"
  | "equipment_request_approved"
  | null;

type TaskBlockMap = Record<string, BlockReason>;

// ─── Storage helpers ──────────────────────────────────────────────────────────
export const savePendingLeave = async (range: PendingLeaveRange) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing: PendingLeaveRange[] = raw ? JSON.parse(raw) : [];
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

// ─── Date helpers — nhận `today` làm tham số, không dùng module-level ─────────
const getDays = (today: Date) =>
  [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      label: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      date: d.getDate(),
      full: d.toISOString().split("T")[0],
    };
  });

const buildDateForOffset = (offset: number, today: Date): string => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  isAdhoc: boolean;
}

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
  block: { label: "Bị chặn", color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
};

const TAG_CONFIG: Record<
  string,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Biohazard: { color: "#EF4444", bg: "#FEE2E2", icon: "warning-outline" },
  "High-Traffic": { color: "#8B5CF6", bg: "#EDE9FE", icon: "people-outline" },
  "High-Rise": { color: "#0EA5E9", bg: "#E0F2FE", icon: "arrow-up-outline" },
};

const BLOCK_REASON_CONFIG: Record<
  Exclude<BlockReason, null>,
  {
    icon: keyof typeof Ionicons.glyphMap;
    bg: string;
    color: string;
    text: string;
  }
> = {
  emergency_leave_pending: {
    icon: "time-outline",
    bg: "#FEF3C7",
    color: "#92400E",
    text: "Đang chờ quản lý xét duyệt yêu cầu nghỉ — vui lòng chờ",
  },
  issue_report_pending: {
    icon: "warning-outline",
    bg: "#FEF3C7",
    color: "#92400E",
    text: "Đang chờ xử lý báo cáo sự cố",
  },
  issue_report_approved: {
    icon: "checkmark-circle-outline",
    bg: "#ECFDF5",
    color: "#065F46",
    text: "Sự cố đã được xác nhận — công việc tạm dừng",
  },
  equipment_request_pending: {
    icon: "construct-outline",
    bg: "#EFF6FF",
    color: "#1E40AF",
    text: "Đang chờ duyệt yêu cầu thiết bị",
  },
  equipment_request_approved: {
    icon: "checkmark-circle-outline",
    bg: "#ECFDF5",
    color: "#065F46",
    text: "Yêu cầu thiết bị đã được duyệt — đang xử lý",
  },
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

const BlockReasonBanner = ({ reason }: { reason: BlockReason }) => {
  if (!reason) return null;
  const cfg = BLOCK_REASON_CONFIG[reason];
  return (
    <View style={[styles.blockBanner, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={15} color={cfg.color} />
      <Text style={[styles.blockBannerText, { color: cfg.color }]}>
        {cfg.text}
      </Text>
    </View>
  );
};

const RejectedLeaveBanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <View style={styles.rejectedBanner}>
    <Ionicons name="refresh-circle-outline" size={15} color="#065F46" />
    <Text style={styles.rejectedBannerText}>
      Yêu cầu nghỉ đã bị từ chối — tiếp tục công việc bình thường
    </Text>
    <TouchableOpacity
      onPress={onDismiss}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="close" size={14} color="#065F46" />
    </TouchableOpacity>
  </View>
);

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({
  task,
  onStart,
  onContinue,
  canAct = true,
  onFinishAdhoc,
  blockReason = null,
  showRejectedBanner = false,
  onDismissRejected,
}: {
  task: Task;
  onStart?: (id: string) => void;
  onContinue?: (id: string) => void;
  canAct?: boolean;
  onFinishAdhoc?: (id: string) => void;
  blockReason?: BlockReason;
  showRejectedBanner?: boolean;
  onDismissRejected?: () => void;
}) => {
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isNotStarted = task.status === "not_started";
  const isBlock = task.status === "block";
  const isLeaveRequestPending = blockReason === "emergency_leave_pending";
  const hasActions =
    canAct && (isInProgress || isNotStarted) && !isLeaveRequestPending;

  return (
    <View
      style={[
        styles.card,
        isInProgress && !isLeaveRequestPending && styles.cardActive,
        isBlock && blockReason && styles.cardBlocked,
        isLeaveRequestPending && styles.cardPendingLeave,
      ]}
    >
      {showRejectedBanner && (
        <RejectedLeaveBanner onDismiss={onDismissRejected ?? (() => {})} />
      )}
      {!showRejectedBanner && blockReason && (
        <BlockReasonBanner reason={blockReason} />
      )}

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
            : `${task.startTime}${task.endTime ? ` – ${task.endTime}` : ""}`}
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

      {isLeaveRequestPending && (isInProgress || isNotStarted) && (
        <View style={styles.cardActions}>
          <View style={styles.lockedBtn}>
            <Ionicons name="lock-closed-outline" size={15} color="#92400E" />
            <Text style={styles.lockedBtnText}>Đang chờ duyệt — tạm khoá</Text>
          </View>
        </View>
      )}

      {hasActions && (
        <View style={styles.cardActions}>
          {isInProgress && !task.isAdhoc && (
            <AppButton
              label="Tiếp tục"
              onPress={() => onContinue?.(task.id)}
              iconLeft="play"
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
          )}
          {isInProgress && task.isAdhoc && (
            <AppButton
              label="Hoàn thành công việc"
              onPress={() => onFinishAdhoc?.(task.id)}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TaskListScreen() {
  // ✅ TODAY được tính bên trong component và cập nhật khi app foreground
  const [today, setToday] = useState(() => new Date());

  const [selectedDay, setSelectedDay] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<TaskAssignmentDto[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [adhocInProgressId, setAdhocInProgressId] = useState<string | null>(
    null,
  );
  const [th2PendingLeaves, setTh2PendingLeaves] = useState<PendingLeaveRange[]>(
    [],
  );
  const [taskBlockMap, setTaskBlockMap] = useState<TaskBlockMap>({});
  const [rejectedTaskIds, setRejectedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  const prevBlockMapRef = useRef<TaskBlockMap>({});

  // ✅ Dùng useMemo để tránh tính lại getDays mỗi render không cần thiết
  const days = useMemo(() => getDays(today), [today]);

  const navigation = useNavigation();
  const { getWorkerProfile } = useAuth();
  const {
    getTaskAssignments,
    startTask,
    loading: hookLoading,
    getTaskAssignmentById,
    completeTask,
  } = useTaskAssignments();
  const { getTaskScheduleById } = useTaskSchedules();
  const { getListByWorkerId } = useEmergencyLeaveRequest();
  const { getByWorker: getIssueReportsByWorker } = useIssueReport();
  const { getByWorker: getEquipmentRequestsByWorker } = useEquipment();
  const getListByWorkerIdRef = useRef(getListByWorkerId);
  const getIssueReportsByWorkerRef = useRef(getIssueReportsByWorker);
  const getEquipmentRequestsByWorkerRef = useRef(getEquipmentRequestsByWorker);

  useEffect(() => {
    getListByWorkerIdRef.current = getListByWorkerId;
    getIssueReportsByWorkerRef.current = getIssueReportsByWorker;
    getEquipmentRequestsByWorkerRef.current = getEquipmentRequestsByWorker;
  });

  // ── Load workerId ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const profile = await getWorkerProfile();
        if (profile?.id) setWorkerId(profile.id);
      } catch (e) {
        console.error("Error fetching worker profile:", e);
      }
    })();
  }, []);

  const route = useRoute<any>();

  // Refresh khi quay lại từ TaskExecution
  useEffect(() => {
    const refreshParam = route.params?.refresh;
    if (!refreshParam) return;
    fetchTasks();
    syncBlockReasons();
  }, [route.params?.refresh]);

  // ── Sync block reasons từ server ──────────────────────────────────────────
  const syncBlockReasons = useCallback(async () => {
    if (!workerId) return;

    try {
      const [leaveRes, issueRes, equipRes] = await Promise.allSettled([
        getListByWorkerIdRef.current(workerId, { pageNumber: 1, pageSize: 50 }),
        getIssueReportsByWorkerRef.current(workerId, {
          pageNumber: 1,
          pageSize: 50,
        }),
        getEquipmentRequestsByWorkerRef.current(workerId, {
          pageNumber: 1,
          pageSize: 50,
        }),
      ]);

      const newTH2Pending: PendingLeaveRange[] =
        leaveRes.status === "fulfilled"
          ? leaveRes.value.content
              .filter((r) => r.status === "Pending" && !r.taskAssignmentId)
              .map((r) => ({
                id: r.id,
                from: r.leaveDateFrom?.split("T")[0] ?? null,
                to: r.leaveDateTo?.split("T")[0] ?? null,
                taskAssignmentId: null,
                status: "Pending" as const,
              }))
          : await loadPendingLeaves();

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTH2Pending));
      setTh2PendingLeaves(newTH2Pending);

      const newBlockMap: TaskBlockMap = {};

      if (leaveRes.status === "fulfilled") {
        leaveRes.value.content
          .filter((r) => r.status === "Pending" && !!r.taskAssignmentId)
          .forEach((r) => {
            newBlockMap[r.taskAssignmentId!] = "emergency_leave_pending";
          });
      }

      if (issueRes.status === "fulfilled") {
        issueRes.value.content
          .filter((r) => r.status === "Pending" || r.status === "Approved")
          .forEach((r) => {
            if (!newBlockMap[r.taskAssignmentId]) {
              newBlockMap[r.taskAssignmentId] =
                r.status === "Pending"
                  ? "issue_report_pending"
                  : "issue_report_approved";
            }
          });
      }

      if (equipRes.status === "fulfilled") {
        equipRes.value.content
          .filter((r) => r.status === "Pending" || r.status === "Approved")
          .forEach((r) => {
            if (!newBlockMap[r.taskAssignmentId]) {
              newBlockMap[r.taskAssignmentId] =
                r.status === "Pending"
                  ? "equipment_request_pending"
                  : "equipment_request_approved";
            }
          });
      }

      const prevMap = prevBlockMapRef.current;
      const prevTH1PendingIds = Object.entries(prevMap)
        .filter(([, v]) => v === "emergency_leave_pending")
        .map(([k]) => k);

      const justRejectedIds = prevTH1PendingIds.filter(
        (id) => newBlockMap[id] !== "emergency_leave_pending",
      );

      if (justRejectedIds.length > 0) {
        setRejectedTaskIds((prev) => new Set([...prev, ...justRejectedIds]));
        setTimeout(() => {
          setRejectedTaskIds((prev) => {
            const next = new Set(prev);
            justRejectedIds.forEach((id) => next.delete(id));
            return next;
          });
        }, 8000);
      }

      prevBlockMapRef.current = newBlockMap;
      setTaskBlockMap(newBlockMap);
    } catch (e) {
      console.warn("[BlockReasons] sync failed", e);
    }
  }, [workerId]);

  // ✅ Cập nhật `today` mỗi khi app foreground — đặt cùng chỗ với AppState listener
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setToday(new Date()); // cập nhật ngày thực khi mở lại app
        syncBlockReasons();
      }
    });
    return () => sub.remove();
  }, [syncBlockReasons]);

  useEffect(() => {
    if (workerId) {
      syncBlockReasons();
    }
  }, [workerId]);

  useEffect(() => {
    const interval = setInterval(syncBlockReasons, 15_000);
    return () => clearInterval(interval);
  }, [syncBlockReasons]);

  // ── Derived state ──────────────────────────────────────────────────────────
  // ✅ Truyền `today` vào buildDateForOffset thay vì dùng module-level TODAY
  const currentDateStr = buildDateForOffset(selectedDay, today);

  const hasPendingDotForDay = (dayFull: string): boolean =>
    th2PendingLeaves.some(
      (r) =>
        r.from !== null &&
        r.to !== null &&
        dayFull >= r.from! &&
        dayFull <= r.to!,
    );

  const getBlockReasonForTask = (taskId: string): BlockReason =>
    taskBlockMap[taskId] ?? null;

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!workerId) return;
    setLoadingTasks(true);
    // ✅ Truyền `today` vào buildDateForOffset
    const baseDate = buildDateForOffset(selectedDay, today);
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
  }, [workerId, selectedDay, filter, today]); // ✅ thêm `today` vào deps

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    setToday(new Date()); // ✅ cũng cập nhật ngày khi pull-to-refresh
    await Promise.all([fetchTasks(), syncBlockReasons()]);
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

  const mappedTasks: Task[] = tasks.map((t) => {
    const time = new Date(t.scheduledStartAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
    const endTime = t.scheduledEndAt
      ? new Date(t.scheduledEndAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        })
      : undefined;
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
      endTime,
      tags: [],
      dayOffset: 0,
      isAdhoc: t.isAdhocTask,
    };
  });

  const visibleTasks = mappedTasks.filter(
    (t) => filter === "all" || t.status === filter,
  );

  const remaining = mappedTasks.filter((t) => t.status !== "completed").length;
  // const earliestNotStartedId = useMemo(() => {
  //   if (selectedDay !== 0) return null;

  //   // Nếu có bất kỳ task nào đang in_progress, bị block status,
  //   // hoặc đang bị lock do emergency_leave/issue/equipment pending
  //   // → không cho phép bắt đầu task mới nào cả
  //   const hasBlockingTask = mappedTasks.some((t) => {
  //     if (t.status === "in_progress") return true;
  //     if (t.status === "block") return true;
  //     if (taskBlockMap[t.id]) return true; // emergency_leave_pending / issue / equipment
  //     return false;
  //   });

  //   if (hasBlockingTask) return null;

  //   const notStarted = mappedTasks
  //     .filter((t) => t.status === "not_started")
  //     .sort((a, b) => a.startTime.localeCompare(b.startTime));
  //   return notStarted[0]?.id ?? null;
  // }, [mappedTasks, selectedDay, taskBlockMap]); // thêm taskBlockMap vào deps

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

      const taskDetail = await getTaskAssignmentById(id);
      const listTask = tasks.find((t) => t.id === id);
      const isAdhocTask =
        taskDetail?.isAdhocTask === true || listTask?.isAdhocTask === true;

      let latitude: number | null = null,
        longitude: number | null = null,
        isConfirmed = true;
      try {
        const loc = await getCurrentLocation();
        latitude = loc.latitude;
        longitude = loc.longitude;
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

      if (isAdhocTask) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: "InProgress" as any } : t,
          ),
        );
        setAdhocInProgressId(id);
        return;
      }

      const hasExecutionSteps =
        Array.isArray(res?.steps) && (res?.steps?.length ?? 0) > 0;

      if (!hasExecutionSteps) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: "InProgress" as any } : t,
          ),
        );
        setAdhocInProgressId(id);
        return;
      }

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

  const handleFinishAdhocTask = async (id: string) => {
    if (!workerId) return;
    try {
      setLoadingTasks(true);
      await completeTask(id, workerId);
      setAdhocInProgressId(null);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "Completed" as any } : t,
        ),
      );
      Alert.alert("Thành công", "Công việc adhoc đã hoàn thành!");
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể hoàn thành công việc.");
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
          const hasDot = hasPendingDotForDay(d.full);
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
              {hasDot && (
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
                onFinishAdhoc={handleFinishAdhocTask}
                canAct={selectedDay === 0}
                blockReason={getBlockReasonForTask(task.id)}
                showRejectedBanner={rejectedTaskIds.has(task.id)}
                onDismissRejected={() => {
                  setRejectedTaskIds((prev) => {
                    const next = new Set(prev);
                    next.delete(task.id);
                    return next;
                  });
                }}
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
  pendingDotSelected: { backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sectionSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
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
  taskList: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
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
  cardBlocked: {
    borderColor: "#db0614",
    borderLeftWidth: 4,
    shadowColor: "#db0614",
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardPendingLeave: {
    borderColor: "#F59E0B",
    borderLeftWidth: 4,
    opacity: 0.85,
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
  lockedBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  lockedBtnText: { fontSize: 13, fontWeight: "600", color: "#92400E" },
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
  blockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  blockBannerText: { fontSize: 12, fontWeight: "600", flex: 1 },
  rejectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
    backgroundColor: "#D1FAE5",
  },
  rejectedBannerText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    color: "#065F46",
  },
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
  dayNotice: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  dayNoticeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dayNoticeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  dayNoticeText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
});
