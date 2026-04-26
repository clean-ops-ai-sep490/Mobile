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
  const payload = {
    workerId,
    latitude,
    longitude,
    isConfirmed,
  };

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

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchWorkers = useCallback(async (): Promise<void> => {
    if (!workAreaId || !mountedRef.current) return;

    try {
      setError(null);
      if (!isPolling) setLoading(true);

      const params: WorkerGPSParams = {
        pageNumber: 1,
        pageSize: 100,
        offlineThresholdMinutes: 10,
      };

      const response = await gpsService.getWorkerGPSByWorkArea(
        workAreaId,
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
  }, [workAreaId, isPolling]);

  const startPolling = useCallback(() => {
    if (!workAreaId || isPolling) return;

    setIsPolling(true);
    fetchWorkers();

    intervalRef.current = setInterval(() => {
      if (mountedRef.current) fetchWorkers();
    }, pollingInterval);
  }, [workAreaId, isPolling, fetchWorkers, pollingInterval]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshWorkers = useCallback(async (): Promise<void> => {
    await fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    if (workAreaId && autoStart) startPolling();
    else stopPolling();

    return () => stopPolling();
  }, [workAreaId, autoStart, startPolling, stopPolling]);

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
