import axiosInstance from "@/config/axiosInstance";
import { AdhocTask, CreateAdhocTaskRequest } from "@/types/adhocTask.types";

// ─── ADHOC TASK SERVICE ────────────────────────────────────────────────────

const createAdhocTask = async (
  data: CreateAdhocTaskRequest,
): Promise<AdhocTask> => {
  const response = await axiosInstance.post("/TaskAssignments/adhoc", data);
  return response.data;
};

export const adhocTaskService = {
  createAdhocTask,
};
