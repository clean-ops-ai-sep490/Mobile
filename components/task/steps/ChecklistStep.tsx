// src/components/task/steps/ChecklistStep.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function ChecklistComponent({ config, state, onChange }: StepPluginProps) {
  const items: string[] = config?.items ?? [];
  const toggle = (item: string) => onChange({ ...state, [item]: !state[item] });
  const doneCount = items.filter((item) => state[item]).length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>
          Hoàn thành checklist — {doneCount}/{items.length}
        </Text>
      </View>

      <View style={s.list}>
        {items.map((item) => {
          const isChecked = state[item];
          return (
            <TouchableOpacity
              key={item}
              style={[s.row, isChecked && s.rowDone]}
              onPress={() => toggle(item)}
              activeOpacity={0.7}
            >
              <View style={[s.box, isChecked && s.boxDone]}>
                {isChecked && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <Text style={[s.text, isChecked && s.textDone]}>{item}</Text>
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

export const ChecklistStepPlugin: StepPlugin = {
  type: "checklist",
  label: "Danh sách kiểm tra",
  detect: (config) => config?.["x-behavior"] === "checklist",
  buildInitialState: (config) =>
    Object.fromEntries((config.items as string[]).map((item) => [item, false])),
  isFulfilled: (state) =>
    Object.values(state).length > 0 && Object.values(state).every(Boolean),
  serialize: (state) => ({ checklistDone: state }),
  Component: ChecklistComponent,
};
