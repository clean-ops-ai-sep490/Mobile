import { useAuth } from "@/contexts/AuthContext";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = "worker" | "supervisor";

interface WorkerUser {
  role: "worker";
  name: string;
  jobTitle: string;
  id: string;
  joinedDate: string;
  avatar: string;
  avatarColor: string;
  workingAreas: string[];
  certificates: {
    id: string;
    name: string;
    expires: string;
    status: "valid" | "expiring";
    icon: string;
  }[];
  skills: string[];
}

interface SupervisorUser {
  role: "supervisor";
  name: string;
  jobTitle: string;
  id: string;
  joinedDate: string;
  avatar: string;
  avatarColor: string;
  department: string;
  email: string;
  phone: string;
}

type UserData = WorkerUser | SupervisorUser;

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_WORKER: WorkerUser = {
  role: "worker",
  name: "Jordan Smith",
  jobTitle: "Senior Specialist",
  id: "CS-8892",
  joinedDate: "Jan 2023",
  avatar: "JS",
  avatarColor: "#7DD3B0",
  workingAreas: ["Downtown", "Brooklyn", "Manhattan", "Queens"],
  certificates: [
    {
      id: "1",
      name: "Biohazard Safety",
      expires: "Dec 2024",
      status: "valid",
      icon: "🛡",
    },
    {
      id: "2",
      name: "Chemical Handling",
      expires: "in 12 days",
      status: "expiring",
      icon: "⚠️",
    },
  ],
  skills: ["Deep Cleaning", "Office Sanitation", "Inventory Mgmt"],
};

const MOCK_SUPERVISOR: SupervisorUser = {
  role: "supervisor",
  name: "Michelle Tran",
  jobTitle: "Operations Supervisor",
  id: "SV-2041",
  joinedDate: "Mar 2021",
  avatar: "MT",
  avatarColor: "#818CF8",
  department: "Commercial Cleaning Division",
  email: "m.tran@cleanops.com",
  phone: "+1 (555) 204-1988",
};

// Change this to test both views: "worker" | "supervisor"
// const CURRENT_ROLE: UserRole = "worker";
// const MOCK_USER: UserData = CURRENT_ROLE === "worker" ? MOCK_WORKER : MOCK_SUPERVISOR;

const APP_VERSION = "2.4.1 (Build 882)";

// ─── Shared Sub-components ────────────────────────────────────────────────────
const Avatar = ({ initials, color }: { initials: string; color: string }) => (
  <View style={[styles.avatarCircle, { backgroundColor: color }]}>
    <Text style={styles.avatarText}>{initials}</Text>
    <View style={styles.avatarOnline} />
  </View>
);

