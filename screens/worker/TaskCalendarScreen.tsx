import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Animated,
    Modal,
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
    useTaskAssignments,
} from "@/hooks/useTaskAssignment";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus = "NotStarted" | "InProgress" | "Completed" | "Block";

interface DayCell {
  date: number;
  full: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateKey = (iso: string): string => iso.split("T")[0];

const getDotColor = (status: TaskStatus | string): string => {
  switch (status) {
    case "Completed":
      return "#10B981";
    case "InProgress":
      return "#F59E0B";
    case "Block":
      return "#EF4444";
    default:
      return "#3B82F6";
  }
};

const getStatusLabel = (status: TaskStatus | string): string => {
  switch (status) {
    case "Completed":
      return "Đã hoàn thành";
    case "InProgress":
      return "Đang thực hiện";
    case "Block":
      return "Bị chặn";
    default:
      return "Chưa bắt đầu";
  }
};

const getStatusColors = (
  status: TaskStatus | string,
): { bg: string; color: string } => {
  switch (status) {
    case "Completed":
      return { bg: "#10B981", color: "#FFFFFF" };
    case "InProgress":
      return { bg: "#F59E0B", color: "#FFFFFF" };
    case "Block":
      return { bg: "#EF4444", color: "#FFFFFF" };
    default:
      return { bg: "#3B82F6", color: "#FFFFFF" };
  }
};

const buildCalendarGrid = (year: number, month: number): DayCell[][] => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const cells: DayCell[] = [];

  // Prev month padding
  const prevMonthLast = new Date(year, month, 0);
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLast.getDate() - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const full = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: d, full, isCurrentMonth: false, isToday: false });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const full = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      date: d,
      full,
      isCurrentMonth: true,
      isToday: full === todayStr,
    });
  }

  // Next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const full = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: d, full, isCurrentMonth: false, isToday: false });
  }

  // Split into weeks
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
};

const formatFullDate = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const DotRow = ({ tasks }: { tasks: TaskAssignmentDto[] }) => {
  const dots = tasks.slice(0, 5);
  return (
    <View style={styles.dotRow}>
      {dots.map((t, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: getDotColor(String(t.status)) },
          ]}
        />
      ))}
    </View>
  );
};

