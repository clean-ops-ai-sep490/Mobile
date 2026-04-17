import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { bleManager } from "@/ble/bleManager";
import { isBluetoothOn } from "@/ble/bluetooth";
import { connectAndRead } from "@/ble/connector";
import { requestBlePermissions } from "@/ble/permissions";

import { useAuth } from "@/contexts/AuthContext";
import { useCheckin } from "@/hooks/useCheckin";
import { getDevicesByCheckinPoint } from "@/services/checkinService";

import { BleDeviceConfig } from "@/types/ble";

type Props = {
  route: {
    params: {
      checkinPointId: string;
      onResult: (result: any) => void;
      stepId: string;
      taskId?: string;
    };
  };
  navigation: any;
};

type DeviceItem = {
  id: string;
  name?: string;
  rssi?: number;
};

type State =
  | "loading"
  | "permission"
  | "bluetooth"
  | "scanning"
  | "connecting"
  | "verifying"
  | "error";

export default function BleScannerScreen({ route, navigation }: Props) {
  const { checkinPointId, onResult, stepId, taskId } = route.params;
  const { checkinByBle } = useCheckin();
  const { getWorkerProfile } = useAuth();

  const [state, setState] = useState<State>("loading");
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);

  const configsRef = useRef<BleDeviceConfig[]>([]);
  const isProcessing = useRef(false);

  const scanAnim = useRef(new Animated.Value(0)).current;

  // ================= ANIMATION =================
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  // ================= LOAD WORKER =================
  useEffect(() => {
    (async () => {
      try {
        const profile = await getWorkerProfile();
        setWorkerId(profile?.id ?? null);
      } catch {}
    })();
  }, []);

  // ================= START =================
  useEffect(() => {
    run();
    return cleanup;
  }, []);

  function cleanup() {
    bleManager.stopDeviceScan();
    isProcessing.current = false;
  }

  async function run() {
    try {
      setState("loading");
      setError(null);

      // 1. Fetch BLE device configs from API
      setState("loading");
      const configs = await getDevicesByCheckinPoint(checkinPointId);

      if (!configs.length) {
        throw new Error("Không có thiết bị BLE nào");
      }

      configsRef.current = configs;

      // 2. Permission
      setState("permission");
      const ok = await requestBlePermissions();
      if (!ok) throw new Error("Permission bị từ chối");

      // 3. Bluetooth
      setState("bluetooth");
      const bt = await isBluetoothOn();
      if (!bt) throw new Error("Bluetooth chưa bật");

      // 4. Scan
      startScan();
    } catch (e: any) {
      setState("error");
      setError(e.message);
    }
  }

  // ================= SCAN =================
  function startScan() {
    setState("scanning");
    setDevices([]);

    const targetUUIDs = configsRef.current
      .map((c) => c.serviceUuid)
      .filter(Boolean);

    bleManager.startDeviceScan(
      targetUUIDs.length ? targetUUIDs : null,
      { allowDuplicates: false },
      async (err, device) => {
        if (err) {
          setError(err.message);
          setState("error");
          bleManager.stopDeviceScan();
          return;
        }

        if (!device) return;

        console.log("📡 DEVICE:", {
          id: device.id,
          name: device.name,
          rssi: device.rssi,
          uuids: device.serviceUUIDs,
        });

        // Update devices list
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });

        const uuids = device.serviceUUIDs ?? [];

        // Find matching config
        const match = configsRef.current.find((c) => {
          if (!c.serviceUuid) return false;

          const normalize = (u?: string) => u?.toLowerCase();
          const uuidMatch = uuids.some(
            (u) => normalize(u) === normalize(c.serviceUuid),
          );
          const rssiOk =
            !c.rssiThreshold || (device.rssi ?? -999) >= c.rssiThreshold;

          return uuidMatch && rssiOk;
        });

        if (match && !isProcessing.current) {
          isProcessing.current = true;
          await handleConnect(device, match);
        }
      },
    );
  }

  // ================= CONNECT =================
  async function handleConnect(device: any, config: BleDeviceConfig) {
    try {
      setState("connecting");
      bleManager.stopDeviceScan();

      // Read deviceUuid from BLE
      const { token: deviceUuid } = await connectAndRead(
        device.id,
        config.serviceUuid!,
      );

      setState("verifying");

      if (!workerId) {
        throw new Error("Không xác định được worker");
      }

      // Call checkin API
      const result = await checkinByBle({
        workerId,
        checkinPointId,
        deviceUuid,
        taskId,
        taskStepId: stepId,
      });

      if (!result.valid) {
        throw new Error(result.message || "Check-in thất bại");
      }

      // Return result to parent screen
      onResult?.({
        ...result,
        deviceId: device.id,
        deviceName: device.name,
        valid: true,
      });

      setState("loading");
      navigation.goBack();
    } catch (e: any) {
      setError(e.message);
      setState("error");
      isProcessing.current = false;
    }
  }

  // ================= UI =================
  const statusText = useMemo(() => {
    switch (state) {
      case "loading":
        return "Đang tải cấu hình...";
      case "permission":
        return "Xin quyền Bluetooth...";
      case "bluetooth":
        return "Kiểm tra Bluetooth...";
      case "scanning":
        return "Đang quét thiết bị...";
      case "connecting":
        return "Đang kết nối...";
      case "verifying":
        return "Đang xác thực...";
      case "error":
        return "Có lỗi xảy ra";
      default:
        return "";
    }
  }, [state]);

  // ================= RENDER =================
  return (
    <View style={s.container}>
      <Text style={s.title}>BLE Scanner</Text>
      <Text style={s.subtitle}>{statusText}</Text>

      {/* RADAR */}
      <View style={s.radar}>
        <Animated.View
          style={[
            s.pulse,
            {
              opacity: scanAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 0],
              }),
              transform: [
                {
                  scale: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 2.5],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={s.centerDot} />
      </View>

      {/* ERROR */}
      {state === "error" && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>

          <TouchableOpacity style={s.retryBtn} onPress={run}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DEVICES */}
      <View style={s.listWrap}>
        {state === "scanning" && devices.length === 0 && <ActivityIndicator />}

        <FlatList
          data={devices}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={s.deviceItem}>
              <Text style={s.deviceName}>{item.name || "Unknown"}</Text>
              <Text style={s.deviceRssi}>RSSI: {item.rssi ?? "-"}</Text>
            </View>
          )}
        />
      </View>

      {/* CANCEL */}
      <TouchableOpacity
        style={s.cancelBtn}
        onPress={() => {
          cleanup();
          navigation.goBack();
        }}
      >
        <Text style={s.cancelText}>Huỷ</Text>
      </TouchableOpacity>
    </View>
  );
}

// ================= STYLE =================
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 16,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  subtitle: {
    color: "#94A3B8",
    marginTop: 4,
  },

  radar: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  pulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },

  centerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#22C55E",
  },

  listWrap: {
    flex: 1,
    marginTop: 10,
  },

  deviceItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#111827",
    marginBottom: 8,
  },

  deviceName: {
    color: "#fff",
    fontWeight: "600",
  },

  deviceRssi: {
    color: "#94A3B8",
    fontSize: 12,
  },

  errorBox: {
    backgroundColor: "#7F1D1D",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  errorText: {
    color: "#fff",
  },

  retryBtn: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    alignItems: "center",
  },

  retryText: {
    color: "#fff",
    fontWeight: "600",
  },

  cancelBtn: {
    padding: 14,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  cancelText: {
    color: "#fff",
    fontWeight: "600",
  },
});
