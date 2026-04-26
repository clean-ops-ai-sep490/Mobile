// ─── GPS TRACKING TYPES ───────────────────────────────────────────────────

export interface WorkerGPS {
  workerId: string;
  workerName: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  isConfirmed: boolean;
  lastSeen: string; // ISO date
}

export interface WorkerGPSParams {
  pageNumber?: number;
  pageSize?: number;
  offlineThresholdMinutes?: number;
}

export interface WorkerGPSResponse {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  content: WorkerGPS[];
}

export interface WorkerWithDistance extends WorkerGPS {
  distance: number; // meters
  status: WorkerStatus; // Add status property
}

export interface MapLocation {
  latitude: number;
  longitude: number;
}

export type WorkerStatus = "online" | "idle" | "offline";

export interface WorkerMarkerData extends WorkerGPS {
  status: WorkerStatus;
}
