import { PermissionsAndroid, Platform } from "react-native";

export async function requestBlePermissions() {
  if (Platform.OS !== "android") return true;

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  console.log("🔐 BLE PERMISSION RESULT:", result);

  const scan = result["android.permission.BLUETOOTH_SCAN"] === "granted";
  const connect = result["android.permission.BLUETOOTH_CONNECT"] === "granted";
  const location =
    result["android.permission.ACCESS_FINE_LOCATION"] === "granted";

  console.log("🧪 CHECK:", { scan, connect, location });

  return scan && connect && location;
}
