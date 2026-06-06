import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  mapCertCategory,
  useWorkerCertification,
} from "@/hooks/useWorkerCertification";
import {
  mapSkillCategory,
  mapSkillLevel,
  useWorkerSkill,
} from "@/hooks/useWorkerSkill";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
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
  TouchableOpacity,
  View,
} from "react-native";

const getInitials = (fullName?: string) => {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({ initials, url }: { initials: string; url?: string }) => (
  <View
    style={[
      styles.avatarCircle,
      { backgroundColor: url ? "transparent" : "#7DD3B0" },
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

export default function WorkerProfileScreen() {
  const { getWorkerProfile, updateWorkerProfile, logout } = useAuth();
  const navigation = useNavigation();

  const [worker, setWorker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const { categories: skillCategories, getSkillsByCategory } = useWorkerSkill(
    worker?.id,
  );
  const {
    certifications,
    categories: certificationCategories,
    getCertificationsByCategory,
  } = useWorkerCertification(worker?.id);

  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryType, setCategoryType] = useState<"skill" | "certificate">(
    "skill",
  );
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySkills, setCategorySkills] = useState<any[]>([]);
  const [categoryCerts, setCategoryCerts] = useState<any[]>([]);

  const allCategories = useMemo(
    () => Array.from(new Set([...skillCategories, ...certificationCategories])),
    [skillCategories, certificationCategories],
  );

  const certPreview = useMemo(
    () =>
      [...certifications]
        .sort(
          (a, b) =>
            new Date(a.expiredAt).getTime() - new Date(b.expiredAt).getTime(),
        )
        .slice(0, 3),
    [certifications],
  );

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

  const handleOpenEdit = () => {
    setEditFullName(worker?.fullName || "");
    setEditAddress(worker?.displayAddress || "");
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!worker?.id) return;
    if (!editFullName.trim()) {
      Alert.alert("Lỗi", "Họ và tên không được để trống");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("fullName", editFullName.trim());
      formData.append("address", editAddress.trim());
      await updateWorkerProfile(worker.id, formData);
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
      setIsEditModalVisible(false);
      await loadProfile();
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      Alert.alert("Lỗi", "Không thể cập nhật hồ sơ lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

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
            console.error("Lỗi đăng xuất:", error);
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const openCategory = async (
    category: string,
    type: "skill" | "certificate",
  ) => {
    // Hiển thị tên tiếng Việt trên modal title
    setCategoryTitle(
      type === "skill" ? mapSkillCategory(category) : mapCertCategory(category),
    );
    setCategoryType(type);
    setIsCategoryModalVisible(true);
    setCategoryLoading(true);
    try {
      if (type === "skill") {
        const skills = await getSkillsByCategory(category);
        setCategorySkills(skills);
        setCategoryCerts([]);
      } else {
        const certs = await getCertificationsByCategory(category);
        setCategoryCerts(certs);
        setCategorySkills([]);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể tải dữ liệu danh mục.");
      setCategorySkills([]);
      setCategoryCerts([]);
    } finally {
      setCategoryLoading(false);
    }
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
          <View style={styles.identitySection}>
            <Avatar
              initials={getInitials(worker?.fullName)}
              url={worker?.avatarUrl}
            />
            <Text style={styles.userName}>{worker?.fullName ?? "-"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THÔNG TIN</Text>
            <View style={styles.infoCard}>
              <InfoRow
                icon="person-outline"
                label="Họ và tên"
                value={worker?.fullName ?? "-"}
              />
              <View style={styles.infoDivider} />
              <InfoRow
                icon="location-outline"
                label="Địa chỉ"
                value={worker?.displayAddress ?? "-"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CHỨNG CHỈ THEO LOẠI</Text>
            {certificationCategories.length === 0 ? (
              <View style={styles.infoCard}>
                <View style={styles.listEmptyWrap}>
                  <Text style={styles.listEmptyText}>Chưa có chứng chỉ</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.infoCard, { padding: 12 }]}>
                <View style={styles.chipWrap}>
                  {certificationCategories.map((cat, index) => {
                    const certColors = [
                      { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
                      { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
                      { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
                      { bg: "#FDF4FF", border: "#E9D5FF", text: "#7E22CE" },
                      { bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
                      { bg: "#F0F9FF", border: "#BAE6FD", text: "#0369A1" },
                    ];
                    const color = certColors[index % certColors.length];
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: color.bg,
                            borderColor: color.border,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                        onPress={() => openCategory(cat, "certificate")}
                      >
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={13}
                          color={color.text}
                        />
                        <Text style={[styles.chipText, { color: color.text }]}>
                          {mapCertCategory(cat)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KỸ NĂNG THEO LOẠI</Text>
            <View style={[styles.infoCard, { padding: 12 }]}>
              {skillCategories.length === 0 ? (
                <Text style={styles.listEmptyText}>Chưa có danh mục nào</Text>
              ) : (
                <View style={styles.chipWrap}>
                  {skillCategories.map((cat, index) => {
                    const skillColors = [
                      { bg: "#FFF1F2", border: "#FECDD3", text: "#BE123C" },
                      { bg: "#F0FDFA", border: "#99F6E4", text: "#0F766E" },
                      { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
                      { bg: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9" },
                      { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" },
                      { bg: "#FEF9C3", border: "#FDE047", text: "#854D0E" },
                    ];
                    const color = skillColors[index % skillColors.length];
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: color.bg,
                            borderColor: color.border,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                        onPress={() => openCategory(cat, "skill")}
                      >
                        <Ionicons
                          name="flash-outline"
                          size={13}
                          color={color.text}
                        />
                        <Text style={[styles.chipText, { color: color.text }]}>
                          {mapSkillCategory(cat)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View style={styles.bottomButtonContainer}>
            <AppButton
              label="Chỉnh sửa hồ sơ"
              onPress={handleOpenEdit}
              iconLeft="create-outline"
              style={{
                width: "90%",
                alignSelf: "center",
                backgroundColor: "#2563EB",
                marginBottom: 12,
              }}
            />
            <AppButton
              label="Đăng xuất"
              onPress={handleLogout}
              loading={submitting && !isEditModalVisible}
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

      {/* Modal chỉnh sửa hồ sơ */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
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
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAddress}
                  onChangeText={setEditAddress}
                />
              </View>
              <AppButton
                label="Lưu thay đổi"
                onPress={handleUpdateProfile}
                loading={submitting && isEditModalVisible}
                loadingLabel="Đang lưu..."
                style={{
                  width: "100%",
                  marginTop: 10,
                  backgroundColor: "#2563EB",
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal danh mục */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{categoryTitle}</Text>
              <Ionicons
                name="close"
                size={24}
                color="#64748B"
                onPress={() => setIsCategoryModalVisible(false)}
              />
            </View>
            {categoryLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {categoryType === "skill" ? (
                  <>
                    <Text style={styles.modalSectionTitle}>Kỹ năng</Text>
                    {categorySkills.length === 0 ? (
                      <Text style={styles.listEmptyText}>
                        Không có kỹ năng nào
                      </Text>
                    ) : (
                      categorySkills.map((s) => (
                        <View key={s.skillId} style={styles.modalItem}>
                          <Text style={styles.modalItemTitle}>{s.name}</Text>
                          <Text style={styles.modalItemSub}>
                            Cấp độ: {mapSkillLevel(s.skillLevel)}
                          </Text>
                        </View>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.modalSectionTitle}>Chứng chỉ</Text>
                    {categoryCerts.length === 0 ? (
                      <Text style={styles.listEmptyText}>
                        Không có chứng chỉ nào
                      </Text>
                    ) : (
                      categoryCerts.map((c) => (
                        <View key={c.certificationId} style={styles.modalItem}>
                          <Text style={styles.modalItemTitle}>{c.name}</Text>
                          <Text style={styles.modalItemSub}>
                            {c.issuingOrganization}
                          </Text>
                          <Text style={styles.modalItemSub}>
                            Hết hạn:{" "}
                            {c.expiredAt
                              ? new Date(c.expiredAt).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "Không có"}
                          </Text>
                        </View>
                      ))
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  identitySection: {
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    paddingVertical: 24,
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
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
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
  section: {
    marginTop: 12,
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
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
  certItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    gap: 10,
  },
  certIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  certName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  certSub: { fontSize: 13, color: "#64748B" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    backgroundColor: "#F8FAFC",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  listEmptyWrap: { padding: 14 },
  listEmptyText: { fontSize: 14, color: "#94A3B8" },
  bottomButtonContainer: { marginTop: "auto", paddingTop: 30 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  inputGroup: { marginBottom: 16 },
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
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalItem: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  modalItemTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  modalItemSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
});
