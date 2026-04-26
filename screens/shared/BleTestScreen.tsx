// // TestBleScreen.tsx
// import { ble } from "@/hooks/ble/bleCheckin";
// import React, { useState } from "react";
// import {
//     Button,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     Text,
//     View,
// } from "react-native";

// export default function BleTestScreen() {
//   const [devices, setDevices] = useState<any[]>([]);
//   const [scanning, setScanning] = useState(false);
//   const [countdown, setCountdown] = useState(0);

//   const startScan = () => {
//     setDevices([]);
//     setScanning(true);
//     setCountdown(5);

//     const seen = new Set<string>();

//     ble.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
//       if (err || !device || seen.has(device.id)) return;

//       seen.add(device.id);

//       setDevices((prev) => [
//         ...prev,
//         {
//           id: device.id,
//           name: device.name || "Unknown",
//           rssi: device.rssi,
//           manufacturerData: device.manufacturerData,
//         },
//       ]);
//     });

//     // Countdown timer
//     const interval = setInterval(() => {
//       setCountdown((c) => {
//         if (c <= 1) {
//           clearInterval(interval);
//           ble.stopDeviceScan();
//           setScanning(false);
//           return 0;
//         }
//         return c - 1;
//       });
//     }, 1000);
//   };

//   return (
//     <View style={s.container}>
//       <Button
//         title={
//           scanning ? `Đang quét... ${countdown}s` : "Bắt đầu quét BLE (5s)"
//         }
//         onPress={startScan}
//         disabled={scanning}
//       />

//       <Text style={s.title}>Tìm thấy {devices.length} thiết bị:</Text>

//       <ScrollView style={s.list}>
//         {devices.map((d, i) => (
//           <View key={d.id} style={s.item}>
//             <Text style={s.itemTitle}>
//               #{i + 1} {d.name}
//               <Text style={s.rssi}> ({d.rssi} dBm)</Text>
//             </Text>
//             <Text style={s.itemDetail} numberOfLines={1}>
//               ID: {d.id}
//             </Text>
//             <Text style={s.itemDetail}>
//               Manufacturer Data: {d.manufacturerData ? "✅ Có" : "❌ Không"}
//             </Text>
//             {d.manufacturerData && (
//               <Text style={s.itemData} numberOfLines={1}>
//                 {d.manufacturerData.substring(0, 50)}...
//               </Text>
//             )}
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: "#F8FAFC" },
//   title: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginVertical: 16,
//     color: "#0F172A",
//   },
//   list: { flex: 1 },
//   item: {
//     backgroundColor: "#FFF",
//     padding: 12,
//     marginBottom: 8,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//   },
//   itemTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
//   rssi: { fontSize: 12, fontWeight: "400", color: "#64748B" },
//   itemDetail: { fontSize: 12, color: "#64748B", marginTop: 4 },
//   itemData: {
//     fontSize: 10,
//     color: "#94A3B8",
//     marginTop: 4,
//     fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
//   },
// });
