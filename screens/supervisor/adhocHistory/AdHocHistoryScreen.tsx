import Header from "@/components/common/Header";
import {
    TaskAssignmentDto,
    useTaskAssignments,
} from "@/hooks/useTaskAssignment";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Navigation = NativeStackNavigationProp<SupervisorStackParamList>;

const PAGE_SIZE = 20;

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  // Backend lưu giờ Việt Nam nhưng gắn Z (UTC) nhầm → bỏ Z để đọc đúng giờ
  const normalized = value.endsWith("Z") ? value.slice(0, -1) : value;
  const dt = new Date(normalized);
  if (Number.isNaN(dt.getTime())) return "--";

  return dt.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: string | number) => {
  const key = String(status);
  if (key === "InProgress" || key === "1") return "Đang thực hiện";
  if (key === "Completed" || key === "2") return "Hoàn thành";
  if (key === "Block" || key === "3") return "Bị chặn";
  return "Chưa bắt đầu";
};

const getStatusColor = (status: string | number) => {
  const key = String(status);
  if (key === "InProgress" || key === "1") return "#F59E0B";
  if (key === "Completed" || key === "2") return "#10B981";
  if (key === "Block" || key === "3") return "#DC2626";
  return "#3B82F6";
};

function TaskCard({ item }: { item: TaskAssignmentDto }) {
  const title = item.nameAdhocTask || item.taskName || "Adhoc Task";
  const statusText = getStatusLabel(item.status);
  const statusColor = getStatusColor(item.status);

  // ✅ Ưu tiên assigneeName, fallback về assigneeId nếu không có
  const assigneeDisplay = item.assigneeName || item.assigneeId || "--";

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.title}>{title}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      <Text style={styles.metaText}>Nhân viên: {assigneeDisplay}</Text>
      <Text style={styles.metaText}>
        Địa điểm: {item.displayLocation || "--"}
      </Text>
      <Text style={styles.metaText}>
        Bắt đầu: {formatDateTime(item.scheduledStartAt)}
      </Text>
      <Text style={styles.metaText}>
        Kết thúc: {formatDateTime(item.scheduledEndAt)}
      </Text>
    </View>
  );
}

export default function AdHocHistoryScreen() {
  const navigation = useNavigation<Navigation>();
  const { getAdhocTasksBySupervisor } = useTaskAssignments();

  const [items, setItems] = useState<TaskAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => items.length, [items]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getAdhocTasksBySupervisor({
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        sortBy: "created",
        sortDescending: true,
      });

      if (!result) {
        setError("Không thể tải lịch sử adhoc task");
        setItems([]);
        return;
      }

      setItems(result.content ?? []);
    } catch (e: any) {
      setError(e?.message || "Không thể tải lịch sử adhoc task");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAdhocTasksBySupervisor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Lịch Sử Đột Xuất" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.helperText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Lịch Sử Đột Xuất" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.helperText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!items.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Lịch Sử Đột Xuất" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🗂️</Text>
          <Text style={styles.helperText}>Chưa có adhoc task nào được tạo</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Lịch Sử Đột Xuất (${total})`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  helperText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  errorIcon: {
    fontSize: 40,
  },
  emptyIcon: {
    fontSize: 46,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 3,
  },
});
