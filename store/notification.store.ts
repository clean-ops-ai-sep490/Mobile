import { NotificationApi } from "@/hooks/useNotification";
import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  // Gọi API lấy page 1 chỉ để lấy unreadCount cập nhật lên Store
  fetchUnreadCount: async () => {
    try {
      const data = await NotificationApi.getPaged(1, 1);
      set({ unreadCount: data.unreadCount });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  // Giảm đi 1 khi user click vào 1 tin chưa đọc
  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  // Xoá chấm đỏ khi click "Read All"
  clearUnread: () => set({ unreadCount: 0 }),
}));
