import { WorkAreaSupervisor } from "@/types/workAreaSupervisor.types";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── PROPS ─────────────────────────────────────────────────────────────────

interface WorkAreaCardProps {
  workArea: WorkAreaSupervisor;
  onCreateAdhocTask: (workAreaId: string) => void;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────

const WorkAreaCard: React.FC<WorkAreaCardProps> = ({
  workArea,
  onCreateAdhocTask,
}) => {
  const handleCreateTask = () => {
    onCreateAdhocTask(workArea.workAreaId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.locationInfo}>
          <Text style={styles.workAreaName}>{workArea.workAreaName}</Text>
          <Text style={styles.displayLocation}>{workArea.displayLocation}</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTask}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonIcon}>⚡</Text>
          <Text style={styles.createButtonText}>Tạo Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── STYLES ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  workAreaName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  displayLocation: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 90,
    justifyContent: "center",
  },
  createButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default WorkAreaCard;
