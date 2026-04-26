import { gpsService } from "@/services/gps.service";
import { WorkerGPSParams, WorkerMarkerData } from "@/types/gps.types";
import { getWorkerStatus } from "@/utils/gpsUtils";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── HOOK ──────────────────────────────────────────────────────────────────

interface UseWorkerGPSProps {
  workAreaId?: string;
  pollingInterval?: number; // milliseconds
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
  pollingInterval = 10000, // 10 seconds default
  autoStart = true,
}: UseWorkerGPSProps): UseWorkerGPSReturn => {
  const [workers, setWorkers] = useState<WorkerMarkerData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchWorkers = useCallback(async (): Promise<void> => {
    if (!workAreaId || !mountedRef.current) {
      console.log("[useWorkerGPS] Skipping fetch - no workAreaId or unmounted");
      return;
    }

    try {
      setError(null);
      if (!isPolling) setLoading(true);

      const params: WorkerGPSParams = {
        pageNumber: 1,
        pageSize: 100,
        offlineThresholdMinutes: 10,
      };

      console.log(
        "[useWorkerGPS] Fetching GPS data for workAreaId:",
        workAreaId,
      );
      console.log("[useWorkerGPS] Params:", params);

      const response = await gpsService.getWorkerGPSByWorkArea(
        workAreaId,
        params,
      );

      console.log("[useWorkerGPS] Response received:", response);
      console.log(
        "[useWorkerGPS] Workers count:",
        response.content?.length || 0,
      );

      if (!mountedRef.current) return;

      // Transform workers with status
      const workersWithStatus: WorkerMarkerData[] = (
        response.content || []
      ).map((worker) => ({
        ...worker,
        status: getWorkerStatus(worker.lastSeen, worker.isOnline),
      }));

      console.log("[useWorkerGPS] Workers with status:", workersWithStatus);
      setWorkers(workersWithStatus);
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error("[useWorkerGPS] Failed to fetch worker GPS:", err);
      console.error("[useWorkerGPS] Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Không thể lấy vị trí nhân viên";

      setError(errorMessage);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [workAreaId, isPolling]);

  const startPolling = useCallback(() => {
    if (!workAreaId || isPolling) return;

    setIsPolling(true);

    // Initial fetch
    fetchWorkers();

    // Set up polling
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchWorkers();
      }
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

  // Auto-start polling when workAreaId changes
  useEffect(() => {
    if (workAreaId && autoStart) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [workAreaId, autoStart, startPolling, stopPolling]);

  // Calculate statistics
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
