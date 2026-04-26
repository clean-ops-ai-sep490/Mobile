// ─── WORKER TYPES ──────────────────────────────────────────────────────────

export interface Worker {
  id: string;
  userId: string;
  fullName: string;
  displayAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string;
  totalSkills: number;
  totalCertifications: number;
}

export interface WorkerFilterParams {
  address?: string;
  skillCategories?: string[];
  certificateCategories?: string[];
  startAt?: string; // ISO 8601 format
  endAt?: string; // ISO 8601 format
}
