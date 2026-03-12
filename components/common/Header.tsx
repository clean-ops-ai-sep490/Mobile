import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface HeaderAction {
  icon: IoniconsName;
  size?: number;
  color?: string;
  onPress: () => void;
}

interface HeaderProps {
  title: string;
  leftAction?: HeaderAction;
  /** Show default back chevron on the left */
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

const DEFAULT_LEFT: Omit<HeaderAction, "onPress"> = {
  icon: "chevron-back",
  size: 20,
  color: "#1E293B",
};

export default function Header({
  title,
  leftAction,
  onBack,
  style,
  titleStyle,
}: HeaderProps) {
  // Resolve left button
  const left: HeaderAction | null = leftAction
    ? leftAction
    : onBack
      ? { ...DEFAULT_LEFT, onPress: onBack }
      : null;

  const renderBtn = (action: HeaderAction | null) =>
    action ? (
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={action.onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={action.icon}
          size={action.size ?? 20}
          color={action.color ?? "#1E293B"}
        />
      </TouchableOpacity>
    ) : (
      // Placeholder keeps title centered when one side is empty
      <View style={styles.headerBtn} />
    );

  return (
    <View style={[styles.header, style]}>
      {renderBtn(left)}
      <Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerBtnPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: "#F5F6FA",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
