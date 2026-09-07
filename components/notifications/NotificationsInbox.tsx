"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { formatDate } from "../../src/app/admin/types";
import type { PortalNotification } from "../../src/lib/useNotifications";

type NotificationsInboxProps = {
  notifications: PortalNotification[];
  unreadCount: number;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  loadingMore?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRetry?: () => void;
  onLoadMore?: () => void;
};

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-[9px] bg-bg-muted"
        />
      ))}
    </div>
  );
}

export default function NotificationsInbox({
  notifications,
  unreadCount,
  loading = false,
  error = null,
  hasMore = false,
  loadingMore = false,
  onMarkRead,
  onMarkAllRead,
  onRetry,
  onLoadMore,
}: NotificationsInboxProps) {
  const router = useRouter();

  function handleClick(notification: PortalNotification) {
    if (!notification.read) {
      onMarkRead(notification.id);
    }

    if (notification.productRequestId) {
      router.push(`/products/${notification.productRequestId}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Inbox for request and user activity"
        action={
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="h-9 cursor-pointer rounded-[9px] border border-border-subtle bg-bg-elevated px-4 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        }
      />

      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <div className="rounded-[12px] border border-border-subtle bg-bg-elevated px-5 py-10 text-center">
          <p className="text-[14px] font-medium text-text-primary">
            Could not load notifications
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-5 py-10 text-center">
          <p className="text-[14px] font-medium text-text-primary">
            You&apos;re all caught up
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            New notifications will show here when activity starts.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-[12px] border border-border-subtle bg-bg-elevated">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={`w-full px-4 py-4 text-left transition-colors duration-150 hover:bg-bg-muted ${
                    notification.read ? "" : "bg-brand-50/40"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read ? (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500"
                        aria-label="Unread"
                      />
                    ) : (
                      <span className="mt-1.5 size-2 shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-text-primary">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-[13px] text-text-secondary">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[12px] text-text-muted">
                        {notification.productName
                          ? `${notification.productName} · `
                          : ""}
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {hasMore && onLoadMore ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="h-9 cursor-pointer rounded-[9px] border border-border-subtle bg-bg-elevated px-4 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
