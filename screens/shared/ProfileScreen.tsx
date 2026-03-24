import AppButton from "@/components/common/AppButton";
import { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

const APP_VERSION = "2.4.1 (Build 882)";

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
  const navigation = useNavigation();

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  const isSupervisor = user?.role === "Supervisor";
  const isWorker = user?.role === "Worker";

  const initials = getInitials(user?.fullName ?? "");
  const avatarColor = AVATAR_COLORS[user?.role ?? "Worker"];

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setSubmitting(true);
          await logout();
          setSubmitting(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Header
        title="My Profile"
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
            {isSupervisor ? "Operations Supervisor" : "Worker"}
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
          <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="person-outline"
              label="Full Name"
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
              label="Role"
              value={user?.role ?? "—"}
            />
            <View style={styles.infoDivider} />
            <InfoRow
              icon="finger-print-outline"
              label="User ID"
              value={user?.userId ? `#${user.userId.slice(0, 8)}...` : "—"}
            />
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={18} color="#64748B" />
                <Text style={styles.settingLabel}>Share Location</Text>
              </View>
              <Switch
                value={shareLocation}
                onValueChange={setShareLocation}
                trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="#64748B"
                />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#E2E8F0", true: "#2563EB" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ── Logout ── */}
        <AppButton
          label="Log Out"
          onPress={handleLogout}
          loading={submitting}
          loadingLabel="Logging out..."
          iconLeft="log-out"
          style={{
            width: "90%",
            alignSelf: "center",
            marginTop: 30,
            backgroundColor: "#db0614",
          }}
        />

        <Text style={styles.version}>Version {APP_VERSION}</Text>
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