const SlotItem = ({
  task,
  index,
}: {
  task: TaskAssignmentDto;
  index: number;
}) => {
  const status = String(task.status) as TaskStatus;
  const statusColors = getStatusColors(status);
  const startTime = formatTime(task.scheduledStartAt);
  const endTime = task.scheduledEndAt ? formatTime(task.scheduledEndAt) : "";

  const slotColors = [
    { border: "#EF4444", label: "#EF4444" },
    { border: "#10B981", label: "#10B981" },
    { border: "#1E3A5F", label: "#1E3A5F" },
  ];
  const slotColor = slotColors[index % slotColors.length];

  return (
    <View style={[styles.slotItem, { borderLeftColor: slotColor.border }]}>
      <View style={styles.slotHeader}>
        <View
          style={[
            styles.slotLabelBadge,
            { backgroundColor: slotColor.border + "1A" },
          ]}
        >
          <Text style={[styles.slotLabelText, { color: slotColor.label }]}>
            STT: {index + 1}
          </Text>
        </View>
        <View style={styles.slotRoomRow}>
          <Ionicons name="location-outline" size={13} color="#94A3B8" />
          <Text style={styles.slotRoomValue}>
            {task.displayLocation || "—"}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
        >
          <Text style={[styles.statusBadgeText, { color: statusColors.color }]}>
            {getStatusLabel(status)}
          </Text>
        </View>
      </View>

      <View style={styles.slotTimeRow}>
        <Text style={styles.slotTime}>{startTime}</Text>
        <View style={styles.slotTimeLine} />
        <Text style={styles.slotTime}>{endTime}</Text>
      </View>

      <Text style={styles.slotTitle}>
        Công việc:{" "}
        {task.taskName ||
          (task.isAdhocTask
            ? task.nameAdhocTask || "Flexible Task"
            : `Task ${task.id.slice(0, 8).toUpperCase()}`)}
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TaskCalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasksByDate, setTasksByDate] = useState<
    Record<string, TaskAssignmentDto[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  const modalAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  const { getWorkerProfile } = useAuth();
  const { getTaskAssignments } = useTaskAssignments();

  // ── Load workerId ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const profile = await getWorkerProfile();
        if (profile?.id) setWorkerId(profile.id);
      } catch {}
    })();
  }, []);

  // ── Fetch month tasks ──────────────────────────────────────────────────────
  const fetchMonthTasks = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const fromDate = `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00Z`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const toDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

      const resp = await getTaskAssignments(
        { assigneeId: workerId, fromDate, toDate },
        { pageNumber: 1, pageSize: 200 },
      );

      const grouped: Record<string, TaskAssignmentDto[]> = {};
      (resp?.content ?? []).forEach((t) => {
        const key = toDateKey(t.scheduledStartAt);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
      });
      setTasksByDate(grouped);
    } catch (e) {
      console.warn("[TaskCalendar] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [workerId, year, month]);

  useEffect(() => {
    fetchMonthTasks();
  }, [fetchMonthTasks]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const weeks = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // ── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (dayKey: string) => {
    setSelectedDay(dayKey);
    setModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] ?? []) : [];

  const handleNavigate = (screen: TabKey) =>
    navigation.navigate(screen as never);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />
      <Header
        title="Lịch công việc"
        onBack={() => handleNavigate("Home")}
        style={styles.header}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Month navigation ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={handlePrevMonth}
          >
            <Ionicons name="chevron-back" size={20} color="#1E3A5F" />
          </TouchableOpacity>
          <View style={styles.monthTitleRow}>
            <Text style={styles.monthTitle}>
              {MONTHS_VI[month]} {year}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={handleNextMonth}
          >
            <Ionicons name="chevron-forward" size={20} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        {/* ── Calendar grid ── */}
        <View style={styles.calendarWrap}>
          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((d) => (
              <Text key={d} style={styles.weekdayLabel}>
                {d}
              </Text>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#1E3A5F"
              style={{ marginVertical: 32 }}
            />
          ) : (
            weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((cell) => {
                  const cellTasks = tasksByDate[cell.full] ?? [];
                  const hasTasks = cellTasks.length > 0;
                  return (
                    <TouchableOpacity
                      key={cell.full}
                      style={[
                        styles.dayCell,
                        cell.isToday && styles.dayCellToday,
                      ]}
                      onPress={() => hasTasks && openModal(cell.full)}
                      activeOpacity={hasTasks ? 0.6 : 1}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          !cell.isCurrentMonth && styles.dayNumberFaded,
                          cell.isToday && styles.dayNumberToday,
                        ]}
                      >
                        {cell.date}
                      </Text>
                      {hasTasks && <DotRow tasks={cellTasks} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>

        {/* ── Legend ── */}
        <View style={styles.legend}>
          {[
            { color: "#10B981", label: "Đã hoàn thành" },
            { color: "#F59E0B", label: "Đang thực hiện" },
            { color: "#EF4444", label: "Bị chặn" },
            { color: "#3B82F6", label: "Chưa bắt đầu" },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Tab ── */}
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

      {/* ── Day Detail Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.modalSheet,
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalDate}>
                  {selectedDay ? formatFullDate(selectedDay) : ""}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Slot list */}
              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {selectedTasks.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Ionicons
                      name="calendar-outline"
                      size={36}
                      color="#CBD5E1"
                    />
                    <Text style={styles.modalEmptyText}>
                      Không có công việc
                    </Text>
                  </View>
                ) : (
                  selectedTasks.map((task, i) => (
                    <SlotItem key={task.id} task={task} index={i} />
                  ))
                )}
                <View style={{ height: 16 }} />
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#F8FAFC" },
  scroll: { flex: 1 },

  semesterRow: { marginTop: 12 },
  semesterContent: { paddingHorizontal: 16, gap: 10 },
  semesterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  semesterPillActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  semesterText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  semesterTextActive: { color: "#FFFFFF" },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  monthTitleRow: { flexDirection: "row", alignItems: "center" },
  monthTitle: { fontSize: 18, fontWeight: "800", color: "#1E3A5F" },

  calendarWrap: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    paddingVertical: 6,
  },
  weekRow: { flexDirection: "row" },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 10,
    minHeight: 48,
  },
  dayCellToday: {
    backgroundColor: "#EFF6FF",
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  dayNumberFaded: { color: "#CBD5E1" },
  dayNumberToday: { color: "#2563EB", fontWeight: "800" },
  dotRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
    marginHorizontal: 16,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#64748B", fontWeight: "500" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalDate: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  modalEmptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "500" },

  // Slot item
  slotItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  slotLabelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  slotLabelText: { fontSize: 12, fontWeight: "700" },
  slotRoomRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  slotRoomLabel: { fontSize: 13, color: "#94A3B8" },
  slotRoomValue: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginLeft: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  slotTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  slotTime: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  slotTimeLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    lineHeight: 20,
  },
});
