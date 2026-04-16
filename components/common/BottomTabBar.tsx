import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────
export type TabKey =
  | "Home"
  | "Tasks"
  | "EmergencyLeave"
  | "Notifications"
  | "Profile";

interface TabItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}

interface BottomTabBarProps {
  activeTab?: TabKey;
  onNavigate?: (screen: TabKey) => void;
  onEmergencyPress?: () => void;
}

// ─── Cấu hình Tab (Vị trí Khẩn cấp ở giữa được render riêng) ─────────────────
const LEFT_TABS: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "Home", label: "Trang chủ", icon: "home-outline", activeIcon: "home" },
  {
    key: "Tasks",
    label: "Công việc",
    icon: "list-outline",
    activeIcon: "list",
  },
];

const RIGHT_TABS: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "Notifications",
    label: "Thông báo",
    icon: "notifications-outline",
    activeIcon: "notifications",
  },
  {
    key: "Profile",
    label: "Hồ sơ",
    icon: "person-outline",
    activeIcon: "person",
  },
];

// ─── Component Tab Item ───────────────────────────────────────────────────────
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
        style={styles.tabIcon}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {active && <View style={styles.tabDot} />}
    </TouchableOpacity>
  );
}

// ─── Thanh Bottom Tab ─────────────────────────────────────────────────────────
export default function BottomTabBar({
  activeTab = "Home",
  onNavigate,
  onEmergencyPress,
}: BottomTabBarProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  return (
    <View style={styles.wrapper}>
      <View style={styles.tabBar}>
        {/* Các tab bên trái */}
        {LEFT_TABS.map((tab) => (
          <TabItem
            key={tab.key}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={() => onNavigate?.(tab.key)}
          />
        ))}

        {/* Khoảng trống ở giữa cho nút nổi */}
        <View style={styles.tabItemCenter} />

        {/* Các tab bên phải */}
        {RIGHT_TABS.map((tab) => (
          <TabItem
            key={tab.key}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={() => {
              // For the Profile tab, route based on role
              if (tab.key === "Profile") {
                if (user?.role === "Worker") {
                  // Navigate to worker-only profile screen
                  (navigation as any).navigate("WorkerProfile");
                } else {
                  // Default supervisor/general profile
                  onNavigate?.("Profile");
                }
                return;
              }
              onNavigate?.(tab.key);
            }}
          />
        ))}
      </View>

      {/* Nút Khẩn cấp nổi */}
      <TouchableOpacity
        style={styles.emergencyBtn}
        onPress={() => {
          // ✅ Gọi hàm từ HomeScreen truyền vào, nếu không có thì chạy mặc định
          if (onEmergencyPress) {
            onEmergencyPress();
          } else {
            onNavigate?.("EmergencyLeave");
          }
        }}
        activeOpacity={0.85}
      >
        <View style={styles.emergencyInner}>
          <Ionicons name="warning" size={26} color="#FFF" />
        </View>
        <Text style={styles.emergencyLabel}>KHẨN CẤP</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TAB_HEIGHT = Platform.OS === "ios" ? 80 : 64;
const EMERGENCY_BTN_SIZE = 60;
const EMERGENCY_LIFT = 20;

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignItems: "center",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    height: TAB_HEIGHT,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabItemCenter: { flex: 1 },
  tabIcon: { marginBottom: 3 },
  tabLabel: { fontSize: 10, fontWeight: "600", color: "#94A3B8" },
  tabLabelActive: { color: "#2563EB" },
  tabDot: {
    position: "absolute",
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },

  emergencyBtn: {
    position: "absolute",
    top: -(EMERGENCY_BTN_SIZE / 2 + EMERGENCY_LIFT / 2),
    alignItems: "center",
    marginTop: 12,
  },
  emergencyInner: {
    width: EMERGENCY_BTN_SIZE,
    height: EMERGENCY_BTN_SIZE,
    borderRadius: EMERGENCY_BTN_SIZE / 2,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  emergencyLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
