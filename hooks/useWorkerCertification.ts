import axiosInstance from "@/config/axiosInstance";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface WorkerCertificationItem {
  certificationId: string;
  name: string;
  category: string;
  issuingOrganization: string;
  expiredAt: string;
}

interface WorkerCertificationApiItem {
  certificationId?: string;
  name?: string;
  category?: string;
  issuingOrganization?: string;
  expiredAt?: string;
}

interface UseWorkerCertificationReturn {
  certifications: WorkerCertificationItem[];
  certificationNames: string[];
  categories: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCertificationsByCategory: (
    category: string,
  ) => Promise<WorkerCertificationItem[]>;
}

export const mapCertCategory = (category: string): string => {
  const map: Record<string, string> = {
    "Building Cleaning": "Vệ sinh công trình",
    Chemical: "Hóa chất",
    Cleaning: "Vệ sinh",
    Equipment: "Thiết bị",
    "Healthcare Hygiene": "Vệ sinh y tế",
    "Laboratory Safety": "An toàn phòng thí nghiệm",
    Management: "Quản lý",
    Safety: "An toàn",
    "Workplace Safety": "An toàn lao động",
  };
  return map[category] || category;
};

export const useWorkerCertification = (
  workerId?: string | null,
): UseWorkerCertificationReturn => {
  const [certifications, setCertifications] = useState<
    WorkerCertificationItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkerCertifications = useCallback(async () => {
    if (!workerId) {
      setCertifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get<WorkerCertificationApiItem[]>(
        `/Certifications/worker/${workerId}/certifications`,
      );

      const mapped = (response.data ?? [])
        .map((item) => ({
          certificationId: item.certificationId ?? "",
          name: (item.name ?? "").trim(),
          category: (item.category ?? "").trim(),
          issuingOrganization: (item.issuingOrganization ?? "").trim(),
          expiredAt: item.expiredAt ?? "",
        }))
        .filter((item) => item.certificationId && item.name);

      setCertifications(mapped);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Lấy danh sách chứng chỉ thất bại",
      );
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerCertifications();
  }, [fetchWorkerCertifications]);

  const certificationNames = useMemo(
    () => Array.from(new Set(certifications.map((item) => item.name))),
    [certifications],
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(certifications.map((item) => item.category).filter(Boolean)),
      ),
    [certifications],
  );

  const getCertificationsByCategory = useCallback(
    async (category: string): Promise<WorkerCertificationItem[]> => {
      if (!category.trim()) return [];

      const response = await axiosInstance.get<
        {
          id?: string;
          name?: string;
          category?: string;
          issuingOrganization?: string;
        }[]
      >("/Certifications/by-category", {
        params: { category },
      });

      const byCategory = (response.data ?? [])
        .map((item) => ({
          certificationId: item.id ?? "",
          name: (item.name ?? "").trim(),
          category: (item.category ?? "").trim(),
          issuingOrganization: (item.issuingOrganization ?? "").trim(),
          expiredAt: "",
        }))
        .filter((item) => item.certificationId && item.name);

      const workerCertMap = new Map(
        certifications.map((item) => [item.certificationId, item]),
      );
      return byCategory
        .map((item) => {
          const workerItem = workerCertMap.get(item.certificationId);
          return workerItem
            ? {
                ...item,
                issuingOrganization: workerItem.issuingOrganization,
                expiredAt: workerItem.expiredAt,
              }
            : item;
        })
        .filter((item) => workerCertMap.has(item.certificationId));
    },
    [certifications],
  );

  return {
    certifications,
    certificationNames,
    categories,
    loading,
    error,
    refresh: fetchWorkerCertifications,
    getCertificationsByCategory,
  };
};
