import axiosInstance from "@/config/axiosInstance";
import { gpsService } from "@/services/gps.service";
import { WorkerGPSParams, WorkerMarkerData } from "@/types/gps.types";
import { getWorkerStatus } from "@/utils/gpsUtils";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── API: SEND GPS ─────────────────────────────────────────────
export const sendWorkerGps = async (
  workerId: string,
  latitude: number | null,
  longitude: number | null,
  isConfirmed: boolean,
) => {
  const payload = { workerId, latitude, longitude, isConfirmed };
  console.log("📍 Sending GPS:", payload);
  const res = await axiosInstance.post("/WorkerGps", payload);
  return res.data;
};

// ─── HOOK: FETCH + POLLING GPS ─────────────────────────────────

interface UseWorkerGPSProps {
  workAreaId?: string;
  pollingInterval?: number;
  autoStart?: boolean;
}

interface UseWorkerGPSReturn {
  workers: WorkerMarkerData[];
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  totalWorkers: number;
  onlineCount: number;
  offlineCount: number;
  fetchWorkers: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  refreshWorkers: () => Promise<void>;
}

export const useWorkerGPS = ({
  workAreaId,
  pollingInterval = 10000,
  autoStart = true,
}: UseWorkerGPSProps): UseWorkerGPSReturn => {
  const [workers, setWorkers] = useState<WorkerMarkerData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef<boolean>(true);
  const isPollingRef = useRef<boolean>(false); // ✅ track polling state without causing re-renders
  const workAreaIdRef = useRef<string | undefined>(workAreaId); // ✅ latest workAreaId without deps

  // Keep workAreaIdRef in sync
  useEffect(() => {
    workAreaIdRef.current = workAreaId;
  }, [workAreaId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ✅ No state in deps — uses refs instead
  const fetchWorkers = useCallback(async (): Promise<void> => {
    const currentWorkAreaId = workAreaIdRef.current;
    if (!currentWorkAreaId || !mountedRef.current) return;

    try {
      setError(null);
      if (!isPollingRef.current) setLoading(true);

      const params: WorkerGPSParams = {
        pageNumber: 1,
        pageSize: 100,
        offlineThresholdMinutes: 5,
      };

      const response = await gpsService.getWorkerGPSByWorkArea(
        currentWorkAreaId,
        params,
      );

      if (!mountedRef.current) return;

      const workersWithStatus: WorkerMarkerData[] = (
        response.content || []
      ).map((worker) => ({
        ...worker,
        status: getWorkerStatus(worker.lastSeen, worker.isOnline),
      }));

      setWorkers(workersWithStatus);
    } catch (err: any) {
      if (!mountedRef.current) return;
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Không thể lấy vị trí nhân viên";
      setError(errorMessage);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []); // ✅ empty deps — all values accessed via refs

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!workAreaIdRef.current || isPollingRef.current) return;

    isPollingRef.current = true;
    setIsPolling(true);
    fetchWorkers();

    intervalRef.current = setInterval(() => {
      if (mountedRef.current) fetchWorkers();
    }, pollingInterval);
  }, [fetchWorkers, pollingInterval]); // ✅ no isPolling/workAreaId state in deps

  const refreshWorkers = useCallback(async (): Promise<void> => {
    await fetchWorkers();
  }, [fetchWorkers]);

  // ✅ Only re-run when workAreaId or autoStart actually changes
  useEffect(() => {
    if (workAreaId && autoStart) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [workAreaId, autoStart]); // ✅ startPolling/stopPolling intentionally excluded

  const totalWorkers = workers.length;
  const onlineCount = workers.filter(
    (w) => w.status === "online" || w.status === "idle",
  ).length;
  const offlineCount = workers.filter((w) => w.status === "offline").length;

  return {
    workers,
    loading,
    error,
    isPolling,
    totalWorkers,
    onlineCount,
    offlineCount,
    fetchWorkers,
    startPolling,
    stopPolling,
    refreshWorkers,
  };
};
