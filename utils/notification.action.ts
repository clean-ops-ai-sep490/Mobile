// src/utils/notification.action.ts

import { NavigationProp } from "@react-navigation/native";

// Khớp chính xác với payload BE đang serialize
interface AppPayload {
  type:
    | "SWAP_REQUEST"
    | "SWAP_RESPONSE"
    | "SWAP_REVIEW"
    | "ISSUE"
    | "EQUIPMENT_REQUEST"
    | "EMERGENCY_LEAVE"
    | string;

  // SWAP fields
  swapRequestId?: string;
  requesterTaskAssignmentId?: string;
  targetTaskAssignmentId?: string;
  status?: string;
  isApproved?: boolean;

  // ISSUE fields
  action?: "CREATED" | string;
  issueId?: string;
  taskAssignmentId?: string;

  // EQUIPMENT_REQUEST fields
  requestId?: string;
  workerId?: string;

  // EMERGENCY_LEAVE fields
  leaveDateFrom?: string;
  leaveDateTo?: string;
}

export const handleNotificationClick = (
  payload: AppPayload | string,
  role: "Worker" | "Supervisor",
  navigation: NavigationProp<any>,
) => {
  try {
    const parsed: AppPayload =
      typeof payload === "string" ? JSON.parse(payload || "{}") : payload;

    switch (parsed.type) {
      // ─── SWAP ────────────────────────────────────────────────────────────
      // Worker nhận: ai đó muốn đổi ca với mình
      case "SWAP_REQUEST":
        navigation.navigate("ListAllRequests", { initialTab: "swap" });
        break;

      // Worker nhận: target đã reply (chấp nhận/từ chối)
      case "SWAP_RESPONSE":
        navigation.navigate("ListAllRequests", { initialTab: "swap" });
        break;

      // Worker nhận: supervisor đã review (duyệt/từ chối)
      // Supervisor nhận: cần duyệt swap (PendingSupervisorApproval)
      case "SWAP_REVIEW":
        if (role === "Supervisor") {
          if (parsed.swapRequestId) {
            navigation.navigate("SwapRequestDetail", {
              requestId: parsed.swapRequestId,
            });
          } else {
            navigation.navigate("SwapRequestList");
          }
        } else {
          // Worker → xem danh sách request của mình
          navigation.navigate("ListAllRequests", { initialTab: "swap" });
        }
        break;

      // ─── ISSUE REPORT ────────────────────────────────────────────────────
      // Manager nhận khi worker báo lỗi task
      // (App này chỉ có Worker/Supervisor, Manager không có app → default)
      case "ISSUE":
        navigation.navigate("Home");
        break;

      // ─── EQUIPMENT REQUEST ───────────────────────────────────────────────
      // Supporter nhận — Supporter không có trong app này → default
      case "EQUIPMENT_REQUEST":
        navigation.navigate("Home");
        break;

      // ─── EMERGENCY LEAVE ─────────────────────────────────────────────────
      // Manager nhận khi worker xin nghỉ khẩn
      // Worker có thể nhận kết quả duyệt → về màn EmergencyLeave
      case "EMERGENCY_LEAVE":
        if (role === "Worker") {
          navigation.navigate("ListAllRequests", { initialTab: "emergency" }); // ✅ mở thẳng tab emergency
        } else {
          navigation.navigate("SupervisorHome");
        }
        break;

      // ─── DEFAULT ─────────────────────────────────────────────────────────
      default:
        console.log("No handler for notification type:", parsed.type);
        if (role === "Worker") {
          navigation.navigate("Home");
        } else {
          navigation.navigate("SupervisorHome");
        }
        break;
    }
  } catch (error) {
    console.error("Failed to handle notification payload:", error);
  }
};
