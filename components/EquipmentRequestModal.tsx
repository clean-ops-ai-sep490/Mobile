import AppButton from "@/components/common/AppButton";
import useEquipment, { EquipmentItem } from "@/hooks/useEquipment";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  taskAssignmentId: string;
}

export default function EquipmentRequestModal({
  visible,
  onClose,
  taskAssignmentId,
}: Props) {
  const {
    equipmentList,
    loading: equipmentLoading,
    submitting,
    fetchEquipments,
    createEquipmentRequest,
  } = useEquipment();

  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentItem | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) {
      fetchEquipments();
      // Reset form when opened
      setEquipmentSearch("");
      setSelectedEquipment(null);
      setQuantity(1);
      setReason("");
      setDropdownOpen(false);
    }
  }, [visible]);

  const filteredEquipment = equipmentList.filter((e) =>
    e.name.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  const handleSelectEquipment = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedEquipment) {
      Alert.alert("Lack of information", "Please select an equipment.");
      return;
    }
    if (!reason.trim()) {
      Alert.alert(
        "Lack of information",
        "Please enter the reason for the request.",
      );
      return;
    }

    try {
      await createEquipmentRequest({
        taskAssignmentId,
        equipmentId: selectedEquipment.id,
        quantity,
        reason,
      });

      Alert.alert("Success!", "Your equipment request has been submitted.", [
        { text: "OK", onPress: onClose },
      ]);
    } catch (e: any) {
      const beErr =
        e?.response?.data?.errors?.[0] ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to submit equipment request.";
      Alert.alert("Error", String(beErr));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Request Equipment</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Select Equipment + Quantity */}
              <View style={styles.fieldRow}>
                <View style={styles.leftCol}>
                  <Text style={styles.sectionTitle}>Select Equipment</Text>
                  {equipmentLoading ? (
                    <ActivityIndicator
                      color="#2563EB"
                      style={{ marginVertical: 10 }}
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
                        <ScrollView
                          style={styles.dropdownList}
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                        >
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
                                </View>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.dropdownEmpty}>
                              <Text style={styles.dropdownEmptyText}>
                                No equipment found
                              </Text>
                            </View>
                          )}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.rightCol}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        quantity <= 1 && styles.qtyBtnDisabled,
                      ]}
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Ionicons name="remove" size={18} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQuantity((q) => Math.min(99, q + 1))}
                    >
                      <Ionicons name="add" size={18} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Reason */}
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                Reason for Request
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Explain why you need this..."
                placeholderTextColor="#CBD5E1"
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                label="Submit Request"
                onPress={handleSubmit}
                loading={submitting}
                loadingLabel="Submitting..."
                iconLeft="send"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "85%",
  },
  modalContent: {
    backgroundColor: "#F5F6FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  closeBtn: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    zIndex: 10,
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  rightCol: {
    width: 110,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 48,
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
  },
  dropdownList: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#2563EB",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  dropdownItemActive: { backgroundColor: "#EFF6FF" },
  dropdownItemText: { fontSize: 14, color: "#475569" },
  dropdownItemTextActive: { color: "#2563EB", fontWeight: "600" },
  dropdownEmpty: { padding: 16, alignItems: "center" },
  dropdownEmptyText: { fontSize: 13, color: "#94A3B8" },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 48,
  },
  qtyBtn: {
    width: 36,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  textInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  footer: {
    marginTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
});
