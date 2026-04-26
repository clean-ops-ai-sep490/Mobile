import { useAdhocTask } from "@/hooks/useAdhocTask";
import { useWorker } from "@/hooks/useWorker";
import { formatStartAt, getCurrentDate } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

// ─── TYPES ─────────────────────────────────────────────────────────────────

type UrgencyLevel = "Normal" | "High" | "Critical";

interface UseEmergencyTaskFormProps {
  workAreaId?: string;
  preselectedWorker?: {
    id: string;
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  onSuccess: () => void;
}

interface UseEmergencyTaskFormReturn {
  assigneeId: string;
  selectedWorkerName: string;
  displayLocation: string;
  taskName: string;
  startDate: string;
  startTime: string;
  durationMinutes: string;
  urgency: UrgencyLevel;
  showWorkerDropdown: boolean;
  workers: ReturnType<typeof useWorker>["workers"];
  loadingWorkers: boolean;
  loading: boolean;
  error: string | null;
  setDisplayLocation: (value: string) => void;
  setTaskName: (value: string) => void;
  setStartTime: (value: string) => void;
  setDurationMinutes: (value: string) => void;
  setUrgency: (value: UrgencyLevel) => void;
  setShowWorkerDropdown: (value: boolean) => void;
  handleSelectWorker: (workerId: string, workerName: string) => void;
  handleReset: () => void;
  handleCreate: () => Promise<void>;
}

// ─── HOOK ──────────────────────────────────────────────────────────────────

export const useEmergencyTaskForm = ({
  workAreaId,
  preselectedWorker,
  location,
  onSuccess,
}: UseEmergencyTaskFormProps): UseEmergencyTaskFormReturn => {
  const { createAdhocTask, loading, error } = useAdhocTask();
  const {
    workers,
    loading: loadingWorkers,
    fetchWorkersByWorkArea,
  } = useWorker();

  const [assigneeId, setAssigneeId] = useState("");
  const [selectedWorkerName, setSelectedWorkerName] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Normal");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);

  useEffect(() => {
    const now = new Date();
    setStartDate(getCurrentDate());
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const hours = String(nextHour.getHours()).padStart(2, "0");
    const minutes = String(nextHour.getMinutes()).padStart(2, "0");
    setStartTime(`${hours}:${minutes}:00`);

    // Set preselected data if provided
    if (preselectedWorker) {
      setAssigneeId(preselectedWorker.id);
      setSelectedWorkerName(preselectedWorker.name);
    }

    if (location) {
      // Generate a display location from coordinates
      setDisplayLocation(
        `Vị trí: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      );
    }
  }, [preselectedWorker, location]);

  useEffect(() => {
    if (workAreaId) {
      fetchWorkersByWorkArea(workAreaId);
    }
  }, [workAreaId]);

  const handleSelectWorker = (workerId: string, workerName: string) => {
    setAssigneeId(workerId);
    setSelectedWorkerName(workerName);
    setShowWorkerDropdown(false);
  };

  const handleReset = () => {
    setAssigneeId("");
    setSelectedWorkerName("");
    setDisplayLocation("");
    setTaskName("");
    setStartTime("");
    setDurationMinutes("60");
    setUrgency("Normal");
    setShowWorkerDropdown(false);
  };

  const validateForm = (): boolean => {
    if (!workAreaId) {
      Alert.alert("Lỗi", "Vui lòng chọn khu vực");
      return false;
    }
    if (!assigneeId) {
      Alert.alert("Lỗi", "Vui lòng chọn nhân viên");
      return false;
    }
    if (!displayLocation) {
      Alert.alert("Lỗi", "Vui lòng nhập địa điểm hiển thị");
      return false;
    }
    if (!taskName) {
      Alert.alert("Lỗi", "Vui lòng nhập tên task");
      return false;
    }
    if (!startDate || !startTime) {
      Alert.alert("Lỗi", "Vui lòng chọn thời gian bắt đầu");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const startAt = formatStartAt(startDate, startTime);

    const success = await createAdhocTask({
      assigneeId,
      workAreaId: workAreaId!,
      displayLocation,
      startAt,
      durationMinutes: parseInt(durationMinutes) || 60,
      name: taskName,
    });

    if (success) {
      Alert.alert("Thành công", "Tạo task khẩn cấp thành công", [
        { text: "OK", onPress: onSuccess },
      ]);
    } else {
      Alert.alert("Lỗi", error || "Tạo task thất bại");
    }
  };

  return {
    assigneeId,
    selectedWorkerName,
    displayLocation,
    taskName,
    startDate,
    startTime,
    durationMinutes,
    urgency,
    showWorkerDropdown,
    workers,
    loadingWorkers,
    loading,
    error,
    setDisplayLocation,
    setTaskName,
    setStartTime,
    setDurationMinutes,
    setUrgency,
    setShowWorkerDropdown,
    handleSelectWorker,
    handleReset,
    handleCreate,
  };
};
