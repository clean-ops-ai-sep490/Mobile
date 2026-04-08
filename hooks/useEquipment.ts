import axiosInstance from "@/config/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";

// pagination types (local)
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

export interface EquipmentRequestItem {
  id: string;
  taskAssignmentId: string;
  workerId: string;
  equipmentId: string;
  quantity: number;
  reason?: string;
  status?: string;
  createdAt?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: string | number; // API trả về "DisinfectantSprayer" thay vì number
  description?: string;
}

export interface CreateEquipmentRequestPayload {
  taskAssignmentId: string;
  equipmentId: string;
  quantity: number;
  reason: string;
}

const useEquipment = () => {
  const { getWorkerProfile } = useAuth();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // 🔥 FIX TÍNH NĂNG: Không gọi trực tiếp hàm async ở body hook. Sử dụng useEffect.
  useEffect(() => {
    let isMounted = true;
    const fetchWorkerId = async () => {
      try {
        const profile = await getWorkerProfile();
        if (isMounted && profile?.id) setWorkerId(profile.id);
      } catch (error) {
        console.error("Error fetching worker profile:", error);
      }
    };
    fetchWorkerId();
    return () => {
      isMounted = false;
    };
  }, [getWorkerProfile]);

  // GET danh sách equipment
  const fetchEquipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(
        "/Equipments?pageNumber=1&pageSize=100",
      );
      setEquipmentList(res.data.content ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load equipment list");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 THÊM MỚI: GET equipment by ID để lấy Name
  // Trong useEquipment.ts
  const getEquipmentById = useCallback(
    async (id: string): Promise<EquipmentItem | null> => {
      try {
        const res = await axiosInstance.get(`/Equipments/${id}`);

        // Kiểm tra nếu là mảng thì lấy phần tử đầu tiên, nếu không thì lấy trực tiếp
        const data = Array.isArray(res.data) ? res.data[0] : res.data;

        return data || null;
      } catch (e: any) {
        console.error(`Failed to fetch equipment details for ${id}`, e);
        return null;
      }
    },
    [],
  );

  // POST tạo equipment request
  const createEquipmentRequest = async (
    payload: CreateEquipmentRequestPayload,
  ) => {
    if (!workerId) throw new Error("User not found. Please login again.");

    try {
      setSubmitting(true);
      setError(null);
      const res = await axiosInstance.post("/EquipmentRequests", {
        taskAssignmentId: payload.taskAssignmentId,
        workerId: workerId,
        equipmentId: payload.equipmentId,
        quantity: payload.quantity,
        reason: payload.reason,
      });
      return res.data;
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to submit request");
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  // GET equipment requests by worker (paginated)
  const getByWorker = async (workerId: string, params?: PaginationRequest) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get<
        PaginatedResult<EquipmentRequestItem>
      >(`/EquipmentRequests/worker/${workerId}`, { params });
      return res.data;
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to fetch equipment requests",
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    equipmentList,
    loading,
    submitting,
    error,
    fetchEquipments,
    getEquipmentById, // Trả hàm mới ra ngoài
    createEquipmentRequest,
    getByWorker,
  };
};

export default useEquipment;
