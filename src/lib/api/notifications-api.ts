import { api } from "./axios";
import { ApiError, type ApiResponse, type PaginationMeta } from "./types";

export type NotificationType =
  | "REQUEST_CREATED"
  | "REQUEST_SUBMITTED"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED"
  | "REQUEST_MESSAGE"
  | "REQUEST_DELETED"
  | "REQUEST_REQUIREMENTS_UPDATED";

export type ApiNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  productRequestId: string | null;
  createdAt: string;
  productRequest: { id: string; name: string } | null;
};

export type NotificationListData = {
  items: ApiNotification[];
  unreadCount: number;
};

export type NotificationListResult = {
  items: ApiNotification[];
  pagination: PaginationMeta;
  unreadCount: number;
};

export type ListNotificationsParams = {
  page?: number;
  limit?: number;
  sort?: string;
  unreadOnly?: boolean;
};

export async function listNotifications(
  params?: ListNotificationsParams,
): Promise<NotificationListResult> {
  const { data } = await api.get<ApiResponse<NotificationListData>>(
    "/notifications",
    { params },
  );

  if (!data.success) {
    throw new ApiError(data.message);
  }

  if (!data.pagination) {
    throw new ApiError("Missing pagination metadata");
  }

  return {
    items: data.data.items,
    pagination: data.pagination,
    unreadCount: data.data.unreadCount,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch<ApiResponse<null>>(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch<ApiResponse<null>>("/notifications/read-all");
}
