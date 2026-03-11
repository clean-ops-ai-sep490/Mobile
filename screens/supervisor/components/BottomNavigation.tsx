import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BottomNavigationProps {
  activeTab: string;
  colors: any;
  onTabPress: (tab: string) => void;
}

interface TabItemProps {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}

function TabItem({ icon, label, active, onPress, colors }: TabItemProps) {
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {active && (
        <View style={[styles.tabDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export default function BottomNavigation({
  activeTab,
  colors,
  onTabPress,
}: BottomNavigationProps) {
  const styles = createStyles(colors);

  const tabs = [
    { id: "dashboard", icon: "📊", label: "Bảng điều khiển" },
    { id: "tasks", icon: "📋", label: "Task" },
    { id: "workers", icon: "👥", label: "Công nhân" },
    { id: "reports", icon: "📈", label: "Báo cáo" },
    { id: "settings", icon: "⚙️", label: "Cài đặt" },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          active={activeTab === tab.id}
          onPress={() => onTabPress(tab.id)}
          colors={colors}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    tabBar: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 24 : 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 8,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      position: "relative",
    },
    tabIcon: {
      fontSize: 20,
      marginBottom: 3,
      opacity: 0.4,
    },
    tabIconActive: {
      opacity: 1,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.primary,
    },
    tabDot: {
      position: "absolute",
      bottom: -10,
      width: 4,
      height: 4,
      borderRadius: 2,
    },
  });
