import { decode as atob } from "base-64";
import { bleManager } from "./bleManager";

const CHAR_UUID = "00000726-0000-1000-8000-00805f9b34fb"; // notify char

export async function connectAndRead(deviceId: string, serviceUuid: string) {
  const device = await bleManager.connectToDevice(deviceId);
  await device.discoverAllServicesAndCharacteristics();

  console.log("🔗 CONNECTED:", deviceId);

  return new Promise<{ device: any; token: string }>((resolve, reject) => {
    let timeout: NodeJS.Timeout | null = null;
    let sub: any;

    const cleanup = async () => {
      sub?.remove();
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      await device.cancelConnection().catch(() => {});
    };

    sub = device.monitorCharacteristicForService(
      serviceUuid,
      CHAR_UUID,
      async (error, characteristic) => {
        if (error) {
          console.log("❌ MONITOR ERROR:", error);
          await cleanup();
          reject(error);
          return;
        }

        const value = characteristic?.value;
        if (!value) return;

        const token = atob(value);
        console.log("🔑 TOKEN received:", token);

        await cleanup();
        resolve({ device, token });
      },
    );

    timeout = setTimeout(async () => {
      await cleanup();
      reject(new Error("Timeout waiting BLE notify"));
    }, 15000);
  });
}
