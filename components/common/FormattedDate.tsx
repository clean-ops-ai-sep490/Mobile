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

  // Lấy thẳng từ string, không qua Date object
  // "2026-04-28T00:00:00.000Z" → "28/04/2026 00:00"
  // "2026-04-28T23:59:59.999Z" → "28/04/2026 23:59"
  const [datePart, timePart] = dateString.split("T");
  const [y, m, d] = datePart.split("-");
  const hhmm = timePart?.slice(0, 5) ?? "00:00";

  return <Text style={style}>{`${d}/${m}/${y} ${hhmm}`}</Text>;
}
