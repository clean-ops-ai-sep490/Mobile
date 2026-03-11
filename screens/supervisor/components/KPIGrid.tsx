import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KPIData } from "../types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface KPIGridProps {
  kpiData: KPIData;
  colors: any;
  onNavigate?: (screen: string) => void;
}

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: string;
  iconBg: string;
  onPress: () => void;
  colors: any;
  delay: number;
}

function KPICard({
  label,
  value,
  subtitle,
  icon,
  iconBg,
  onPress,
  colors,
  delay,
}: KPICardProps) {
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
        width: CARD_WIDTH,
      }}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
          <View style={[styles.iconBg, { backgroundColor: iconBg }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        </View>

        <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function KPIGrid({ kpiData, colors, onNavigate }: KPIGridProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <KPICard
          label="CHỜ XEM XÉT"
          value={kpiData.pendingReview.count}
          subtitle={`+${kpiData.pendingReview.todayNew} hôm nay`}
          icon="📋"
          iconBg="#FEF3C7"
          onPress={() => onNavigate?.("ReviewTasks")}
          colors={colors}
          delay={100}
        />
        <KPICard
          label="ĐANG LÀM VIỆC"
          value={`${kpiData.onDuty.current}/${kpiData.onDuty.total}`}
          subtitle={`${kpiData.onDuty.capacity}% công suất`}
          icon="👥"
          iconBg="#DBEAFE"
          onPress={() => onNavigate?.("Workers")}
          colors={colors}
          delay={200}
        />
      </View>

      <View style={styles.row}>
        <KPICard
          label="SỰ CỐ HOẠT ĐỘNG"
          value={kpiData.activeIssues.count}
          subtitle={`${kpiData.activeIssues.severity} ${kpiData.activeIssues.trend < 0 ? "↓" : "↑"}${Math.abs(kpiData.activeIssues.trend)} từ hôm qua`}
          icon="🔴"
          iconBg="#FEE2E2"
          onPress={() => onNavigate?.("IssuesHub")}
          colors={colors}
          delay={300}
        />
        <KPICard
          label="HOÀN THÀNH"
          value={`${kpiData.completion.percentage}%`}
          subtitle={kpiData.completion.status}
          icon="✅"
          iconBg="#DCFCE7"
          onPress={() => onNavigate?.("Reports")}
          colors={colors}
          delay={400}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
      gap: 12,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    card: {
      borderRadius: 16,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      flex: 1,
    },
    iconBg: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      fontSize: 16,
    },
    value: {
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 11,
      lineHeight: 16,
    },
  });
