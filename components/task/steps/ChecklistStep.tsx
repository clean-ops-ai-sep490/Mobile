// src/components/task/steps/ChecklistStep.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function ChecklistComponent({ config, state, onChange }: StepPluginProps) {
  const items: string[] = config?.items ?? [];
  const toggle = (item: string) => onChange({ ...state, [item]: !state[item] });
  const doneCount = items.filter((item) => state[item]).length;

  return (
    <View>
      <Text style={s.label}>
        Complete all items — {doneCount}/{items.length}
      </Text>
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

export const ChecklistStepPlugin: StepPlugin = {
  type: "checklist",
  label: "Checklist",
  detect: (config) => config?.["x-behavior"] === "checklist",
  buildInitialState: (config) =>
    Object.fromEntries((config.items as string[]).map((item) => [item, false])),
  isFulfilled: (state) =>
    Object.values(state).length > 0 && Object.values(state).every(Boolean),
  serialize: (state) => ({ checklistDone: state }),
  Component: ChecklistComponent,
};
