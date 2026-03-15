import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CameraScreen from "./CameraScreen";

type Props = NativeStackScreenProps<WorkerStackParamList, "AdhocRequest">;

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestType = "manpower" | "weather";
type UrgencyLevel = "low" | "medium" | "high";
type Zone = "Zone C1" | "Zone C2" | "Zone B1" | "Zone B2";
type Floor = "Floor 3" | "Floor 4" | "Floor 5" | "Floor 2";

// ─── Request Type Options ─────────────────────────────────────────────────────
const REQUEST_TYPES: {
  key: RequestType;
  icon: string;
  label: string;
  sub: string;
}[] = [
  {
    key: "manpower",
    icon: "people-outline",
    label: "Manpower",
    sub: "Report shortage",
  },
  {
    key: "weather",
    icon: "partly-sunny-outline",
    label: "Weather",
    sub: "Affects work",
  },
];

interface Photo {
  uri: string;
}

interface CapturedPhoto {
  uri: string;
  timestamp: string;
}

const FLOORS: Floor[] = ["Floor 2", "Floor 3", "Floor 4", "Floor 5"];
const ZONES: Zone[] = ["Zone C1", "Zone C2", "Zone B1", "Zone B2"];
const URGENCY: {
  key: UrgencyLevel;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "low", label: "Low", color: "#16A34A", bg: "#F0FDF4" },
  { key: "medium", label: "Medium", color: "#D97706", bg: "#FFFBEB" },
  { key: "high", label: "High", color: "#DC2626", bg: "#FEF2F2" },
];

