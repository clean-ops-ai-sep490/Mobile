// src/screens/IssueReportDetailModal.tsx
import FormattedDate from "@/components/common/FormattedDate";
import { IssueReport, useIssueReport } from "@/hooks/useIssueReport";
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
  const { getTaskAssignmentById } = useTaskAssignments();

  // States
  const [item, setItem] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayLocation, setDisplayLocation] = useState<string | null>(null);
  const [taskName, setTaskName] = useState<string | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  // 1. Effect: Fetch thông tin chi tiết của Issue
  useEffect(() => {
    let isMounted = true;
    if (!visible) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await getById(reportId);
        if (isMounted) setItem(res);
      } catch (e) {
        console.warn("Failed to load issue report", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
      if (!visible) {
        setItem(null);
        setDisplayLocation(null);
        setTaskName(null);
      }
    };
  }, [reportId, visible]);

  // 2. Effect: Fetch Location từ Task (Chỉ chạy khi đã có item.taskAssignmentId)
  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      if (visible && item?.taskAssignmentId) {
        setIsLoadingTask(true);
        try {
          const taskData = await getTaskAssignmentById(item.taskAssignmentId);
          if (isMounted) {
            setDisplayLocation(
              taskData?.displayLocation || "Vị trí không xác định",
            );
            setTaskName(taskData?.taskName || taskData?.nameAdhocTask || null);
          }
        } catch (error) {
          if (isMounted) setDisplayLocation("Không thể tải vị trí");
        } finally {
          if (isMounted) setIsLoadingTask(false);
        }
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, [visible, item?.taskAssignmentId]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent={true} // Bật nền mờ
    >
      <SafeAreaView style={styles.overlay}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✖️</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#1e90ff"
                style={styles.loaderCenter}
              />
            ) : !item ? (
              <Text style={styles.info}>Không có dữ liệu</Text>
            ) : (
              <View style={styles.card}>
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Công việc:</Text>
                  <View style={styles.rowValueContainer}>
                    {isLoadingTask ? (
                      <ActivityIndicator size="small" color="#1e90ff" />
                    ) : (
                      <Text style={styles.rowValue}>
                        {taskName ?? item.taskAssignmentId ?? "—"}
                      </Text>
                    )}
                  </View>
                </View>
                {/* ROW: Location (Sử dụng cấu trúc đồng nhất) */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Vị trí:</Text>
                  <View style={styles.rowValueContainer}>
                    {isLoadingTask ? (
                      <ActivityIndicator size="small" color="#1e90ff" />
                    ) : (
                      <Text style={styles.rowValue}>
                        {displayLocation ?? "—"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* ROW: Status */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Status:</Text>
                  <View style={styles.rowValueContainer}>
                    <Text
                      style={[
                        styles.rowValue,
                        item.status === "Pending"
                          ? styles.pending
                          : styles.status,
                      ]}
                    >
                      {item.status ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* ROW: Created */}
                <View style={styles.rowContainer}>
                  <Text style={styles.rowLabel}>Ngày tạo:</Text>
                  <View style={styles.rowValueContainer}>
                    <Text style={styles.rowValue}>
                      {item.created ? (
                        <FormattedDate dateString={item.created} />
                      ) : (
                        "—"
                      )}
                    </Text>
                  </View>
                </View>

                {/* KHỐI DESCRIPTION: Đặt riêng ra vì văn bản thường dài */}
                <View style={styles.descriptionBlock}>
                  <Text style={styles.rowLabel}>Mô tả:</Text>
                  <Text style={styles.descriptionText}>
                    {item.description ?? "Không có mô tả."}
                  </Text>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Nền đen mờ
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
  loaderCenter: {
    marginTop: 40,
  },
  info: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
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
    marginBottom: 16,
    color: "#1e90ff",
  },

  // -- Cấu trúc Layout Grid Chuẩn --
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  rowLabel: {
    width: 95, // Cố định chiều rộng để thẳng cột
    fontWeight: "600",
    color: "#444",
    fontSize: 14,
  },
  rowValueContainer: {
    flex: 1, // Cho phép text chiếm nốt phần trống
    flexDirection: "row",
  },
  rowValue: {
    color: "#333",
    fontSize: 14,
    flexWrap: "wrap", // Tự động xuống dòng
  },

  // -- Description Block --
  descriptionBlock: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  descriptionText: {
    marginTop: 6,
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },

  // -- Trạng thái --
  status: {
    fontWeight: "600",
    color: "#28a745",
  },
  pending: {
    fontWeight: "600",
    color: "#ffc107",
  },
});
