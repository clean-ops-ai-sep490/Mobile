// src/components/task/steps/NoteStep.tsx
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function NoteComponent({ state, onChange }: StepPluginProps) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>Add a completion note</Text>
      </View>

      <TextInput
        style={s.input}
        multiline
        numberOfLines={4}
        placeholder="Enter your observations, issues, or notes..."
        placeholderTextColor="#94A3B8"
        value={state.note ?? ""}
        onChangeText={(text) => onChange({ note: text })}
      />

      <Text style={s.count}>{(state.note ?? "").trim().length} chars</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    minHeight: 120,
    textAlignVertical: "top", // Quan trọng trên Android để chữ bắt đầu từ Top
    // Đổ bóng đồng bộ với các Component khác
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  count: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 8,
    fontWeight: "500",
  },
});

export const NoteStepPlugin: StepPlugin = {
  type: "note",
  label: "Completion Note",
  detect: (config) => config?.["x-behavior"] === "finish",
  buildInitialState: () => ({ note: "" }),
  isFulfilled: (state) => (state.note ?? "").trim().length > 0,
  serialize: (state) => ({ note: state.note }),
  Component: NoteComponent,
};
