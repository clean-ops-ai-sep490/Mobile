import { NotificationApi } from "@/hooks/useNotification";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info"; // Cần cài react-native-device-info
import { useNotificationStore } from "../store/notification.store";

export const setupFirebaseMessaging = async (workerId?: string) => {
  // 1. Xin quyền (Chủ yếu cho iOS)
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log("User declined push notifications");
    return;
  }

  // 2. Lấy FCM Token từ Google Services
  try {
    const fcmToken = await messaging().getToken();
    const uniqueId = await DeviceInfo.getUniqueId();
    const deviceName = await DeviceInfo.getDeviceName();

    // 3. Gửi lên Backend
    await NotificationApi.registerToken({
      token: fcmToken,
      uniqueId: uniqueId,
      platform: Platform.OS === "ios" ? 1 : 0,
      deviceName: deviceName,
      workerId: workerId || null,
    });
    console.log("FCM Token registered with Server successfully");
  } catch (error) {
    console.error("Error registering FCM token:", error);
  }

  // 4. Lắng nghe tin nhắn khi App đang mở (Foreground)
  messaging().onMessage(async (remoteMessage) => {
    console.log("A new FCM message arrived!", remoteMessage);
    // Có tin mới -> Cập nhật lại số chưa đọc
    useNotificationStore.getState().fetchUnreadCount();
    // TODO: Bạn có thể show 1 cái Toast Notification nhỏ ở đây
  });
};
