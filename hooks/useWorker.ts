import { workAreaSupervisorService } from "@/services/workAreaSupervisor.service";
import { WorkAreaWorker } from "@/types/workAreaSupervisor.types";
import { useState } from "react";

// ─── HOOK ──────────────────────────────────────────────────────────────────

interface UseWorkerReturn {
  workers: WorkAreaWorker[];
  loading: boolean;
  error: string | null;
  fetchWorkersByWorkArea: (workAreaId: string) => Promise<void>;
  clearWorkers: () => void;
}

export const useWorker = (): UseWorkerReturn => {
  const [workers, setWorkers] = useState<WorkAreaWorker[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkersByWorkArea = async (workAreaId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await workAreaSupervisorService.getWorkersByWorkArea(
        workAreaId,
        { pageNumber: 1, pageSize: 100 },
      );
      setWorkers(result.content);
    } catch (err: any) {
      setError(err.message || "Lấy danh sách nhân viên thất bại");
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const clearWorkers = () => {
    setWorkers([]);
    setError(null);
  };

  return {
    workers,
    loading,
    error,
    fetchWorkersByWorkArea,
    clearWorkers,
  };
};
