// hooks/useCheckPpe.ts
import axiosInstance from "@/config/axiosInstance"; // chỉnh theo path project
import { SIGNALR_URL } from "@/constants/signalr";
import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PpeCheckStatus = "IDLE" | "PENDING" | "PASS" | "FAIL" | "ERROR";

export interface PpeRequiredItem {
  actionKey: string;
  name: string;
}

export interface PpeDetectedItem {
  actionKey: string;
  name: string;
  confidence: number;
  imageIndex: number;
}

export interface PpeFailedImage {
  imageUrl: string;
  imageIndex: number;
  error: string;
}

export interface PpeCheckResult {
  taskStepExecutionId: string;
  sopStepId: string;
  stepOrder: number;
  checkedAt: string;
  status: PpeCheckStatus;
  message: string;
  requiredPPE: PpeRequiredItem[];
  imageUrls: string[];
  detectedItems: PpeDetectedItem[];
  missingItems: PpeRequiredItem[];
  failedImages: PpeFailedImage[];
}

// SignalR payload từ BE: ppe-check-updated
interface PpeSignalRPayload {
  taskStepExecutionId: string;
  status: string;
  message: string;
  missingItems: string[]; // BE gửi mảng actionKey string
  at: string;
}

interface UseCheckPpeOptions {
  /** URL hub SignalR, mặc định /hubs/compliance */
  hubUrl?: string;
}

interface UseCheckPpeReturn {
  /** Trạng thái hiện tại của lần check gần nhất */
  status: PpeCheckStatus;
  /** Kết quả đầy đủ từ API (có ngay sau khi gọi requestPpeCheck) */
  result: PpeCheckResult | null;
  /** Đang gọi API */
  isRequesting: boolean;
  /** SignalR đã connect chưa */
  isConnected: boolean;
  /** Gọi API POST ppe-check */
  requestPpeCheck: () => Promise<void>;
  /** Reset về IDLE (dùng khi chụp lại ảnh) */
  reset: () => void;
}

const HUB_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export function useCheckPpe(
  stepExecutionId: string,
  options?: UseCheckPpeOptions,
): UseCheckPpeReturn {
  const hubUrl = options?.hubUrl ?? `${HUB_BASE}/hubs/compliance`;

  const [status, setStatus] = useState<PpeCheckStatus>("IDLE");
  const [result, setResult] = useState<PpeCheckResult | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // ─── Khởi tạo SignalR connection ───────────────────────────────────────────
  useEffect(() => {
    if (!stepExecutionId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    const startConnection = async () => {
      try {
        await connection.start();
        setIsConnected(true);

        // Join vào group PPE của step này
        await connection.invoke("JoinPpeCheck", stepExecutionId);
        console.log("✅ Joined PPE group:", stepExecutionId);
      } catch (err) {
        console.warn("[useCheckPpe] SignalR connect failed:", err);
        setIsConnected(false);
      }
    };

    // Lắng nghe event từ BE
    connection.on("ppe-check-updated", (payload: PpeSignalRPayload) => {
      if (payload.taskStepExecutionId !== stepExecutionId) return;

      const normalizedStatus = (payload.status?.toUpperCase() ??
        "ERROR") as PpeCheckStatus;

      setStatus(normalizedStatus);

      // Merge thêm thông tin signalR vào result hiện tại
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: normalizedStatus,
          message: payload.message ?? prev.message,
          // missingItems từ signalR là string[], map sang PpeRequiredItem[]
          missingItems: (payload.missingItems ?? []).map((key) => {
            // Tìm trong requiredPPE để lấy name đẹp
            const found = prev.requiredPPE.find(
              (r) => r.actionKey.toLowerCase() === key.toLowerCase(),
            );
            return found ?? { actionKey: key, name: key };
          }),
        };
      });
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      // Rejoin group sau khi reconnect
      connection.invoke("JoinPpeCheck", stepExecutionId).catch(console.warn);
    });

    connection.onclose(() => setIsConnected(false));

    startConnection();

    return () => {
      connection
        .invoke("LeavePpeCheck", stepExecutionId)
        .catch(() => {})
        .finally(() => {
          connection.stop();
          setIsConnected(false);
        });
    };
  }, [stepExecutionId, hubUrl]);

  // ─── Gọi API ppe-check ─────────────────────────────────────────────────────
  const requestPpeCheck = async () => {
    if (!stepExecutionId) return;
    if (status === "PENDING") return; // Tránh double-submit

    try {
      setIsRequesting(true);
      setStatus("PENDING");

      const response = await axiosInstance.post<PpeCheckResult>(
        `/TaskStepExecutions/${stepExecutionId}/ppe-check`,
      );

      const data = response.data;
      setResult(data);

      // Status từ API lúc này thường là PENDING, nhưng cứ sync lại
      const apiStatus = (data.status?.toUpperCase() ??
        "PENDING") as PpeCheckStatus;
      setStatus(apiStatus);
    } catch (err: any) {
      setStatus("ERROR");
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err?.message ??
        "Không thể gửi yêu cầu kiểm tra PPE.";
      setResult((prev) =>
        prev ? { ...prev, status: "ERROR", message: msg } : null,
      );
      throw err; // Để component xử lý Alert nếu muốn
    } finally {
      setIsRequesting(false);
    }
  };

  const reset = () => {
    setStatus("IDLE");
    setResult(null);
  };

  return {
    status,
    result,
    isRequesting,
    isConnected,
    requestPpeCheck,
    reset,
  };
}
