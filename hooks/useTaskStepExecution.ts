import axiosInstance from "@/config/axiosInstance";
import { useCallback, useState } from "react";

export interface TaskStepExecutionDto {
  id: string;
  sopStepId: string;
  stepOrder: number;
  status: string;
  nextStepId?: string | null;
}

export const useTaskStepExecution = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeStep = useCallback(
    async (stepId: string, payload: { workerId: string; resultData: any }) => {
      try {
        setLoading(true);
        const res = await axiosInstance.post<TaskStepExecutionDto>(
          `/TaskStepExecutions/${stepId}/complete`,
          payload,
        );
        return res.data;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to complete step",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<TaskStepExecutionDto>(
        `/TaskStepExecutions/${id}`,
      );
      return res.data;
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to fetch step",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    completeStep,
    getById,
  };
};

export default useTaskStepExecution;
