import {
  MapLocation,
  WorkerGPS,
  WorkerStatus,
  WorkerWithDistance,
} from "@/types/gps.types";

// ─── GPS UTILITIES ─────────────────────────────────────────────────────────

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export const getDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Calculate distance from a location to multiple workers and sort by distance
 * @param location Target location
 * @param workers Array of workers with GPS data
 * @returns Workers sorted by distance (nearest first)
 */
export const getNearestWorkers = (
  location: MapLocation,
  workers: WorkerGPS[],
): WorkerWithDistance[] => {
  return workers
    .map((worker) => ({
      ...worker,
      distance: getDistance(
        location.latitude,
        location.longitude,
        worker.latitude,
        worker.longitude,
      ),
      status: getWorkerStatus(worker.lastSeen, worker.isOnline),
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 * @param distance Distance in meters
 * @returns Formatted string (e.g., "12m", "1.2km")
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

/**
 * Determine worker status based on lastSeen timestamp
 * @param lastSeen ISO date string
 * @param isOnline Boolean from API
 * @returns Worker status
 */
export const getWorkerStatus = (
  lastSeen: string,
  isOnline: boolean,
): WorkerStatus => {
  if (!isOnline) return "offline";

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  if (diffMinutes < 0.5) return "online"; // < 30 seconds
  if (diffMinutes < 5) return "idle"; // < 5 minutes
  return "offline"; // > 5 minutes
};

/**
 * Get marker color based on worker status
 * @param status Worker status
 * @returns Hex color code
 */
export const getMarkerColor = (status: WorkerStatus): string => {
  switch (status) {
    case "online":
      return "#10B981"; // Green
    case "idle":
      return "#F59E0B"; // Yellow
    case "offline":
      return "#EF4444"; // Red
    default:
      return "#94A3B8"; // Gray
  }
};

/**
 * Get status display text
 * @param status Worker status
 * @returns Display text
 */
export const getStatusText = (status: WorkerStatus): string => {
  switch (status) {
    case "online":
      return "Đang hoạt động";
    case "idle":
      return "Chờ";
    case "offline":
      return "Ngoại tuyến";
    default:
      return "Không xác định";
  }
};
