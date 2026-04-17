import axiosInstance from "@/config/axiosInstance";
import { useState } from "react";

export interface CheckinResult {
  valid: boolean;
  message?: string;
  raw?: string;

  checkinRecordId?: string;
  checkinAt?: string;

  checkinPointId?: string;
  workareaId?: string;
  code?: string;

  // BLE specific
  deviceId?: string;
  deviceName?: string;
  deviceUuid?: string;

  verifiedAt?: string;
}

interface CheckinParams {
  workerId: string;
  checkinPointId: string;

  // QR specific
  raw?: string;
  code?: string;
  workareaId?: string;

  // BLE specific
  deviceUuid?: string;

  // Task context
  taskId?: string;
  taskStepId?: string;
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
  }: CheckinParams & { raw: string }): Promise<CheckinResult> => {
    setLoading(true);

    try {
      let parsed: { id: string; code?: string };

      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("QR không hợp lệ");
      }

      if (!parsed?.id) {
        throw new Error("QR thiếu checkinPointId");
      }

      const pointRes = await axiosInstance.get(
        `/WorkareaCheckinPoints/${parsed.id}`,
      );

      const point = pointRes.data;

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

  const checkinByBle = async ({
    workerId,
    checkinPointId,
    deviceUuid,
    taskId,
    taskStepId,
    notes,
  }: CheckinParams & { deviceUuid: string }): Promise<CheckinResult> => {
    setLoading(true);

    try {
      const pointRes = await axiosInstance.get(
        `/WorkareaCheckinPoints/${checkinPointId}`,
      );
      const point = pointRes.data;

      const checkinRes = await axiosInstance.post("/CheckinRecords/checkin", {
        checkinPointId,
        workerId,
        code: point.code,
        workareaId: null, // BLE không cần workareaId trong request
        deviceUuid,
        taskId: taskId ?? null,
        taskStepId: taskStepId ?? null,
        notes: notes ?? "BLE scan from mobile",
      });

      const checkin = checkinRes.data;

      return {
        valid: true,
        checkinRecordId: checkin.id,
        checkinAt: checkin.checkinAt,
        checkinPointId: point.id,
        workareaId: point.workareaId,
        code: point.code,
        deviceUuid,
        verifiedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        valid: false,
        message:
          err?.response?.data?.message ||
          err.message ||
          "BLE Check-in thất bại",
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkinByQr,
    checkinByBle,
    loading,
  };
}
