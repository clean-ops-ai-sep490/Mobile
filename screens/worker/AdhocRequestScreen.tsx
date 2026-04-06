import AppButton from "@/components/common/AppButton";
import CustomDatePicker from "@/components/common/CustomDatePicker";
import Header from "@/components/common/Header";
import { AdHocRequestType, useAdhocRequest } from "@/hooks/useAdhocRequest";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = NativeStackScreenProps<WorkerStackParamList, "AdhocRequest">;

// ─── Constants & Mock Data ──────────────────────────────────────────────────

const REQUEST_TYPES = [
  {
    key: AdHocRequestType.General,
    icon: "information-circle-outline",
    label: "General",
    sub: "Routine request",
    activeColor: "#2563EB",
    activeBg: "#EFF6FF",
  },
  {
    key: AdHocRequestType.Urgent,
    icon: "alert-circle-outline",
    label: "Urgent",
    sub: "Needs fast action",
    activeColor: "#D97706",
    activeBg: "#FFFBEB",
  },
  {
    key: AdHocRequestType.HighPriority,
    icon: "warning-outline",
    label: "High Priority",
    sub: "Critical issue",
    activeColor: "#DC2626",
    activeBg: "#FEF2F2",
  },
];

// Mock WorkAreas - Trong thực tế bạn nên fetch từ API (VD: useWorkArea hook)
const MOCK_WORK_AREAS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Building A - Floor 2 - Zone C1",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Building B - Floor 1 - Main Lobby",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdhocRequestScreen({ navigation }: Props) {
  // Hook API
  const { createRequest, loading } = useAdhocRequest();

  // Form States
  const [requestType, setRequestType] = useState<AdHocRequestType>(
    AdHocRequestType.General,
  );
  const [workAreaId, setWorkAreaId] = useState<string>(MOCK_WORK_AREAS[0].id);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const selectedType = REQUEST_TYPES.find((t) => t.key === requestType)!;
  const selectedWorkArea = MOCK_WORK_AREAS.find((w) => w.id === workAreaId)!;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Missing Information", "Please provide a short reason.");
      return;
    }

    const payload = {
      workAreaId,
      requestType,
      requestDateFrom: dateFrom.toISOString(),
      requestDateTo: dateTo ? dateTo.toISOString() : null,
      reason,
      description,
    };

    const result = await createRequest(payload);

    if (result) {
      Alert.alert("Success", "Ad-hoc request submitted successfully!");
      navigation.goBack();
    } else {
      Alert.alert("Error", "Failed to submit request. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <Header title="Adhoc Request" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* REQUEST TYPE */}
        <Text style={styles.sectionLabel}>REQUEST TYPE (URGENCY)</Text>
        <View style={styles.typeGrid}>
          {REQUEST_TYPES.map((t) => {
            const isActive = requestType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeCard,
                  isActive && {
                    borderColor: t.activeColor,
                    backgroundColor: t.activeBg,
                  },
                ]}
                onPress={() => setRequestType(t.key)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.typeIconWrap,
                    isActive && { backgroundColor: t.activeColor },
                  ]}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={22}
                    color={isActive ? "#FFF" : "#64748B"}
                  />
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    isActive && { color: t.activeColor },
                  ]}
                >
                  {t.label}
                </Text>
                <Text
                  style={[
                    styles.typeSub,
                    isActive && { color: t.activeColor, opacity: 0.8 },
                  ]}
                >
                  {t.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* WORK AREA */}
        <Text style={styles.sectionLabel}>WORK AREA</Text>
        <View style={styles.locationCard}>
          <Text style={styles.locationFieldLabel}>Select Assigned Area</Text>
          <View style={styles.locationSelectRow}>
            {MOCK_WORK_AREAS.map((area) => (
              <TouchableOpacity
                key={area.id}
                style={[
                  styles.floorZoneBtn,
                  workAreaId === area.id && styles.floorZoneBtnActive,
                ]}
                onPress={() => setWorkAreaId(area.id)}
              >
                <Text
                  style={[
                    styles.floorZoneBtnText,
                    workAreaId === area.id && styles.floorZoneBtnTextActive,
                  ]}
                >
                  {area.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TIMING */}
        <Text style={styles.sectionLabel}>TIMING</Text>
        <View style={styles.timeRow}>
          {/* Start Date */}
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Start Date (From)</Text>
            <TouchableOpacity
              style={styles.timeSelect}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.timeText}>
                {dateFrom.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>End Date (To - Optional)</Text>
            <TouchableOpacity
              style={styles.timeSelect}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.timeText}>
                {dateTo ? dateTo.toLocaleDateString() : "Not set"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* REASON & DESCRIPTION */}
        <Text style={styles.sectionLabel}>REQUEST DETAILS</Text>
        <View style={styles.detailsCard}>
          <Text style={styles.locationFieldLabel}>Short Reason *</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="E.g., Out of cleaning supplies"
            placeholderTextColor="#94A3B8"
            value={reason}
            onChangeText={setReason}
          />

          <Text style={styles.locationFieldLabel}>Detailed Description</Text>
          <TextInput
            style={styles.descInput}
            placeholder="Provide more context about the situation..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ACTIONS */}
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
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
      <CustomDatePicker
        visible={showFromPicker}
        value={dateFrom}
        onConfirm={(date) => {
          setDateFrom(date);
          setShowFromPicker(false);
          // UX Tốt: Nếu End Date đang được set mà Start Date mới lại lớn hơn End Date, thì reset End Date
          if (dateTo && date > dateTo) {
            setDateTo(null);
          }
        }}
        onCancel={() => setShowFromPicker(false)}
      />

      <CustomDatePicker
        visible={showToPicker}
        value={dateTo || dateFrom}
        minimumDate={dateFrom} // Logic chặt chẽ: End Date không được nhỏ hơn Start Date
        onConfirm={(date) => {
          setDateTo(date);
          setShowToPicker(false);
        }}
        onCancel={() => setShowToPicker(false)}
      />
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  typeCard: {
    width: "31%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    elevation: 1,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },
  typeSub: { fontSize: 9, color: "#94A3B8", textAlign: "center" },

  // Location
  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  locationFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  locationSelectRow: {
    gap: 8,
  },
  floorZoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  floorZoneBtnActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  floorZoneBtnText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  floorZoneBtnTextActive: { color: "#2563EB", fontWeight: "700" },

  // Timing
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  timeBox: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 6,
  },
  timeSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
  },
  timeText: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },

  // Details
  detailsCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reasonInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 16,
  },
  descInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 100,
  },

  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: { fontSize: 15, color: "#64748B", fontWeight: "600" },
});
