import AppButton from "@/components/common/AppButton";
import { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Avatar từ tên thật ───────────────────────────────────────────────────────
const getInitials = (fullName: string): string => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS: Record<string, string> = {
  Worker: "#7DD3B0",
  Supervisor: "#818CF8",
};

const Avatar = ({ initials, color }: { initials: string; color: string }) => (
  <View style={[styles.avatarCircle, { backgroundColor: color }]}>
    <Text style={styles.avatarText}>{initials}</Text>
    <View style={styles.avatarOnline} />
  </View>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={16} color="#94A3B8" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [shareLocation, setShareLocation] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as any);
  };

  const isSupervisor = user?.role === "Supervisor";
  const isWorker = user?.role === "Worker";

  const initials = getInitials(user?.fullName ?? "");
  const avatarColor = AVATAR_COLORS[user?.role ?? "Worker"];

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            setSubmitting(true);
            await logout();
            // AppNavigator sẽ tự động chuyển về AuthNavigator khi isAuthenticated = false
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert(
              "Lỗi",
              "Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại.",
            );
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header
        title="Hồ sơ của tôi"
        onBack={() => handleNavigate("Home")}
        style={{ backgroundColor: "#F5F6FA" }}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Identity ── */}
        <View style={styles.identitySection}>
          <Avatar initials={initials} color={avatarColor} />
          <Text style={styles.userName}>{user?.fullName ?? "—"}</Text>
          <Text
            style={[styles.userRole, isSupervisor && styles.userRoleSupervisor]}
          >
            {isSupervisor ? "Supervisor" : "Worker"}
          </Text>
          <Text style={styles.userMeta}>{user?.email ?? "—"}</Text>

          {/* Role badge */}
          <View
            style={[
              styles.roleBadge,
              isSupervisor && styles.roleBadgeSupervisor,
            ]}
          >
            <Ionicons
              name={isWorker ? "construct-outline" : "briefcase-outline"}
              size={12}
              color={isSupervisor ? "#7C3AED" : "#2563EB"}
            />
            <Text
              style={[
                styles.roleBadgeText,
                isSupervisor && styles.roleBadgeTextSupervisor,
              ]}
            >
              {user?.role ?? "—"}
            </Text>
          </View>
        </View>

        {/* ── Account Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN TÀI KHOẢN</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="person-outline"
              label="Họ và tên"
              value={user?.fullName ?? "—"}
            />
            <View style={styles.infoDivider} />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user?.email ?? "—"}
            />
            <View style={styles.infoDivider} />
            <InfoRow
              icon="shield-outline"
              label="Vai trò"
              value={user?.role ?? "—"}
            />
          </View>
        </View>

        {/* ── Logout ── */}
        <AppButton
          label="Đăng xuất"
          onPress={handleLogout}
          loading={submitting}
          loadingLabel="Đang đăng xuất..."
          iconLeft="log-out"
          style={{
            width: "90%",
            alignSelf: "center",
            marginTop: 30,
            backgroundColor: "#db0614",
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 40 },

  // Identity
  identitySection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    position: "relative",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#FFFFFF" },
  avatarOnline: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
    marginBottom: 6,
  },
  userRoleSupervisor: { color: "#7C3AED" },
  userMeta: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  roleBadgeSupervisor: { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#2563EB" },
  roleBadgeTextSupervisor: { color: "#7C3AED" },

  // Section
  section: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  // Info card
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoLabel: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "55%",
    textAlign: "right",
  },
  infoDivider: { height: 1, backgroundColor: "#E2E8F0", marginHorizontal: 16 },

  // Settings
  settingsList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  settingDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },

  // Version
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 16,
    fontWeight: "500",
  },
});
