import axiosInstance from "@/config/axiosInstance";

// --- TYPES (Dựa trên DTOs Backend) ---
export interface FcmTokenCreateDto {
  token: string;
  uniqueId: string;
  platform: 0 | 1 | 2; // Ví dụ: 0: Android, 1: iOS, 2: Web
  deviceName?: string;
  workerId?: string | null;
}

export interface NotificationListItemDto {
  id: string; // Id của bảng trung gian NotificationRecipient
  notificationId: string;
  title: string;
  body: string;
  priority: string;
  senderType: string;
  senderId: string | null;
  isRead: boolean;
  isReadAt: string | null;
  created: string;
}

export interface NotificationDetailDto extends NotificationListItemDto {
  payload: string; // JSON string
}

export interface PaginatedResult<T> {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  content: T[];
}

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

// --- API SERVICES ---
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

  // Lấy danh sách thông báo
  getPaged: async (
    pageNumber: number,
    pageSize: number = 10,
    isRead?: boolean,
  ) => {
    const params: any = { pageNumber, pageSize };
    if (isRead !== undefined) params.isRead = isRead;

    const response = await axiosInstance.get<NotificationPagedResponse>(
      "/NotificationRecipients",
      { params },
    );
    return response.data;
  },

  // Lấy chi tiết thông báo (để lấy Payload)
  getDetail: async (notificationId: string) => {
    const response = await axiosInstance.get<NotificationDetailDto>(
      `/NotificationRecipients/${notificationId}`,
    );
    return response.data;
  },

  // Đánh dấu 1 tin đã đọc
  markAsRead: async (notificationId: string) => {
    await axiosInstance.patch(`/NotificationRecipients/${notificationId}/read`);
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async () => {
    const response = await axiosInstance.patch<number>(
      "/NotificationRecipients/read-all",
    );
    return response.data;
  },
};
