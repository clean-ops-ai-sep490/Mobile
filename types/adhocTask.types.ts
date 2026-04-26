// ─── ADHOC TASK TYPES ──────────────────────────────────────────────────────

export interface CreateAdhocTaskRequest {
  assigneeId: string;
  workAreaId: string;
  displayLocation: string;
  startAt: string; // ISO 8601 format: "2026-04-18T16:18:24.886Z"
  durationMinutes: number;
  name: string;
}

export interface AdhocTask {
  id: string;
  assigneeId: string;
  workAreaId: string;
  displayLocation: string;
  startAt: string;
  durationMinutes: number;
  name: string;
  status?: string;
  createdAt?: string;
}
