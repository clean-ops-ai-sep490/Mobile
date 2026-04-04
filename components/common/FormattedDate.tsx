import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";

interface FormattedDateProps {
  dateString?: string;
  style?: StyleProp<TextStyle>;
  fallback?: string;
}

export default function FormattedDate({
  dateString,
  style,
  fallback = "—",
}: FormattedDateProps) {
  if (!dateString) {
    return <Text style={style}>{fallback}</Text>;
  }

  const formatted = new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return <Text style={style}>{formatted}</Text>;
}
