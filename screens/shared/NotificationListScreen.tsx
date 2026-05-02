// src/screens/notification/NotificationListScreen.tsx

import Header from "@/components/common/Header";
import { NotificationItem } from "@/components/notification/NotificationItem";
import { useAuth } from "@/contexts/AuthContext";
import {
  NotificationApi,
  NotificationListItemDto,
} from "@/hooks/useNotification";
import { useNotificationStore } from "@/store/notification.store";
import { handleNotificationClick } from "@/utils/notification.action";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export const NotificationListScreen = () => {
  const navigation = useNavigation();
  const { decrementUnread, clearUnread } = useNotificationStore();

  const [data, setData] = useState<NotificationListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const userRole = (user?.role as "Worker" | "Supervisor") ?? "Worker";

  // ✅ Lấy thẳng từ AuthContext — không cần gọi getWorkerProfile() nữa
  const workerId = user?.workerId;

  // ============================
  // LOAD DATA
  // ============================
  const loadData = useCallback(
    async (pageNumber: number, isRefresh = false) => {
      if (loading && !isRefresh) return;
      setLoading(true);
      try {
        const response = await NotificationApi.getPaged(
          pageNumber,
          15,
          undefined,
          workerId,
        );
        const contentList = response.content ?? [];

        setData((prev) =>
          isRefresh ? contentList : [...prev, ...contentList],
        );
        setHasMore(response.hasNextPage);
        setPage(pageNumber);
      } catch (error) {
        console.error("Lỗi fetch notifications:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workerId],
  );

  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  // ============================
  // HANDLERS
  // ============================
  const handleRefresh = () => {
    setRefreshing(true);
    loadData(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadData(page + 1);
    }
  };

  const handleItemPress = async (item: NotificationListItemDto) => {
    try {
      // Đánh dấu đã đọc nếu chưa đọc
      if (!item.isRead) {
        await NotificationApi.markAsRead(item.notificationId, workerId);
        decrementUnread();
        setData((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      }

      // ✅ Dùng thẳng item.payload — không cần gọi getDetail nữa
      // item.payload là JsonElement (object) từ NotificationListItemDto
      if (item.payload) {
        handleNotificationClick(item.payload, userRole, navigation);
      } else {
        // Không có payload → về Home
        if (userRole === "Worker") {
          navigation.navigate("Home" as never);
        } else {
          navigation.navigate("SupervisorHome" as never);
        }
      }
    } catch (error: any) {
      console.error(
        "handleItemPress error:",
        error?.response?.status,
        JSON.stringify(error?.response?.data),
      );
      Alert.alert("Lỗi", "Không thể mở thông báo lúc này.");
    }
  };

  const handleMarkAllRead = () => {
    Alert.alert("Xác nhận", "Đánh dấu tất cả thông báo là đã đọc?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          try {
            await NotificationApi.markAllAsRead(workerId);
            clearUnread();
            setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
          } catch (error) {
            console.error("Mark all read error:", error);
            Alert.alert("Lỗi", "Không thể đánh dấu đã đọc lúc này.");
          }
        },
      },
    ]);
  };

  // ============================
  // RENDER
  // ============================
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Thông báo"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.rightActionBtn}
            onPress={handleMarkAllRead}
            disabled={loading}
          >
            <Ionicons
              name="checkmark-done-circle-outline"
              size={24}
              color={loading ? "#ccc" : "#007AFF"}
            />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={handleItemPress} />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator style={styles.loader} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Chưa có thông báo nào</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  rightActionBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    margin: 20,
  },
  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});
