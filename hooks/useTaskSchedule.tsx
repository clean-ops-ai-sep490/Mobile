// src/hooks/useTaskSchedules.ts
import axiosInstance from "@/config/axiosInstance";
import { useState } from "react";

export interface SopStepDto {
  id: string; // ID của SopStepConfig (dùng để completeStep)
  stepId: string; // ID của Step definition (dùng để lookup actionKey/x-behavior)
  stepOrder: number;
  configDetail: any; // runtime values — đã parse từ JSON string
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

export const useTaskSchedules = (baseUrl: string = "/TaskSchedules") => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse metadata — giữ đúng StepId để loadData lookup được step definition
  const parseMetadata = (metadata: any[]): SopStepDto[] => {
    if (!Array.isArray(metadata)) return [];

    return metadata.map((item: any) => {
      let configDetail = {};
      try {
        configDetail = item.ConfigDetail ? JSON.parse(item.ConfigDetail) : {};
      } catch {
        console.warn("⚠️ Invalid ConfigDetail JSON", item.ConfigDetail);
      }

      return {
        id: item.Id, // SopStepConfig ID → dùng khi gọi completeStep
        stepId: item.StepId, // Step definition ID → dùng để lookup actionKey + x-behavior
        stepOrder: item.StepOrder,
        configDetail, // runtime values đã parse sẵn
      };
    });
  };

  const getTaskScheduleById = async (
    id: string | null | undefined,
  ): Promise<{ schedule: TaskScheduleDto | null; steps: SopStepDto[] }> => {
    if (!id) return { schedule: null, steps: [] };

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<TaskScheduleDto>(
        `${baseUrl}/${id}`,
      );
      const schedule = response.data;
      const steps = parseMetadata(schedule.metadata);
      return { schedule, steps };
    } catch (err: any) {
      const message =
        err?.response?.status === 404
          ? "Task schedule not found"
          : (err?.response?.data?.message ??
            err?.message ??
            "Failed to load task schedule");

      console.error("❌ [TaskSchedule] getById error:", message);
      setError(message);
      return { schedule: null, steps: [] };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getTaskScheduleById };
};