export default function AdhocRequestScreen({ navigation }: Props) {
  const [requestType, setRequestType] = useState<RequestType>("manpower");
  const [floor, setFloor] = useState<Floor>("Floor 2");
  const [zone, setZone] = useState<Zone>("Zone C1");
  const [building] = useState("Building A - Complex");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  const selectedType = REQUEST_TYPES.find((t) => t.key === requestType)!;
  const selectedUrgency = URGENCY.find((u) => u.key === urgency)!;

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

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1500);
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <Header title="Adhoc Request" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Request Type */}
        <Text style={styles.sectionLabel}>REQUEST TYPE</Text>
        <View style={styles.typeGrid}>
          {REQUEST_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.typeCard,
                requestType === t.key && styles.typeCardActive,
              ]}
              onPress={() => setRequestType(t.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.typeIconWrap,
                  requestType === t.key && styles.typeIconWrapActive,
                ]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={22}
                  color={requestType === t.key ? "#FFF" : "#64748B"}
                />
              </View>
              <Text
                style={[
                  styles.typeLabel,
                  requestType === t.key && styles.typeLabelActive,
                ]}
              >
                {t.label}
              </Text>
              <Text
                style={[
                  styles.typeSub,
                  requestType === t.key && styles.typeSubActive,
                ]}
              >
                {t.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <View style={styles.locationCard}>
          {/* Building */}
          <View style={styles.locationRow}>
            <Text style={styles.locationFieldLabel}>Building</Text>
            <View style={styles.locationSelect}>
              <Text style={styles.locationSelectText}>{building}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </View>
          </View>
          {/* Floor & Zone */}
          <View style={styles.locationRowDouble}>
            <View style={styles.locationHalf}>
              <Text style={styles.locationFieldLabel}>Floor</Text>
              <View style={styles.floorZoneRow}>
                {FLOORS.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.floorZoneBtn,
                      floor === f && styles.floorZoneBtnActive,
                    ]}
                    onPress={() => setFloor(f)}
                  >
                    <Text
                      style={[
                        styles.floorZoneBtnText,
                        floor === f && styles.floorZoneBtnTextActive,
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.locationHalf}>
              <Text style={styles.locationFieldLabel}>Zone</Text>
              <View style={styles.floorZoneRow}>
                {ZONES.map((z) => (
                  <TouchableOpacity
                    key={z}
                    style={[
                      styles.floorZoneBtn,
                      zone === z && styles.floorZoneBtnActive,
                    ]}
                    onPress={() => setZone(z)}
                  >
                    <Text
                      style={[
                        styles.floorZoneBtnText,
                        zone === z && styles.floorZoneBtnTextActive,
                      ]}
                    >
                      {z}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Urgency */}
        <Text style={styles.sectionLabel}>URGENCY LEVEL</Text>
        <View style={styles.urgencyRow}>
          {URGENCY.map((u) => (
            <TouchableOpacity
              key={u.key}
              style={[
                styles.urgencyBtn,
                urgency === u.key && {
                  backgroundColor: u.bg,
                  borderColor: u.color,
                },
              ]}
              onPress={() => setUrgency(u.key)}
              activeOpacity={0.8}
            >
              {urgency === u.key && (
                <View
                  style={[styles.urgencyDot, { backgroundColor: u.color }]}
                />
              )}
              <Text
                style={[
                  styles.urgencyText,
                  urgency === u.key && { color: u.color, fontWeight: "700" },
                ]}
              >
                {u.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>SITUATION DESCRIPTION</Text>
        <TextInput
          style={styles.descInput}
          placeholder="Describe the situation in detail..."
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Photos */}
        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri: p.uri }} style={styles.photoImg} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() =>
                  setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 3 && (
            <TouchableOpacity style={styles.photoAdd} onPress={handleAddPhoto}>
              <Ionicons name="camera-outline" size={24} color="#94A3B8" />
              <Text style={styles.photoAddText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="document-text-outline" size={16} color="#2563EB" />
            <Text style={styles.summaryTitle}>Request Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Type:</Text>
            <Text style={styles.summaryVal}>{selectedType.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Location:</Text>
            <Text style={styles.summaryVal}>
              {building}, {floor}, {zone}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Urgency:</Text>
            <View
              style={[
                styles.urgencyPill,
                { backgroundColor: selectedUrgency.bg },
              ]}
            >
              <Text
                style={[
                  styles.urgencyPillText,
                  { color: selectedUrgency.color },
                ]}
              >
                {selectedUrgency.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <AppButton
          label="Submit Adhoc Request"
          onPress={handleSubmit}
          loading={loading}
          loadingLabel="Submitting..."
          iconLeft="send-outline"
          style={{ marginTop: 8 }}
        />
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  // Type Grid
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  typeCard: {
    width: "30%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeCardActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  typeIconWrapActive: { backgroundColor: "#2563EB" },
  typeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },
  typeLabelActive: { color: "#1E40AF" },
  typeSub: { fontSize: 10, color: "#94A3B8", textAlign: "center" },
  typeSubActive: { color: "#3B82F6" },

  // Location
  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 14,
  },
  locationRow: { gap: 8 },
  locationFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  locationSelect: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationSelectText: { fontSize: 14, color: "#1E293B", fontWeight: "500" },
  locationRowDouble: { flexDirection: "row", gap: 12 },
  locationHalf: { flex: 1 },
  floorZoneRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  floorZoneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  floorZoneBtnActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  floorZoneBtnText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  floorZoneBtnTextActive: { color: "#2563EB", fontWeight: "700" },

  // Urgency
  urgencyRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  urgencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyText: { fontSize: 14, fontWeight: "600", color: "#64748B" },

  // Description
  descInput: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 100,
    marginBottom: 20,
  },

  // Photos
  photoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
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
    gap: 4,
  },
  photoAddText: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoImg: { width: 80, height: 80 },
  photoRemove: { position: "absolute", top: 2, right: 2 },

  // Summary
  summaryCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 13, fontWeight: "700", color: "#1E40AF" },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryKey: { fontSize: 13, color: "#475569", fontWeight: "500" },
  summaryVal: { fontSize: 13, color: "#1E293B", fontWeight: "600" },
  urgencyPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  urgencyPillText: { fontSize: 12, fontWeight: "700" },

  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: { fontSize: 15, color: "#64748B", fontWeight: "600" },
});
