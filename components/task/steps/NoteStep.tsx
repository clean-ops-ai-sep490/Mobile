// src/components/task/steps/NoteStep.tsx
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function NoteComponent({ state, onChange }: StepPluginProps) {
  return (
    <View>
      <Text style={s.label}>Add a completion note</Text>
      <TextInput
        style={s.input}
        multiline
        numberOfLines={4}
        placeholder="Enter your observations, issues, or notes..."
        value={state.note ?? ""}
        onChangeText={(text) => onChange({ note: text })}
      />
      <Text style={s.count}>{(state.note ?? "").trim().length} chars</Text>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, color: "#64748B", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 100,
    textAlignVertical: "top",
  },
  count: { fontSize: 11, color: "#94A3B8", textAlign: "right", marginTop: 4 },
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
