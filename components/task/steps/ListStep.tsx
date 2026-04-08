// src/components/task/steps/ListStep.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function ListComponent({ config, state, onChange }: StepPluginProps) {
  const items: string[] = config?.items ?? [];

  return (
    <View>
      <Text style={s.instruction}>Đọc kỹ danh sách bên dưới và xác nhận</Text>

      <View style={s.listBox}>
        {items.map((item, index) => (
          <View
            key={index}
            style={[s.listRow, index < items.length - 1 && s.listRowBorder]}
          >
            <View style={s.bullet} />
            <Text style={s.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[s.confirmBtn, state.confirmed && s.confirmBtnDone]}
        onPress={() => onChange({ confirmed: !state.confirmed })}
      >
        <View style={[s.confirmCheck, state.confirmed && s.confirmCheckDone]}>
          {state.confirmed && <Text style={s.confirmCheckMark}>✓</Text>}
        </View>
        <Text style={[s.confirmText, state.confirmed && s.confirmTextDone]}>
          {state.confirmed ? "Đã xác nhận" : "Xác nhận đã đọc"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  instruction: { fontSize: 13, color: "#64748B", marginBottom: 10 },
  listBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 14,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: "#FAFAFA",
  },
  listRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
    marginTop: 5,
  },
  listText: { fontSize: 14, color: "#1E293B", flex: 1, lineHeight: 20 },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
  },
  confirmBtnDone: {
    borderColor: "#166534",
    backgroundColor: "#DCFCE7",
  },
  confirmCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCheckDone: {
    backgroundColor: "#166534",
    borderColor: "#166534",
  },
  confirmCheckMark: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  confirmText: { fontSize: 14, color: "#475569", fontWeight: "500" },
  confirmTextDone: { color: "#166534" },
});

export const ListStepPlugin: StepPlugin = {
  type: "list",
  label: "Danh sách xác nhận",
  detect: (config) => config?.["x-behavior"] === "list",
  buildInitialState: () => ({ confirmed: false }),
  isFulfilled: (state) => !!state.confirmed,
  serialize: (state) => ({ confirmed: state.confirmed }),
  Component: ListComponent,
};
