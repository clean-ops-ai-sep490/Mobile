import axiosInstance from "@/config/axiosInstance";
import { useState } from "react";

// Types
export interface TaskStepExecutionDto {
  id: string;
  sopStepId: string;
  stepOrder: number;
  status: string;
}

export interface StartTaskDto {
  taskAssignmentId: string;
  status: TaskAssignmentStatus;
  steps: TaskStepExecutionDto[];
}

export interface TaskStepSnapshotDto {
  id: string; // TaskStepExecution ID
  sopStepId: string;
  stepOrder: number;
  status: string; // "InProgress" | "NotStarted" | "Completed"
  configSnapshot: {
    detail: any;
    schema: any;
  };
  resultData: any;
  nextStepId: string | null;
}

export interface TaskAssignmentDto {
  id: string;
  taskScheduleId: string;
  taskName: string;
  assigneeId: string;
  originalAssigneeId: string;
  status: TaskAssignmentStatus;
  scheduledStartAt: string;
  scheduleEndAt: string;
  isAdhocTask: boolean;
  nameAdhocTask?: string;
  displayLocation?: string;
  steps: TaskStepSnapshotDto[];
}

export enum TaskAssignmentStatus {
  NotStarted = "Chưa bắt đầu",
  InProgress = "Đang thực hiện",
  Completed = "Hoàn thành",
  Block = "Bị chặn",
}

export interface TaskAssignmentFilter {
  assigneeId?: string;
  workAreaId?: string;
  status?: TaskAssignmentStatus | string;
  fromDate?: string;
  toDate?: string;
  isAdhocTask?: boolean;
}

export interface PaginationRequest {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PaginatedResult<T> {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  content: T[];
}

export interface StartTaskRequest {
  workerId: string;
}

// Hook for Task Assignments
export const useTaskAssignments = (baseUrl: string = "/TaskAssignments") => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get paginated task assignments with filters
  const getTaskAssignments = async (
    filter?: TaskAssignmentFilter,
    pagination?: PaginationRequest,
  ): Promise<PaginatedResult<TaskAssignmentDto> | null> => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {};

      if (filter?.assigneeId) params.assigneeId = filter.assigneeId;
      if (filter?.workAreaId) params.workAreaId = filter.workAreaId;
      if (filter?.status !== undefined) params.status = filter.status;
      if (filter?.fromDate) params.fromDate = filter.fromDate;
      if (filter?.toDate) params.toDate = filter.toDate;
      if (filter?.isAdhocTask !== undefined)
        params.isAdhocTask = filter.isAdhocTask;

      if (pagination?.pageNumber) params.pageNumber = pagination.pageNumber;
      if (pagination?.pageSize) params.pageSize = pagination.pageSize;
      if (pagination?.sortBy) params.sortBy = pagination.sortBy;
      if (pagination?.sortDescending !== undefined)
        params.sortDescending = pagination.sortDescending;

      const response = await axiosInstance.get(baseUrl, { params });
      // console.log("[TaskList] getTaskAssignments response:", response.data);
      return response.data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Đã xảy ra lỗi";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get task assignment by ID
  const getTaskAssignmentById = async (
    id: string,
  ): Promise<TaskAssignmentDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`${baseUrl}/${id}`);
      const data: any = response.data;
      // Log to help debug why `taskName` might be missing / where it's located
      // console.log("[useTaskAssignments] getTaskAssignmentById response:", data);

      // Normalize common shapes so callers can reliably read `taskName`
      const derivedName =
        data?.taskName ||
        data?.nameAdhocTask ||
        data?.task?.taskName ||
        data?.task?.name ||
        data?.taskSchedule?.taskName ||
        undefined;

      if (derivedName && !data.taskName) data.taskName = derivedName;

      return data as TaskAssignmentDto;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("Không tìm thấy công việc");
        return null;
      }
      const message =
        err?.response?.data?.message || err?.message || "Đã xảy ra lỗi";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (
    taskAssignmentId: string,
    workerId: string,
  ): Promise<StartTaskDto | null> => {
    setLoading(true);
    setError(null);

    const url = `${baseUrl}/${taskAssignmentId}/start`;
    const payload = { workerId };

    try {
      const response = await axiosInstance.post(url, payload);
      return response.data;
    } catch (err: any) {
      const errorData = err?.response?.data;
      const message = errorData?.message || err?.message || "Đã xảy ra lỗi";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Update task assignment
  const updateTaskAssignment = async (
    id: string,
    dto: TaskAssignmentDto,
  ): Promise<TaskAssignmentDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.put(`${baseUrl}/${id}`, dto);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("Không tìm thấy công việc");
        return null;
      }
      const message =
        err?.response?.data?.message || err?.message || "Đã xảy ra lỗi";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update task assignment status
  const updateTaskAssignmentStatus = async (
    id: string,
    status: TaskAssignmentStatus,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await axiosInstance.patch(`${baseUrl}/${id}/status`, status);
      return true;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("Không tìm thấy công việc");
        return false;
      }
      const message =
        err?.response?.data?.message || err?.message || "Đã xảy ra lỗi";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete task assignment
  const deleteTaskAssignment = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(`${baseUrl}/${id}`);
      return true;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("Không tìm thấy công việc");
        return false;
      }
      const message =
        err?.response?.data?.message || err?.message || "Đã xảy ra lỗi";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (
    taskAssignmentId: string,
    workerId: string,
  ): Promise<StartTaskDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${baseUrl}/${taskAssignmentId}/complete`;
      const payload = { workerId };
      const response = await axiosInstance.post<StartTaskDto>(url, payload);
      return response.data;
    } catch (err: any) {
      const errorData = err?.response?.data;
      const message = errorData?.message || err?.message || "An error occurred";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getTaskAssignments,
    getTaskAssignmentById,
    startTask,
    updateTaskAssignment,
    updateTaskAssignmentStatus,
    deleteTaskAssignment,
    completeTask,
  };
};
