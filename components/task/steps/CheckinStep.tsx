// src/components/task/steps/CheckinStep.tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function CheckinComponent({ config, state, onChange }: StepPluginProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const method: string = config?.method ?? "qr";

  // ← Lắng nghe kết quả trả về từ QRScannerScreen
  useEffect(() => {
    const result = route.params?.qrResult;
    if (!result) return;

    if (!result.valid) {
      Alert.alert("Lỗi", result.message || "QR không hợp lệ");
    } else {
      onChange({
        ...state,
        checkedIn: true,
        verified: true,
        method: "qr",
        qrRaw: result.raw,
        locationId: result.locationId,
        verifiedAt: result.verifiedAt,
      });
    }

    // Clear param để tránh trigger lại khi re-render
    navigation.setParams({ qrResult: undefined });
  }, [route.params?.qrResult]);

  // ← Lắng nghe kết quả trả về từ InspectionCameraScreen (selfie)
  useEffect(() => {
    const photo = route.params?.selfieResult;
    if (!photo?.uri) return;

    onChange({
      ...state,
      checkedIn: true,
      method: "selfie",
      photoUri: photo.uri,
      capturedAt: new Date().toISOString(),
    });

    navigation.setParams({ selfieResult: undefined });
  }, [route.params?.selfieResult]);

  const handleAction = () => {
    switch (method) {
      case "qr":
        navigation.navigate("QRScannerScreen", {
          returnScreen: route.name,
        });
        break;

      case "ble":
        Alert.alert("Bluetooth Check-in", "Đang tìm thiết bị BLE gần đây...", [
          {
            text: "Kết nối",
            onPress: () =>
              onChange({
                ...state,
                checkedIn: true,
                method: "ble",
                deviceId: "BLE-DEV-001",
              }),
          },
          { text: "Huỷ", style: "cancel" },
        ]);
        break;

      case "selfie":
        navigation.navigate("InspectionCameraScreen", {
          mode: "selfie",
          returnScreen: route.name,
        });
        break;

      default:
        Alert.alert("Không hỗ trợ method này");
    }
  };

  const methodMeta: Record<
    string,
    { label: string; instruction: string; btnLabel: string }
  > = {
    qr: {
      label: "QR Code",
      instruction: "Quét mã QR tại khu vực làm việc",
      btnLabel: "Mở QR Scanner",
    },
    ble: {
      label: "Bluetooth",
      instruction: "Kết nối với thiết bị BLE gần đây",
      btnLabel: "Tìm thiết bị BLE",
    },
    selfie: {
      label: "Selfie Check-in",
      instruction:
        "Chụp ảnh khuôn mặt để xác nhận bạn đang tại vị trí làm việc",
      btnLabel: "Mở Camera",
    },
  };

  const meta = methodMeta[method] ?? methodMeta.qr;

  return (
    <View>
      <View style={s.methodBadge}>
        <Text style={s.methodText}>{meta.label}</Text>
      </View>

      <Text style={s.instruction}>{meta.instruction}</Text>

      {state.checkedIn ? (
        <View style={s.success}>
          <Text style={s.successText}>✓ Đã check-in thành công</Text>

          {state.method === "qr" && (
            <>
              {state.locationId && (
                <Text style={s.successSub}>Location: {state.locationId}</Text>
              )}
              {state.verifiedAt && (
                <Text style={s.successSub}>Time: {state.verifiedAt}</Text>
              )}
            </>
          )}

          {state.method === "ble" && state.deviceId && (
            <Text style={s.successSub}>Device: {state.deviceId}</Text>
          )}

          {state.method === "selfie" && state.photoUri && (
            <Text style={s.successSub}>Selfie captured ✓</Text>
          )}
        </View>
      ) : (
        <TouchableOpacity style={s.btn} onPress={handleAction}>
          <Text style={s.btnText}>{meta.btnLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  methodBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  methodText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  instruction: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  btn: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  success: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  successText: { color: "#166534", fontWeight: "600", fontSize: 14 },
  successSub: { color: "#15803D", fontSize: 12 },
});

export const CheckinStepPlugin: StepPlugin = {
  type: "checkin",
  label: "Check-in",
  detect: (config) => config?.["x-behavior"] === "checkin",
  buildInitialState: () => ({ checkedIn: false }),
  isFulfilled: (state) => !!state.checkedIn,
  serialize: (state) => ({
    checkedIn: state.checkedIn,
    method: state.method,
    photoUri: state.photoUri,
    qrRaw: state.qrRaw,
    locationId: state.locationId,
  }),
  Component: CheckinComponent,
};