const StatCard = ({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
}) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statIcon, { color: iconColor }]}>{icon}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// ─── Worker-only sections ─────────────────────────────────────────────────────
const WorkerSections = ({
  user,
  selectedArea,
  setSelectedArea,
}: {
  user: WorkerUser;
  selectedArea: string;
  setSelectedArea: (a: string) => void;
}) => (
  <>
    {/* Working Areas */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>WORKING AREAS</Text>
      <View style={styles.chipRow}>
        {user.workingAreas.map((area) => (
          <TouchableOpacity
            key={area}
            style={[
              styles.areaChip,
              selectedArea === area && styles.areaChipActive,
            ]}
            onPress={() => setSelectedArea(area)}
          >
            {selectedArea === area && <Text style={styles.chipIcon}>📍</Text>}
            <Text
              style={[
                styles.chipText,
                selectedArea === area && styles.chipTextActive,
              ]}
            >
              {area}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Certificates */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CERTIFICATES</Text>
      <View style={styles.certList}>
        {user.certificates.map((cert) => (
          <TouchableOpacity key={cert.id} style={styles.certCard}>
            <View style={styles.certLeft}>
              <View
                style={[
                  styles.certIconWrap,
                  cert.status === "expiring"
                    ? styles.certIconExpiring
                    : styles.certIconValid,
                ]}
              >
                <Text style={styles.certIcon}>{cert.icon}</Text>
              </View>
              <View>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text
                  style={[
                    styles.certExpiry,
                    cert.status === "expiring" && styles.certExpiryWarning,
                  ]}
                >
                  Expires {cert.expires}
                </Text>
              </View>
            </View>
            <Text style={styles.certArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Skills */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>SKILLS</Text>
      <View style={styles.chipRow}>
        {user.skills.map((skill) => (
          <View key={skill} style={styles.skillChip}>
            <Text style={styles.skillChipText}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  </>
);

// ─── Supervisor-only sections ─────────────────────────────────────────────────
const SupervisorSections = ({ user }: { user: SupervisorUser }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>INFORMATION</Text>
    <View style={styles.infoCard}>
      <InfoRow icon="🏢" label="Department" value={user.department} />
      <View style={styles.infoDivider} />
      <InfoRow icon="✉️" label="Email" value={user.email} />
      <View style={styles.infoDivider} />
      <InfoRow icon="📞" label="Phone" value={user.phone} />
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user: authUser, logout } = useAuth();
  const [shareLocation, setShareLocation] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [selectedArea, setSelectedArea] = useState("Downtown");

  // Dùng role từ AuthContext để chọn đúng mock data
  const MOCK_USER: UserData =
    authUser?.role === "supervisor" ? MOCK_SUPERVISOR : MOCK_WORKER;

  const isWorker = MOCK_USER.role === "worker";
  const isSupervisor = MOCK_USER.role === "supervisor";

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout(); // xóa session + tự điều hướng về /login qua RouteGuard
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>✎</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Identity (shared) ── */}
        <View style={styles.identitySection}>
          <Avatar initials={MOCK_USER.avatar} color={MOCK_USER.avatarColor} />
          <Text style={styles.userName}>{MOCK_USER.name}</Text>
          <Text
            style={[styles.userRole, isSupervisor && styles.userRoleSupervisor]}
          >
            {MOCK_USER.jobTitle}
          </Text>
          <Text style={styles.userMeta}>
            ID: #{MOCK_USER.id} • Joined {MOCK_USER.joinedDate}
          </Text>
          {/* Role badge */}
          <View
            style={[
              styles.roleBadge,
              isSupervisor && styles.roleBadgeSupervisor,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isSupervisor && styles.roleBadgeTextSupervisor,
              ]}
            >
              {isWorker ? "👷 Worker" : "👔 Supervisor"}
            </Text>
          </View>
        </View>

        {/* ── Role-specific sections ── */}
        {isWorker && (
          <WorkerSections
            user={MOCK_USER as WorkerUser}
            selectedArea={selectedArea}
            setSelectedArea={setSelectedArea}
          />
        )}
        {isSupervisor && (
          <SupervisorSections user={MOCK_USER as SupervisorUser} />
        )}

        {/* ── Settings (shared) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>◎</Text>
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
                <Text style={styles.settingIcon}>🔔</Text>
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

        {/* ── Logout (shared) ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>⎋</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  backBtnText: { fontSize: 28, color: "#1E293B", lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  editBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  editBtnText: { fontSize: 18, color: "#2563EB" },

  // Scroll
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

  // Chips (shared for areas & skills)
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  areaChipActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  chipIcon: { fontSize: 12 },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#2563EB" },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  skillChipText: { fontSize: 13, fontWeight: "600", color: "#475569" },

  // Certificates
  certList: { gap: 10 },
  certCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  certLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  certIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  certIconValid: { backgroundColor: "#DCFCE7" },
  certIconExpiring: { backgroundColor: "#FEF3C7" },
  certIcon: { fontSize: 18 },
  certName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  certExpiry: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  certExpiryWarning: { color: "#F59E0B", fontWeight: "600" },
  certArrow: { fontSize: 20, color: "#CBD5E1" },

  // Info card (Supervisor)
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
  infoIcon: { fontSize: 16 },
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
  settingIcon: { fontSize: 18 },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  settingDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "#FFF1F2",
    borderWidth: 1.5,
    borderColor: "#FECDD3",
    gap: 8,
  },
  logoutIcon: { fontSize: 18, color: "#EF4444" },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#EF4444" },

  // Version
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 16,
    fontWeight: "500",
  },
});
