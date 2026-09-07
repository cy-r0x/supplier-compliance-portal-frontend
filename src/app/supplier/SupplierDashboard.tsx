"use client";

import Image from "next/image";
import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  HiOutlineBell,
  HiOutlineClipboardDocumentList,
  HiOutlineHome,
} from "react-icons/hi2";
import AppShell from "../../../components/layouts/AppShell";
import NotificationsInbox from "../../../components/notifications/NotificationsInbox";
import { formatDate } from "../admin/types";
import type { ProductRequest } from "../distributor/types";
import { useProductRequests } from "../distributor/useProductRequests";
import { useNotifications } from "../../lib/useNotifications";

type SupplierSection = "dashboard" | "products" | "notifications";

const SUPPLIER_SECTIONS: SupplierSection[] = [
  "dashboard",
  "products",
  "notifications",
];

function isSupplierSection(value: string): value is SupplierSection {
  return (SUPPLIER_SECTIONS as string[]).includes(value);
}

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: HiOutlineHome },
  {
    id: "products" as const,
    label: "Product request",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    id: "notifications" as const,
    label: "Notification",
    icon: HiOutlineBell,
  },
];

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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-5 py-10 text-center">
      <p className="text-[14px] font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-[9px] bg-bg-muted"
        />
      ))}
    </div>
  );
}

function ProgressCircle({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const size = 36;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex size-9 items-center justify-center"
      role="img"
      aria-label={`${clamped}% complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-bg-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-brand-500 transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span className="absolute font-mono text-[9px] font-medium text-text-primary">
        {clamped}%
      </span>
    </div>
  );
}

export function SupplierDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
          Loading…
        </div>
      }
    >
      <SupplierDashboardInner />
    </Suspense>
  );
}

const DASHBOARD_PATH = "/dashboard";

function SupplierDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, requests } = useProductRequests();

  const {
    ready: notificationsReady,
    notifications,
    unreadCount,
    error: notificationsError,
    markRead,
    markAllRead,
    refetch: refetchNotifications,
    hasMore: hasMoreNotifications,
    loadingMore: loadingMoreNotifications,
    loadMore: loadMoreNotifications,
  } = useNotifications();

  const sectionParam = searchParams.get("section");
  const section: SupplierSection =
    sectionParam && isSupplierSection(sectionParam)
      ? sectionParam
      : "dashboard";

  const navigate = useCallback(
    (id: string) => {
      if (!isSupplierSection(id)) return;
      const params = new URLSearchParams(searchParams.toString());
      if (id === "dashboard") params.delete("section");
      else params.set("section", id);
      const query = params.toString();
      router.replace(
        query ? `${DASHBOARD_PATH}?${query}` : DASHBOARD_PATH,
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );
  const approvedCount = useMemo(
    () => requests.filter((request) => request.status === "approved").length,
    [requests],
  );
  const rejectedCount = useMemo(
    () => requests.filter((request) => request.status === "rejected").length,
    [requests],
  );

  function handleEdit(request: ProductRequest) {
    router.push(`/products/${request.id}`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppShell
        navItems={NAV_ITEMS}
        activeNavId={section}
        onNavigate={navigate}
        notificationCount={unreadCount}
      >
        {!ready ? (
          <div>
            <PageHeader title="Dashboard" description="Loading…" />
            <SkeletonRows />
          </div>
        ) : section === "dashboard" ? (
          <DashboardSection
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            rejectedCount={rejectedCount}
            onViewRequests={() => navigate("products")}
          />
        ) : section === "products" ? (
          <ProductRequestsSection
            requests={requests}
            onEdit={handleEdit}
          />
        ) : (
          <NotificationsInbox
            notifications={notifications}
            unreadCount={unreadCount}
            loading={!notificationsReady}
            error={notificationsError}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onRetry={refetchNotifications}
            hasMore={hasMoreNotifications}
            loadingMore={loadingMoreNotifications}
            onLoadMore={loadMoreNotifications}
          />
        )}
      </AppShell>
    </div>
  );
}

function DashboardSection({
  pendingCount,
  approvedCount,
  rejectedCount,
  onViewRequests,
}: {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  onViewRequests: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Status overview of product requests from distributors"
        action={
          <button
            type="button"
            onClick={onViewRequests}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            View requests
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={pendingCount} />
        <StatCard label="Products approved" value={approvedCount} />
        <StatCard label="Products rejected" value={rejectedCount} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
      <p className="text-[12px] font-medium text-text-muted">{label}</p>
      <p className="mt-2 font-display text-[32px] font-semibold tracking-[-0.03em] text-brand-600">
        {value}
      </p>
    </section>
  );
}

function ProductRequestsSection({
  requests,
  onEdit,
}: {
  requests: ProductRequest[];
  onEdit: (request: ProductRequest) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (request) =>
        request.productName.toLowerCase().includes(q) ||
        request.distributorName.toLowerCase().includes(q),
    );
  }, [requests, search]);

  return (
    <div>
      <PageHeader
        title="Product request"
        description="Requests submitted by distributors"
      />

      {requests.length === 0 ? (
        <EmptyState
          title="No product requests yet"
          description="When a distributor requests a product, it will appear here."
        />
      ) : (
        <>
          <div className="mb-4">
            <label className="sr-only" htmlFor="supplier-product-search">
              Search product requests
            </label>
            <input
              id="supplier-product-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or distributor"
              className="h-10 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25 sm:max-w-xs"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No matching requests"
              description="Try a different search."
            />
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border-subtle bg-bg-muted/50 text-[12px] text-text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Product</th>
                    <th className="px-4 py-2.5 font-medium">Progress</th>
                    <th className="px-4 py-2.5 font-medium">Distributor</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filtered.map((request) => (
                    <tr key={request.id} className="h-14">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <Image
                            src={request.productImage}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="size-10 shrink-0 rounded-[8px] object-cover outline outline-border-subtle"
                          />
                          <span className="font-medium text-text-primary">
                            {request.productName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <ProgressCircle value={request.progress} />
                      </td>
                      <td className="px-4 py-2 text-text-secondary">
                        {request.distributorName}
                      </td>
                      <td className="px-4 py-2 font-mono text-[12px] text-text-muted">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {request.submitted ? (
                          <span className="text-[12px] font-medium text-brand-700">
                            Submitted
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEdit(request)}
                            className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
