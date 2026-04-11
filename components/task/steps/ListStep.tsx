// src/components/task/steps/ListStep.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function ListComponent({ config, state, onChange }: StepPluginProps) {
  const items: string[] = config?.items ?? [];
  const isConfirmed = state.confirmed;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>Đọc kỹ danh sách bên dưới và xác nhận</Text>
      </View>

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
        style={[s.row, isConfirmed && s.rowDone]}
        onPress={() => onChange({ confirmed: !isConfirmed })}
        activeOpacity={0.7}
      >
        <View style={[s.box, isConfirmed && s.boxDone]}>
          {isConfirmed && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <Text style={[s.text, isConfirmed && s.textDone]}>
          {isConfirmed ? "Đã xác nhận" : "Xác nhận đã đọc"}
        </Text>
      </TouchableOpacity>
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
  // ─── List Box Styles (Read-only) ─────────────
  listBox: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 16, // Cách một khoảng so với nút xác nhận
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  listRowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#F1F5F9", // Màu viền ngăn cách nhạt hơn viền ngoài
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
    marginTop: 7, // Căn giữa theo dòng text đầu tiên
  },
  listText: {
    fontSize: 14.5,
    color: "#334155",
    flex: 1,
    lineHeight: 22,
  },
  // ─── Confirm Button Styles (Đồng bộ Checklist) ─
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

export const ListStepPlugin: StepPlugin = {
  type: "list",
  label: "Danh sách xác nhận",
  detect: (config) => config?.["x-behavior"] === "list",
  buildInitialState: () => ({ confirmed: false }),
  isFulfilled: (state) => !!state.confirmed,
  serialize: (state) => ({ confirmed: state.confirmed }),
  Component: ListComponent,
};
