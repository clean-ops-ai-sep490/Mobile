// src/components/task/steps/PpeStep.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function PpeComponent({ config, state, onChange }: StepPluginProps) {
  const items: string[] = config?.requiredPPE ?? [];
  const toggle = (item: string) => {
    const updated = { ...state, [item]: !state[item] };
    onChange(updated);
  };
  return (
    <View>
      <Text style={s.label}>Confirm all PPE is worn before proceeding</Text>
      {items.map((item) => (
        <TouchableOpacity key={item} style={s.row} onPress={() => toggle(item)}>
          <View style={[s.box, state[item] && s.boxDone]}>
            {state[item] && <Text style={s.check}>✓</Text>}
          </View>
          <Text style={s.text}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, color: "#64748B", marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  boxDone: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  check: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  text: { fontSize: 14, color: "#1E293B", flex: 1 },
});

export const PpeStepPlugin: StepPlugin = {
  type: "ppe",
  label: "PPE Check",
  detect: (config) => config?.["x-behavior"] === "ai-ppe-check",
  buildInitialState: (config) =>
    Object.fromEntries(
      (config.requiredPPE as string[]).map((item) => [item, false]),
    ),
  isFulfilled: (state) => Object.values(state).every(Boolean),
  serialize: (state) => ({ checkedItems: state }),
  Component: PpeComponent,
};
