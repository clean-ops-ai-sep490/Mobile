// src/components/task/steps/EquipmentStep.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function EquipmentComponent({ config, state, onChange }: StepPluginProps) {
  const items: { id: string; name: string }[] = config?.requiredEquipment ?? [];
  const toggle = (id: string) => onChange({ ...state, [id]: !state[id] });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>
          Hãy chắc chắn tất cả thiết bị yêu cầu đều sẵn sàng !
        </Text>
      </View>

      <View style={s.list}>
        {items.map((eq) => {
          const isChecked = state[eq.id];
          return (
            <TouchableOpacity
              key={eq.id}
              style={[s.row, isChecked && s.rowDone]}
              onPress={() => toggle(eq.id)}
              activeOpacity={0.7}
            >
              <View style={[s.box, isChecked && s.boxDone]}>
                {isChecked && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <Text style={[s.text, isChecked && s.textDone]}>{eq.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  list: {
    gap: 8,
  },
  // ─── Row Styles ──────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rowDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  // ─── Checkbox Styles ─────────────────────────
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  boxDone: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  // ─── Text Styles ─────────────────────────────
  text: {
    fontSize: 15,
    color: "#1E293B",
    flex: 1,
    fontWeight: "500",
  },
  textDone: {
    color: "#166534",
    fontWeight: "600",
  },
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
