import BottomNavigation from "@/components/bottom-navigation";
import ActivityItem from "@/components/cards/activity-item";
import KPICard from "@/components/cards/kpi-card";
import QuickActionButton from "@/components/cards/quick-action-button";
import Header from "@/components/header";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface Props {
  onNavigate?: (screen: string) => void;
}

const CARD_GAP = 12;

export default function SupervisorHomeScreen({ onNavigate }: Props) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (onNavigate) {
      onNavigate(tabId);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const navigationTabs = [
    { icon: "📊", label: "Dashboard", id: "dashboard" },
    { icon: "📋", label: "Tasks", id: "tasks" },
    { icon: "👥", label: "Workers", id: "workers" },
    { icon: "📈", label: "Reports", id: "reports" },
    { icon: "⚙️", label: "Settings", id: "settings" },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        <Header
          title="Dashboard"
          showDate
          showSettings
          onSettingsPress={handleLogout}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* KPI Grid */}
          <Animated.View
            style={{
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            }}
          >
            <Text style={styles.sectionLabel}>Key Metrics</Text>
            <View style={styles.kpiGrid}>
              <KPICard
                label="Pending Review"
                value="12"
                subtext="+2 today"
                icon="📋"
                color="#F59E0B"
                onPress={() => handleTabPress("review")}
              />
              <KPICard
                label="On Duty"
                value="24/30"
                subtext="80% capacity"
                icon="👥"
                color="#3B82F6"
                onPress={() => handleTabPress("workers")}
              />
            </View>
            <View style={styles.kpiGrid}>
              <KPICard
                label="Active Issues"
                value="3"
                subtext="-1 from yesterday"
                icon="⚠️"
                color="#EF4444"
                onPress={() => handleTabPress("issues")}
              />
              <KPICard
                label="Completion"
                value="87%"
                subtext="Ahead of schedule"
                icon="✅"
                color="#10B981"
                onPress={() => handleTabPress("reports")}
              />
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            style={{
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            }}
          >
            <Text style={styles.sectionLabel}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              <QuickActionButton
                icon="➕"
                label="Ad-hoc Task"
                onPress={() => handleTabPress("create-task")}
              />
              <QuickActionButton
                icon="📝"
                label="Review Tasks"
                onPress={() => handleTabPress("review")}
              />
            </View>
            <View style={styles.quickGrid}>
              <QuickActionButton
                icon="👤"
                label="View Workers"
                onPress={() => handleTabPress("workers")}
              />
              <QuickActionButton
                icon="🚨"
                label="Issues Hub"
                onPress={() => handleTabPress("issues")}
              />
            </View>
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View
            style={{
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            }}
          >
            <View style={styles.activityHeader}>
              <Text style={styles.sectionLabel}>Recent Activity</Text>
              <TouchableOpacity onPress={() => handleTabPress("activity")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityCard}>
              <ActivityItem
                icon="📍"
                name="Marco Ross"
                action="checked in at Main Lobby"
                time="2 mins ago"
              />
              <ActivityItem
                icon="✅"
                name="Janice Smith"
                action="completed Suite 405 Deep Clean"
                time="15 mins ago"
              />
              <ActivityItem
                icon="⚠️"
                name="Urgent Alert"
                action="Spill reported in North Stairwell"
                time="45 mins ago"
              />
              <ActivityItem
                icon="📍"
                name="David Chen"
                action="checked in at East Wing"
                time="1 hour ago"
              />
              <ActivityItem
                icon="✅"
                name="Sarah Johnson"
                action="completed Conference Room B"
                time="2 hours ago"
              />
            </View>
          </Animated.View>

          {/* Spacer for tab bar */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={navigationTabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F6FA" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // Quick Actions Grid
  quickGrid: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // Activity
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  activityCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
});
