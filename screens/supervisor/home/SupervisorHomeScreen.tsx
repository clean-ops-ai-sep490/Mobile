import Header from "@/components/header";
import { useTaskSwap } from "@/hooks/useTaskSwap";
import { Ionicons } from "@expo/vector-icons";
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
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

interface Props {
  onNavigate?: (screen: string) => void;
}

function ActionCard({
  label,
  desc,
  iconName,
  color,
  badge,
  fullWidth,
  onPress,
}: {
  label: string;
  desc: string;
  iconName: any;
  color: string;
  badge?: number;
  fullWidth?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        fullWidth ? styles.actionCardFullWidth : { width: CARD_WIDTH },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.actionCardTop}>
        <View
          style={[styles.actionIconWrap, { backgroundColor: color + "15" }]}
        >
          <Ionicons name={iconName} size={22} color={color} />
        </View>
        {!!badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

export default function SupervisorHomeScreen({ onNavigate }: Props) {
  const { getList } = useTaskSwap();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendingSwapCount, setPendingSwapCount] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const result = await getList({ status: "PendingManagerApproval" });
      setPendingSwapCount(result.totalElements);
    } catch (error) {
      console.error("Không thể tải số lượng yêu cầu đổi ca:", error);
    }
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "SwapRequestList" && pendingSwapCount === 0) {
      fetchPendingCount();
    }
    onNavigate?.(tabId);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4FF" />
      <SafeAreaView style={styles.safe}>
        <Header title="Xin chào" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fade, transform: [{ translateY: slide }] }}
          >
            <Text style={styles.sectionLabel}>Thao tác nhanh</Text>
            <View style={styles.grid}>
              <ActionCard
                label="Xem bản đồ"
                desc="Theo dõi nhân viên"
                iconName="map-outline"
                color="#2563EB"
                onPress={() => handleTabPress("map-view")}
              />
              <ActionCard
                label="Nhiệm vụ đột xuất"
                desc="Tạo công việc khẩn cấp"
                iconName="add-circle-outline"
                color="#7C3AED"
                onPress={() => handleTabPress("map-adhoc")}
              />
            </View>
            <View style={styles.grid}>
              <ActionCard
                label="Duyệt hình ảnh"
                desc="Xem ảnh chờ duyệt"
                iconName="images-outline"
                color="#0891B2"
                onPress={() => handleTabPress("review")}
              />
              <ActionCard
                label="Yêu cầu đổi ca"
                desc="Xem và phê duyệt"
                iconName="swap-horizontal-outline"
                color="#EA580C"
                badge={pendingSwapCount}
                onPress={() => handleTabPress("SwapRequestList")}
              />
            </View>
            <View style={styles.grid}>
              <ActionCard
                label="Lịch sử đột xuất"
                desc="Xem lại các công việc đột xuất đã tạo"
                iconName="document-text-outline"
                color="#16A34A"
                onPress={() => handleTabPress("adhoc-history")}
              />
              <ActionCard
                label="Hồ sơ"
                desc="Xem hồ sơ cá nhân"
                iconName="person-outline"
                color="#040404"
                onPress={() => handleTabPress("profile")}
              />
            </View>
            <View style={styles.grid}>
              <ActionCard
                label="Xem khu vực và danh sách nhân viên"
                desc="Xem khu vực và nhân viên trong khu vực"
                iconName="grid-outline"
                color="#EF4444"
                fullWidth
                onPress={() => handleTabPress("workers")}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F0F4FF" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  actionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardFullWidth: {
    width: "100%",
  },
  actionCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 11,
    color: "#94A3B8",
  },
});
