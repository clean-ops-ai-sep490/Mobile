// import { useAuth } from "@/contexts/AuthContext";
// import { ble } from "@/hooks/ble/bleCheckin"; // Import ble manager
// import { useBleCheckin } from "@/hooks/ble/useBleCheckin";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   PermissionsAndroid,
//   Platform,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { State as BleState } from "react-native-ble-plx";

// export default function BleScannerScreen({ route, navigation }: any) {
//   const { taskId, stepId, onResult } = route.params;
//   const { start, scanning } = useBleCheckin();
//   const { getWorkerProfile } = useAuth();
//   const [bleState, setBleState] = useState<BleState>("Unknown");

//   // 👇 Check permissions trước
//   const requestPermissions = async () => {
//     if (Platform.OS === "android") {
//       if (Platform.Version >= 31) {
//         // Android 12+
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         ]);

//         console.log("📱 Permissions granted:", granted);

//         return Object.values(granted).every(
//           (status) => status === PermissionsAndroid.RESULTS.GRANTED,
//         );
//       } else {
//         // Android < 12
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         );

//         console.log("📱 Location permission:", granted);
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       }
//     }
//     return true; // iOS
//   };

//   useEffect(() => {
//     console.log("📱 BLE SCREEN MOUNTED - taskId:", taskId, "stepId:", stepId);

//     const run = async () => {
//       // 1️⃣ Check BLE state
//       const state = await ble.state();
//       setBleState(state);
//       console.log("🔵 BLE State:", state);

//       if (state !== "PoweredOn") {
//         Alert.alert(
//           "Bluetooth chưa bật",
//           "Vui lòng bật Bluetooth để tiếp tục",
//           [{ text: "OK", onPress: () => navigation.goBack() }],
//         );
//         return;
//       }

//       // 2️⃣ Request permissions
//       const hasPermissions = await requestPermissions();
//       if (!hasPermissions) {
//         Alert.alert(
//           "Thiếu quyền truy cập",
//           "Cần cấp quyền Bluetooth và Location để quét BLE",
//           [{ text: "OK", onPress: () => navigation.goBack() }],
//         );
//         return;
//       }

//       // 3️⃣ Get worker profile
//       const profile = await getWorkerProfile();
//       const workerId = profile?.id;

//       if (!workerId) {
//         console.log("❌ missing workerId");
//         Alert.alert("Lỗi", "Không tìm thấy thông tin worker");
//         navigation.goBack();
//         return;
//       }

//       console.log("✅ Starting BLE scan with workerId:", workerId);

//       // 4️⃣ Start scan
//       start({
//         workerId,
//         taskId,
//         stepId,
//         onSuccess: (result) => {
//           console.log("✅ BLE RESULT in BleScannerScreen:", result);

//           if (onResult) {
//             onResult(result);
//           }

//           navigation.goBack();
//         },
//       });
//     };

//     run();

//     return () => {
//       console.log("🧹 BLE SCREEN UNMOUNTED");
//     };
//   }, []);

//   return (
//     <View style={s.container}>
//       <ActivityIndicator size="large" color="#0F172A" />
//       <Text style={s.text}>
//         {scanning ? "Đang quét thiết bị BLE..." : "Đang khởi động..."}
//       </Text>
//       <Text style={s.state}>Bluetooth: {bleState}</Text>
//       <Text style={s.hint}>Đảm bảo Bluetooth đã bật và đứng gần beacon</Text>
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F8FAFC",
//     padding: 20,
//   },
//   text: {
//     marginTop: 16,
//     fontSize: 16,
//     color: "#1E293B",
//     fontWeight: "600",
//   },
//   state: {
//     marginTop: 8,
//     fontSize: 14,
//     color: "#0F172A",
//     fontWeight: "500",
//   },
//   hint: {
//     marginTop: 8,
//     fontSize: 13,
//     color: "#64748B",
//   },
// });
