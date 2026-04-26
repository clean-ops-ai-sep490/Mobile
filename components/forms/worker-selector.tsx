import { WorkAreaWorker } from "@/types/workAreaSupervisor.types";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── PROPS ─────────────────────────────────────────────────────────────────

interface WorkerSelectorProps {
  selectedWorkerName: string;
  workers: WorkAreaWorker[];
  loading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (workerId: string, workerName: string) => void;
  selectedWorkerId?: string;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────

const WorkerSelector: React.FC<WorkerSelectorProps> = ({
  selectedWorkerName,
  workers,
  loading,
  isOpen,
  onToggle,
  onSelect,
  selectedWorkerId,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhân viên *</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={onToggle}>
        <Text
          style={
            selectedWorkerName
              ? styles.dropdownText
              : styles.dropdownPlaceholder
          }
        >
          {selectedWorkerName || "Chọn nhân viên..."}
        </Text>
        <Text style={styles.dropdownIcon}>{isOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={onToggle}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={onToggle}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn nhân viên</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {loading ? (
                  <View style={styles.dropdownItem}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.dropdownItemText}>Đang tải...</Text>
                  </View>
                ) : workers.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>
                      Không tìm thấy nhân viên phù hợp
                    </Text>
                  </View>
                ) : (
                  workers.map((worker) => (
                    <TouchableOpacity
                      key={worker.id}
                      style={[
                        styles.dropdownItem,
                        selectedWorkerId === worker.workerId &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() =>
                        onSelect(worker.workerId, worker.workerName)
                      }
                    >
                      <Text style={styles.dropdownItemText}>
                        {worker.workerName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

// ─── STYLES ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 14,
    color: "#1E293B",
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: "#94A3B8",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#64748B",
  },
  dropdownList: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
    textAlign: "center",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#1E293B",
  },
});

export default WorkerSelector;
