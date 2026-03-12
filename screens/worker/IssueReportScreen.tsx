import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import CameraScreen from "@/screens/worker/CameraScreen";
import { Ionicons } from "@expo/vector-icons";
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

const ISSUE_TYPES: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "chemical", label: "Chemical Leak", icon: "flask-outline" },
  { id: "equipment", label: "Equipment Broken", icon: "construct-outline" },
  { id: "access", label: "Access Denied", icon: "lock-closed-outline" },
  { id: "safety", label: "Safety Hazard", icon: "warning-outline" },
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

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  const [selectedIssue, setSelectedIssue] = useState("chemical");
  const [selectedSeverity, setSelectedSeverity] = useState("high");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

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
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    Alert.alert(
      "Report Submitted",
      "Your issue has been reported successfully.",
      [{ text: "OK", onPress: handleBack }],
    );
  };

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
        <Header
          title="Report an Issue"
          onBack={handleBack}
          style={{ backgroundColor: "#f5f6fa" }}
        />

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
                  <Ionicons
                    name="clipboard-outline"
                    size={18}
                    color="#3B82F6"
                  />
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
                          <Ionicons name="checkmark" size={11} color="#FFF" />
                        </View>
                      )}
                      <View style={styles.issueIconWrap}>
                        <Ionicons
                          name={item.icon}
                          size={26}
                          color={active ? "#2563EB" : "#64748B"}
                        />
                      </View>
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
                      <Ionicons name="close" size={10} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < 3 && (
                  <TouchableOpacity
                    style={styles.photoAdd}
                    onPress={handleAddPhoto}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add" size={24} color="#94A3B8" />
                    <Text style={styles.photoAddLabel}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>

          {/* ── Submit Button ── */}
          <AppButton
            label="Submit Issue Report"
            onPress={handleSubmit}
            loading={submitting}
            loadingLabel="Submitting..."
            iconLeft="send"
            style={{ width: "90%", alignSelf: "center" }}
          />
        </KeyboardAvoidingView>
        <BottomTabBar onNavigate={handleNavigate} />
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
  issueIconWrap: {
    marginBottom: 8,
  },
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
});
