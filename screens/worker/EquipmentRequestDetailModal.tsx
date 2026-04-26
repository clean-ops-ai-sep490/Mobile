import FormattedDate from "@/components/common/FormattedDate";
import useEquipment, { EquipmentRequestItem } from "@/hooks/useEquipment";
import { useTaskAssignments } from "@/hooks/useTaskAssignment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EquipmentRequestDetailModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  item?: EquipmentRequestItem;
}

export default function EquipmentRequestDetailModal({
  visible,
  onClose,
  requestId,
  item,
}: EquipmentRequestDetailModalProps) {
  const data = item || {};

  const { getTaskAssignmentById } = useTaskAssignments();
  const { getEquipmentById } = useEquipment();

  // States
  const [displayLocation, setDisplayLocation] = useState<string | null>(null);
  const [equipmentName, setEquipmentName] = useState<string | null>(null);

  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [isLoadingEq, setIsLoadingEq] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Fetch Task Location
    const fetchTaskDetails = async () => {
      if (!data.taskAssignmentId) return;
      setIsLoadingTask(true);
      try {
        const taskData = await getTaskAssignmentById(data.taskAssignmentId);
        if (isMounted)
          setDisplayLocation(
            taskData?.displayLocation || "Vị trí không xác định",
          );
      } catch (error) {
        if (isMounted) setDisplayLocation("Không thể tải vị trí");
      } finally {
        if (isMounted) setIsLoadingTask(false);
      }
    };

    // Fetch Equipment Name
    const fetchEquipmentDetails = async () => {
      if (!data.equipmentId) return;
      setIsLoadingEq(true);
      try {
        const eqData = await getEquipmentById(data.equipmentId);
        if (isMounted)
          setEquipmentName(eqData?.name || "Thiết bị không xác định");
      } catch (error) {
        if (isMounted) setEquipmentName("Không thể tải thiết bị");
      } finally {
        if (isMounted) setIsLoadingEq(false);
      }
    };

    if (visible) {
      fetchTaskDetails();
      fetchEquipmentDetails();
    }

    return () => {
      isMounted = false;
      if (!visible) {
        setDisplayLocation(null);
        setEquipmentName(null);
      }
    };
  }, [visible, data.taskAssignmentId, data.equipmentId]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent={true}
    >
      <SafeAreaView style={styles.overlay}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Yêu cầu thiết bị</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✖️</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
              {/* 1. ROW LOCATION (Fixed wrapping) */}
              <View style={styles.rowContainer}>
                <Text style={styles.rowLabel}>Vị trí:</Text>
                <View style={styles.rowValueContainer}>
                  {isLoadingTask ? (
                    <ActivityIndicator
                      size="small"
                      color="#1e90ff"
                      style={styles.loader}
                    />
                  ) : (
                    <Text style={styles.rowValue}>
                      {displayLocation ?? "—"}
                    </Text>
                  )}
                </View>
              </View>
              {/* 2. ROW EQUIPMENT */}
              {/* ITEMS (FIX THE REQUEST MODAL STRUCTURE) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thiết bị yêu cầu</Text>

                {data.items?.length ? (
                  data.items.map((item: any, index: number) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>
                          {item.equipmentName ?? item.equipmentId ?? "—"}
                        </Text>
                      </View>

                      <Text style={styles.itemQty}>x{item.quantity}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>—</Text>
                )}
              </View>
              {/* 3. ROW REASON */}
              <View style={styles.rowContainer}>
                <Text style={styles.rowLabel}>Lý do:</Text>
                <View style={styles.rowValueContainer}>
                  <Text style={styles.rowValue}>{data.reason ?? "—"}</Text>
                </View>
              </View>

              {/* 5. ROW STATUS */}
              <View style={styles.rowContainer}>
                <Text style={styles.rowLabel}>Trạng thái:</Text>
                <View style={styles.rowValueContainer}>
                  <Text
                    style={[
                      styles.rowValue,
                      data.status === "Pending"
                        ? styles.pending
                        : styles.status,
                    ]}
                  >
                    {data.status ?? "—"}
                  </Text>
                </View>
              </View>

              {/* 6. ROW CREATED */}
              {/* ROW: Created */}
              <View style={styles.rowContainer}>
                <Text style={styles.rowLabel}>Ngày tạo:</Text>
                <View style={styles.rowValueContainer}>
                  <Text style={styles.rowValue}>
                    {item?.created ? (
                      <FormattedDate dateString={item?.created} />
                    ) : (
                      "—"
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#f5f6fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e90ff",
  },
  closeBtn: {
    fontSize: 20,
    color: "#1e90ff",
  },
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e90ff",
  },
  // 🔥 FIX BỂ LAYOUT
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Quan trọng: Đẩy chữ lên top thay vì center nếu có 2 dòng
    marginTop: 8,
  },
  rowLabel: {
    fontWeight: "600",
    color: "#444",
    width: 85, // Cố định chiều rộng Label để cột Value thẳng hàng nhau
  },
  rowValueContainer: {
    flex: 1, // Quan trọng: Cho phép phần Value chiếm toàn bộ không gian còn lại
    flexDirection: "row",
  },
  rowValue: {
    color: "#333",
    fontSize: 14,
    flexWrap: "wrap", // Cho phép text rớt dòng
  },
  row: {
    marginTop: 8,
    color: "#333",
    fontSize: 14,
    flexDirection: "row",
  },
  loader: {
    marginLeft: 4,
  },
  status: {
    fontWeight: "600",
    color: "#28a745",
  },
  pending: {
    fontWeight: "600",
    color: "#ffc107",
  },

  section: {
    marginTop: 12,
  },

  sectionTitle: {
    fontWeight: "700",
    color: "#1e90ff",
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  itemName: {
    fontSize: 14,
    color: "#0F172A",
  },

  itemQty: {
    fontWeight: "700",
    color: "#2563EB",
  },

  emptyText: {
    color: "#94A3B8",
  },
});
