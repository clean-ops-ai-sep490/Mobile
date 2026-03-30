import {
  differenceInMilliseconds,
  formatDistanceToNow,
  intervalToDuration,
} from "date-fns";

/**
 * Convert ISO timestamp to relative time format
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Relative time string (e.g., "2 hours ago", "1 day ago")
 */
export const getRelativeTime = (isoTimestamp: string): string => {
  try {
    const date = new Date(isoTimestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Calculate time remaining until expiry
 * @param expiredAt - ISO 8601 timestamp string for expiry
 * @returns Time remaining string (e.g., "23h 45m remaining") or "Expired"
 */
export const getTimeRemaining = (expiredAt: string): string => {
  try {
    const expiryDate = new Date(expiredAt);

    // Check if date is invalid
    if (isNaN(expiryDate.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const remainingMs = differenceInMilliseconds(expiryDate, now);

    if (remainingMs <= 0) {
      return "Expired";
    }

    const duration = intervalToDuration({ start: now, end: expiryDate });

    // Format based on time remaining
    if (duration.days && duration.days > 0) {
      return `${duration.days}d ${duration.hours || 0}h remaining`;
    } else if (duration.hours && duration.hours > 0) {
      return `${duration.hours}h ${duration.minutes || 0}m remaining`;
    } else if (duration.minutes && duration.minutes > 0) {
      return `${duration.minutes}m remaining`;
    } else {
      return "Less than 1m remaining";
    }
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Check if request is urgent (less than 2 hours until expiry)
 * @param expiredAt - ISO 8601 timestamp string for expiry
 * @returns true if less than 2 hours remaining, false otherwise
 */
export const isUrgent = (expiredAt: string): boolean => {
  try {
    const expiryDate = new Date(expiredAt);
    const now = new Date();
    const remainingMs = differenceInMilliseconds(expiryDate, now);

    const twoHoursInMs = 2 * 60 * 60 * 1000;
    return remainingMs > 0 && remainingMs < twoHoursInMs;
  } catch (error) {
    return false;
  }
};
