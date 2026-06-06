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
  categories: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSkillsByCategory: (category: string) => Promise<WorkerSkillItem[]>;
}

export const mapSkillLevel = (level: string): string => {
  const map: Record<string, string> = {
    Beginner: "Cơ bản",
    Intermediate: "Trung cấp",
    Advanced: "Nâng cao",
  };
  return map[level] || level || "Không có";
};

export const mapSkillCategory = (category: string): string => {
  const map: Record<string, string> = {
    Chemical: "Hóa chất",
    Cleaning: "Vệ sinh",
    Equipment: "Thiết bị",
    Maintenance: "Bảo trì",
    Safety: "An toàn",
    SoftSkill: "Kỹ năng mềm",
  };
  return map[category] || category;
};

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

  const categories = useMemo(
    () =>
      Array.from(new Set(skills.map((item) => item.category).filter(Boolean))),
    [skills],
  );

  const getSkillsByCategory = useCallback(
    async (category: string): Promise<WorkerSkillItem[]> => {
      if (!category.trim()) return [];

      const response = await axiosInstance.get<
        {
          id?: string;
          name?: string;
          category?: string;
          description?: string;
        }[]
      >("/Skills/by-category", {
        params: { category },
      });

      const byCategory = (response.data ?? [])
        .map((item) => ({
          skillId: item.id ?? "",
          name: (item.name ?? "").trim(),
          category: (item.category ?? "").trim(),
          skillLevel: "",
        }))
        .filter((item) => item.skillId && item.name);

      const workerSkillIdSet = new Set(skills.map((item) => item.skillId));
      return byCategory
        .map((item) => {
          const workerItem = skills.find((x) => x.skillId === item.skillId);
          return workerItem
            ? { ...item, skillLevel: workerItem.skillLevel }
            : item;
        })
        .filter((item) => workerSkillIdSet.has(item.skillId));
    },
    [skills],
  );

  return {
    skills,
    skillNames,
    categories,
    loading,
    error,
    refresh: fetchWorkerSkills,
    getSkillsByCategory,
  };
};
