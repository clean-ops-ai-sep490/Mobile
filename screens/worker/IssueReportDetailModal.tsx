// src/screens/IssueReportDetailModal.tsx
import Header from "@/components/common/Header";
import { IssueReport, useIssueReport } from "@/hooks/useIssueReport";
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

interface IssueReportDetailModalProps {
  visible: boolean;
  onClose: () => void;
  reportId: string;
}

export default function IssueReportDetailModal({
  visible,
  onClose,
  reportId,
}: IssueReportDetailModalProps) {
  const { getById } = useIssueReport();
  const [item, setItem] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setItem(null);
    (async () => {
      try {
        const res = await getById(reportId);
        setItem(res);
      } catch (e) {
        console.warn("Failed to load issue report", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header title="Issue Report" onBack={onClose} />
        <ScrollView contentContainerStyle={styles.container}>
          {loading ? (
            <Text style={styles.loading}>Loading...</Text>
          ) : !item ? (
            <Text style={styles.loading}>No data available.</Text>
          ) : (
            <View style={styles.card}>
              <Text style={styles.title}>Issue #{item.id}</Text>
              <Text style={styles.row}>
                Reported by: {item.reportedByWorkerId}
              </Text>
              <Text style={styles.row}>
                Task Assignment: {item.taskAssignmentId ?? "—"}
              </Text>
              <Text style={styles.row}>Status: {item.status}</Text>
              <Text style={styles.row}>Created: {item.created}</Text>
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "700" }}>Description</Text>
                <Text style={{ marginTop: 6 }}>{item.description}</Text>
              </View>
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
