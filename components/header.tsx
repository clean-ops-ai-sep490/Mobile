import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  showDate?: boolean;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
}

export default function Header({
  title,
  showDate = true,
  showSettings = false,
  onSettingsPress,
  onNotificationsPress,
}: Props) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    if (showDate) {
      updateDate();
      const interval = setInterval(updateDate, 60000);
      return () => clearInterval(interval);
    }
  }, [showDate]);

  const updateDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formatter.format(now));
  };

  return (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>{title}</Text>
        {showDate && <Text style={styles.date}>{currentDate}</Text>}
      </View>
      <View style={styles.actions}>
        {onNotificationsPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationsPress}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>
        )}
        {showSettings && onSettingsPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSettingsPress}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#94A3B8",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 18,
  },
});
