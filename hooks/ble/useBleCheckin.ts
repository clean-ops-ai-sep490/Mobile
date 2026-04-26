// import axiosInstance from "@/config/axiosInstance";
// import { useState } from "react";
// import { startBleScan, stopBleScan } from "./bleCheckin";

// const BLE_TIMEOUT = 15000; // 👈 15 giây

// export function useBleCheckin() {
//   const [scanning, setScanning] = useState(false);

//   const start = (params: {
//     workerId: string;
//     taskId?: string;
//     stepId?: string;
//     onSuccess: (result: any) => void;
//   }) => {
//     setScanning(true);
//     console.log("🚀 BLE START - Scanning for 15s...");

//     const timeoutId = setTimeout(() => {
//       console.log("⏱️ BLE TIMEOUT after 15s");
//       stopBleScan();
//       setScanning(false);
//       params.onSuccess({
//         valid: false,
//         message:
//           "Không tìm thấy thiết bị BLE trong 15s. Hãy kiểm tra lại beacon.",
//       });
//     }, BLE_TIMEOUT);

//     startBleScan(async (b) => {
//       console.log("🎯 MATCHED BEACON:", b);
//       clearTimeout(timeoutId);

//       try {
//         console.log("📡 Calling API...");
//         const res = await axiosInstance.post("/CheckinRecords/checkin", {
//           workerId: params.workerId,
//           deviceUuid: b.uuid,
//           taskId: params.taskId ?? null,
//           taskStepId: params.stepId ?? null,
//           notes: "BLE check-in",
//         });

//         console.log("✅ API SUCCESS:", res.data);
//         stopBleScan();
//         setScanning(false);

//         params.onSuccess({
//           valid: true,
//           deviceId: b.deviceId,
//           deviceName: b.deviceName,
//           deviceUuid: b.uuid,
//           checkinRecordId: res.data.id,
//           checkinAt: res.data.checkinAt,
//           checkinPointId: res.data.checkinPointId,
//           workareaId: res.data.workareaId,
//           code: res.data.code,
//           verifiedAt: res.data.verifiedAt,
//         });
//       } catch (e: any) {
//         console.log("❌ API ERROR:", e?.response?.data || e.message);
//         stopBleScan();
//         setScanning(false);

//         params.onSuccess({
//           valid: false,
//           message: e?.response?.data?.message || "BLE check-in API failed",
//         });
//       }
//     });
//   };

//   return { start, scanning };
// }
