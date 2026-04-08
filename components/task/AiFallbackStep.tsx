// src/components/task/AiFallbackStep.tsx
// Khi không có plugin nào match config, gọi Claude API để interpret
// và render UI động dựa trên response

import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Field types AI có thể trả về ────────────────────────────────────────────

export type AiFieldType =
  | "checkbox_list" // list of items to check off
  | "text_input" // free text / note
  | "number_input" // numeric value
  | "toggle" // single yes/no confirmation
  | "info"; // read-only instruction, no input needed

export interface AiField {
  id: string;
  type: AiFieldType;
  label: string;
  required: boolean;
  // checkbox_list only
  items?: string[];
  // number_input only
  unit?: string;
  min?: number;
  max?: number;
  // info only
  content?: string;
}

export interface AiStepSchema {
  instruction: string; // hướng dẫn ngắn cho user
  fields: AiField[];
}

// ─── Gọi Claude API để interpret config ──────────────────────────────────────

async function interpretConfig(
  stepName: string,
  config: any,
): Promise<AiStepSchema> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a mobile app UI generator for a task execution workflow system.

Given a step name and its config JSON, return a JSON object describing UI fields the worker must complete.

Step name: "${stepName}"
Config: ${JSON.stringify(config, null, 2)}

Return ONLY valid JSON. No markdown, no explanation. Schema:
{
  "instruction": "short instruction for the worker (1 sentence)",
  "fields": [
    {
      "id": "unique_id",
      "type": "checkbox_list" | "text_input" | "number_input" | "toggle" | "info",
      "label": "field label",
      "required": true | false,
      // for checkbox_list:
      "items": ["item 1", "item 2"],
      // for number_input:
      "unit": "optional unit string",
      "min": 0,
      "max": 100,
      // for info:
      "content": "the instruction text"
    }
  ]
}

