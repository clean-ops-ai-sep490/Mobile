import axiosInstance from "@/config/axiosInstance";
import { useState } from "react";

// ─── TYPES & ENUMS ─────────────────────────────────────────────────────────

export enum AdHocRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum AdHocRequestType {
  General = 0,
  Urgent = 1,
  HighPriority = 2,
}

export interface PaginationRequest {
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  content: T[];
}

export interface AdHocRequestDto {
  id: string;
  taskAssignmentId: string;
  requestDateFrom: string;
  requestDateTo?: string;
  requestedByWorkerId: string;
  workerName?: string;
  workAreaId: string;
  workAreaName?: string;
  requestType: AdHocRequestType;
  reason?: string;
  description?: string;
  status: AdHocRequestStatus;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  approvedAt?: string;
  created: string;
}

export interface CreateAdHocRequestDto {
  workAreaId: string;
  requestType: AdHocRequestType;
  requestDateFrom: string;
  requestDateTo?: string | null;
  reason?: string;
  description?: string;
}

export interface UpdateAdHocRequestDto {
  workAreaId?: string | null;
  requestType?: AdHocRequestType | null;
  requestDateFrom?: string | null;
  requestDateTo?: string | null;
  reason?: string;
  description?: string;
}

export interface ReviewAdHocRequestDto {
  status: AdHocRequestStatus;
}

// ─── HOOK ──────────────────────────────────────────────────────────────────

const ENDPOINT = "/AdHocRequests";

export const useAdhocRequest = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toQueryString = (params?: PaginationRequest) => {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    if (params.pageNumber)
      searchParams.append("PageNumber", params.pageNumber.toString());
    if (params.pageSize)
      searchParams.append("PageSize", params.pageSize.toString());
    return `?${searchParams.toString()}`;
  };

  const getRequests = async (
    params?: PaginationRequest,
  ): Promise<PaginatedResult<AdHocRequestDto> | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `${ENDPOINT}${toQueryString(params)}`,
      );
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Lấy danh sách yêu cầu thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRequestById = async (
    id: string,
  ): Promise<AdHocRequestDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Lấy yêu cầu theo ID thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRequestsByWorkerId = async (
    workerId: string,
    params?: PaginationRequest,
  ): Promise<PaginatedResult<AdHocRequestDto> | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `${ENDPOINT}/worker/${workerId}${toQueryString(params)}`,
      );
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Lấy yêu cầu của nhân viên thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRequestsByStatus = async (
    status: AdHocRequestStatus,
    params?: PaginationRequest,
  ): Promise<PaginatedResult<AdHocRequestDto> | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `${ENDPOINT}/status/${status}${toQueryString(params)}`,
      );
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Lấy yêu cầu theo trạng thái thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (
    data: CreateAdHocRequestDto,
  ): Promise<AdHocRequestDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(ENDPOINT, data);
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Tạo yêu cầu thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (
    id: string,
    data: UpdateAdHocRequestDto,
  ): Promise<AdHocRequestDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.put(`${ENDPOINT}/${id}`, data);
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Cập nhật yêu cầu thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async (
    id: string,
    data: ReviewAdHocRequestDto,
  ): Promise<AdHocRequestDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.patch(
        `${ENDPOINT}/${id}/review`,
        data,
      );
      return response.data;
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Duyệt yêu cầu thất bại",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.delete(`${ENDPOINT}/${id}`);
      return true;
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Xóa yêu cầu thất bại",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getRequests,
    getRequestById,
    getRequestsByWorkerId,
    getRequestsByStatus,
    createRequest,
    updateRequest,
    reviewRequest,
    deleteRequest,
  };
};
