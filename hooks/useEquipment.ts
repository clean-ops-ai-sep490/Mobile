import axiosInstance from "@/config/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EquipmentItem {
  id: string;
  name: string;
  type: number;
  description?: string;
}

export interface CreateEquipmentRequestPayload {
  taskAssignmentId: string;
  equipmentId: string;
  quantity: number;
  reason: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
const useEquipment = () => {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // POST tạo equipment request
  const createEquipmentRequest = async (
    payload: CreateEquipmentRequestPayload,
  ) => {
    if (!user?.userId) throw new Error("User not found. Please login again.");

    try {
      setSubmitting(true);
      setError(null);
      const res = await axiosInstance.post("/EquipmentRequests", {
        taskAssignmentId: payload.taskAssignmentId,
        workerId: user.userId,
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

  return {
    equipmentList,
    loading,
    submitting,
    error,
    fetchEquipments,
    createEquipmentRequest,
  };
};

export default useEquipment;
