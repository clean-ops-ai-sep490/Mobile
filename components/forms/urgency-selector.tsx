import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type UrgencyLevel = "Normal" | "High" | "Critical";

interface Props {
  label: string;
  value: UrgencyLevel;
  onChange: (level: UrgencyLevel) => void;
}

export default function UrgencySelector({ label, value, onChange }: Props) {
  const levels: UrgencyLevel[] = ["Normal", "High", "Critical"];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.option, value === level && styles.optionActive]}
            onPress={() => onChange(level)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                value === level && styles.optionTextActive,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

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
  options: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  optionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  optionTextActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});
