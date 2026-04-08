// src/components/task/steps/EquipmentStep.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function EquipmentComponent({ config, state, onChange }: StepPluginProps) {
  const items: { id: string; name: string }[] = config?.requiredEquipment ?? [];
  const toggle = (id: string) => onChange({ ...state, [id]: !state[id] });
  return (
    <View>
      <Text style={s.label}>Confirm all required equipment is ready</Text>
      {items.map((eq) => (
        <TouchableOpacity
          key={eq.id}
          style={s.row}
          onPress={() => toggle(eq.id)}
        >
          <View style={[s.box, state[eq.id] && s.boxDone]}>
            {state[eq.id] && <Text style={s.check}>✓</Text>}
          </View>
          <Text style={s.text}>{eq.name}</Text>
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

export const EquipmentStepPlugin: StepPlugin = {
  type: "equipment",
  label: "Equipment Check",
  detect: (config) => config?.["x-behavior"] === "equipment-check",
  buildInitialState: (config) =>
    Object.fromEntries(
      (config.requiredEquipment as { id: string; name: string }[]).map((eq) => [
        eq.id,
        false,
      ]),
    ),
  isFulfilled: (state) => Object.values(state).every(Boolean),
  serialize: (state) => ({ checkedItems: state }),
  Component: EquipmentComponent,
};
