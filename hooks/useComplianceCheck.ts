// hooks/useComplianceCheck.ts
//
// Cài package trước khi dùng:
//   npm install @microsoft/signalr
//
// Cấu hình URL trong .env:
//   EXPO_PUBLIC_SIGNALR_URL=ws://localhost:5000/hubs/compliance     ← docker  (default)
//   EXPO_PUBLIC_SIGNALR_URL=wss://localhost:7298/hubs/compliance    ← dotnet

import { SIGNALR_URL } from "@/constants/signalr";
import axiosInstance from "@/lib/axios";
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplianceStatus =
  | "Pending"
  | "Processing"
  | "Passed"
  | "PendingSupervisor"
  | "Failed";

export interface ComplianceCheckStatusResponse {
  complianceCheckId: string;
  taskStepExecutionId: string;
  status: ComplianceStatus;
  minScore: number;
  failedImageCount: number;
  updatedAt?: string;
}

/** Payload SignalR push về — map với ComplianceCheckNotification của BE */
interface SignalRNotification {
  complianceCheckId: string;
  taskStepExecutionId: string;
  status: string;
  checkedBy: string;
  minScore: number;
  failedImageCount: number;
  action: string;
  at: string;
}

interface InitiateAiCheckResult {
  complianceCheckId: string;
  type: string;
  status: ComplianceStatus;
  created: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PENDING_STATUSES: ComplianceStatus[] = [
  "Pending",
  "Processing",
  "PendingSupervisor",
];
const POLL_INTERVAL_MS = 1_000; // 1s
const MAX_POLL_ATTEMPTS = 999; // 30 × 1s = 30 seconds (faster dev feedback)
const POLL_INTERVAL_SUPERVISOR_MS = 5_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComplianceCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [result, setResult] = useState<ComplianceCheckStatusResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<HubConnection | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const activeExecutionRef = useRef<string | null>(null);
  const statusRef = useRef<ComplianceStatus | null>(null);

  // Mỗi khi setStatus thì đồng thời cập nhật ref:
  const _setStatus = (s: ComplianceStatus | null) => {
    statusRef.current = s;
    setStatus(s);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      _teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const _cancelPoll = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
    pollAttemptsRef.current = 0;
  };

  const _teardown = () => {
    _cancelPoll();
    const conn = connectionRef.current;
    if (conn && conn.state !== HubConnectionState.Disconnected) {
      console.log(
        "[useComplianceCheck] _teardown called. activeExecution=",
        activeExecutionRef.current,
      );
      // Rời group trước khi disconnect (phải đọc ref trước khi null nó)
      if (activeExecutionRef.current) {
        conn
          .invoke("LeaveExecution", activeExecutionRef.current)
          .catch(() => {});
      }
      conn.stop().catch(() => {});
    }
    connectionRef.current = null;
    activeExecutionRef.current = null;
    console.log(
      "[useComplianceCheck] teardown complete. connection cleared, activeExecution cleared",
    );
  };

  /** Áp kết quả terminal: cập nhật state, dừng poll + SignalR */
  const _applyResult = useCallback((data: ComplianceCheckStatusResponse) => {
    if (!isMountedRef.current) return;
    _cancelPoll();
    setStatus(data.status);
    setResult(data);
    setIsChecking(false);
  }, []);

  // ─── Polling fallback ────────────────────────────────────────────────────────

  const _poll = useCallback(
    async (executionId: string) => {
      if (!isMountedRef.current) return;
      if (activeExecutionRef.current !== executionId) return;

      pollAttemptsRef.current += 1;

      // Chỉ giới hạn attempt trong giai đoạn AI thuần (Pending/Processing)
      // Khi đã PendingSupervisor thì poll vô hạn với interval chậm hơn
      const isWaitingForAi =
        statusRef.current === null ||
        statusRef.current === "Pending" ||
        statusRef.current === "Processing";

      if (isWaitingForAi && pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        if (isMountedRef.current) {
          setError("AI scoring mất quá nhiều thời gian. Vui lòng thử lại.");
          setIsChecking(false);
        }
        return;
      }

      console.log(
        `[useComplianceCheck] poll attempt ${pollAttemptsRef.current} for ${executionId}`,
      );

      try {
        const { data } = await axiosInstance.get<ComplianceCheckStatusResponse>(
          `/ComplianceChecks/task-step-executions/${executionId}`,
        );

        if (!isMountedRef.current || activeExecutionRef.current !== executionId)
          return;

        setStatus(data.status);
        setResult(data);

        if (data.status === "Passed" || data.status === "Failed") {
          // ── Terminal: dừng hẳn ────────────────────────────────────────
          _teardown();
          setIsChecking(false);
        } else if (data.status === "PendingSupervisor") {
          // ── Chờ supervisor: poll chậm hơn, GIỮ isChecking=false ──────
          // isChecking=false để UI không hiển thị spinner "AI đang kiểm tra"
          // banner PendingSupervisor sẽ tự hiển thị qua status
          setIsChecking(false);
          pollTimerRef.current = setTimeout(
            () => _poll(executionId),
            POLL_INTERVAL_SUPERVISOR_MS,
          );
        } else {
          // ── Pending / Processing: poll nhanh, giữ isChecking=true ────
          setIsChecking(true);
          pollTimerRef.current = setTimeout(
            () => _poll(executionId),
            POLL_INTERVAL_MS,
          );
        }
      } catch (err: any) {
        if (!isMountedRef.current || activeExecutionRef.current !== executionId)
          return;

        if (err?.response?.status === 404) {
          pollTimerRef.current = setTimeout(
            () => _poll(executionId),
            POLL_INTERVAL_MS,
          );
          console.log(
            `[useComplianceCheck] poll 404, retrying for ${executionId}`,
          );
        } else {
          setError("Không thể lấy kết quả kiểm tra. Vui lòng thử lại.");
          _teardown();
          setIsChecking(false);
        }
      }
    },
    [status],
  ); // thêm status vào deps để đọc được giá trị mới nhất

