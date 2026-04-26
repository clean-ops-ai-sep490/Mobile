import axiosInstance from "@/config/axiosInstance";
import { WorkerGPSParams, WorkerGPSResponse } from "@/types/gps.types";

// ─── GPS SERVICE ───────────────────────────────────────────────────────────

const toQueryString = (params?: WorkerGPSParams): string => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.pageNumber)
    searchParams.append("pageNumber", params.pageNumber.toString());
  if (params.pageSize)
    searchParams.append("pageSize", params.pageSize.toString());
  if (params.offlineThresholdMinutes)
    searchParams.append(
      "offlineThresholdMinutes",
      params.offlineThresholdMinutes.toString(),
    );
  return `?${searchParams.toString()}`;
};

/**
 * Get worker GPS by work area
 * GET /api/WorkAreaSupervisors/workareas/{workAreaId}/workers/gps
 */
const getWorkerGPSByWorkArea = async (
  workAreaId: string,
  params?: WorkerGPSParams,
): Promise<WorkerGPSResponse> => {
  const response = await axiosInstance.get(
    `/WorkAreaSupervisors/workareas/${workAreaId}/workers/gps${toQueryString(params)}`,
  );
  return response.data;
};

export const gpsService = {
  getWorkerGPSByWorkArea,
};
