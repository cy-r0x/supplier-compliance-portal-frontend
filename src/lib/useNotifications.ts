"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
  type NotificationType,
} from "./api/notifications-api";
import { useAuth } from "./auth/AuthProvider";

import { FALLBACK_PRODUCT_IMAGE } from "@/components/products/ProductThumbnail";

export type PortalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  productRequestId: string | null;
  productName: string | null;
  productImage: string | null;
  createdAt: string;
  read: boolean;
};

function toPortalNotification(notification: ApiNotification): PortalNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    productRequestId: notification.productRequestId,
    productName: notification.productRequest?.name ?? null,
    productImage: notification.productRequest
      ? notification.productRequest.photo || FALLBACK_PRODUCT_IMAGE
      : null,
    createdAt: notification.createdAt,
    read: notification.isRead,
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(
    async (pageNum: number, append = false) => {
      if (!user) return;

      try {
        setError(null);
        const result = await listNotifications({ page: pageNum, limit: 20 });
        const mapped = result.items.map(toPortalNotification);

        setNotifications((prev) => (append ? [...prev, ...mapped] : mapped));
        setUnreadCount(result.unreadCount);
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load notifications",
        );
      } finally {
        setReady(true);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }

    setReady(false);
    void fetchNotifications(1);
  }, [user, fetchNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.read) return;

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await markNotificationRead(id);
      } catch {
        void fetchNotifications(1);
      }
    },
    [notifications, fetchNotifications],
  );

  const markAllRead = useCallback(async () => {
    const hadUnread = unreadCount > 0;

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      if (hadUnread) {
        void fetchNotifications(1);
      }
    }
  }, [unreadCount, fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    try {
      await fetchNotifications(page + 1, true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages, fetchNotifications]);

  const refetch = useCallback(() => fetchNotifications(1), [fetchNotifications]);

  return {
    ready,
    notifications,
    unreadCount,
    error,
    markRead,
    markAllRead,
    refetch,
    hasMore: page < totalPages,
    loadingMore,
    loadMore,
  };
}
