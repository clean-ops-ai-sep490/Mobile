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

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (taskAssignmentId: string) => void;
}

export default function TaskPickerModal({ visible, onClose, onSelect }: Props) {
  const { getTaskAssignments } = useTaskAssignments();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getTaskAssignments(
          { assigneeId: user?.userId },
          { pageNumber: 1, pageSize: 50 },
        );
        setTasks(res?.content || []);
      } catch (e) {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Task</Text>

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
                <Text style={styles.rowTitle}>{item.taskRef || item.id}</Text>
                <Text style={styles.rowSub}>
                  {item.location || item.taskLocation || ""}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {loading ? "Loading..." : "No tasks found"}
              </Text>
            }
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "70%",
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  rowSub: { fontSize: 12, color: "#64748B", marginTop: 4 },
  empty: { padding: 12, color: "#94A3B8" },
  closeBtn: { marginTop: 8, alignItems: "center" },
  closeText: { color: "#2563EB", fontWeight: "700" },
});
