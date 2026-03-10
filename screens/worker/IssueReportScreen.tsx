import CameraScreen from "@/screens/worker/CameraScreen";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  taskRef?: string;
  taskLocation?: string;
  onBack?: () => void;
}

interface Photo {
  uri: string;
}

interface CapturedPhoto {
  uri: string;
  timestamp: string;
}

const ISSUE_TYPES = [
  { id: "chemical", label: "Chemical Leak", icon: "⚗️" },
  { id: "equipment", label: "Equipment Broken", icon: "🔧" },
  { id: "access", label: "Access Denied", icon: "🔒" },
  { id: "safety", label: "Safety Hazard", icon: "⚠️" },
];

const SEVERITY = [
  {
    id: "low",
    label: "Low",
    color: "#22C55E",
    bg: "#F0FDF4",
    activeBg: "#22C55E",
  },
  {
    id: "medium",
    label: "Medium",
    color: "#F59E0B",
    bg: "#FFFBEB",
    activeBg: "#F59E0B",
  },
  {
    id: "high",
    label: "High",
    color: "#3B82F6",
    bg: "#EFF6FF",
    activeBg: "#3B82F6",
  },
  {
    id: "critical",
    label: "Critical",
    color: "#EF4444",
    bg: "#FEF2F2",
    activeBg: "#EF4444",
  },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IssueReportScreen({
  taskRef = "#12345",
  taskLocation = "2nd Floor Office A-12",
  onBack,
}: Props) {
  const navigation = useNavigation();

  const [selectedIssue, setSelectedIssue] = useState("chemical");
  const [selectedSeverity, setSelectedSeverity] = useState("high");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    if (onBack) onBack();
    else navigation.goBack();
  };

  const handleAddPhoto = () => {
    if (photos.length >= 3) {
      Alert.alert("Limit reached", "You can only upload up to 3 photos.");
      return;
    }
    setShowCamera(true);
  };

  // Nhận ảnh từ InspectionCameraScreen, chỉ lấy đủ slot còn lại (max 3)
  const handleCameraSubmit = (captured: CapturedPhoto[]) => {
    setShowCamera(false);
    setPhotos((prev) => {
      const remaining = 3 - prev.length;
      const newPhotos = captured
        .slice(0, remaining)
        .map((p) => ({ uri: p.uri }));
      return [...prev, ...newPhotos];
    });
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Missing Info", "Please provide a description of the issue.");
      return;
    }
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    Alert.alert(
      "Report Submitted",
      "Your issue has been reported successfully.",
      [{ text: "OK", onPress: handleBack }],
    );
  };

  // ── Camera overlay ─────────────────────────────────────────────────────────
  if (showCamera) {
    return (
      <CameraScreen
        onClose={() => setShowCamera(false)}
        onSubmit={handleCameraSubmit}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report an Issue</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* ── Task Reference ── */}
              <View style={styles.taskRefCard}>
                <View style={styles.taskRefIcon}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </View>
                <View>
                  <Text style={styles.taskRefLabel}>
                    CURRENT TASK REFERENCE
                  </Text>
                  <Text style={styles.taskRefValue}>
                    {taskRef} — {taskLocation}
                  </Text>
                </View>
              </View>

              {/* ── Issue Type ── */}
              <Text style={styles.sectionTitle}>Issue Type</Text>
              <View style={styles.issueGrid}>
                {ISSUE_TYPES.map((item) => {
                  const active = selectedIssue === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.issueCard,
                        active && styles.issueCardActive,
                      ]}
                      onPress={() => setSelectedIssue(item.id)}
                      activeOpacity={0.75}
                    >
                      {active && (
                        <View style={styles.issueCheck}>
                          <Text style={styles.issueCheckText}>✓</Text>
                        </View>
                      )}
                      <Text style={styles.issueIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.issueLabel,
                          active && styles.issueLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Severity ── */}
              <Text style={styles.sectionTitle}>Severity</Text>
              <View style={styles.severityRow}>
                {SEVERITY.map((s) => {
                  const active = selectedSeverity === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.severityChip,
                        {
                          backgroundColor: active ? s.activeBg : s.bg,
                          borderColor: active ? s.activeBg : "transparent",
                        },
                      ]}
                      onPress={() => setSelectedSeverity(s.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.severityLabel,
                          { color: active ? "#FFF" : s.color },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Description ── */}
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Provide more details about the issue..."
                placeholderTextColor="#CBD5E1"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />

              {/* ── Evidence Photos ── */}
              <Text style={styles.sectionTitle}>
                Evidence <Text style={styles.sectionSub}>(Up to 3 photos)</Text>
              </Text>
              <View style={styles.photosRow}>
                {photos.map((p, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri: p.uri }} style={styles.photoImg} />
                    <TouchableOpacity
                      style={styles.photoDelete}
                      onPress={() =>
                        setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Text style={styles.photoDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < 3 && (
                  <TouchableOpacity
                    style={styles.photoAdd}
                    onPress={handleAddPhoto}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.photoAddIcon}>+</Text>
                    <Text style={styles.photoAddLabel}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>

          {/* ── Submit Button ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnBusy]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <Text style={styles.submitBtnText}>Submitting...</Text>
              ) : (
                <>
                  <Text style={styles.submitBtnIcon}>➤</Text>
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6FA" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 4,
    paddingBottom: 14,
    backgroundColor: "#F5F6FA",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: { fontSize: 24, color: "#1E293B", lineHeight: 28, marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  closeIcon: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  // Task ref
  taskRefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  taskRefIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  taskRefLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#3B82F6",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  taskRefValue: { fontSize: 13, fontWeight: "600", color: "#1E40AF" },

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  sectionSub: { fontSize: 13, fontWeight: "400", color: "#94A3B8" },

  // Issue type grid
  issueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  issueCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  issueCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#FFF",
  },
  issueCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  issueCheckText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  issueIcon: { fontSize: 28, marginBottom: 8 },
  issueLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  issueLabelActive: { color: "#1E293B" },

  // Severity
  severityRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  severityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  severityLabel: { fontSize: 13, fontWeight: "700" },

  // Description
  textInput: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Photos
  photosRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "visible",
    position: "relative",
  },
  photoImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  photoDelete: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F5F6FA",
  },
  photoDeleteText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  photoAddIcon: { fontSize: 22, color: "#94A3B8", lineHeight: 26 },
  photoAddLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    paddingTop: 12,
    backgroundColor: "#F5F6FA",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnBusy: { backgroundColor: "#93C5FD" },
  submitBtnIcon: { color: "#FFF", fontSize: 16 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
