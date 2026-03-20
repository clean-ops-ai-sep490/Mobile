import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  name: string;
  distance: string;
  rating: number;
  matchScore: number;
  avatar?: string;
  isBestMatch?: boolean;
}

export default function WorkerMatchCard({
  name,
  distance,
  rating,
  matchScore,
  isBestMatch,
}: Props) {
  return (
    <View style={styles.card}>
      {isBestMatch && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓ BEST MATCH</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.distance}>{distance}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.rating}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreText}>{matchScore}% Score</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  distance: {
    fontSize: 11,
    color: "#94A3B8",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  score: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
  },
});
