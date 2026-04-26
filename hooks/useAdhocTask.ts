import { adhocTaskService } from "@/services/adhocTask.service";
import { CreateAdhocTaskRequest } from "@/types/adhocTask.types";
import { useState } from "react";

// ─── HOOK ──────────────────────────────────────────────────────────────────

interface UseAdhocTaskReturn {
  loading: boolean;
  error: string | null;
  createAdhocTask: (data: CreateAdhocTaskRequest) => Promise<boolean>;
}

export const useAdhocTask = (): UseAdhocTaskReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createAdhocTask = async (
    data: CreateAdhocTaskRequest,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await adhocTaskService.createAdhocTask(data);
      return true;
    } catch (err: any) {
      setError(err.message || "Tạo task thất bại");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createAdhocTask,
  };
};
