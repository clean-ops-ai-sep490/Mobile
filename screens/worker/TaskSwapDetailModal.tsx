// src/screens/TaskSwapDetailModal.tsx
import Header from "@/components/common/Header";
import { SwapRequest, useTaskSwap } from "@/hooks/useTaskSwap";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header title="Task Swap" onBack={onClose} />
        <ScrollView contentContainerStyle={styles.container}>
          {loading ? (
            <Text style={styles.loading}>Loading...</Text>
          ) : !item ? (
            <Text style={styles.loading}>No data available.</Text>
          ) : (
            <View style={styles.card}>
              <Text style={styles.title}>SwapId: {item.id}</Text>
              <Text style={styles.row}>Note: {item.requesterNote ?? "—"}</Text>
              <Text style={styles.row}>Requester: {item.requesterName}</Text>
              <Text style={styles.row}>
                Target Worker: {item.targetWorkerName ?? "—"}
              </Text>
              <Text style={styles.row}>Status: {item.status}</Text>
              <Text style={styles.row}>Created: {item.createdAt}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f6fa" },
  container: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { marginTop: 6, color: "#333" },
  loading: { textAlign: "center", marginTop: 20, color: "#555" },
});
