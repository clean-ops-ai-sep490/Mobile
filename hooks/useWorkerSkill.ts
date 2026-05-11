import axiosInstance from "@/config/axiosInstance";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface WorkerSkillItem {
  skillId: string;
  name: string;
  category: string;
  skillLevel: string;
}

interface WorkerSkillApiItem {
  skillId?: string;
  name?: string;
  category?: string;
  skillLevel?: string;
}

interface UseWorkerSkillReturn {
  skills: WorkerSkillItem[];
  skillNames: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useWorkerSkill = (
  workerId?: string | null,
): UseWorkerSkillReturn => {
  const [skills, setSkills] = useState<WorkerSkillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkerSkills = useCallback(async () => {
    if (!workerId) {
      setSkills([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get<WorkerSkillApiItem[]>(
        `/Skills/worker/${workerId}/skills`,
      );

      const mapped = (response.data ?? [])
        .map((item) => ({
          skillId: item.skillId ?? "",
          name: (item.name ?? "").trim(),
          category: (item.category ?? "").trim(),
          skillLevel: (item.skillLevel ?? "").trim(),
        }))
        .filter((item) => item.skillId && item.name);

      setSkills(mapped);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Lấy danh sách kỹ năng thất bại",
      );
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerSkills();
  }, [fetchWorkerSkills]);

  const skillNames = useMemo(
    () => Array.from(new Set(skills.map((item) => item.name))),
    [skills],
  );

  return {
    skills,
    skillNames,
    loading,
    error,
    refresh: fetchWorkerSkills,
  };
};
