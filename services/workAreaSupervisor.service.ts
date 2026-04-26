import axiosInstance from "@/config/axiosInstance";
import {
  PaginatedResult,
  PaginationRequest,
  WorkAreaSupervisor,
  WorkAreaWorker,
} from "@/types/workAreaSupervisor.types";

// ─── WORK AREA SUPERVISOR SERVICE ─────────────────────────────────────────

const toQueryString = (params?: PaginationRequest): string => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.pageNumber)
    searchParams.append("pageNumber", params.pageNumber.toString());
  if (params.pageSize)
    searchParams.append("pageSize", params.pageSize.toString());
  return `?${searchParams.toString()}`;
};

/**
 * Get work areas by supervisor
 * GET /api/WorkAreaSupervisors/workareas/{supervisorId}
 */
const getWorkAreasBySupervisor = async (
  supervisorId: string,
  params?: PaginationRequest,
): Promise<PaginatedResult<WorkAreaSupervisor>> => {
  const response = await axiosInstance.get(
    `/WorkAreaSupervisors/workareas/${supervisorId}${toQueryString(params)}`,
  );
  return response.data;
};

/**
 * Get workers by supervisor
 * GET /api/WorkAreaSupervisors/supervisors/{supervisorId}/workers
 */
const getWorkersBySupervisor = async (
  supervisorId: string,
  params?: PaginationRequest,
): Promise<PaginatedResult<WorkAreaWorker>> => {
  const response = await axiosInstance.get(
    `/WorkAreaSupervisors/supervisors/${supervisorId}/workers${toQueryString(params)}`,
  );
  return response.data;
};

/**
 * Get workers by work area
 * GET /api/WorkAreaSupervisors/workareas/{workAreaId}/workers
 */
const getWorkersByWorkArea = async (
  workAreaId: string,
  params?: PaginationRequest,
): Promise<PaginatedResult<WorkAreaWorker>> => {
  const response = await axiosInstance.get(
    `/WorkAreaSupervisors/workareas/${workAreaId}/workers${toQueryString(params)}`,
  );
  return response.data;
};

export const workAreaSupervisorService = {
  getWorkAreasBySupervisor,
  getWorkersBySupervisor,
  getWorkersByWorkArea,
};
