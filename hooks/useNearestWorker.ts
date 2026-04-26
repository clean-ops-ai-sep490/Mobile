import { MapLocation, WorkerGPS, WorkerWithDistance } from "@/types/gps.types";
import { getNearestWorkers } from "@/utils/gpsUtils";
import { useMemo } from "react";

// ─── HOOK ──────────────────────────────────────────────────────────────────

interface UseNearestWorkerProps {
  location?: MapLocation;
  workers: WorkerGPS[];
  maxDistance?: number; // meters, optional filter
}

interface UseNearestWorkerReturn {
  nearestWorkers: WorkerWithDistance[];
  nearestWorker: WorkerWithDistance | null;
  workersInRange: WorkerWithDistance[];
  hasNearbyWorkers: boolean;
}

export const useNearestWorker = ({
  location,
  workers,
  maxDistance,
}: UseNearestWorkerProps): UseNearestWorkerReturn => {
  const nearestWorkers = useMemo(() => {
    if (!location || workers.length === 0) {
      return [];
    }

    return getNearestWorkers(location, workers);
  }, [location, workers]);

  const nearestWorker = useMemo(() => {
    return nearestWorkers.length > 0 ? nearestWorkers[0] : null;
  }, [nearestWorkers]);

  const workersInRange = useMemo(() => {
    if (!maxDistance) return nearestWorkers;

    return nearestWorkers.filter((worker) => worker.distance <= maxDistance);
  }, [nearestWorkers, maxDistance]);

  const hasNearbyWorkers = useMemo(() => {
    return nearestWorkers.length > 0;
  }, [nearestWorkers]);

  return {
    nearestWorkers,
    nearestWorker,
    workersInRange,
    hasNearbyWorkers,
  };
};
