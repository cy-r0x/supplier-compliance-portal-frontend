"use client";

import { useEffect, useState } from "react";

export type PortalNotification = {
  id: string;
  type: "compliance_submitted";
  message: string;
  productRequestId: string;
  productName: string;
  supplierName: string;
  distributorName: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = "scp-notifications";

function readNotifications(): PortalNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PortalNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: PortalNotification[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function useNotifications(distributorName?: string) {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNotifications(readNotifications());
    setReady(true);
  }, []);

  function persist(next: PortalNotification[]) {
    setNotifications(next);
    writeNotifications(next);
  }

  function addNotification(
    notification: Omit<PortalNotification, "id" | "createdAt" | "read">,
  ) {
    const entry: PortalNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    persist([entry, ...readNotifications()]);
  }

  const filtered = distributorName
    ? notifications.filter((n) => n.distributorName === distributorName)
    : notifications;

  const unreadCount = filtered.filter((n) => !n.read).length;

  function markRead(id: string) {
    persist(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  return {
    ready,
    notifications: filtered,
    unreadCount,
    addNotification,
    markRead,
  };
}

export function addComplianceNotification(params: {
  productRequestId: string;
  productName: string;
  supplierName: string;
  distributorName: string;
}) {
  const entry: PortalNotification = {
    id: crypto.randomUUID(),
    type: "compliance_submitted",
    message: `${params.supplierName} submitted compliance documents for ${params.productName}.`,
    productRequestId: params.productRequestId,
    productName: params.productName,
    supplierName: params.supplierName,
    distributorName: params.distributorName,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const existing = readNotifications();
  writeNotifications([entry, ...existing]);
}
