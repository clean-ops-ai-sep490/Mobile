import AppButton from "@/components/common/AppButton";
import Header from "@/components/common/Header";
import { WorkerStackParamList } from "@/navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
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

type Props = NativeStackScreenProps<WorkerStackParamList, "SwapTask">;

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CURRENT_TASK = {
  image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
  badge: "IN PROGRESS",
  title: "Factory Floor Cleaning",
  date: "15/10/2023",
  time: "08:00 - 10:00",
  area: "Production Zone A",
  tags: ["Floor Cleaning", "Chemical Handling", "Safety Training"],
};

const COLLEAGUES = [
  {
    id: "1",
    name: "Nguyen Van An",
    role: "Cleaning Staff - Zone C",
    shift: "08:00 - 17:00 | Floor 2, Building A, Main Branch",
    avatar: "NV",
    avatarColor: "#7DD3B0",
  },
  {
    id: "2",
    name: "Tran Thi Bich",
    role: "Cleaning Staff - Zone B",
    shift: "08:00 - 17:00 | Floor 1, Building B",
    avatar: "TB",
    avatarColor: "#60A5FA",
  },
];

// ─── Step Badge ───────────────────────────────────────────────────────────────
const StepBadge = ({
  step,
  label,
  active,
}: {
  step: number;
  label: string;
  active?: boolean;
}) => (
  <View style={styles.stepRow}>
    <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
      <Text style={[styles.stepNum, active && styles.stepNumActive]}>
        {step}
      </Text>
    </View>
    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
      {label}
    </Text>
  </View>
);

