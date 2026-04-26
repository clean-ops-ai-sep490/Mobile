import { workAreaSupervisorService } from "@/services/workAreaSupervisor.service";
import {
  PaginationRequest,
  WorkAreaSupervisor,
} from "@/types/workAreaSupervisor.types";
import { useState } from "react";

// ─── HOOK ──────────────────────────────────────────────────────────────────

interface UseWorkAreaSupervisorReturn {
  workAreas: WorkAreaSupervisor[];
  loading: boolean;
  error: string | null;
  getWorkAreasBySupervisor: (
    supervisorId: string,
    params?: PaginationRequest,
  ) => Promise<void>;
}

export const useWorkAreaSupervisor = (): UseWorkAreaSupervisorReturn => {
  const [workAreas, setWorkAreas] = useState<WorkAreaSupervisor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getWorkAreasBySupervisor = async (
    supervisorId: string,
    params?: PaginationRequest,
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[useWorkAreaSupervisor] Fetching work areas for supervisor:",
        supervisorId,
      );
      console.log("[useWorkAreaSupervisor] Params:", params);

      const result = await workAreaSupervisorService.getWorkAreasBySupervisor(
        supervisorId,
        params,
      );

      console.log("[useWorkAreaSupervisor] Response:", result);
      console.log(
        "[useWorkAreaSupervisor] Work areas count:",
        result.content?.length || 0,
      );

      setWorkAreas(result.content || []);
    } catch (err: any) {
      console.error("[useWorkAreaSupervisor] Failed to fetch work areas:", err);
      console.error("[useWorkAreaSupervisor] Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Lấy danh sách khu vực thất bại";

      setError(errorMessage);
      setWorkAreas([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    workAreas,
    loading,
    error,
    getWorkAreasBySupervisor,
  };
};
