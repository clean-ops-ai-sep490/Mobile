import AppButton from "@/components/common/AppButton";
import BottomTabBar, { TabKey } from "@/components/common/BottomTabBar";
import Header from "@/components/common/Header";
import useEquipment, { EquipmentItem } from "@/hooks/useEquipment";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

interface Props {
  taskAssignmentId?: string;
  taskName?: string;
  onBack?: () => void;
}

export default function RequestEquipmentScreen({
  taskAssignmentId,
  taskName = "Deep Clean - Room 302",
  onBack,
}: Props) {
  const navigation = useNavigation();
  const {
    equipmentList,
    loading: equipmentLoading,
    submitting,
    fetchEquipments,
    createEquipmentRequest,
  } = useEquipment();

  const handleNavigate = (screen: TabKey) => {
    navigation.navigate(screen as never);
  };

  // ── Form state ──
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fetchEquipments();
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

  const filteredEquipment = equipmentList.filter((e) =>
    e.name.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  const handleSelectEquipment = (item: EquipmentItem) => {
    setSelectedEquipment(item);
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

    try {
      await createEquipmentRequest({
        taskAssignmentId:
          taskAssignmentId ?? "00000000-0000-0000-0000-000000000000",
        equipmentId: selectedEquipment.id,
        quantity,
        reason,
      });
      Alert.alert(
        "Request Sent!",
        "Your equipment request has been submitted.",
        [{ text: "OK", onPress: handleBack }],
      );
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Failed to submit request.",
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
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

              {/* ── Select Equipment + Quantity (inline) ── */}
              <View style={styles.fieldRow}>
                <View style={styles.leftCol}>
                  <Text style={styles.sectionTitle}>Select Equipment</Text>
                  {equipmentLoading ? (
                    <ActivityIndicator
                      color="#2563EB"
                      style={{ marginBottom: 24 }}
                    />
                  ) : (
                    <View style={{ zIndex: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.dropdown,
                          dropdownOpen && styles.dropdownOpen,
                        ]}
                        onPress={() => setDropdownOpen((v) => !v)}
                        activeOpacity={0.85}
                      >
                        <TextInput
                          style={styles.dropdownInput}
                          placeholder="Search equipment..."
                          placeholderTextColor="#CBD5E1"
                          value={
                            equipmentSearch
                              ? equipmentSearch
                              : selectedEquipment?.name || ""
                          }
                          onChangeText={(t) => {
                            setEquipmentSearch(t);
                            setSelectedEquipment(null);
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
                                key={item.id}
                                style={[
                                  styles.dropdownItem,
                                  selectedEquipment?.id === item.id &&
                                    styles.dropdownItemActive,
                                ]}
                                onPress={() => handleSelectEquipment(item)}
                                activeOpacity={0.75}
                              >
                                <View>
                                  <Text
                                    style={[
                                      styles.dropdownItemText,
                                      selectedEquipment?.id === item.id &&
                                        styles.dropdownItemTextActive,
                                    ]}
                                  >
                                    {item.name}
                                  </Text>
                                  {item.description ? (
                                    <Text style={styles.dropdownItemDesc}>
                                      {item.description}
                                    </Text>
                                  ) : null}
                                </View>
                                {selectedEquipment?.id === item.id && (
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
                  )}
                </View>

                <View style={styles.rightCol}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  <View style={[styles.quantityControl, { marginTop: 0 }]}>
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
              </View>

              {/* ── Reason ── */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Reason for Request
              </Text>
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
              position: "absolute",
              bottom: 20,
            }}
          />
        </KeyboardAvoidingView>
        <BottomTabBar onNavigate={handleNavigate} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6FA" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
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

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  rightCol: {
    width: 120,
  },

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
  dropdownItemDesc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  dropdownEmpty: { padding: 16, alignItems: "center" },
  dropdownEmptyText: { fontSize: 13, color: "#94A3B8" },

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
});
