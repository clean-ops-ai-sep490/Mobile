import AppButton from "@/components/common/AppButton";
import { useAuth } from "@/contexts/AuthContext";
import { useIssueReport } from "@/hooks/useIssueReport";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface IssueReportModalProps {
  visible: boolean;
  onClose: () => void;
  taskAssignmentId: string;
}

export default function IssueReportModal({
  visible,
  onClose,
  taskAssignmentId,
}: IssueReportModalProps) {
  const { getWorkerProfile } = useAuth();
  const { create } = useIssueReport();

  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch worker info khi modal mở lên
  useEffect(() => {
    if (visible && !workerId) {
      const fetchWorkerId = async () => {
        try {
          setLoadingWorker(true);
          const profile = await getWorkerProfile();
          if (profile && profile.id) {
            setWorkerId(profile.id);
          }
        } catch (error) {
          console.error("Error fetching worker profile:", error);
        } finally {
          setLoadingWorker(false);
        }
      };
      fetchWorkerId();
    }
  }, [visible, workerId]);

  const handleClose = () => {
    setDescription("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả sự cố.");
      return;
    }

    if (!workerId) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await create({
        taskAssignmentId,
        reportedByWorkerId: workerId,
        description: description.trim(),
      });

      Alert.alert("Thành công", "Báo cáo sự cố đã được gửi thành công.", [
        { text: "OK", onPress: handleClose },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Thất bại",
        err?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalContainer}>
              {/* Header của Modal */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="warning" size={24} color="#EF4444" />
                  <Text style={styles.title}>Báo cáo sự cố</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Vui lòng mô tả chi tiết sự cố bạn gặp phải khi thực hiện công
                việc.
              </Text>

              {loadingWorker ? (
                <ActivityIndicator
                  size="small"
                  color="#3B82F6"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mô tả sự cố..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                  autoFocus
                />
              )}

              <View style={styles.footer}>
                <AppButton
                  label="Gửi báo cáo"
                  onPress={handleSubmit}
                  loading={submitting}
                  loadingLabel="Đang gửi..."
                  style={styles.submitBtn}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  keyboardView: {
    width: "100%",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    margin: 0,
  },
});
