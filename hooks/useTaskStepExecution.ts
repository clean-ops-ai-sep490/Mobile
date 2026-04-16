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
      console.log("➡️ API call /TaskStepExecutions", stepId, payload);
      try {
        setLoading(true);
        const res = await axiosInstance.post<TaskStepExecutionDto>(
          `/TaskStepExecutions/${stepId}/complete`,
          payload,
        );
        return res.data;
      } catch (err: any) {
        console.error("❌ API error:", err?.response?.data || err.message);
        setError(
          err?.response?.data?.detail || // ✅ đúng field
            err?.response?.data?.title ||
            err?.message ||
            "Hoàn thành bước thất bại",
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
        err?.response?.data?.message || err?.message || "Lấy bước thất bại",
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
