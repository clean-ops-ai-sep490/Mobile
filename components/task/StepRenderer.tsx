// src/components/task/StepRenderer.tsx
import React from "react";

import "./steps/index";

import { AiFallbackStep, isAiFallbackFulfilled } from "./AiFallbackStep";
import { resolvePlugin } from "./StepRegistry";

// ─── Public helpers ───────────────────────────────────────────────────────────

export function buildInitialState(config: any): any {
  const plugin = resolvePlugin(config);
  // console.log("🔹 buildInitialState", config, plugin?.type);
  if (!plugin) return { __aiGenerated: true };
  return plugin.buildInitialState(config);
}

export function isStepFulfilled(state: any, config: any): boolean {
  const plugin = resolvePlugin(config);
  // console.log("🔹 isStepFulfilled", { state, config, plugin: plugin?.type });
  if (state?.__aiGenerated) return isAiFallbackFulfilled(state);
  if (!plugin) return true;
  return plugin.isFulfilled(state, config);
}

export function getStepLabel(config: any): string {
  const plugin = resolvePlugin(config);
  // console.log("🔹 getStepLabel", config, plugin?.type);
  return plugin?.label ?? "Bước tùy chỉnh";
}

export function serializeStepData(
  state: any,
  config: any,
): Record<string, any> {
  const plugin = resolvePlugin(config);
  // console.log("🔹 serializeStepData", { state, config, plugin: plugin?.type });
  if (state?.__aiGenerated) {
    const { __aiGenerated, __schema, ...data } = state;
    return data;
  }
  if (!plugin?.serialize) return {};
  return plugin.serialize(state);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StepRendererProps {
  stepName: string;
  config: any;
  state: any;
  onChange: (newState: any) => void;
}

export function StepRenderer({
  stepName,
  config,
  state,
  onChange,
}: StepRendererProps) {
  const plugin = resolvePlugin(config);

  // console.log("🔹 StepRenderer", { stepName, config, plugin: plugin?.type });

  if (plugin) {
    const { Component } = plugin;
    return <Component config={config} state={state} onChange={onChange} />;
  }

  // console.warn("⚠️ No plugin detected, falling back to AiFallbackStep", {
  //   stepName,
  //   config,
  // });

  return (
    <AiFallbackStep
      stepName={stepName}
      config={config}
      state={state}
      onChange={onChange}
    />
  );
}
