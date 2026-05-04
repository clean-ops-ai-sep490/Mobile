import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import TaskPickerModal from "@/components/modals/TaskPickerModal";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedTask } from "@/contexts/SelectedTaskContext";
import { useNotificationStore } from "@/store/notification.store";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  userName?: string;
  company?: string;
  location?: string;
  pendingTasks?: number;
  completedTasks?: number;
  totalTasks?: number;
  onNavigate?: (screen: string) => void;
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
interface QuickCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  delay?: number;
  onPress?: () => void;
}

function QuickCard({
  icon,
  label,
  subtitle,
  iconBg,
  iconColor,
  delay = 0,
  onPress,
}: QuickCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flex: 1,
      }}
    >
      <TouchableOpacity
        style={styles.quickCard}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={[styles.quickIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
        <Text style={styles.quickSub}>{subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Bottom Tab ───────────────────────────────────────────────────────────────
interface TabItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}
function TabItem({ icon, activeIcon, label, active, onPress }: TabItemProps) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={active ? activeIcon : icon}
        size={22}
        color={active ? "#2563EB" : "#94A3B8"}
        style={styles.tabIconIon}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {active && <View style={styles.tabDot} />}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate }: Props) {
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  const navigation = useNavigation();
  const { user } = useAuth();
  const userName = user?.fullName ?? "";
  const { selectedTaskId, setSelectedTaskId } = useSelectedTask();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { getWorkerProfile } = useAuth();

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    (async () => {
      try {
        if (user?.role === "Worker") {
          const profile = await getWorkerProfile();
          if (profile?.id) {
            fetchUnreadCount(profile.id); // ✅ truyền workerId
          }
        } else {
          fetchUnreadCount(); // Supervisor/Manager không cần workerId
        }
      } catch (e) {
        console.error("fetchUnreadCount error:", e);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View>
              <Text style={styles.greeting}>Chúc bạn một ngày tốt lành,</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onNavigate?.("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#334155"
              />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                if (user?.role === "Worker") {
                  (navigation as any).navigate("WorkerProfile");
                } else {
                  onNavigate?.("Profile");
                }
              }}
            >
              <Ionicons name="person-outline" size={18} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── My Tasks ── */}
          <Animated.View style={{ opacity: headerFade }}>
            <TouchableOpacity
              style={styles.tasksCard}
              onPress={() => onNavigate?.("Tasks")}
              activeOpacity={0.82}
            >
              <View style={styles.tasksLeft}>
                <View style={styles.tasksIconWrap}>
                  <Ionicons
                    name="clipboard-outline"
                    size={22}
                    color="#3B82F6"
                  />
                </View>
                <View>
                  <Text style={styles.tasksTitle}>Công việc của tôi</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </Animated.View>

          {/* ── Quick Actions ── */}
          <Text style={styles.sectionLabel}>Tác vụ nhanh</Text>
          <View
            style={[
              styles.quickGrid,
              { gap: CARD_GAP, marginBottom: CARD_GAP },
            ]}
          >
            <QuickCard
              icon="swap-horizontal-outline"
              label="Yêu cầu đổi công việc"
              subtitle="Gửi yêu cầu đổi công việc"
              iconBg="#F3F4F6"
              iconColor="#6B7280"
              delay={340}
              onPress={() => {
                setPendingAction("SwapTask");
                setPickerVisible(true);
              }}
            />
          </View>
          <View
            style={[
              styles.quickGrid,
              { gap: CARD_GAP, marginBottom: CARD_GAP },
            ]}
          >
            <QuickCard
              icon="calendar-outline"
              label="Lịch công việc của tôi"
              subtitle="Xem công việc theo lịch biểu"
              iconBg="#dfe0ec"
              iconColor="#3B82F6"
              delay={180}
              onPress={() => onNavigate?.("TaskCalendar")}
            />
          </View>
          <View
            style={[
              styles.quickGrid,
              { gap: CARD_GAP, marginBottom: CARD_GAP },
            ]}
          >
            <QuickCard
              icon="list-outline"
              label="Danh sách yêu cầu"
              subtitle="Xem và quản lý tất cả yêu cầu"
              iconBg="#FFF7ED"
              iconColor="#F97316"
              delay={260}
              onPress={() => onNavigate?.("ListAllRequests")}
            />
          </View>
          <View
            style={[
              styles.quickGrid,
              { gap: CARD_GAP, marginBottom: CARD_GAP },
            ]}
          >
            <QuickCard
              icon="person-outline"
              label="Hồ sơ của tôi"
              subtitle="Xem và quản lý thông tin của bạn"
              iconBg="#F3E8FF"
              iconColor="#9333EA"
              delay={180}
              onPress={() => {
                if (user?.role === "Worker") {
                  (navigation as any).navigate("WorkerProfile");
                } else {
                  onNavigate?.("Profile");
                }
              }}
            />
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>

        <BottomTabBar activeTab="Home" onNavigate={handleNavigate} />
        <TaskPickerModal
          visible={pickerVisible}
          onClose={() => {
            setPickerVisible(false);
            setPendingAction(null);
          }}
          onSelect={(id) => {
            setPickerVisible(false);

            const action = pendingAction ?? "SwapTask";

            if (action === "SwapTask") {
              navigation.navigate(
                "SwapTask" as never,
                { taskAssignmentId: id } as never,
              );
            } else if (action === "EmergencyLeave") {
              navigation.navigate(
                "EmergencyLeave" as never,
                { taskAssignmentId: id } as never,
              );
            } else {
              navigation.navigate(
                "SwapTask" as never,
                { taskAssignmentId: id } as never,
              );
            }

            setPendingAction(null);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_GAP = 12;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6FA" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 4,
    paddingBottom: 12,
    backgroundColor: "#F5F6FA",
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBarRight: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },

  // Greeting
  greeting: {
    fontSize: 22,
    fontWeight: "400",
    color: "#334155",
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  date: { fontSize: 13, color: "#94A3B8", marginBottom: 24 },

  // Tasks card
  tasksCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tasksLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  tasksIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  tasksTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  tasksPending: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
    marginTop: 2,
  },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Quick grid
  quickGrid: {
    flexDirection: "row",
  },
  quickCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  quickSub: { fontSize: 11, color: "#94A3B8", lineHeight: 16 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: { flex: 1, alignItems: "center", position: "relative" },
  tabIconIon: { marginBottom: 3 },
  tabLabel: { fontSize: 10, fontWeight: "600", color: "#94A3B8" },
  tabLabelActive: { color: "#2563EB" },
  tabDot: {
    position: "absolute",
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },
  // Xóa class notifDot cũ và thêm 2 class này vào:
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  notifBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
  },
});
