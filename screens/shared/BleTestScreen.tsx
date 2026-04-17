import { bleManager } from "@/ble/bleManager";
import { requestBlePermissions } from "@/ble/permissions";
import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Device = { id: string; name: string | null; rssi: number | null };

export default function BleTestScreen() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  const startScan = async () => {
    const granted = await requestBlePermissions();
    console.log("🔐 PERMISSION:", granted);

    if (!granted) {
      console.log("❌ Permission denied");
      return;
    }

    const state = await bleManager.state();
    console.log("🧠 BLE STATE:", state);
    setDevices([]);
    seen.current.clear();
    setScanning(true);

    // null = scan ALL devices, no serviceUUID filter
    bleManager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (err, device) => {
        if (err) {
          console.warn("BLE scan error:", err.message);
          setScanning(false);
          return;
        }
        if (!device) return;
        console.log("📡 DEVICE FOUND =====");
        console.log("ID:", device.id);
        console.log("NAME:", device.name);
        console.log("LOCAL NAME:", device.localName);
        console.log("RSSI:", device.rssi);
        console.log("SERVICE UUIDS:", device.serviceUUIDs);
        console.log("MANUFACTURER DATA:", device.manufacturerData);
        console.log("=====================");
        if (seen.current.has(device.id)) return;

        seen.current.add(device.id);
        setDevices((prev) => [
          ...prev,
          { id: device.id, name: device.name, rssi: device.rssi },
        ]);
      },
    );

    // Auto stop after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
    setScanning(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>BLE Test</Text>
      <Text style={s.sub}>
        {scanning
          ? `Đang quét... (${devices.length} thiết bị)`
          : `Tìm thấy ${devices.length} thiết bị`}
      </Text>

      <TouchableOpacity
        style={[s.btn, scanning && s.btnStop]}
        onPress={scanning ? stopScan : startScan}
      >
        <Text style={s.btnText}>{scanning ? "Dừng" : "Bắt đầu quét"}</Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        style={s.list}
        ListEmptyComponent={
          <Text style={s.empty}>
            {scanning ? "Đang tìm thiết bị..." : "Chưa có thiết bị nào"}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <Text style={s.name}>{item.name ?? "(no name)"}</Text>
            <Text style={s.detail}>ID: {item.id}</Text>
            <Text style={s.detail}>RSSI: {item.rssi ?? "-"} dBm</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#94A3B8", fontSize: 13, marginBottom: 16 },
  btn: {
    backgroundColor: "#22C55E",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  btnStop: { backgroundColor: "#EF4444" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  list: { flex: 1 },
  empty: { color: "#475569", textAlign: "center", marginTop: 40 },
  item: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  name: { color: "#fff", fontWeight: "600", fontSize: 14 },
  detail: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
});
