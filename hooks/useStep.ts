// src/hooks/useSteps.ts

import axiosInstance from "@/config/axiosInstance";
import { useCallback, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────

export interface StepDto {
  id: string;
  actionKey: string;
  name: string;
  description?: string;
  configSchema: any; // BE trả JsonElement → FE parse thành object
}

export interface PaginatedResult<T> {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  content: T[];
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useSteps() {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<StepDto[]>([]);

  // ─── GET ALL STEPS ─────────────────────────────────────────────────

  const getSteps = useCallback(
    async (pageNumber = 1, pageSize = 50): Promise<StepDto[]> => {
      const url = `/Steps?pageNumber=${pageNumber}&pageSize=${pageSize}`;

      //   console.log("📤 [Step API] GET", url, {
      //     timestamp: new Date().toISOString(),
      //   });

      setLoading(true);

      try {
        const res = await axiosInstance.get<PaginatedResult<StepDto>>(url);

        const data = res.data;

        // console.log("✅ [Step API] GET Success", {
        //   total: data.totalElements,
        //   returned: data.content.length,
        //   timestamp: new Date().toISOString(),
        // });

        setSteps(data.content);

        return data.content;
      } catch (error: any) {
        // console.error("❌ [Step API] GET ERROR", {
        //   message: error?.message,
        //   response: error?.response?.data,
        //   timestamp: new Date().toISOString(),
        // });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ─── GET STEP BY ID (API + CACHE) ────────────────────────────────────

  const getStepById = useCallback(
    async (stepId: string): Promise<StepDto | null> => {
      // 🔹 1. check cache trước
      const cached = steps.find((s) => s.id === stepId);
      if (cached) {
        // console.log("⚡ [Step API] Cache hit", {
        //   stepId,
        //   timestamp: new Date().toISOString(),
        // });
        return cached;
      }

      const url = `/Steps/${stepId}`;

      //   console.log("📤 [Step API] GET BY ID", url, {
      //     stepId,
      //     timestamp: new Date().toISOString(),
      //   });

      setLoading(true);

      try {
        const res = await axiosInstance.get<StepDto>(url);

        let step = res.data;

        // 🔥 FIX nếu BE trả JsonElement dạng string
        if (typeof step.configSchema === "string") {
          try {
            step.configSchema = JSON.parse(step.configSchema);
          } catch {
            console.warn("⚠️ Failed to parse configSchema");
          }
        }

        // console.log("✅ [Step API] GET BY ID Success", {
        //   stepId,
        //   actionKey: step.actionKey,
        //   timestamp: new Date().toISOString(),
        // });

        // 🔥 update cache
        setSteps((prev) => {
          const exists = prev.some((s) => s.id === step.id);
          return exists ? prev : [...prev, step];
        });

        return step;
      } catch (error: any) {
        // console.error("❌ [Step API] GET BY ID ERROR", {
        //   stepId,
        //   message: error?.message,
        //   response: error?.response?.data,
        //   timestamp: new Date().toISOString(),
        // });

        return null;
      } finally {
        setLoading(false);
      }
    },
    [steps],
  );

  // ─── HELPER: MAP STEP CONFIG (QUAN TRỌNG) ──────────────────────────

  const buildStepConfig = useCallback(
    (stepDef: StepDto | undefined, configDetailRaw: string | null) => {
      let configDetail = {};

      try {
        configDetail = configDetailRaw ? JSON.parse(configDetailRaw) : {};
      } catch (err) {
        console.warn("⚠️ Invalid configDetail JSON", configDetailRaw);
      }

      return {
        ...configDetail,

        // 🔥 KEY FIX
        actionKey: stepDef?.actionKey,
        "x-behavior": stepDef?.configSchema?.["x-behavior"],
      };
    },
    [],
  );

  return {
    loading,
    steps,

    getSteps,
    getStepById,
    buildStepConfig,
  };
}
