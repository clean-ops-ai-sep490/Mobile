// src/components/task/stepRegistry.ts
// Core registry — StepRenderer chỉ đọc từ đây, không biết gì về step types

import { ComponentType } from "react";

// ─── Contract mỗi step plugin phải implement ─────────────────────────────────

export interface StepPluginProps {
  config: any; // raw config từ backend (đã JSON.parse)
  state: any; // state hiện tại của step này
  onChange: (newState: any) => void; // gọi khi state thay đổi
}

export interface StepPlugin {
  // Tên type — phải unique, dùng để detect & serialize
  type: string;

  // Nhãn hiển thị cho user
  label: string;

  // Detect xem config này có thuộc type này không
  detect: (config: any) => boolean;

  // Khởi tạo state ban đầu từ config
  buildInitialState: (config: any) => any;

  // Validate xem step đã done chưa
  isFulfilled: (state: any, config: any) => boolean;

  // React component render UI của step này
  Component: ComponentType<StepPluginProps>;

  // Serialize data để gửi lên backend khi complete
  serialize?: (state: any) => Record<string, any>;
}

// ─── Registry ────────────────────────────────────────────────────────────────

const registry: StepPlugin[] = [];

export function registerStep(plugin: StepPlugin) {
  // Tránh duplicate khi hot-reload
  const existing = registry.findIndex((p) => p.type === plugin.type);
  if (existing >= 0) {
    registry[existing] = plugin;
  } else {
    registry.push(plugin);
  }
}

export function resolvePlugin(config: any): StepPlugin | null {
  return registry.find((p) => p.detect(config)) ?? null;
}

export function getAllPlugins(): StepPlugin[] {
  return [...registry];
}
