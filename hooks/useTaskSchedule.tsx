// src/hooks/useTaskSchedules.ts
import axiosInstance from "@/config/axiosInstance";
import { useState } from "react";

// ── TYPES ─────────────────────────────────────────────

export interface SopStepDto {
  id: string;
  name: string;
  description?: string;
  stepOrder: number;
  config?: any;
}

export interface TaskScheduleDto {
  id: string;
  sopId: string;
  slaTaskId: string;
  slaShiftId: string;
  workAreaDetailId?: string;
  name: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  displayLocation?: string;
  durationMinutes: number;
  metadata: any[];
  recurrenceType: string;
  recurrenceConfig: any;
  isActive: boolean;
}

// Response chuẩn backend
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ── HOOK ─────────────────────────────────────────────

export const useTaskSchedules = (baseUrl: string = "/TaskSchedules") => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ── Helper: parse metadata safely ─────────────────────
  const parseMetadata = (metadata: any[]): SopStepDto[] => {
    if (!Array.isArray(metadata)) return [];

    return metadata.map((step: any) => ({
      id: step.Id,
      name: `Step ${step.StepOrder}`,
      description: "",
      stepOrder: step.StepOrder,
      config: step.ConfigDetail ? JSON.parse(step.ConfigDetail) : {},
    }));
  };

  // ── Get schedule by ID ───────────────────────────────
  const getTaskScheduleById = async (
    id: string | null | undefined,
  ): Promise<{
    schedule: TaskScheduleDto | null;
    steps: SopStepDto[];
  }> => {
    if (!id) {
      return { schedule: null, steps: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<TaskScheduleDto>(
        `${baseUrl}/${id}`,
      );

      const schedule = response.data;

      const steps = parseMetadata(schedule.metadata);

      return { schedule, steps };
    } catch (err: unknown) {
      let message = "Failed to load task schedule";

      if (typeof err === "object" && err !== null) {
        const e = err as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };

        if (e.response?.status === 404) {
          message = "Task schedule not found";
        } else if (e.response?.data?.message) {
          message = e.response.data.message;
        } else if (e.message) {
          message = e.message;
        }
      }

      console.error("❌ [TaskSchedule] getById error:", message);
      setError(message);

      return { schedule: null, steps: [] };
    } finally {
      setLoading(false);
    }
  };

  // ── MAIN FLOW: từ TaskAssignment → lấy steps ──────────
  const getStepsFromTaskAssignment = async (
    taskScheduleId: string | null | undefined,
  ): Promise<SopStepDto[]> => {
    // Guard
    if (!taskScheduleId) return [];

    const { steps } = await getTaskScheduleById(taskScheduleId);
    return steps;
  };

  return {
    loading,
    error,
    getTaskScheduleById,
    getStepsFromTaskAssignment,
  };
};
