import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const TODAY = new Date();
const getDays = () => {
  return [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + offset);
    return {
      offset,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.getDate(),
      full: d.toISOString().split("T")[0],
    };
  });
};

type TaskStatus = "in_progress" | "upcoming" | "completed";

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

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Floor Maintenance - Lobby",
    location: "Westside Plaza",
    sublocation: "Main Entrance",
    status: "in_progress",
    startTime: "09:00",
    endTime: "11:30",
    tags: ["Biohazard"],
    dayOffset: 0,
  },
  {
    id: "2",
    title: "Deep Clean - Office Suite B",
    location: "Downtown Corporate Center",
    sublocation: "Room 402",
    status: "upcoming",
    startTime: "13:00",
    endTime: "15:30",
    tags: ["High-Traffic"],
    dayOffset: 0,
  },
  {
    id: "3",
    title: "Sanitization - Break Room",
    location: "Westside Plaza",
    sublocation: "2nd Floor",
    status: "completed",
    startTime: "07:00",
    endTime: "08:45",
    finishedAt: "08:45",
    tags: [],
    dayOffset: 0,
  },
  {
    id: "4",
    title: "Window Cleaning - Facade",
    location: "North Tower",
    sublocation: "Exterior Level 1-3",
    status: "upcoming",
    startTime: "08:00",
    endTime: "10:00",
    tags: ["High-Rise"],
    dayOffset: 1,
  },
  {
    id: "5",
    title: "Restroom Deep Clean",
    location: "City Mall",
    sublocation: "Ground Floor",
    status: "upcoming",
    startTime: "11:00",
    endTime: "12:30",
    tags: ["Biohazard"],
    dayOffset: -1,
  },
  {
    id: "6",
    title: "Carpet Steam Cleaning",
    location: "Grand Hotel",
    sublocation: "Conference Room A",
    status: "completed",
    startTime: "09:00",
    finishedAt: "10:20",
    tags: [],
    dayOffset: -1,
  },
];

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  in_progress: {
    label: "In Progress",
    color: "#F59E0B",
    bg: "#FEF3C7",
    dot: "#F59E0B",
  },
  upcoming: {
    label: "Upcoming",
    color: "#3B82F6",
    bg: "#EFF6FF",
    dot: "#3B82F6",
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "#ECFDF5",
    dot: "#10B981",
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

const TaskCard = ({ task }: { task: Task }) => {
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isUpcoming = task.status === "upcoming";

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
            ? `Finished ${task.finishedAt}`
            : `${task.startTime} – ${task.endTime}`}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{task.title}</Text>

      {/* Location */}
      <View style={styles.cardLocation}>
        <Ionicons name="location-outline" size={13} color="#94A3B8" />
        <Text style={styles.locationText}>
          {task.location} • {task.sublocation}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        {isInProgress && (
          <>
            <AppButton
              label="Continue"
              onPress={() => {}}
              iconLeft="play"
              size="md"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <TouchableOpacity style={styles.btnCamera}>
              <Ionicons name="camera-outline" size={20} color="#F59E0B" />
            </TouchableOpacity>
          </>
        )}
        {isUpcoming && (
          <AppButton
            label="Start Task"
            onPress={() => {}}
            size="md"
            style={{ flex: 1, marginBottom: 0 }}
          />
        )}
        {isCompleted && (
          <AppButton
            label="View Status"
            onPress={() => {}}
            variant="secondary"
            size="md"
            style={{ flex: 1, marginBottom: 0 }}
          />
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
type FilterType = "all" | TaskStatus;

export default function TaskListScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const days = getDays();
  const navigation = useNavigation();

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const filtered = MOCK_TASKS.filter((t) => {
    const dayMatch = t.dayOffset === selectedDay;
    const statusMatch = filter === "all" || t.status === filter;
    return dayMatch && statusMatch;
  });

  const todayTasks = MOCK_TASKS.filter((t) => t.dayOffset === selectedDay);
  const remaining = todayTasks.filter((t) => t.status !== "completed").length;

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "in_progress", label: "In Progress" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <Header
        title="My Tasks"
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
              ? "Today's Schedule"
              : selectedDay < 0
                ? "Past Schedule"
                : "Upcoming Schedule"}
          </Text>
          <Text style={styles.sectionSub}>
            {remaining > 0
              ? `${remaining} tasks remaining`
              : "All tasks completed 🎉"}
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
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="clipboard-outline" size={36} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptyText}>
                No tasks match this filter for the selected day.
              </Text>
            </View>
          ) : (
            filtered.map((task) => <TaskCard key={task.id} task={task} />)
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
    backgroundColor: "#F8FAFC",
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
