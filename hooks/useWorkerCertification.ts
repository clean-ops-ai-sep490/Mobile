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
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

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

  return {
    certifications,
    certificationNames,
    loading,
    error,
    refresh: fetchWorkerCertifications,
  };
};
