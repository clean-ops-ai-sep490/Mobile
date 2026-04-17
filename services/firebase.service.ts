import messaging from "@react-native-firebase/messaging";
import { Alert, Clipboard } from "react-native";

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

    if (__DEV__) {
      Alert.alert("FCM Token", fcmToken, [
        {
          text: "Copy Token",
          onPress: () => Clipboard.setString(fcmToken),
        },
        { text: "OK" },
      ]);
    }
  } catch (error) {
    console.log(">>> FCM Error:", error);
  }
};
