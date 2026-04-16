// src/screens/TaskSwapDetailModal.tsx
import { SwapRequest, useTaskSwap } from "@/hooks/useTaskSwap";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TaskSwapDetailModalProps {
  visible: boolean;
  onClose: () => void;
  swapId: string;
}

export default function TaskSwapDetailModal({
  visible,
  onClose,
  swapId,
}: TaskSwapDetailModalProps) {
  const { getById } = useTaskSwap();
  const [item, setItem] = useState<SwapRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setItem(null);

    (async () => {
      try {
        const res = await getById(swapId);
        setItem(res);
      } catch (e) {
        console.warn("Failed to load swap request", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [swapId, visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade" // Đổi từ slide sang fade cho mượt
      onRequestClose={onClose}
      transparent={true} // Bật trong suốt để làm overlay
    >
      <SafeAreaView style={styles.overlay}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.modalContainer}>
          {/* Header Modal giống Equipment */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Đổi công việc</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✖️</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            {loading ? (
              <Text style={styles.loading}>Đang tải...</Text>
            ) : !item ? (
              <Text style={styles.loading}>Không có dữ liệu</Text>
            ) : (
              <View style={styles.card}>
                {/* NOTE */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Ghi chú:</Text>
                  <View style={styles.rowValueContainer}>
                    <Text style={styles.rowValue}>
                      {item.requesterNote ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* REQUESTER */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Người yêu cầu:</Text>
                  <View style={styles.rowValueContainer}>
                    <Text style={styles.rowValue}>
                      {item.requesterName ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* TARGET WORKER */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Người nhận:</Text>
                  <View style={styles.rowValueContainer}>
                    <Text style={styles.rowValue}>
                      {item.targetWorkerName ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* STATUS */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Trạng thái:</Text>
                  <View style={styles.rowValueContainer}>
                    <Text style={[styles.rowValue, styles.status]}>
                      {item.status ?? "—"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Overlay làm mờ background
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Container chính của modal
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#f5f6fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  // Header Modal
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
  // Chống vỡ layout Row
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  rowLabel: {
    fontWeight: "600",
    color: "#444",
    width: 105, // Giữ độ rộng cố định để các cột gióng thẳng nhau
  },
  rowValueContainer: {
    flex: 1,
    flexDirection: "row",
  },
  rowValue: {
    color: "#333",
    fontSize: 14,
    flexWrap: "wrap",
  },
  loading: { textAlign: "center", marginTop: 20, color: "#555" },
  status: { fontWeight: "600", color: "#B45309" },
});
