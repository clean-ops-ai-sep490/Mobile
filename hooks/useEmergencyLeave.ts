import axiosInstance from "@/config/axiosInstance";
import { useCallback, useState } from "react";

/* ================= TYPES ================= */

export type RequestStatus = "Pending" | "Approved" | "Rejected";

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

export interface EmergencyLeaveRequestDto {
  id: string;
  workerId: string;
  taskAssignmentId?: string;
  leaveDateFrom: string;
  leaveDateTo: string;
  audioUrl?: string;
  transcription?: string;
  status: RequestStatus;
  reviewedByUserId?: string;
  approvedAt?: string;
  created: string;
  lastModified?: string;
}

export interface CreateEmergencyLeaveRequestPayload {
  workerId: string;
  taskAssignmentId?: string;
  leaveDateFrom?: string; // bắt buộc nếu không có taskAssignmentId
  leaveDateTo?: string; // bắt buộc nếu không có taskAssignmentId
  audioFile?: File | { uri: string; name: string; type?: string }; // hỗ trợ cả File và RNAudioFile
  transcription?: string;
}

export interface UpdateEmergencyLeaveRequestPayload {
  leaveDateFrom?: string;
  leaveDateTo?: string;
  audioFile?: File | { uri: string; name: string; type?: string }; // hỗ trợ cả File và RNAudioFile
  transcription?: string;
}

export interface ReviewEmergencyLeaveRequestPayload {
  status: RequestStatus; // "Approved" | "Rejected"
}

/* ================= HOOK ================= */

export const useEmergencyLeaveRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= GET BY ID ================= */
  const getById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<EmergencyLeaveRequestDto>(
        `/EmergencyLeaveRequests/${id}`,
      );
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= GET LIST (phân trang) ================= */
  const getList = useCallback(async (pagination?: PaginationRequest) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<
        PaginatedResult<EmergencyLeaveRequestDto>
      >("/EmergencyLeaveRequests", { params: { ...pagination } });
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= GET BY WORKER ID ================= */
  const getListByWorkerId = useCallback(
    async (workerId: string, pagination?: PaginationRequest) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<
          PaginatedResult<EmergencyLeaveRequestDto>
        >(`/EmergencyLeaveRequests/worker/${workerId}`, {
          params: { ...pagination },
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

  /* ================= GET BY TASK ASSIGNMENT ID ================= */
  const getListByTaskAssignmentId = useCallback(
    async (taskAssignmentId: string, pagination?: PaginationRequest) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<
          PaginatedResult<EmergencyLeaveRequestDto>
        >(`/EmergencyLeaveRequests/task-assignment/${taskAssignmentId}`, {
          params: { ...pagination },
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

  /* ================= GET BY STATUS ================= */
  const getListByStatus = useCallback(
    async (status: RequestStatus, pagination?: PaginationRequest) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<
          PaginatedResult<EmergencyLeaveRequestDto>
        >("/EmergencyLeaveRequests/status", {
          params: { status, ...pagination },
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

  /* ================= GET BY DATE RANGE ================= */
  const getListByDateRange = useCallback(
    async (from: string, to: string, pagination?: PaginationRequest) => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<
          PaginatedResult<EmergencyLeaveRequestDto>
        >("/EmergencyLeaveRequests/date-range", {
          params: { from, to, ...pagination },
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

  /* ================= CREATE ================= */
  const createRequest = useCallback(
    async (payload: CreateEmergencyLeaveRequestPayload) => {
      try {
        setLoading(true);

        const formData = new FormData();
        formData.append("workerId", payload.workerId);

        if (payload.taskAssignmentId) {
          formData.append("taskAssignmentId", payload.taskAssignmentId);
        }
        if (payload.leaveDateFrom) {
          formData.append("leaveDateFrom", payload.leaveDateFrom);
        }
        if (payload.leaveDateTo) {
          formData.append("leaveDateTo", payload.leaveDateTo);
        }
        if (payload.audioFile) {
          const af: any = payload.audioFile;
          if (af && typeof af.uri === "string") {
            // React Native file object: append the object directly (RN FormData expects { uri, name, type })
            formData.append("audioFile", {
              uri: af.uri,
              name: af.name,
              type: af.type ?? "audio/m4a",
            } as any);
          } else {
            // Browser File
            formData.append(
              "audioFile",
              payload.audioFile as File,
              (payload.audioFile as File).name,
            );
          }
        }
        if (payload.transcription) {
          formData.append("transcription", payload.transcription);
        }

        const res = await axiosInstance.post<EmergencyLeaveRequestDto>(
          "/EmergencyLeaveRequests",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
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

  /* ================= UPDATE ================= */
  const update = useCallback(
    async (id: string, payload: UpdateEmergencyLeaveRequestPayload) => {
      try {
        setLoading(true);

        const formData = new FormData();
        if (payload.leaveDateFrom) {
          formData.append("leaveDateFrom", payload.leaveDateFrom);
        }
        if (payload.leaveDateTo) {
          formData.append("leaveDateTo", payload.leaveDateTo);
        }
        if (payload.audioFile) {
          const af: any = payload.audioFile;
          if (af && typeof af.uri === "string") {
            formData.append("audioFile", {
              uri: af.uri,
              name: af.name,
              type: af.type ?? "audio/m4a",
            } as any);
          } else {
            formData.append(
              "audioFile",
              payload.audioFile as File,
              (payload.audioFile as File).name,
            );
          }
        }
        if (payload.transcription) {
          formData.append("transcription", payload.transcription);
        }

        const res = await axiosInstance.put<EmergencyLeaveRequestDto>(
          `/EmergencyLeaveRequests/${id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
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

  /* ================= REVIEW (MANAGER) ================= */
  const review = useCallback(
    async (id: string, payload: ReviewEmergencyLeaveRequestPayload) => {
      try {
        setLoading(true);
        const res = await axiosInstance.put<EmergencyLeaveRequestDto>(
          `/EmergencyLeaveRequests/${id}/review`,
          payload,
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

  /* ================= DELETE ================= */
  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/EmergencyLeaveRequests/${id}`);
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

    getById,
    getList,
    getListByWorkerId,
    getListByTaskAssignmentId,
    getListByStatus,
    getListByDateRange,

    createRequest,
    update,
    review,
    remove,
  };
};
