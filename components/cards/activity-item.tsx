import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  icon: string;
  name: string;
  action: string;
  time: string;
  onPress?: () => void;
}

export default function ActivityItem({
  icon,
  name,
  action,
  time,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.action}>{action}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  action: {
    fontSize: 12,
    color: "#94A3B8",
  },
  time: {
    fontSize: 11,
    color: "#CBD5E1",
  },
});
