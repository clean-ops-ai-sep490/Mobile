// src/components/task/steps/CheckinStep.tsx
import { sendWorkerGps } from "@/hooks/useWorkerGps";
import { getCurrentLocation } from "@/services/workergps.service";
import { useNavigation } from "@react-navigation/native";
import React, { useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StepPlugin, StepPluginProps } from "../StepRegistry";

function CheckinComponent({ config, state, onChange }: StepPluginProps) {
  const navigation = useNavigation<any>();

  const method: string = config?.method ?? "qr";
  const checkinPointId = config?.checkinPointId;
  const identifier = config?.identifier;
  const workerId = config?.workerId;
  // const taskAssignmentId = state?.__taskAssignmentId;
  // const stepId = state?.__stepId;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stateRef = useRef(state);
  stateRef.current = state;

  const taskAssignmentId = stateRef.current?.__taskAssignmentId;
  const stepId = stateRef.current?.__stepId;

  const triggerGps = async (wId: string) => {
    try {
      const { latitude, longitude } = await getCurrentLocation();
      await sendWorkerGps(wId, latitude, longitude, true);
    } catch (err) {
      console.warn("GPS capture failed:", err);
    }
  };

  const handleAction = () => {
    console.log("method:", method);
    switch (method) {
      case "qr":
        navigation.navigate("QRScannerScreen", {
          onScanned: (result: any) => {
            if (!result?.valid) {
              Alert.alert("Lỗi", result?.message || "QR không hợp lệ");
              return;
            }

            onChangeRef.current({
              ...stateRef.current,
              checkedIn: true,
              verified: true,
              method: "qr",

              qrRaw: result.raw,
              checkinPointId: result.checkinPointId,
              workareaId: result.workareaId,
              code: result.code,

              checkinRecordId: result.checkinRecordId,
              checkinAt: result.checkinAt,
              verifiedAt: result.verifiedAt,
            });

            triggerGps(workerId);
          },
        });
        break;

      case "ble":
        navigation.navigate("BleScannerScreen", {
          taskId: taskAssignmentId,
          stepId,
          workerId,
          onResult: (bleResult: any) => {
            console.log("📱 BLE Result received in CheckinStep:", bleResult);

            if (!bleResult?.valid) {
              Alert.alert("BLE lỗi", bleResult?.message || "Không hợp lệ");
              return;
            }

            // ✅ Update state ngay
            onChangeRef.current({
              ...stateRef.current,
              checkedIn: true,
              verified: true,
              method: "ble",
              deviceId: bleResult.deviceId,
              deviceName: bleResult.deviceName,
              deviceUuid: bleResult.deviceUuid,
              checkinRecordId: bleResult.checkinRecordId,
              checkinAt: bleResult.checkinAt,
              checkinPointId: bleResult.checkinPointId,
              workareaId: bleResult.workareaId,
              code: bleResult.code,
              verifiedAt: bleResult.verifiedAt,
            });

            triggerGps(workerId);
          },
        });
        break;

      case "selfie":
        navigation.navigate("InspectionCameraScreen", {
          mode: "selfie",
          onCaptured: (photo: any) => {
            if (!photo?.uri) return;

            onChangeRef.current({
              ...stateRef.current,
              checkedIn: true,
              method: "selfie",
              photoUri: photo.uri,
              capturedAt: new Date().toISOString(),
            });

            triggerGps(workerId);
          },
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
      instruction: "Quét và kết nối thiết bị BLE gần bạn",
      btnLabel: "Mở BLE Scanner",
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

          {state.method === "ble" && (
            <>
              {state.deviceName && (
                <Text style={s.successSub}>Device: {state.deviceName}</Text>
              )}
              {state.checkinAt && (
                <Text style={s.successSub}>
                  Time: {new Date(state.checkinAt).toLocaleString("vi-VN")}
                </Text>
              )}
              {state.checkinRecordId && (
                <Text style={s.successSub}>
                  Record ID: {state.checkinRecordId}
                </Text>
              )}
            </>
          )}

          {state.method === "qr" && (
            <>
              {state.workareaId && (
                <Text style={s.successSub}>Area: {state.workareaId}</Text>
              )}
              {state.checkinAt && (
                <Text style={s.successSub}>
                  Time: {new Date(state.checkinAt).toLocaleString("vi-VN")}
                </Text>
              )}
            </>
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

    // Common fields
    checkinRecordId: state.checkinRecordId,
    checkinAt: state.checkinAt,
    checkinPointId: state.checkinPointId,
    workareaId: state.workareaId,
    code: state.code,

    // BLE specific
    deviceId: state.deviceId,
    deviceName: state.deviceName,
    deviceUuid: state.deviceUuid,

    // QR specific
    qrRaw: state.qrRaw,

    // Selfie specific
    photoUri: state.photoUri,
  }),

  Component: CheckinComponent,
};
