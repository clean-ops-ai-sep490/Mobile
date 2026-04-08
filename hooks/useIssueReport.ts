import axiosInstance from "@/config/axiosInstance";
import { useCallback, useState } from "react";

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

export interface IssueReport {
  id: string;
  taskAssignmentId: string;
  reportedByWorkerId: string;
  description: string;
  status: "Approved" | "Rejected";
  resolvedByUserId?: string;
  resolvedAt?: string;
  created: string;
  lastModified?: string;
}

export const useIssueReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================= GET ALL =================
  const getAll = useCallback(async (params?: PaginationRequest) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<PaginatedResult<IssueReport>>(
        "/IssueReports",
        { params },
      );
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= GET BY ID =================
  const getById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<IssueReport>(`/IssueReports/${id}`);
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= GET BY WORKER =================
  const getByWorker = useCallback(
    async (workerId: string, params?: PaginationRequest) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<PaginatedResult<IssueReport>>(
          `/IssueReports/worker/${workerId}`,
          { params },
        );
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

  // ================= GET BY TASK =================
  const getByTask = useCallback(
    async (taskAssignmentId: string, params?: PaginationRequest) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<PaginatedResult<IssueReport>>(
          `/IssueReports/task-assignment/${taskAssignmentId}`,
          { params },
        );
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

  // ================= GET BY STATUS =================
  const getByStatus = useCallback(
    async (
      status: "Open" | "Approved" | "Rejected",
      params?: PaginationRequest,
    ) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<PaginatedResult<IssueReport>>(
          `/IssueReports/status/${status}`,
          { params },
        );
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

  // ================= CREATE =================
  const create = useCallback(
    async (data: {
      taskAssignmentId: string;
      reportedByWorkerId: string;
      description: string;
    }) => {
      try {
        setLoading(true);
        const res = await axiosInstance.post<IssueReport>(
          "/IssueReports",
          data,
        );
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

  // ================= UPDATE =================
  const update = useCallback(
    async (
      id: string,
      data: {
        description: string;
      },
    ) => {
      try {
        setLoading(true);
        const res = await axiosInstance.put<IssueReport>(
          `/IssueReports/${id}`,
          data,
        );
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

  // ================= RESOLVE =================
  const resolve = useCallback(
    async (
      id: string,
      data: {
        status: "Approved" | "Rejected";
        resolvedByUserId: string;
      },
    ) => {
      try {
        setLoading(true);
        const res = await axiosInstance.patch<IssueReport>(
          `/IssueReports/${id}/resolve`,
          data,
        );
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

  // ================= DELETE =================
  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/IssueReports/${id}`);
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,

    getAll,
    getById,
    getByWorker,
    getByTask,
    getByStatus,

    create,
    update,
    resolve,
    remove,
  };
};
