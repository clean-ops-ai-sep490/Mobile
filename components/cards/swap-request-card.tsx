import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  getRelativeTime,
  getTimeRemaining,
  isUrgent,
} from "../../utils/timeUtils";

interface SwapRequestCardProps {
  workerAName: string;
  workerBName: string;
  taskSummary: string;
  createdAt: string; // ISO timestamp
  expiredAt: string; // ISO timestamp
  onPress: () => void;
}

export default function SwapRequestCard({
  workerAName,
  workerBName,
  taskSummary,
  createdAt,
  expiredAt,
  onPress,
}: SwapRequestCardProps) {
  const urgent = isUrgent(expiredAt);
  const relativeTime = getRelativeTime(createdAt);
  const timeRemaining = getTimeRemaining(expiredAt);

  return (
    <TouchableOpacity
      style={[styles.card, urgent && styles.cardUrgent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>⚠️ URGENT</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{workerAName}</Text>
          <Text style={styles.swapArrow}> → </Text>
          <Text style={styles.workerName}>{workerBName}</Text>
        </View>
        <Text style={styles.relativeTime}>{relativeTime}</Text>
      </View>

      <Text style={styles.taskSummary} numberOfLines={2}>
        {taskSummary}
      </Text>

      <View style={styles.footer}>
        <View style={styles.expiryContainer}>
          <Text style={styles.expiryLabel}>Expires: </Text>
          <Text style={[styles.expiryTime, urgent && styles.expiryTimeUrgent]}>
            {timeRemaining}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUrgent: {
    borderColor: "#F59E0B",
    borderWidth: 2,
    backgroundColor: "#FFFBEB",
  },
  urgentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  swapArrow: {
    fontSize: 14,
    color: "#94A3B8",
    marginHorizontal: 4,
  },
  relativeTime: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  taskSummary: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  expiryTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  expiryTimeUrgent: {
    color: "#F59E0B",
    fontWeight: "700",
  },
});
