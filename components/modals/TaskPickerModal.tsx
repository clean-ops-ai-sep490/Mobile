import { useAuth } from "@/contexts/AuthContext";
import { useTaskAssignments } from "@/hooks/useTaskAssignment";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FormattedDate from "../common/FormattedDate";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (taskAssignmentId: string) => void;
}

export default function TaskPickerModal({ visible, onClose, onSelect }: Props) {
  const { getTaskAssignments } = useTaskAssignments();
  const { getWorkerProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkerId = async () => {
      try {
        const profile = await getWorkerProfile();
        if (profile?.id) setWorkerId(profile.id);
      } catch (error) {
        console.error("Error fetching worker profile:", error);
      }
    };
    fetchWorkerId();
  }, []);

  useEffect(() => {
    if (!visible || !workerId) return;

    const buildLocalDateRange = (date: Date) => {
      const baseDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      return {
        fromDate: `${baseDate}T00:00:00Z`,
        toDate: `${baseDate}T23:59:59Z`,
      };
    };

    (async () => {
      setLoading(true);
      try {
        const { fromDate, toDate } = buildLocalDateRange(new Date());

        const res = await getTaskAssignments(
          {
            assigneeId: workerId,
            fromDate,
          },
          {
            pageNumber: 1,
            pageSize: 20,
          },
        );

        setTasks(res?.content || []);
      } catch (e) {
        console.error("❌ [TASK_PICKER] Fetch error", e);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, workerId]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Chọn công việc</Text>

          <FlatList
            data={tasks}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <Text style={styles.rowTitle}>
                  {item.isAdhocTask && item.nameAdhocTask
                    ? `Tự phát: ${item.nameAdhocTask}`
                    : "Lịch trình: "}
                  <FormattedDate
                    dateString={item.scheduledStartAt}
                    style={styles.rowTitle}
                  />
                </Text>

                <Text style={styles.rowSub}>
                  {item.displayLocation || "Chưa gán vị trí"}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {loading
                  ? "Đang tải công việc..."
                  : "Không có công việc sắp tới"}
              </Text>
            }
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1e293b",
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  rowSub: { fontSize: 13, color: "#64748b", marginTop: 6 },
  statusBadge: {
    marginTop: 10,
    backgroundColor: "#f0f9ff",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  statusText: { fontSize: 11, fontWeight: "600", color: "#0369a1" },
  empty: { padding: 40, textAlign: "center", color: "#94a3b8" },
  closeBtn: {
    marginTop: 15,
    padding: 15,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  closeText: { color: "#475569", fontWeight: "bold", fontSize: 16 },
});
