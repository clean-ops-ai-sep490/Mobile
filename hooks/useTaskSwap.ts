import axiosInstance from "@/lib/axios";
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
}

export interface TaskSwapRequestListItem {
  id: string;
  taskAssignmentId: string;
  requesterId: string;
  targetWorkerId?: string;
  status: SwapRequestStatus;
  reviewedByUserId?: string;
}

/* ================= HOOK ================= */

export const useTaskSwap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= GET LIST ================= */
  const getList = useCallback(
    async (
      params?: {
        status?: SwapRequestStatus;
      },
      pagination?: PaginationRequest,
    ) => {
      try {
        setLoading(true);

        const res = await axiosInstance.get<
          PaginatedResult<TaskSwapRequestListItem>
        >("/taskSwapRequests", {
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
        `/taskSwapRequests/${id}`,
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
          "/taskSwapRequests",
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

        await axiosInstance.put("/taskSwapRequests/respond", data);

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

        await axiosInstance.put("/taskSwapRequests/review", data);

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

      await axiosInstance.delete(`/taskSwapRequests/${id}/cancel`, {
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

  return {
    loading,
    error,

    getList,
    getById,

    create,
    respond,
    review,
    cancel,
  };
};
