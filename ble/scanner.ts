import { BleDeviceConfig } from "@/types/ble";
import { bleManager } from "./bleManager";

export function scanDevice(
  configs: BleDeviceConfig[],
  onFound: (device: any, config: BleDeviceConfig) => void,
  onError: (msg: string) => void,
) {
  const targetUUIDs = configs.map((c) => c.serviceUuid).filter(Boolean);

  let scanTimeout: NodeJS.Timeout | null = null;
  let hasFoundDevice = false;

  const cleanup = () => {
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      scanTimeout = null;
    }
    bleManager.stopDeviceScan();
  };

  bleManager.startDeviceScan(
    targetUUIDs.length ? targetUUIDs : null,
    { allowDuplicates: false },
    (error, device) => {
      if (error) {
        cleanup();
        if (!hasFoundDevice) {
          onError(error.message);
        }
        return;
      }

      if (!device || hasFoundDevice) return;

      console.log("📡 DEVICE:", {
        id: device.id,
        name: device.name,
        rssi: device.rssi,
        uuids: device.serviceUUIDs,
      });

      const uuids = device.serviceUUIDs ?? [];

      const match = configs.find((c) => {
        if (!c.serviceUuid) return false;

        const normalize = (u?: string) => u?.toLowerCase();

        const uuidMatch = uuids.some(
          (u) => normalize(u) === normalize(c.serviceUuid),
        );

        const rssiOk =
          !c.rssiThreshold || (device.rssi ?? -999) >= c.rssiThreshold;

        return uuidMatch && rssiOk;
      });

      if (match) {
        console.log("🎯 MATCH FOUND:", match.serviceUuid);

        hasFoundDevice = true;
        cleanup();

        setTimeout(() => {
          onFound(device, match);
        }, 300);
      }
    },
  );

  scanTimeout = setTimeout(() => {
    cleanup();
    if (!hasFoundDevice) {
      onError("Không tìm thấy thiết bị");
    }
  }, 10000);
}
