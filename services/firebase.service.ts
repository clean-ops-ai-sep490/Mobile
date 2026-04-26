import { NotificationApi } from "@/hooks/useNotification";
import { useNotificationStore } from "@/store/notification.store";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

export const setupFirebaseMessaging = async (workerId?: string) => {
  console.log(">>> setupFirebaseMessaging called");

  const authStatus = await messaging().requestPermission();
  console.log(">>> authStatus:", authStatus);

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  console.log(">>> enabled:", enabled);

  if (!enabled) {
    console.log(">>> User declined push notifications");
    return;
  }

  try {
    console.log(">>> Getting FCM token...");
    const fcmToken = await messaging().getToken();
    console.log(">>> FCM TOKEN:", fcmToken);

    // Prepare minimal device info for backend registration
    const platformMap =
      Platform.OS === "android" ? 0 : Platform.OS === "ios" ? 1 : 2;
    const uniqueId = `${Platform.OS}-${(fcmToken || "").slice(0, 8)}`;

    // Register token to backend (best-effort)
    try {
      await NotificationApi.registerToken({
        token: fcmToken,
        uniqueId,
        platform: platformMap,
        deviceName: Platform.OS,
        workerId: workerId ?? null,
      });
      console.log(">>> Registered FCM token to backend");
    } catch (regErr) {
      console.error(">>> Failed to register token:", regErr);
    }

    // Refresh unread count in app store when new message arrives
    try {
      useNotificationStore.getState().fetchUnreadCount();
    } catch (e) {
      // ignore if store not available
    }

    // Foreground message handler
    const unsubscribeOnMessage = messaging().onMessage(
      async (remoteMessage) => {
        console.log(">>> Foreground message:", remoteMessage);
        try {
          useNotificationStore.getState().fetchUnreadCount();
        } catch (e) {}
      },
    );

    // Handle when a notification opens the app from background
    const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log(">>> Notification opened (background):", remoteMessage);
        try {
          useNotificationStore.getState().fetchUnreadCount();
        } catch (e) {}
        // TODO: perform navigation handling in a component-level handler
      },
    );

    // Handle when the app is opened from a quit state by a notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log(
        ">>> App opened from quit by notification:",
        initialNotification,
      );
      try {
        useNotificationStore.getState().fetchUnreadCount();
      } catch (e) {}
    }

    // Return a cleanup helper (optional for caller)
    return {
      unsubscribe: () => {
        try {
          unsubscribeOnMessage();
        } catch (e) {}
        try {
          unsubscribeOnNotificationOpened();
        } catch (e) {}
      },
    };
  } catch (error) {
    console.log(">>> FCM Error:", error);
  }
};
