import { workAreaSupervisorService } from "@/services/workAreaSupervisor.service";
import {
  PaginationRequest,
  WorkAreaSupervisor,
  WorkAreaWorker,
} from "@/types/workAreaSupervisor.types";
import { useCallback, useState } from "react";

interface UseWorkAreaSupervisorReturn {
  workAreas: WorkAreaSupervisor[];
  workers: WorkAreaWorker[];
  loading: boolean;
  error: string | null;
  getWorkAreasBySupervisor: (
    supervisorId: string,
    params?: PaginationRequest,
  ) => Promise<void>;
  getWorkersByWorkArea: (
    workAreaId: string,
    params?: PaginationRequest,
  ) => Promise<void>;
  getWorkersBySupervisor: (
    supervisorId: string,
    params?: PaginationRequest,
  ) => Promise<void>;
}

export const useWorkAreaSupervisor = (): UseWorkAreaSupervisorReturn => {
  const [workAreas, setWorkAreas] = useState<WorkAreaSupervisor[]>([]);
  const [workers, setWorkers] = useState<WorkAreaWorker[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getWorkAreasBySupervisor = useCallback(
    async (supervisorId: string, params?: PaginationRequest): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await workAreaSupervisorService.getWorkAreasBySupervisor(
          supervisorId,
          params,
        );
        setWorkAreas(result.content || []);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Lấy danh sách khu vực thất bại",
        );
        setWorkAreas([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getWorkersByWorkArea = useCallback(
    async (workAreaId: string, params?: PaginationRequest): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await workAreaSupervisorService.getWorkersByWorkArea(
          workAreaId,
          params,
        );
        setWorkers(result.content || []);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Lấy danh sách nhân viên thất bại",
        );
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getWorkersBySupervisor = useCallback(
    async (supervisorId: string, params?: PaginationRequest): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await workAreaSupervisorService.getWorkersBySupervisor(
          supervisorId,
          params,
        );
        setWorkers(result.content || []);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Lấy danh sách nhân viên thất bại",
        );
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    workAreas,
    workers,
    loading,
    error,
    getWorkAreasBySupervisor,
    getWorkersByWorkArea,
    getWorkersBySupervisor,
  };
};
