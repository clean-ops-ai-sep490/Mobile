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
  id: string;
  sopStepId: string;
  stepOrder: number;
  name: string;
  status: string;
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
  assigneeName?: string; // ✅ thêm mới
  originalAssigneeId: string;
  originalAssigneeName?: string; // ✅ thêm mới
  status: TaskAssignmentStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
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

export const useTaskAssignments = (baseUrl: string = "/TaskAssignments") => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getTaskAssignmentById = async (
    id: string,
  ): Promise<TaskAssignmentDto | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`${baseUrl}/${id}`);
      const data: any = response.data;

      const derivedName =
        data?.taskName ||
        data?.nameAdhocTask ||
        data?.task?.taskName ||
        data?.task?.name ||
        data?.taskSchedule?.taskName ||
        undefined;

      if (derivedName && !data.taskName) data.taskName = derivedName;

      if (typeof data?.isAdhocTask !== "boolean") {
        const rawIsAdhoc =
          data?.isAdhocTask ??
          data?.isAdhoc ??
          data?.task?.isAdhocTask ??
          data?.taskAssignment?.isAdhocTask;
        data.isAdhocTask =
          rawIsAdhoc === true || rawIsAdhoc === "true" || rawIsAdhoc === 1;
      }

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

  const getAdhocTasksBySupervisor = async (
    pagination?: PaginationRequest,
  ): Promise<PaginatedResult<TaskAssignmentDto> | null> => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {};

      if (pagination?.pageNumber) params.pageNumber = pagination.pageNumber;
      if (pagination?.pageSize) params.pageSize = pagination.pageSize;
      if (pagination?.sortBy) params.sortBy = pagination.sortBy;
      if (pagination?.sortDescending !== undefined)
        params.sortDescending = pagination.sortDescending;

      const response = await axiosInstance.get(`${baseUrl}/adhoc/supervisor`, {
        params,
      });
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
    getAdhocTasksBySupervisor,
  };
};
