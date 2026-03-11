import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SupervisorHeaderProps {
  supervisorName: string;
  currentDate: Date;
  onSettingsPress: () => void;
  colors: any;
}

export default function SupervisorHeader({
  supervisorName,
  currentDate,
  onSettingsPress,
  colors,
}: SupervisorHeaderProps) {
  const formattedDate = currentDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const firstName = supervisorName.split(" ").pop() || supervisorName;

  const styles = createStyles(colors);

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {supervisorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Dashboard
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.settingsBtn, { backgroundColor: colors.card }]}
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "android" ? 12 : 4,
      paddingBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    greeting: {
      fontSize: 14,
      fontWeight: "700",
    },
    date: {
      fontSize: 11,
      marginTop: 2,
    },
    settingsBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    settingsIcon: {
      fontSize: 18,
    },
  });
