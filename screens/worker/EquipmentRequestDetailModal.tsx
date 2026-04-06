// src/screens/EquipmentRequestDetailModal.tsx
import Header from "@/components/common/Header";
import React from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface EquipmentRequestDetailModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  item?: any; // có thể là EquipmentRequestItem
}

export default function EquipmentRequestDetailModal({
  visible,
  onClose,
  requestId,
  item,
}: EquipmentRequestDetailModalProps) {
  const data = item || {};

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header title="Equipment Request" onBack={onClose} />
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Request #{requestId}</Text>
            <Text style={styles.row}>
              Task Assignment: {data.taskAssignmentId ?? "—"}
            </Text>
            <Text style={styles.row}>Equipment: {data.equipmentId ?? "—"}</Text>
            <Text style={styles.row}>Quantity: {data.quantity ?? "—"}</Text>
            <Text style={styles.row}>Reason: {data.reason ?? "—"}</Text>
            <Text style={styles.row}>Status: {data.status ?? "—"}</Text>
            <Text style={styles.row}>Created: {data.createdAt ?? "—"}</Text>
          </View>
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
});
