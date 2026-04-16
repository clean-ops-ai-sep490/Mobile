import Header from "@/components/common/Header";
import { NotificationItem } from "@/components/notification/NotificationItem";
import { useAuth } from "@/contexts/AuthContext";
import {
    NotificationApi,
    NotificationListItemDto,
} from "@/hooks/useNotification";
import { useNotificationStore } from "@/store/notification.store";
import { handleNotificationClick } from "@/utils/notification.action";
import { Ionicons } from "@expo/vector-icons"; // Dùng icon cho đẹp
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView, // Thêm SafeAreaView
    StyleSheet,
    Text,
    TouchableOpacity
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

  const userRole = user?.role || "Worker";

  const loadData = async (pageNumber: number, isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await NotificationApi.getPaged(pageNumber, 15);
      const contentList = response.content || [];

      if (isRefresh) {
        setData(contentList);
      } else {
        setData((prev) => [...prev, ...contentList]);
      }

      setHasMore(contentList.length === 15);
      setPage(pageNumber);
    } catch (error) {
      console.error("Lỗi fetch data:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(1, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && data.length > 0) {
      loadData(page + 1);
    }
  };

  const handleItemPress = async (item: NotificationListItemDto) => {
    try {
      const detail = await NotificationApi.getDetail(item.notificationId);

      if (!item.isRead) {
        await NotificationApi.markAsRead(item.notificationId);
        decrementUnread();
        setData((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      }

      if (detail.payload) {
        handleNotificationClick(detail.payload, userRole, navigation);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở thông báo lúc này.");
    }
  };

  const handleMarkAllRead = async () => {
    // Thêm Alert confirm để user không bấm nhầm
    Alert.alert("Xác nhận", "Đánh dấu tất cả thông báo là đã đọc?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          try {
            await NotificationApi.markAllAsRead();
            clearUnread();
            setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  return (
    // Dùng SafeAreaView bao ngoài cùng
    <SafeAreaView style={styles.container}>
      {/* Tích hợp Nút Back và Nút Read All ngay trên Header
        Sử dụng Icon thay vì chữ dài để Header không bị lệch 
      */}
      <Header
        title="Thông báo"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.rightActionBtn}
            onPress={handleMarkAllRead}
          >
            <Ionicons
              name="checkmark-done-circle-outline"
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>
        }
      />

      {/* Đã xóa <View style={styles.header}> cũ đi */}

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
            <ActivityIndicator style={{ margin: 20 }} />
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
    backgroundColor: "#F5F6FA", // Sửa đồng bộ với màu nền của Header
  },
  rightActionBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});
