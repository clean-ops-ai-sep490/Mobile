// ─── DATE UTILITY FUNCTIONS ────────────────────────────────────────────────

export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const calculateEndTime = (
  startDate: string,
  startTime: string,
  durationMinutes: number,
): string => {
  try {
    // Parse as UTC by appending Z to avoid local timezone shifting
    const startAt = `${startDate}T${startTime}.000Z`;
    const startDateTime = new Date(startAt);

    if (isNaN(startDateTime.getTime())) {
      throw new Error("Invalid date time");
    }

    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60000,
    );

    if (isNaN(endDateTime.getTime())) {
      throw new Error("Invalid end date time");
    }

    // Return as ISO string without the trailing Z to match startAt format
    return endDateTime.toISOString().slice(0, 19);
  } catch (error) {
    console.error("Error calculating end time:", error);
    const now = new Date();
    return now.toISOString().slice(0, 19);
  }
};

export const formatStartAt = (startDate: string, startTime: string): string => {
  return `${startDate}T${startTime}.000Z`;
};
