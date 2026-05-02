import { NotificationApi } from "@/hooks/useNotification";
import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  // ✅ FIX: fetchUnreadCount nhận workerId (bắt buộc với Worker role)
  fetchUnreadCount: (workerId?: string) => Promise<void>;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async (workerId?: string) => {
    try {
      // Truyền workerId vào getPaged
      const data = await NotificationApi.getPaged(1, 1, undefined, workerId);
      set({ unreadCount: data.unreadCount });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearUnread: () => set({ unreadCount: 0 }),
}));
