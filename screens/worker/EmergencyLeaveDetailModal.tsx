// src/screens/EmergencyLeaveDetailModal.tsx
import FormattedDate from "@/components/common/FormattedDate";
import {
  EmergencyLeaveRequestDto,
  useEmergencyLeaveRequest,
} from "@/hooks/useEmergencyLeave";
import { useTaskAssignments } from "@/hooks/useTaskAssignment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ExtendedEmergencyLeaveDto extends EmergencyLeaveRequestDto {
  taskName?: string;
}

interface EmergencyLeaveDetailModalProps {
  visible: boolean;
  onClose: () => void;
  leaveId: string;
}

export default function EmergencyLeaveDetailModal({
  visible,
  onClose,
  leaveId,
}: EmergencyLeaveDetailModalProps) {
  const { getById } = useEmergencyLeaveRequest();
  const { getTaskAssignmentById } = useTaskAssignments();
  const [item, setItem] = useState<ExtendedEmergencyLeaveDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getById(leaveId);
        console.log(
          "[LeaveDetail] full response:",
          JSON.stringify(res, null, 2),
        );
        // Enrich with taskName when possible (same logic as ListAllRequestsScreen)
        if (res?.taskAssignmentId) {
          try {
            const assignment = await getTaskAssignmentById(
              res.taskAssignmentId,
            );
            const taskName =
              assignment?.taskName || assignment?.nameAdhocTask || undefined;
            setItem({ ...res, taskName });
          } catch (e) {
            setItem(res);
          }
        } else {
          setItem(res);
        }
      } catch (err: any) {
        console.error("Không tải được nghỉ khẩn cấp", err);
        setError("Tải dữ liệu nghỉ khẩn cấp thất bại. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leaveId, visible]);

  const openAudio = (uri: string) => {
    Linking.canOpenURL(uri)
      .then((supported) => {
        if (supported) Linking.openURL(uri);
        else console.warn("Cannot open audio URL:", uri);
      })
      .catch((err) => console.error("Error opening audio URL:", err));
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent={true} // transparent để tạo nền mờ
    >
      <SafeAreaView style={styles.overlay}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nghỉ khẩn cấp</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✖️</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.container}>
            {loading ? (
              <ActivityIndicator size="large" color="#1e90ff" />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : !item ? (
              <Text style={styles.info}>Không có dữ liệu</Text>
            ) : (
              <View style={styles.card}>
                <Text style={styles.row}>
                  Công việc: {item.taskName ?? item.taskAssignmentId ?? "—"}
                </Text>

                <Text style={styles.row}>
                  Ngày bắt đầu:{" "}
                  <FormattedDate dateString={item.leaveDateFrom} />
                </Text>
                <Text style={styles.row}>
                  Ngày kết thúc: <FormattedDate dateString={item.leaveDateTo} />
                </Text>

                <Text
                  style={[
                    styles.row,
                    item.status === "Pending" ? styles.pending : styles.status,
                  ]}
                >
                  Trạng thái: {item.status}
                </Text>

                {item.audioUrl && (
                  <TouchableOpacity
                    onPress={() => openAudio(item.audioUrl)}
                    style={styles.audioContainer}
                  >
                    <Text style={styles.audioLabel}>▶️ Phát ghi âm</Text>
                    <Text style={styles.audioUrl}>{item.audioUrl}</Text>
                  </TouchableOpacity>
                )}

                {item.transcription && (
                  <View style={styles.transcription}>
                    <Text style={styles.transLabel}>Bản ghi:</Text>
                    <Text style={styles.transText}>{item.transcription}</Text>
                  </View>
                )}

                <Text style={styles.row}>
                  Ngày tạo: <FormattedDate dateString={item.created} />
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // nền mờ
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e90ff" },
  closeBtn: { fontSize: 20, color: "#1e90ff" },
  container: { padding: 16 },
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
  row: { marginTop: 8, color: "#333", fontSize: 14, fontWeight: 600 },
  status: { fontWeight: "600", color: "#28a745" },
  pending: { fontWeight: "600", color: "#ffc107" },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  info: { textAlign: "center", marginTop: 20, color: "#555" },
  audioContainer: { marginTop: 12 },
  audioLabel: { fontWeight: "600", marginBottom: 4, color: "#1e90ff" },
  audioUrl: { fontSize: 12, color: "#555" },
  transcription: { marginTop: 12 },
  transLabel: { fontWeight: "600", marginBottom: 4 },
  transText: { color: "#555" },
});
