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
  taskAssignmentId?: string | null; // optional, nhưng bắt buộc nếu không có leaveDateFrom/to
  leaveDateFrom?: string; // bắt buộc nếu không có taskAssignmentId
  leaveDateTo?: string; // bắt buộc nếu không có taskAssignmentId
  audioFile?: File | { uri: string; name: string; type?: string }; // hỗ trợ cả File và RNAudioFile
  transcription?: string | null;
}

export interface UpdateEmergencyLeaveRequestPayload {
  leaveDateFrom?: string;
  leaveDateTo?: string;
  audioFile?: File | { uri: string; name: string; type?: string }; // hỗ trợ cả File và RNAudioFile
  transcription?: string | null;
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

        console.log(
          "👉 1. PAYLOAD TỪ COMPONENT GỬI SANG HOOK:",
          JSON.stringify(payload, null, 2),
        );

        const formData = new FormData();
        formData.append("workerId", payload.workerId);

        // 🔴 ĐÃ FIX LỖI 400: CHỈ APPEND KHI CÓ taskAssignmentId
        // Tuyệt đối không append chuỗi rỗng ""
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

        // 🚀 LOG CHÍNH XÁC NHỮNG GÌ SẼ GỬI QUA AXIOS
        console.log(
          "👉 2. FORM DATA CHUẨN BỊ GỬI ĐI (Ruột _parts):",
          JSON.stringify((formData as any)._parts, null, 2),
        );

        const res = await axiosInstance.post<EmergencyLeaveRequestDto>(
          "/EmergencyLeaveRequests",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        return res.data;
      } catch (err: any) {
        // 🔴 LOG CHI TIẾT LỖI 400 TỪ BACKEND
        console.log(
          "🔥 LỖI TỪ BACKEND TRẢ VỀ:",
          JSON.stringify(err.response?.data, null, 2),
        );

        const errorData = err.response?.data;
        const errorMessage =
          errorData?.message ||
          errorData?.detail ||
          (errorData?.errors ? JSON.stringify(errorData.errors) : null) ||
          err.message;

        setError(errorMessage);
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
