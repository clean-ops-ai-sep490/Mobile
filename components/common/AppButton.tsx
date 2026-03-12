import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IoniconName;
  iconRight?: IoniconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; shadow: string; text: string; border?: string }
> = {
  primary: { bg: "#2563EB", shadow: "#2563EB", text: "#FFF" },
  secondary: {
    bg: "#F1F5F9",
    shadow: "#CBD5E1",
    text: "#1E293B",
    border: "#E2E8F0",
  },
  danger: { bg: "#DC2626", shadow: "#DC2626", text: "#FFF" },
  ghost: {
    bg: "transparent",
    shadow: "transparent",
    text: "#2563EB",
    border: "#BFDBFE",
  },
};

const SIZE_CONFIG: Record<
  ButtonSize,
  { py: number; px: number; fontSize: number; iconSize: number; radius: number }
> = {
  sm: { py: 10, px: 16, fontSize: 13, iconSize: 13, radius: 10 },
  md: { py: 14, px: 20, fontSize: 15, iconSize: 15, radius: 13 },
  lg: { py: 16, px: 24, fontSize: 16, iconSize: 16, radius: 16 },
};

export default function AppButton({
  label,
  onPress,
  loading = false,
  loadingLabel,
  disabled = false,
  variant = "primary",
  size = "lg",
  iconLeft,
  iconRight,
  fullWidth = true,
  style,
  textStyle,
}: AppButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;
  const busyBg = variant === "primary" ? "#93C5FD" : v.bg;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: loading ? busyBg : v.bg,
          borderRadius: s.radius,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          opacity: disabled && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "center",
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border ?? "transparent",
          shadowColor: v.shadow,
        },
        style,
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator
            size="small"
            color={v.text}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.label,
              { fontSize: s.fontSize, color: v.text },
              textStyle,
            ]}
          >
            {loadingLabel ?? "Loading..."}
          </Text>
        </>
      ) : (
        <>
          {iconLeft && (
            <Ionicons
              name={iconLeft}
              size={s.iconSize}
              color={v.text}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.label,
              { fontSize: s.fontSize, color: v.text },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {iconRight && (
            <Ionicons
              name={iconRight}
              size={s.iconSize}
              color={v.text}
              style={{ marginLeft: 6 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 36,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
