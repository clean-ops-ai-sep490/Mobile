import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (fullName?: string) => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS: Record<string, string> = {
  Worker: "#7DD3B0",
  Supervisor: "#818CF8",
};

// ─── Components con ───────────────────────────────────────────────────────────
const Avatar = ({
  initials,
  color,
  url,
}: {
  initials: string;
  color: string;
  url?: string;
}) => (
  <View
    style={[
      styles.avatarCircle,
      { backgroundColor: url ? "transparent" : color },
    ]}
  >
    {url ? (
      <Image source={{ uri: url }} style={styles.avatarImage} />
    ) : (
      <Text style={styles.avatarText}>{initials}</Text>
    )}
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
  value: string | number;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={16} color="#94A3B8" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WorkerProfileScreen() {
  // Lấy thêm updateWorkerProfile từ useAuth
  const { getWorkerProfile, updateWorkerProfile, logout } = useAuth();

  const [worker, setWorker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  // State cho Modal Chỉnh sửa
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const w = await getWorkerProfile();
      setWorker(w);
    } catch (err) {
      console.error("Lỗi khi tải hồ sơ nhân viên", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const initials = getInitials(worker?.fullName);
  const avatarColor = AVATAR_COLORS["Worker"];

  //   const handleOpenEdit = () => {
  //     setEditFullName(worker?.fullName || "");
  //     setEditAddress(worker?.displayAddress || "");
  //     setIsEditModalVisible(true);
  //   };

  //   const handleUpdateProfile = async () => {
  //     if (!worker?.id) return;

  //     if (!editFullName.trim()) {
  //       Alert.alert("Lỗi", "Họ và tên không được để trống");
  //       return;
  //     }

  //     try {
  //       setSubmitting(true);

  //       // Đóng gói FormData
  //       const formData = new FormData();
  //       formData.append("fullName", editFullName.trim());

  //       // SỬA Ở ĐÂY: Đổi "Address" thành "DisplayAddress" cho khớp với Backend
  //       formData.append("displayAddress", editAddress.trim());

  //       await updateWorkerProfile(worker.id, formData);

  //       Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
  //       setIsEditModalVisible(false);

  //       // Tải lại dữ liệu sau khi update thành công
  //       await loadProfile();
  //     } catch (error) {
  //       console.error("Lỗi khi cập nhật hồ sơ:", error);
  //       Alert.alert("Lỗi", "Không thể cập nhật hồ sơ lúc này.");
  //     } finally {
  //       setSubmitting(false);
  //     }
  //   };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            setSubmitting(true);
            await logout();
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
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
        title="Hồ sơ nhân viên"
        onBack={() => navigation.goBack()}
        style={{ backgroundColor: "#F5F6FA" }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View>
            {/* ── Identity Section ── */}
            <View style={styles.identitySection}>
              <Avatar
                initials={initials}
                color={avatarColor}
                url={worker?.avatarUrl}
              />
              <Text style={styles.userName}>{worker?.fullName ?? "—"}</Text>
              {/* Role badge */}
              <View style={styles.roleBadge}>
                <Ionicons name="construct-outline" size={12} color="#2563EB" />
                <Text style={styles.roleBadgeText}>Worker</Text>
              </View>
            </View>

            {/* ── Thông tin tài khoản ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>THÔNG TIN</Text>
              <View style={styles.infoCard}>
                <InfoRow
                  icon="person-outline"
                  label="Họ và tên"
                  value={worker?.fullName ?? "—"}
                />
                <View style={styles.infoDivider} />
                <InfoRow
                  icon="location-outline"
                  label="Địa chỉ"
                  value={worker?.displayAddress ?? "—"}
                />
                <View style={styles.infoDivider} />
                <InfoRow
                  icon="hammer-outline"
                  label="Kỹ năng"
                  value={worker?.totalSkills ?? 0}
                />
                <View style={styles.infoDivider} />
                <InfoRow
                  icon="ribbon-outline"
                  label="Chứng chỉ"
                  value={worker?.totalCertifications ?? 0}
                />
              </View>
            </View>
          </View>

          {/* ── Các nút thao tác (Được đẩy xuống dưới cùng) ── */}
          <View style={styles.bottomButtonContainer}>
            {/* <AppButton
              label="Chỉnh sửa hồ sơ"
              onPress={handleOpenEdit}
              iconLeft="create-outline"
              style={{
                width: "90%",
                alignSelf: "center",
                backgroundColor: "#2563EB",
                marginBottom: 12,
              }}
            /> */}
            <AppButton
              label="Đăng xuất"
              onPress={handleLogout}
              loading={submitting && !isEditModalVisible} // Chỉ show loading ở đây khi đang logout
              loadingLabel="Đang xử lý..."
              iconLeft="log-out"
              style={{
                width: "90%",
                alignSelf: "center",
                backgroundColor: "#db0614",
              }}
            />
          </View>
        </ScrollView>
      )}

      {/* ── Modal Chỉnh sửa hồ sơ ── */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
                <Ionicons
                  name="close"
                  size={24}
                  color="#64748B"
                  onPress={() => setIsEditModalVisible(false)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Nhập họ và tên..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Nhập địa chỉ..."
                />
              </View>

              {/* <AppButton
                label="Lưu thay đổi"
                onPress={handleUpdateProfile}
                loading={submitting && isEditModalVisible}
                loadingLabel="Đang lưu..."
                style={{
                  width: "100%",
                  marginTop: 10,
                  backgroundColor: "#2563EB",
                }}
              /> */}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: {
    flexGrow: 1, // Đảm bảo nội dung luôn giãn hết chiều cao
    paddingBottom: 40,
  },

  // Identity
  identitySection: {
    alignItems: "center",
    backgroundColor: "#F5F6FA",
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
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    borderColor: "#F5F6FA",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F5F6FA",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#2563EB" },

  // Section
  section: {
    marginTop: 12,
    backgroundColor: "#F5F6FA",
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
    backgroundColor: "#F5F6FA",
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

  // Bottom Button Container
  bottomButtonContainer: {
    marginTop: "auto", // Đẩy container này xuống dưới cùng khoảng trống còn lại
    paddingTop: 30, // Khoảng cách an toàn nếu cuộn sát lên nội dung trên
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end", // Bottom Sheet style
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
});
