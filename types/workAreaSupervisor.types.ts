// ─── WORK AREA SUPERVISOR TYPES ───────────────────────────────────────────

export interface WorkAreaSupervisor {
  workAreaId: string;
  workAreaName: string;
  zoneName: string;
  locationName: string;
  displayLocation: string;
}

export interface WorkAreaWorker {
  id: string;
  workAreaId: string;
  workerId: string;
  supervisorId: string;
  workerName: string;
  created: string;
}

export interface PaginationRequest {
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  content: T[];
}