// ─── Tag ─────────────────────────────────────────────────────────────────────
const Tag = ({ label }: { label: string }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

// ─── Colleague Card ───────────────────────────────────────────────────────────
const ColleagueCard = ({
  item,
  selected,
  onSelect,
}: {
  item: (typeof COLLEAGUES)[0];
  selected: boolean;
  onSelect: () => void;
}) => (
  <TouchableOpacity
    style={[styles.colleagueCard, selected && styles.colleagueCardSelected]}
    onPress={onSelect}
    activeOpacity={0.8}
  >
    <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
      <Text style={styles.avatarText}>{item.avatar}</Text>
    </View>
    <View style={styles.colleagueInfo}>
      <Text style={styles.colleagueName}>{item.name}</Text>
      <Text style={styles.colleagueRole}>{item.role}</Text>
      <Text style={styles.colleagueShift}>{item.shift}</Text>
    </View>
    <View style={[styles.selectCircle, selected && styles.selectCircleActive]}>
      {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RequestJobChangeScreen({ navigation }: Props) {
  const [selectedColleague, setSelectedColleague] = useState<string | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const colleague = COLLEAGUES.find((c) => c.id === selectedColleague);

  const handleSubmit = async () => {
    if (!selectedColleague) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <Header title="Request Swap Task" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1 — Current Task */}
        <View style={styles.section}>
          <StepBadge step={1} label="Current Task" active />
          <View style={styles.taskCard}>
            <View style={styles.taskImageWrap}>
              <Image
                source={{ uri: CURRENT_TASK.image }}
                style={styles.taskImage}
              />
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>{CURRENT_TASK.badge}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.taskBody} activeOpacity={0.9}>
              <Text style={styles.taskTitle}>{CURRENT_TASK.title}</Text>
              <View style={styles.taskMeta}>
                <Ionicons name="calendar-outline" size={13} color="#64748B" />
                <Text style={styles.taskMetaText}>{CURRENT_TASK.date}</Text>
                <Text style={styles.taskMetaDot}>·</Text>
                <Ionicons name="time-outline" size={13} color="#64748B" />
                <Text style={styles.taskMetaText}>{CURRENT_TASK.time}</Text>
              </View>
              <View style={styles.taskMeta}>
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <Text style={styles.taskMetaText}>{CURRENT_TASK.area}</Text>
              </View>
              <View style={styles.tagRow}>
                {CURRENT_TASK.tags.map((t) => (
                  <Tag key={t} label={t} />
                ))}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2 — Select Colleague */}
        <View style={styles.section}>
          <StepBadge step={2} label="Select Colleague & Task" active />
          {COLLEAGUES.map((c) => (
            <ColleagueCard
              key={c.id}
              item={c}
              selected={selectedColleague === c.id}
              onSelect={() => setSelectedColleague(c.id)}
            />
          ))}
        </View>

        {/* Step 3 — Qualification Check */}
        <View style={styles.section}>
          <StepBadge step={3} label="Qualification Check" active />
          {selectedColleague ? (
            <View style={styles.qualCard}>
              <View style={[styles.qualRow, styles.qualOk]}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                <Text style={styles.qualOkText}>
                  <Text style={{ fontWeight: "700" }}>{colleague?.name}</Text>{" "}
                  has the required skills & certifications to replace you.
                </Text>
              </View>
              <View style={[styles.qualRow, styles.qualWarn]}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
                <View>
                  <Text style={styles.qualWarnText}>
                    Missing required certification for this task:
                  </Text>
                  <Text style={styles.qualWarnBold}>
                    CONFINED SPACE SAFETY CERT (CONFINED SPACE ENTRY)
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.qualPlaceholder}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" />
              <Text style={styles.qualPlaceholderText}>
                Select a colleague to check qualifications
              </Text>
            </View>
          )}
        </View>

        {/* Step 4 — Summary */}
        <View style={styles.section}>
          <StepBadge step={4} label="Request Summary" active />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryDesc}>
              You are requesting a job change at your current location with
              colleague{" "}
              <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                {colleague?.name ?? "—"}
              </Text>
              . Please note this request requires management approval.
            </Text>
            <Text style={styles.reasonLabel}>REASON (OPTIONAL)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter your reason here..."
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {!selectedColleague && (
              <View style={styles.warningRow}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Please select a colleague before submitting. Check
                  qualifications first.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            label="Submit Swap Task Request"
            onPress={handleSubmit}
            loading={loading}
            loadingLabel="Submitting..."
            disabled={!selectedColleague}
            iconLeft="swap-horizontal-outline"
          />
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Section
  section: { marginBottom: 20 },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepCircleActive: { backgroundColor: "#2563EB" },
  stepNum: { fontSize: 12, fontWeight: "800", color: "#94A3B8" },
  stepNumActive: { color: "#FFF" },
  stepLabel: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
  stepLabelActive: { color: "#1E293B" },

  // Task Card
  taskCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  taskImageWrap: { position: "relative" },
  taskImage: { width: "100%", height: 140 },
  taskBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#2563EB",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taskBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  taskBody: { padding: 14 },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  taskMetaText: { fontSize: 13, color: "#64748B" },
  taskMetaDot: { color: "#CBD5E1", marginHorizontal: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: "#2563EB", fontWeight: "600" },

  // Colleague Card
  colleagueCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  colleagueCardSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  colleagueInfo: { flex: 1 },
  colleagueName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  colleagueRole: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  colleagueShift: { fontSize: 11, color: "#94A3B8" },
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  selectCircleActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },

  // Qual Card
  qualCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  qualRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
  },
  qualOk: {
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  qualOkText: { flex: 1, fontSize: 13, color: "#166534", lineHeight: 20 },
  qualWarn: { backgroundColor: "#FEF2F2" },
  qualWarnText: { fontSize: 13, color: "#991B1B", marginBottom: 4 },
  qualWarnBold: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.3,
  },
  qualPlaceholder: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
  },
  qualPlaceholderText: { fontSize: 13, color: "#94A3B8" },

  // Summary
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  summaryDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 80,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 12,
  },
  warningText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  // Actions
  actions: { marginTop: 8 },
  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: { fontSize: 15, color: "#64748B", fontWeight: "600" },
});