  // ─── SignalR ─────────────────────────────────────────────────────────────────

  const _connectSignalR = useCallback(
    async (executionId: string) => {
      // Dừng connection cũ nếu có
      if (connectionRef.current) {
        await connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }

      // Dùng LongPolling để tránh lỗi 'Cannot resolve ws://' trên RN/Expo.
      // SignalR sẽ negotiate qua HTTP trước rồi tự upgrade lên WebSocket nếu BE hỗ trợ.
      const connection = new HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          transport: HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Debug)
        .build();

      connectionRef.current = connection;

      // Lắng nghe event "compliance-check-updated" từ BE
      // BE gửi payload là anonymous object với camelCase fields
      connection.on(
        "compliance-check-updated",
        (payload: SignalRNotification) => {
          if (!isMountedRef.current) return;

          console.log("📡 [SignalR] compliance-check-updated raw:", payload);

          // So sánh case-insensitive vì BE Guid có thể lowercase
          const incomingId = payload?.taskStepExecutionId
            ?.toString()
            .toLowerCase();
          const expectedId = executionId?.toLowerCase();
          if (incomingId !== expectedId) {
            console.warn(
              "[SignalR] executionId mismatch, ignoring:",
              incomingId,
              "vs",
              expectedId,
            );
            return;
          }
          if (activeExecutionRef.current?.toLowerCase() !== expectedId) return;

          _applyResult({
            complianceCheckId: payload.complianceCheckId,
            taskStepExecutionId: payload.taskStepExecutionId,
            status: payload.status as ComplianceStatus,
            minScore: payload.minScore,
            failedImageCount: payload.failedImageCount,
            updatedAt: payload.at,
          });
        },
      );

      try {
        await connection.start();
        console.log("📡 [SignalR] Connected →", SIGNALR_URL);

        // BE method: JoinExecution(Guid taskStepExecutionId)
        // SignalR tự convert string → Guid nếu đúng format "xxxxxxxx-xxxx-..."
        // Log rõ để confirm join thành công
        console.log("📡 [SignalR] Invoking JoinExecution with:", executionId);
        await connection.invoke("JoinExecution", executionId);
        console.log(
          "📡 [SignalR] ✓ JoinExecution successful — now listening for compliance-check-updated",
        );
      } catch (e: any) {
        console.error("📡 [SignalR] ✗ JoinExecution FAILED:", e?.message ?? e);
        // Kết nối thất bại → không sao, polling đang chạy như fallback
      }
    },
    [_applyResult],
  );

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Reset về trạng thái ban đầu (gọi khi xoá ảnh hoặc chụp lại) */
  const reset = useCallback(() => {
    _teardown();
    console.log("[useComplianceCheck] reset() called");
    if (isMountedRef.current) {
      setIsChecking(false);
      setStatus(null);
      setResult(null);
      setError(null);
    }
  }, []);

  /**
   * Khởi động AI compliance check:
   *  1. POST để tạo check trên BE
   *  2. Bắt đầu polling (luôn chạy, là tầng an toàn)
   *  3. Song song kết nối SignalR — nếu BE push về sẽ dừng poll sớm hơn
   */
  const initiateCheck = useCallback(
    async (taskStepExecutionId: string) => {
      if (!taskStepExecutionId) return;

      _teardown();
      activeExecutionRef.current = taskStepExecutionId;
      console.log(
        "[useComplianceCheck] initiateCheck for",
        taskStepExecutionId,
      );

      if (isMountedRef.current) {
        setError(null);
        setResult(null);
        setIsChecking(true);
        setStatus("Pending");
      }

      try {
        console.log(
          "[useComplianceCheck] POST /ComplianceChecks/initiate -> creating check",
        );
        const { data } = await axiosInstance.post<InitiateAiCheckResult>(
          "/ComplianceChecks/initiate",
          { taskStepExecutionId },
        );
        console.log(
          "[useComplianceCheck] POST /ComplianceChecks/initiate succeeded:",
          data,
        );

        // Polling bắt đầu ngay — gọi lần đầu tiên ngay lập tức để kiểm tra nhanh
        pollAttemptsRef.current = 0;
        // Call _poll immediately, subsequent polls are scheduled inside _poll
        _poll(taskStepExecutionId);

        // SignalR chạy song song — nếu kết nối được sẽ nhận kết quả nhanh hơn
        _connectSignalR(taskStepExecutionId);
      } catch (err: any) {
        const msg: string =
          err?.response?.data?.message ??
          err?.response?.data ??
          err?.message ??
          "Không thể khởi tạo kiểm tra AI.";
        if (isMountedRef.current) {
          setError(msg);
          setIsChecking(false);
          setStatus(null);
        }
        activeExecutionRef.current = null;
      }
    },
    [_poll, _connectSignalR],
  );

  return { isChecking, status, result, error, initiateCheck, reset };
}
