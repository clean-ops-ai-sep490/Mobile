import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
  taskName?: string;
  onBack?: () => void;
  onSubmit?: (data: RequestData) => void;
}

interface RequestData {
  equipment: string;
  quantity: number;
  priority: "normal" | "urgent";
  reason: string;
}

// ─── Equipment list ───────────────────────────────────────────────────────────
const EQUIPMENT_LIST = [
  "Floor Scrubber",
  "Vacuum Cleaner",
  "Mop & Bucket Set",
  "Pressure Washer",
  "Steam Cleaner",
  "Window Squeegee Kit",
  "Safety Cones",
  "Cleaning Cart",
  "HEPA Air Purifier",
  "Disinfectant Sprayer",
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RequestEquipmentScreen({
  taskName = "Deep Clean - Room 302",
  onBack,
  onSubmit,
}: Props) {
  const navigation = useNavigation();

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const filteredEquipment = EQUIPMENT_LIST.filter((e) =>
    e.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  const handleSelectEquipment = (item: string) => {
    setSelectedEquipment(item);
    setEquipmentSearch(item);
    setDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedEquipment) {
      Alert.alert("Missing Info", "Please select an equipment.");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Missing Info", "Please provide a reason for the request.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    onSubmit?.({ equipment: selectedEquipment, quantity, priority, reason });
    Alert.alert("Request Sent!", "Your equipment request has been submitted.", [
      { text: "OK", onPress: handleBack },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        {/* ── Header ── */}
        <Header
          title="Request Equipment"
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
              {/* ── Related Task ── */}
              <Text style={styles.fieldLabel}>RELATED TASK</Text>
              <View style={styles.taskCard}>
                <View style={styles.taskCardIcon}>
                  <Ionicons
                    name="clipboard-outline"
                    size={16}
                    color="#3B82F6"
                  />
                </View>
                <Text style={styles.taskCardText}>{taskName}</Text>
              </View>

              {/* ── Select Equipment ── */}
              <Text style={styles.sectionTitle}>Select Equipment</Text>
              <View style={{ zIndex: 10 }}>
                <TouchableOpacity
                  style={[styles.dropdown, dropdownOpen && styles.dropdownOpen]}
                  onPress={() => setDropdownOpen((v) => !v)}
                  activeOpacity={0.85}
                >
                  <TextInput
                    style={styles.dropdownInput}
                    placeholder="Search equipment..."
                    placeholderTextColor="#CBD5E1"
                    value={equipmentSearch}
                    onChangeText={(t) => {
                      setEquipmentSearch(t);
                      setSelectedEquipment("");
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                  />
                  <Ionicons
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#94A3B8"
                  />
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={styles.dropdownList}>
                    {filteredEquipment.length > 0 ? (
                      filteredEquipment.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.dropdownItem,
                            selectedEquipment === item &&
                              styles.dropdownItemActive,
                          ]}
                          onPress={() => handleSelectEquipment(item)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedEquipment === item &&
                                styles.dropdownItemTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                          {selectedEquipment === item && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#2563EB"
                            />
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>
                          No equipment found
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* ── Quantity & Priority ── */}
              <View style={styles.row}>
                {/* Quantity */}
                <View style={styles.halfBlock}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        quantity <= 1 && styles.qtyBtnDisabled,
                      ]}
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="remove" size={18} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQuantity((q) => Math.min(99, q + 1))}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="add" size={18} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Priority */}
                <View style={styles.halfBlock}>
                  <Text style={styles.sectionTitle}>Priority</Text>
                  <View style={styles.priorityRow}>
                    <TouchableOpacity
                      style={[
                        styles.priorityChip,
                        priority === "normal" &&
                          styles.priorityChipActiveNormal,
                      ]}
                      onPress={() => setPriority("normal")}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.priorityLabel,
                          priority === "normal" &&
                            styles.priorityLabelActiveNormal,
                        ]}
                      >
                        Normal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.priorityChip,
                        priority === "urgent" &&
                          styles.priorityChipActiveUrgent,
                      ]}
                      onPress={() => setPriority("urgent")}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.priorityLabel,
                          priority === "urgent" &&
                            styles.priorityLabelActiveUrgent,
                        ]}
                      >
                        Urgent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ── Reason ── */}
              <Text style={styles.sectionTitle}>Reason for Request</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Explain why you need this..."
                placeholderTextColor="#CBD5E1"
                multiline
                numberOfLines={5}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />

              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>

          {/* ── Submit ── */}
          <AppButton
            label="Submit Equipment Request"
            onPress={handleSubmit}
            loading={submitting}
            loadingLabel="Submitting..."
            iconLeft="send"
            style={{
              width: "90%",
              alignSelf: "center",
            }}
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

  // Field label
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },

  // Related task
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  taskCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  taskCardText: { fontSize: 14, fontWeight: "600", color: "#1E40AF" },

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },

  // Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dropdownOpen: {
    borderColor: "#2563EB",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    paddingVertical: 12,
  },
  dropdownList: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#2563EB",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  dropdownItemActive: { backgroundColor: "#EFF6FF" },
  dropdownItemText: { fontSize: 14, color: "#475569" },
  dropdownItemTextActive: { color: "#2563EB", fontWeight: "600" },
  dropdownEmpty: { padding: 16, alignItems: "center" },
  dropdownEmptyText: { fontSize: 13, color: "#94A3B8" },

  // Row layout
  row: { flexDirection: "row", gap: 16, marginBottom: 8 },
  halfBlock: { flex: 1 },

  // Quantity
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  qtyBtn: {
    width: 42,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },

  // Priority
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  priorityChipActiveNormal: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  priorityChipActiveUrgent: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  priorityLabel: { fontSize: 13, fontWeight: "700", color: "#94A3B8" },
  priorityLabelActiveNormal: { color: "#FFF" },
  priorityLabelActiveUrgent: { color: "#FFF" },

  // Text input
  textInput: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
