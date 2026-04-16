import AppButton from "@/components/common/AppButton";
import useEquipment from "@/hooks/useEquipment";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
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

interface EquipmentItem {
  id: string;
  name: string;
}

interface SelectedEquipmentItem {
  equipment: EquipmentItem;
  quantity: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  taskAssignmentId: string;
  requiredEquipment?: EquipmentItem[];
}

export default function EquipmentRequestModal({
  visible,
  onClose,
  taskAssignmentId,
  requiredEquipment = [],
}: Props) {
  const { submitting, createEquipmentRequest } = useEquipment();

  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<
    SelectedEquipmentItem[]
  >([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reason, setReason] = useState("");

  // RESET khi mở modal
  useEffect(() => {
    if (visible) {
      setEquipmentSearch("");
      setSelectedEquipments([]);
      setReason("");
      setDropdownOpen(false);
    }
  }, [visible]);

  // Filter trực tiếp từ prop
  const filteredEquipment = requiredEquipment.filter((e) =>
    e.name.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  // SELECT
  const handleSelectEquipment = (item: EquipmentItem) => {
    const exists = selectedEquipments.find((e) => e.equipment.id === item.id);

    if (exists) {
      setSelectedEquipments((prev) =>
        prev.map((e) =>
          e.equipment.id === item.id ? { ...e, quantity: e.quantity + 1 } : e,
        ),
      );
    } else {
      setSelectedEquipments((prev) => [
        ...prev,
        { equipment: item, quantity: 1 },
      ]);
    }

    setDropdownOpen(false);
  };

  // UPDATE QTY
  const updateQuantity = (id: string, delta: number) => {
    setSelectedEquipments((prev) =>
      prev.map((e) =>
        e.equipment.id === id
          ? { ...e, quantity: Math.max(1, e.quantity + delta) }
          : e,
      ),
    );
  };

  // REMOVE
  const removeItem = (id: string) => {
    setSelectedEquipments((prev) => prev.filter((e) => e.equipment.id !== id));
  };

  // SUBMIT
  const handleSubmit = async () => {
    if (selectedEquipments.length === 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn ít nhất 1 thiết bị.");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập lý do.");
      return;
    }

    try {
      await createEquipmentRequest({
        taskAssignmentId,
        reason,
        items: selectedEquipments.map((e) => ({
          equipmentId: e.equipment.id,
          quantity: e.quantity,
        })),
      });

      Alert.alert("Thành công", "Đã gửi yêu cầu.", [
        { text: "OK", onPress: onClose },
      ]);
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.[0] ||
        e?.response?.data?.message ||
        e?.message ||
        "Gửi thất bại";
      Alert.alert("Lỗi", msg);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Yêu cầu thiết bị</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {/* DROPDOWN */}
              <Text style={styles.sectionTitle}>Chọn thiết bị</Text>

              {requiredEquipment.length === 0 ? (
                <Text style={styles.emptyText}>
                  Không có thiết bị yêu cầu nào.
                </Text>
              ) : (
                <View style={{ zIndex: 10 }}>
                  <TouchableOpacity
                    style={[
                      styles.dropdown,
                      dropdownOpen && styles.dropdownOpen,
                    ]}
                    onPress={() => setDropdownOpen((v) => !v)}
                  >
                    <TextInput
                      style={styles.dropdownInput}
                      placeholder="Tìm thiết bị..."
                      value={equipmentSearch}
                      onChangeText={(t) => {
                        setEquipmentSearch(t);
                        setDropdownOpen(true);
                      }}
                    />
                    <Ionicons
                      name={dropdownOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                    />
                  </TouchableOpacity>

                  {dropdownOpen && (
                    <ScrollView
                      style={styles.dropdownList}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredEquipment.length === 0 ? (
                        <Text style={styles.emptyDropdown}>
                          Không tìm thấy thiết bị.
                        </Text>
                      ) : (
                        filteredEquipment.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectEquipment(item)}
                          >
                            <Text>{item.name}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* SELECTED LIST */}
              <View style={{ marginTop: 12 }}>
                {selectedEquipments.map((item) => (
                  <View key={item.equipment.id} style={styles.selectedItem}>
                    <Text style={{ flex: 1 }}>{item.equipment.name}</Text>

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.equipment.id, -1)}
                      >
                        <Ionicons name="remove" size={18} />
                      </TouchableOpacity>

                      <Text style={{ marginHorizontal: 10 }}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        onPress={() => updateQuantity(item.equipment.id, 1)}
                      >
                        <Ionicons name="add" size={18} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeItem(item.equipment.id)}
                    >
                      <Ionicons name="trash" size={18} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* REASON */}
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                Lý do
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Nhập lý do yêu cầu..."
                value={reason}
                onChangeText={setReason}
              />
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                label="Gửi yêu cầu"
                onPress={handleSubmit}
                loading={submitting}
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: { maxHeight: "85%" },
  modalContent: {
    backgroundColor: "#F5F6FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  sectionTitle: { fontWeight: "700", marginBottom: 6 },
  dropdown: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownOpen: { borderColor: "#2563EB" },
  dropdownInput: { fontSize: 14, flex: 1 },
  dropdownList: {
    backgroundColor: "#FFF",
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  emptyDropdown: {
    padding: 10,
    color: "#94A3B8",
    fontSize: 13,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
    marginVertical: 8,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  footer: { marginTop: 10 },
});
