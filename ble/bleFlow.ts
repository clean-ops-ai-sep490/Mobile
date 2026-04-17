import {
  getDevicesByCheckinPoint,
  verifyBleToken,
} from "@/services/checkinService";
import { isBluetoothOn } from "./bluetooth";
import { connectAndRead } from "./connector";
import { requestBlePermissions } from "./permissions";
import { scanDevice } from "./scanner";

export async function runBleCheckin(checkinPointId: string) {
  const configs = await getDevicesByCheckinPoint(checkinPointId);

  await requestBlePermissions();

  const bt = await isBluetoothOn();
  if (!bt) throw new Error("Bluetooth off");

  return new Promise((resolve, reject) => {
    scanDevice(
      configs,
      async (device, config) => {
        try {
          const { token } = await connectAndRead(
            device.id,
            config.serviceUuid!,
          );
          const res = await verifyBleToken(token);

          resolve({
            ...res,
            deviceId: device.id,
            deviceName: device.name || "Unknown BLE",
          });
        } catch (e) {
          reject(e);
        }
      },
      reject,
    );
  });
}