Rules:
- Infer field types from config keys and values
- If config has a list/array → checkbox_list
- If config has a boolean flag like requireX → toggle
- If config has numeric thresholds → number_input
- If config is just metadata with no input needed → info field
- Keep labels concise, in the same language as the step name`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";

  try {
    return JSON.parse(text) as AiStepSchema;
  } catch {
    // Fallback schema nếu AI trả về sai format
    return {
      instruction: `Complete step: ${stepName}`,
      fields: [
        {
          id: "confirm",
          type: "toggle",
          label: "Mark step as done",
          required: true,
        },
      ],
    };
  }
}

// ─── Dynamic field renderers ──────────────────────────────────────────────────

function CheckboxListField({
  field,
  value,
  onChange,
}: {
  field: AiField;
  value: Record<string, boolean>;
  onChange: (v: Record<string, boolean>) => void;
}) {
  const toggle = (item: string) => onChange({ ...value, [item]: !value[item] });

  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{field.label}</Text>
      {(field.items ?? []).map((item) => (
        <TouchableOpacity
          key={item}
          style={s.checkRow}
          onPress={() => toggle(item)}
        >
          <View style={[s.checkbox, value[item] && s.checkboxDone]}>
            {value[item] && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.checkText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TextInputField({
  field,
  value,
  onChange,
}: {
  field: AiField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>
        {field.label}
        {field.required && <Text style={s.required}> *</Text>}
      </Text>
      <TextInput
        style={s.textInput}
        multiline
        value={value}
        onChangeText={onChange}
        placeholder="Enter value..."
        textAlignVertical="top"
      />
    </View>
  );
}

function NumberInputField({
  field,
  value,
  onChange,
}: {
  field: AiField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>
        {field.label}
        {field.required && <Text style={s.required}> *</Text>}
      </Text>
      <View style={s.numberRow}>
        <TextInput
          style={[s.textInput, s.numberInput]}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
          placeholder="0"
        />
        {field.unit && <Text style={s.unit}>{field.unit}</Text>}
      </View>
    </View>
  );
}

function ToggleField({
  field,
  value,
  onChange,
}: {
  field: AiField;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={s.fieldWrap}>
      <View style={s.toggleRow}>
        <Text style={s.fieldLabel}>{field.label}</Text>
        <Switch value={value} onValueChange={onChange} />
      </View>
    </View>
  );
}

function InfoField({ field }: { field: AiField }) {
  return (
    <View style={[s.fieldWrap, s.infoBox]}>
      <Text style={s.fieldLabel}>{field.label}</Text>
      {field.content && <Text style={s.infoText}>{field.content}</Text>}
    </View>
  );
}

// ─── AI Fallback Component ────────────────────────────────────────────────────

interface AiFallbackStepProps {
  stepName: string;
  config: any;
  state: any;
  onChange: (newState: any) => void;
}

export function AiFallbackStep({
  stepName,
  config,
  state,
  onChange,
}: AiFallbackStepProps) {
  const [schema, setSchema] = useState<AiStepSchema | null>(
    state.__schema ?? null,
  );
  const [loading, setLoading] = useState(!state.__schema);
  const [error, setError] = useState<string | null>(null);

  // Load schema once — cache vào state để không gọi lại khi re-render
  useEffect(() => {
    if (schema) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await interpretConfig(stepName, config);
        setSchema(result);

        // Khởi tạo field values
        const initialValues: Record<string, any> = { __schema: result };
        for (const field of result.fields) {
          if (field.type === "checkbox_list") {
            initialValues[field.id] = Object.fromEntries(
              (field.items ?? []).map((item) => [item, false]),
            );
          } else if (field.type === "toggle") {
            initialValues[field.id] = false;
          } else if (
            field.type === "text_input" ||
            field.type === "number_input"
          ) {
            initialValues[field.id] = "";
          }
        }
        onChange(initialValues);
      } catch {
        setError("Failed to load step UI. Check your connection.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateField = useCallback(
    (fieldId: string, value: any) => {
      onChange({ ...state, [fieldId]: value });
    },
    [state, onChange],
  );

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="small" />
        <Text style={s.loadingText}>Analyzing step requirements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.errorWrap}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setSchema(null);
            setLoading(true);
          }}
        >
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!schema) return null;

  return (
    <View>
      {schema.instruction ? (
        <Text style={s.instruction}>{schema.instruction}</Text>
      ) : null}

      {schema.fields.map((field) => {
        if (field.type === "checkbox_list") {
          return (
            <CheckboxListField
              key={field.id}
              field={field}
              value={state[field.id] ?? {}}
              onChange={(v) => updateField(field.id, v)}
            />
          );
        }
        if (field.type === "text_input") {
          return (
            <TextInputField
              key={field.id}
              field={field}
              value={state[field.id] ?? ""}
              onChange={(v) => updateField(field.id, v)}
            />
          );
        }
        if (field.type === "number_input") {
          return (
            <NumberInputField
              key={field.id}
              field={field}
              value={state[field.id] ?? ""}
              onChange={(v) => updateField(field.id, v)}
            />
          );
        }
        if (field.type === "toggle") {
          return (
            <ToggleField
              key={field.id}
              field={field}
              value={state[field.id] ?? false}
              onChange={(v) => updateField(field.id, v)}
            />
          );
        }
        if (field.type === "info") {
          return <InfoField key={field.id} field={field} />;
        }
        return null;
      })}
    </View>
  );
}

// ─── Fulfill check cho AI fallback ───────────────────────────────────────────

export function isAiFallbackFulfilled(state: any): boolean {
  const schema: AiStepSchema | undefined = state.__schema;
  if (!schema) return false; // schema chưa load xong

  for (const field of schema.fields) {
    if (!field.required) continue;

    const value = state[field.id];

    if (field.type === "checkbox_list") {
      const allChecked =
        value &&
        (field.items ?? []).length > 0 &&
        (field.items ?? []).every((item: string) => value[item]);
      if (!allChecked) return false;
    }

    if (field.type === "text_input" || field.type === "number_input") {
      if (!value || String(value).trim() === "") return false;
    }

    if (field.type === "toggle") {
      if (!value) return false;
    }
  }

  return true;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  instruction: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  required: {
    color: "#EF4444",
  },

  // Checkbox list
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  checkmark: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  checkText: { fontSize: 14, color: "#1E293B", flex: 1 },

  // Text / number
  textInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 80,
  },
  numberInput: {
    minHeight: 0,
    height: 44,
    flex: 1,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unit: {
    fontSize: 14,
    color: "#64748B",
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Info
  infoBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    lineHeight: 18,
  },

  // Loading / error
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  errorWrap: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    marginBottom: 8,
  },
  retryText: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
  },
});
