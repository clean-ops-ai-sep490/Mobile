import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TabItem {
  icon: string;
  label: string;
  id: string;
}

interface Props {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export default function BottomNavigation({
  tabs,
  activeTab,
  onTabPress,
}: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.icon, activeTab === tab.id && styles.iconActive]}
          >
            {tab.icon}
          </Text>
          <Text
            style={[styles.label, activeTab === tab.id && styles.labelActive]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && <View style={styles.indicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabActive: {},
  icon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.4,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  labelActive: {
    color: "#2563EB",
  },
  indicator: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563EB",
  },
});
