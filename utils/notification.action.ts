import { NavigationProp } from "@react-navigation/native";

interface AppPayload {
  type: string;
  referenceId?: string;
  [key: string]: any;
}

export const handleNotificationClick = (
  payloadString: string,
  role: "Worker" | "Supervisor",
  navigation: NavigationProp<any>,
) => {
  try {
    const payload: AppPayload = JSON.parse(payloadString || "{}");

    switch (payload.type) {
      case "NEW_TASK":
        if (role === "Worker") {
          navigation.navigate("WorkerTaskDetail", {
            taskId: payload.referenceId,
          });
        } else {
          navigation.navigate("SupervisorTaskTracking", {
            taskId: payload.referenceId,
          });
        }
        break;
      case "QUALITY_ISSUE":
        navigation.navigate("QualityReportDetail", {
          reportId: payload.referenceId,
        });
        break;
      default:
        console.log(
          "No specific action for this notification type:",
          payload.type,
        );
        // Có thể navigate tới màn hình mặc định
        break;
    }
  } catch (error) {
    console.error("Failed to parse notification payload:", error);
  }
};
