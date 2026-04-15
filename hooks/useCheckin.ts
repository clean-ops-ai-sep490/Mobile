import axiosInstance from "@/config/axiosInstance";
import { useState } from "react";

export interface QRScanResult {
  valid: boolean;
  message?: string;
  raw?: string;

  checkinRecordId?: string;
  checkinAt?: string;

  checkinPointId?: string;
  workareaId?: string;
  code?: string;

  verifiedAt?: string;
}

interface CheckinParams {
  raw: string;
  workerId: string;

  taskId?: string;
  taskStepId?: string;

  deviceUuid?: string;
  notes?: string;
}

export function useCheckin() {
  const [loading, setLoading] = useState(false);

  const checkinByQr = async ({
    raw,
    workerId,
    taskId,
    taskStepId,
    deviceUuid,
    notes,
  }: CheckinParams): Promise<QRScanResult> => {
    setLoading(true);

    try {
      // 1. parse QR
      let parsed: { id: string; code?: string };

      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("QR không hợp lệ");
      }

      if (!parsed?.id) {
        throw new Error("QR thiếu checkinPointId");
      }

      // 2. get checkin point
      const pointRes = await axiosInstance.get(
        `/WorkareaCheckinPoints/${parsed.id}`,
      );

      const point = pointRes.data;

      // 3. call checkin API
      const checkinRes = await axiosInstance.post("/CheckinRecords/checkin", {
        checkinPointId: parsed.id,
        workerId,
        code: parsed.code,

        workareaId: point.workareaId,

        deviceUuid: deviceUuid ?? null,

        taskId: taskId ?? null,
        taskStepId: taskStepId ?? null,

        notes: notes ?? "QR scan from mobile",
      });

      console.log("🔥 Checkin api response:", checkinRes.data);

      const checkin = checkinRes.data;

      return {
        valid: true,
        raw,

        checkinRecordId: checkin.id,
        checkinAt: checkin.checkinAt,

        checkinPointId: point.id,
        workareaId: point.workareaId,
        code: point.code,

        verifiedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        valid: false,
        raw,
        message:
          err?.response?.data?.message || err.message || "Check-in thất bại",
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkinByQr,
    loading,
  };
}
