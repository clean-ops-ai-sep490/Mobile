import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RecentActivity } from "../types";

interface RecentActivityListProps {
  activities: RecentActivity[];
  colors: any;
  onActivityPress: (activity: RecentActivity) => void;
}

interface ActivityItemProps {
  activity: RecentActivity;
  onPress: () => void;
  colors: any;
  delay: number;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

function ActivityItem({ activity, onPress, colors, delay }: ActivityItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.activityItem, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${activity.color}20` },
          ]}
        >
          <Text style={styles.activityIcon}>{activity.icon}</Text>
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={[styles.workerName, { color: colors.text }]}>
              {activity.workerName}
            </Text>
            <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
              {getTimeAgo(activity.timestamp)}
            </Text>
          </View>
          <Text style={[styles.activityText, { color: colors.textSecondary }]}>
            {activity.action}{" "}
            <Text style={{ color: colors.primary }}>{activity.location}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RecentActivityList({
  activities,
  colors,
  onActivityPress,
}: RecentActivityListProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Hoạt động gần đây
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: colors.primary }]}>
            Xem tất cả
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {activities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onPress={() => onActivityPress(activity)}
            colors={colors}
            delay={900 + index * 100}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
    },
    seeAll: {
      fontSize: 12,
      fontWeight: "600",
    },
    listContainer: {
      gap: 10,
    },
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    activityIcon: {
      fontSize: 18,
    },
    activityContent: {
      flex: 1,
    },
    activityHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    workerName: {
      fontSize: 13,
      fontWeight: "700",
    },
    timeAgo: {
      fontSize: 11,
    },
    activityText: {
      fontSize: 12,
      lineHeight: 16,
    },
  });
