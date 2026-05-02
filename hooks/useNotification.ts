// src/hooks/useNotification.ts

import axiosInstance from "@/config/axiosInstance";

// =====================
// TYPES
// =====================

export interface FcmTokenCreateDto {
  token: string;
  uniqueId: string;
  platform: 0 | 1 | 2; // 0: Android, 1: iOS, 2: Web
  deviceName?: string;
  workerId?: string | null;
}

export interface NotificationListItemDto {
  id: string; // ✅ Id của NotificationRecipient — dùng cho getDetail, markAsRead
  notificationId: string; // Id của Notification — KHÔNG dùng cho API calls
  title: string;
  body: string;
  payload: string; // JsonElement từ BE — là object, không phải string
  priority: string;
  senderType: string;
  senderId: string | null;
  isRead: boolean;
  isReadAt: string | null;
  created: string;
}

export type NotificationDetailDto = NotificationListItemDto;

export interface NotificationPagedResponse {
  unreadCount: number;
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  content: NotificationListItemDto[];
}

// =====================
// API
// =====================

export const NotificationApi = {
  // Đăng ký FCM Token
  registerToken: async (data: FcmTokenCreateDto) => {
    const response = await axiosInstance.post("/FcmTokens/register", data);
    return response.data;
  },

  // Xoá FCM Token khi đăng xuất
  deactivateToken: async (uniqueId: string) => {
    await axiosInstance.patch(`/FcmTokens/deactivate?uniqueId=${uniqueId}`);
  },

  // Lấy danh sách thông báo (phân trang)
  // Worker bắt buộc truyền workerId, Supervisor không cần
  getPaged: async (
    pageNumber: number,
    pageSize: number = 10,
    isRead?: boolean,
    workerId?: string,
  ): Promise<NotificationPagedResponse> => {
    const params: Record<string, any> = { pageNumber, pageSize };
    if (isRead !== undefined) params.isRead = isRead;
    if (workerId) params.workerId = workerId;

    const response = await axiosInstance.get<NotificationPagedResponse>(
      "/NotificationRecipients",
      { params },
    );
    return response.data;
  },

  // Lấy chi tiết 1 thông báo
  // ✅ Truyền item.id (NotificationRecipient id), KHÔNG phải item.notificationId
  getDetail: async (
    recipientId: string, // = item.id
    workerId?: string,
  ): Promise<NotificationDetailDto> => {
    const params: Record<string, any> = {};
    if (workerId) params.workerId = workerId;

    const response = await axiosInstance.get<NotificationDetailDto>(
      `/NotificationRecipients/${recipientId}`,
      { params },
    );
    return response.data;
  },

  // Đánh dấu 1 thông báo đã đọc
  // ✅ Truyền item.id (NotificationRecipient id), KHÔNG phải item.notificationId
  markAsRead: async (
    recipientId: string, // = item.id
    workerId?: string,
  ): Promise<void> => {
    const params: Record<string, any> = {};
    if (workerId) params.workerId = workerId;

    await axiosInstance.patch(
      `/NotificationRecipients/${recipientId}/read`,
      null,
      { params },
    );
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (workerId?: string): Promise<number> => {
    const params: Record<string, any> = {};
    if (workerId) params.workerId = workerId;

    const response = await axiosInstance.patch<number>(
      "/NotificationRecipients/read-all",
      null,
      { params },
    );
    return response.data;
  },
};
