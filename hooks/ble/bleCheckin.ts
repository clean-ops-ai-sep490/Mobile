// import { Buffer } from "buffer";
// import { BleManager } from "react-native-ble-plx";

// export const ble = new BleManager();

// const TARGET = {
//   uuid: "fda50693-a4e2-4fb1-afcf-c6eb07647825",
//   major: 1,
//   minor: 2,
// };

// function formatUuid(hex: string) {
//   return [
//     hex.slice(0, 8),
//     hex.slice(8, 12),
//     hex.slice(12, 16),
//     hex.slice(16, 20),
//     hex.slice(20),
//   ].join("-");
// }

// function parseIBeacon(base64: string) {
//   try {
//     const b = Buffer.from(base64, "base64");

//     for (let i = 0; i < b.length - 25; i++) {
//       // Apple company ID + iBeacon type
//       if (
//         b[i] === 0x4c &&
//         b[i + 1] === 0x00 &&
//         b[i + 2] === 0x02 &&
//         b[i + 3] === 0x15
//       ) {
//         const uuid = formatUuid(b.slice(i + 4, i + 20).toString("hex"));

//         return {
//           uuid,
//           major: b.readUInt16BE(i + 20),
//           minor: b.readUInt16BE(i + 22),
//         };
//       }
//     }

//     return null;
//   } catch (e) {
//     console.log("parse error", e);
//     return null;
//   }
// }

// function isValid(beacon: any, rssi?: number) {
//   return (
//     beacon?.uuid === TARGET.uuid &&
//     beacon.major === TARGET.major &&
//     beacon.minor === TARGET.minor &&
//     (rssi ?? -999) > -85
//   );
// }

// export function startBleScan(onSuccess: (data: any) => void) {
//   let locked = false;
//   const foundDevices = new Set<string>(); // 👈 Track unique devices

//   console.log("🔵 Starting BLE scan (one-time discovery)...");
//   console.log("🎯 Target:", TARGET);

//   ble.startDeviceScan(
//     null,
//     {
//       allowDuplicates: false, // 👈 Không duplicate
//       scanMode: 2,
//     },
//     (err, device) => {
//       if (err) {
//         console.log("❌ Scan error:", err);
//         return;
//       }

//       if (!device || foundDevices.has(device.id)) return;
//       console.log("RAW MFR BASE64:", device.manufacturerData);
//       console.log("RAW NAME:", device.name);
//       console.log("SERVICE DATA:", device.serviceData);
//       console.log("SERVICE UUIDS:", device.serviceUUIDs);

//       foundDevices.add(device.id);

//       // 👇 Log ngắn gọn
//       const info = {
//         id: device.id,
//         name: device.name || "Unknown",
//         rssi: device.rssi,
//         hasMfrData: !!device.manufacturerData,
//       };

//       console.log(
//         `📱 [${foundDevices.size}] ${info.name} | RSSI: ${info.rssi} | Mfr: ${info.hasMfrData ? "✅" : "❌"}`,
//       );

//       if (!device.manufacturerData) return;

//       const beacon = parseIBeacon(device.manufacturerData);

//       if (beacon) {
//         console.log(
//           `  🔷 iBeacon: UUID=${beacon.uuid.slice(0, 8)}... Major=${beacon.major} Minor=${beacon.minor}`,
//         );

//         const payload = {
//           ...beacon,
//           rssi: device.rssi,
//           deviceId: device.id,
//           deviceName: device.name || "Unknown",
//         };

//         if (isValid(payload, device.rssi)) {
//           if (locked) return;

//           locked = true;
//           console.log(`  ✅✅✅ TARGET FOUND! ${device.name}`);
//           ble.stopDeviceScan();
//           onSuccess(payload);
//         }
//       }
//     },
//   );
// }

// export function stopBleScan() {
//   console.log("🛑 Stopping BLE scan");
//   ble.stopDeviceScan();
// }
