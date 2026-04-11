import axiosInstance from "@/config/axiosInstance";
import { useCallback, useState } from "react";

/* ================= TYPES ================= */

export type SwapRequestStatus =
  | "PendingTargetApproval"
  | "PendingManagerApproval"
  | "Approved"
  | "RejectedByTarget"
  | "RejectedByManager"
  | "CancelledByRequester"
  | "Expired";

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

export interface SwapRequest {
  id: string;
  status: SwapRequestStatus;
  requesterNote?: string;
  reviewNote?: string;
  expiredAt: string;
  createdAt: string;
  requesterId: string;
  targetWorkerId: string;
  requesterName: string;
  targetWorkerName?: string;
  reviewerName?: string;
}

export interface TaskSwapRequestListItem {
  id: string;
  taskAssignmentId: string;
  requesterId: string;
  targetWorkerId?: string;
  status: SwapRequestStatus;
  reviewedByUserId?: string;
}

export interface SwapTaskInfo {
  taskAssignmentId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  displayLocation?: string;
}

export interface SwapCandidate {
  workerId: string;
  assigneeName: string;
  task: SwapTaskInfo;
}

export type SwapPerspective = "All" | "Sent" | "Received";

/* ================= HOOK ================= */

export const useTaskSwap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= GET LIST ================= */
  const getList = useCallback(
    async (
      params?: {
        status?: SwapRequestStatus;
        requesterId?: string;
      },
      pagination?: PaginationRequest,
    ) => {
      try {
        setLoading(true);

        const res = await axiosInstance.get<
          PaginatedResult<TaskSwapRequestListItem>
        >("/TaskSwapRequests", {
          params: {
            ...params,
            ...pagination,
          },
        });

        return res.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* ================= GET BY ID ================= */
  const getById = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const res = await axiosInstance.get<SwapRequest>(
        `/TaskSwapRequests/${id}`,
      );

      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= CREATE ================= */
  const create = useCallback(
    async (data: {
      taskAssignmentId: string;
      targetTaskAssignmentId: string;
      requesterId: string;
      targetWorkerId: string;
      requesterNote?: string;
    }) => {
      try {
        setLoading(true);

        const res = await axiosInstance.post<SwapRequest>(
          "/TaskSwapRequests",
          data,
        );

        return res.data;
      } catch (err: any) {
        setError(err.response?.data?.errors?.[0] || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* ================= RESPOND (TARGET) ================= */
  const respond = useCallback(
    async (data: {
      swapRequestId: string;
      responderId: string;
      isAccepted: boolean;
    }) => {
      try {
        setLoading(true);

        await axiosInstance.put("/TaskSwapRequests/respond", data);

        return true;
      } catch (err: any) {
        setError(err.response?.data?.errors?.[0] || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* ================= REVIEW (MANAGER) ================= */
  const review = useCallback(
    async (data: {
      taskSwapRequestId: string;
      isApproved: boolean;
      reviewNote?: string;
    }) => {
      try {
        setLoading(true);

        await axiosInstance.put("/TaskSwapRequests/review", data);

        return true;
      } catch (err: any) {
        setError(err.response?.data?.errors?.[0] || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* ================= CANCEL ================= */
  const cancel = useCallback(async (id: string, requesterId: string) => {
    try {
      setLoading(true);

      await axiosInstance.delete(`/TaskSwapRequests/${id}/cancel`, {
        data: { requesterId },
      });

      return true;
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSwapCandidates = useCallback(
    async (
      taskAssignmentId: string,
      params?: {
        date?: string;
        preferredStartTime?: string;
      },
      pagination?: PaginationRequest,
    ) => {
      try {
        setLoading(true);

        const res = await axiosInstance.get<PaginatedResult<SwapCandidate>>(
          `/TaskSwapRequests/${taskAssignmentId}/swap-candidates`,
          {
            params: {
              ...params,
              ...pagination,
            },
          },
        );
        return res.data;
      } catch (err: any) {
        console.error("Lỗi lấy danh sách Swap Candidates:", err);
        const errorMsg =
          err?.response?.data?.message ||
          err.message ||
          "Lấy danh sách ứng viên thất bại";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* ================= GET MY SWAP REQUESTS (sent & received) ================= */
  const getMine = useCallback(
    async (
      workerId: string,
      perspective: SwapPerspective = "All",
      pagination?: PaginationRequest,
      status?: SwapRequestStatus,
    ) => {
      try {
        setLoading(true);

        const res = await axiosInstance.get<
          PaginatedResult<TaskSwapRequestListItem>
        >("/TaskSwapRequests/me", {
          params: {
            workerId,
            perspective,
            status,
            ...pagination,
          },
        });

        return res.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,

    getList,
    getById,
    getMine,

    create,
    respond,
    review,
    cancel,
    getSwapCandidates,
  };
};
