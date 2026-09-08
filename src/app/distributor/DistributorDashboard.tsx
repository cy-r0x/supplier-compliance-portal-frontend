"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineBolt,
  HiOutlineClipboardDocumentList,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlineTruck,
  HiOutlineXMark,
} from "react-icons/hi2";
import ProductThumbnail from "@/components/products/ProductThumbnail";
import { getSettings } from "@/lib/api/settings-api";
import { useNotifications } from "../../lib/useNotifications";
import AppShell from "../../../components/layouts/AppShell";
import NotificationsInbox from "../../../components/notifications/NotificationsInbox";
import UserSettingsPage from "@/components/settings/UserSettingsPage";
import { Skeleton, SkeletonRows } from "@/components/loading/Skeleton";
import {
  AppWorkspaceSkeleton,
  PageHeaderSkeleton,
} from "@/components/loading/page-skeletons";
import EntityFormModal from "../admin/EntityFormModal";
import type { AdminEntity, EntityFormValues } from "../admin/types";
import { formatDate } from "../admin/types";
import { useAdminEntities } from "../admin/useAdminEntities";
import ProductQrCode from "./ProductQrCode";
import type {
  DistributorSection,
  ProductRequest,
  ProductRequestStatus,
} from "./types";
import { isDistributorSection, statusLabel } from "./types";
import { useProductRequests } from "./useProductRequests";

type SupplierModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; entity: AdminEntity };

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: HiOutlineHome },
  { id: "suppliers" as const, label: "Suppliers", icon: HiOutlineTruck },
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
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-5 py-10 text-center">
      <p className="text-[14px] font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

type RequestStatusFilter = "all" | ProductRequestStatus | "submitted";

function requestHref(request: ProductRequest): string {
  if (request.apiStatus === "PENDING") {
    return `/products/${request.id}/edit`;
  }
  return `/products/${request.id}/review`;
}

function RequestStatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-[12px] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
        active
          ? "border-brand-300 bg-brand-50 shadow-sm"
          : "border-border-subtle bg-bg-elevated hover:border-border-strong hover:bg-bg-muted/40"
      }`}
    >
      <p className="text-[12px] font-medium text-text-muted">{label}</p>
      <p
        className={`mt-1 font-display text-[28px] font-semibold tracking-[-0.03em] ${
          active ? "text-brand-700" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </button>
  );
}

function RequestStatusBadge({ request }: { request: ProductRequest }) {
  const label =
    request.apiStatus === "SUBMITTED"
      ? "Submitted"
      : request.apiStatus === "PENDING"
        ? "Pending"
        : statusLabel(request.status);

  const styles =
    request.apiStatus === "APPROVED" || request.status === "approved"
      ? "bg-brand-100 text-brand-700"
      : request.status === "rejected"
        ? "bg-danger-50 text-danger-500"
        : request.apiStatus === "SUBMITTED"
          ? "bg-amber-50 text-amber-700"
          : "bg-bg-inset text-text-secondary";

  return (
    <span
      className={`inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-medium ${styles}`}
    >
      {label}
    </span>
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

export function DistributorDashboard() {
  return (
    <Suspense fallback={<AppWorkspaceSkeleton label="Loading dashboard" />}>
      <DistributorDashboardInner />
    </Suspense>
  );
}

const DASHBOARD_PATH = "/dashboard";

function DistributorDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const {
    ready: entitiesReady,
    suppliers,
    addEntity,
    updateEntity,
  } = useAdminEntities({ roleFilter: "SUPPLIER" });

  const {
    ready: requestsReady,
    requests,
    addRequest: _addRequest,
    deleteRequest,
    refetch: refetchRequests,
  } = useProductRequests();

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

  const ready = entitiesReady && requestsReady && notificationsReady;

  const sectionParam = searchParams.get("section");
  const section: DistributorSection =
    sectionParam && isDistributorSection(sectionParam)
      ? sectionParam
      : "dashboard";

  const [supplierModal, setSupplierModal] = useState<SupplierModalState>({
    open: false,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const navigate = useCallback(
    (id: string) => {
      if (!isDistributorSection(id)) return;
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

  function openCreateSupplier() {
    setSupplierModal({ open: true, mode: "create" });
  }

  function openEditSupplier(entity: AdminEntity) {
    setSupplierModal({ open: true, mode: "edit", entity });
  }

  async function handleSupplierSubmit(values: EntityFormValues) {
    if (!supplierModal.open) return;
    setActionError(null);
    try {
      if (supplierModal.mode === "create") {
        await addEntity("supplier", values);
        setSupplierModal({ open: false });
        return;
      }
      await updateEntity(
        supplierModal.entity.id,
        {
          ...values,
          password: values.password.trim() || supplierModal.entity.password,
        },
        "supplier",
      );
      setSupplierModal({ open: false });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save supplier");
    }
  }

  function handleDeleteSupplier(_entity: AdminEntity) {
    setActionError("Supplier delete is not available yet");
  }

  function openCreateRequest() {
    router.push("/products/new");
  }

  function openViewSubmission(request: ProductRequest) {
    router.push(`/products/${request.id}/review`);
  }

  function openEditRequest(request: ProductRequest) {
    router.push(`/products/${request.id}/edit`);
  }

  async function handleDeleteRequest(request: ProductRequest) {
    if (!window.confirm(`Delete request for ${request.productName}?`)) return;
    setActionError(null);
    try {
      await deleteRequest(request.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete request");
    }
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
          <div role="status" aria-busy="true" aria-live="polite">
            <PageHeaderSkeleton action />
            <div className="mt-4 rounded-[12px] border border-border-subtle bg-bg-elevated p-4">
              <Skeleton className="h-10 w-full max-w-sm" />
              <div className="mt-4">
                <SkeletonRows count={4} height="h-14" />
              </div>
            </div>
            <span className="sr-only">Loading dashboard</span>
          </div>
        ) : section === "dashboard" ? (
          <DashboardSection
            requests={requests}
            supplierCount={suppliers.length}
            unreadCount={unreadCount}
            onCreateRequest={openCreateRequest}
            onCreateSupplier={openCreateSupplier}
            onViewRequests={() => navigate("products")}
            onViewNotifications={() => navigate("notifications")}
            onOpenRequest={(request) => router.push(requestHref(request))}
          />
        ) : section === "suppliers" ? (
          <SuppliersSection
            suppliers={suppliers}
            onCreate={openCreateSupplier}
            onEdit={openEditSupplier}
            onDelete={handleDeleteSupplier}
          />
        ) : section === "products" ? (
          <ProductRequestsSection
            requests={requests}
            supplierCount={suppliers.length}
            actionError={actionError}
            onCreate={openCreateRequest}
            onEdit={openEditRequest}
            onDelete={handleDeleteRequest}
            onView={openViewSubmission}
            onCreateSupplier={openCreateSupplier}
            onOpenSettings={() => navigate("settings")}
          />
        ) : section === "notifications" ? (
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
        ) : (
          <UserSettingsPage />
        )}
      </AppShell>

      <EntityFormModal
        open={supplierModal.open}
        mode={supplierModal.open ? supplierModal.mode : "create"}
        entityType="supplier"
        fixedRole="supplier"
        initial={
          supplierModal.open && supplierModal.mode === "edit"
            ? supplierModal.entity
            : null
        }
        onClose={() => setSupplierModal({ open: false })}
        onSubmit={handleSupplierSubmit}
      />
    </div>
  );
}

function DashboardPanel({
  title,
  count,
  viewAllLabel,
  onViewAll,
  children,
}: {
  title: string;
  count: number;
  viewAllLabel?: string;
  onViewAll?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-border-subtle bg-bg-elevated">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-[14px] font-medium text-text-primary">{title}</h2>
          <span
            className="rounded-[6px] bg-bg-muted px-1.5 py-0.5 font-mono text-[11px] text-text-muted"
            aria-label={`${count} items`}
          >
            {count}
          </span>
        </div>
        {onViewAll && count > 0 ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-[7px] px-2 py-1 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {viewAllLabel ?? "View all"}
            <HiOutlineArrowRight aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

function DashboardRequestRow({
  request,
  actionLabel,
  onOpen,
}: {
  request: ProductRequest;
  actionLabel: string;
  onOpen: (request: ProductRequest) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(request)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[9px] px-2 py-2.5 text-left transition-colors duration-150 hover:bg-bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <ProductThumbnail src={request.productImage} size={36} fit="cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">
          {request.productName}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-text-secondary">
          {request.supplierName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <RequestStatusBadge request={request} />
        <span className="hidden text-[12px] font-medium text-brand-600 sm:inline">
          {actionLabel}
        </span>
        <HiOutlineArrowRight
          aria-hidden="true"
          className="size-4 text-text-muted sm:hidden"
        />
      </div>
    </button>
  );
}

function DashboardSection({
  requests,
  supplierCount,
  unreadCount,
  onCreateRequest,
  onCreateSupplier,
  onViewRequests,
  onViewNotifications,
  onOpenRequest,
}: {
  requests: ProductRequest[];
  supplierCount: number;
  unreadCount: number;
  onCreateRequest: () => void;
  onCreateSupplier: () => void;
  onViewRequests: () => void;
  onViewNotifications: () => void;
  onOpenRequest: (request: ProductRequest) => void;
}) {
  const awaitingReview = useMemo(
    () =>
      requests
        .filter((request) => request.apiStatus === "SUBMITTED")
        .sort((a, b) => {
          const aTime = a.submittedAt ?? a.requestedAt;
          const bTime = b.submittedAt ?? b.requestedAt;
          return bTime.localeCompare(aTime);
        }),
    [requests],
  );

  const waitingOnSuppliers = useMemo(
    () =>
      requests
        .filter(
          (request) =>
            request.apiStatus === "PENDING" || request.status === "rejected",
        )
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [requests],
  );

  const hasNoSuppliers = supplierCount === 0;
  const hasNoRequests = requests.length === 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="What needs your attention right now"
        action={
          <button
            type="button"
            onClick={onCreateRequest}
            disabled={hasNoSuppliers}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            New product request
          </button>
        }
      />

      {hasNoSuppliers ? (
        <EmptyState
          title="Add your first supplier"
          description="Create a supplier account before sending product compliance requests."
          action={
            <button
              type="button"
              onClick={onCreateSupplier}
              className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
            >
              Create new supplier
            </button>
          }
        />
      ) : hasNoRequests ? (
        <EmptyState
          title="No product requests yet"
          description="Create a request to start collecting compliance from your suppliers."
          action={
            <button
              type="button"
              onClick={onCreateRequest}
              className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
            >
              New product request
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onViewNotifications}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors duration-150 hover:bg-amber-100/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <div className="flex items-center gap-2.5">
                <HiOutlineBell
                  aria-hidden="true"
                  className="size-4 shrink-0 text-amber-700"
                />
                <p className="text-[13px] text-amber-900">
                  <span className="font-medium">{unreadCount}</span> unread
                  notification{unreadCount === 1 ? "" : "s"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-800">
                Open inbox
                <HiOutlineArrowRight aria-hidden="true" className="size-3.5" />
              </span>
            </button>
          ) : null}

          <DashboardPanel
            title="Awaiting your review"
            count={awaitingReview.length}
            onViewAll={onViewRequests}
          >
            {awaitingReview.length === 0 ? (
              <p className="px-2 py-6 text-center text-[13px] text-text-secondary">
                Nothing awaiting review. Submitted requests will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {awaitingReview.slice(0, 5).map((request) => (
                  <li key={request.id}>
                    <DashboardRequestRow
                      request={request}
                      actionLabel="Review"
                      onOpen={onOpenRequest}
                    />
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Waiting on suppliers"
            count={waitingOnSuppliers.length}
            onViewAll={onViewRequests}
          >
            {waitingOnSuppliers.length === 0 ? (
              <p className="px-2 py-6 text-center text-[13px] text-text-secondary">
                No open requests with suppliers right now.
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {waitingOnSuppliers.slice(0, 5).map((request) => (
                  <li key={request.id}>
                    <DashboardRequestRow
                      request={request}
                      actionLabel={
                        request.status === "rejected" ? "View details" : "Open"
                      }
                      onOpen={onOpenRequest}
                    />
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <p className="text-[12px] text-text-muted">
            {supplierCount} supplier{supplierCount === 1 ? "" : "s"} in your
            network.
          </p>
        </div>
      )}
    </div>
  );
}

function SuppliersSection({
  suppliers,
  onCreate,
  onEdit,
  onDelete,
}: {
  suppliers: AdminEntity[];
  onCreate: () => void;
  onEdit: (entity: AdminEntity) => void;
  onDelete: (entity: AdminEntity) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(q) ||
        supplier.email.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description={`${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"}`}
        action={
          <button
            type="button"
            onClick={onCreate}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Create new supplier
          </button>
        }
      />

      <div className="mb-4">
        <label className="sr-only" htmlFor="supplier-search">
          Search suppliers
        </label>
        <input
          id="supplier-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          className="h-10 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25 sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={suppliers.length === 0 ? "No suppliers yet" : "No matching suppliers"}
          description={
            suppliers.length === 0
              ? "Create a supplier to start building your network."
              : "Try a different search."
          }
          action={
            suppliers.length === 0 ? (
              <button
                type="button"
                onClick={onCreate}
                className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
              >
                Create new supplier
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-border-subtle bg-bg-muted/50 text-[12px] text-text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((supplier) => (
                <tr key={supplier.id} className="h-11">
                  <td className="px-4 py-2 font-medium text-text-primary">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {supplier.email}
                  </td>
                  <td className="px-4 py-2 font-mono text-[12px] text-text-muted">
                    {formatDate(supplier.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(supplier)}
                      disabled
                      title="Supplier edit is not available yet"
                      className="cursor-not-allowed rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-text-muted opacity-60"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRequestActions({
  request,
  onEdit,
  onDelete,
  onView,
}: {
  request: ProductRequest;
  onEdit: (request: ProductRequest) => void;
  onDelete: (request: ProductRequest) => void;
  onView: (request: ProductRequest) => void;
}) {
  if (request.apiStatus === "PENDING") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(request);
          }}
          className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(request);
          }}
          className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-danger-500 transition-colors duration-150 hover:bg-danger-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {request.apiStatus === "SUBMITTED" ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView(request);
          }}
          className="cursor-pointer rounded-[7px] bg-brand-500 px-2.5 py-1.5 text-[12px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Review
        </button>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView(request);
          }}
          className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          View submission
        </button>
      )}
      {request.apiStatus === "APPROVED" && request.publicSlug ? (
        <div onClick={(event) => event.stopPropagation()}>
          <ProductQrCode request={request} />
        </div>
      ) : null}
    </div>
  );
}

function ProductRequestMobileCard({
  request,
  onOpen,
  onEdit,
  onDelete,
  onView,
}: {
  request: ProductRequest;
  onOpen: (request: ProductRequest) => void;
  onEdit: (request: ProductRequest) => void;
  onDelete: (request: ProductRequest) => void;
  onView: (request: ProductRequest) => void;
}) {
  return (
    <article
      className="cursor-pointer rounded-[12px] border border-border-subtle bg-bg-elevated p-4 transition-colors duration-150 hover:border-border-strong hover:bg-bg-muted/30"
      onClick={() => onOpen(request)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(request);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${request.productName}`}
    >
      <div className="flex items-start gap-3">
        <ProductThumbnail src={request.productImage} size={44} fit="cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[14px] font-medium text-text-primary">
              {request.productName}
            </p>
            <RequestStatusBadge request={request} />
          </div>
          <p className="mt-1 text-[12px] text-text-secondary">
            {request.supplierName}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ProgressCircle value={request.progress} />
              <span className="font-mono text-[11px] text-text-muted">
                {formatDate(request.requestedAt)}
              </span>
            </div>
            <div onClick={(event) => event.stopPropagation()}>
              <ProductRequestActions
                request={request}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductRequestsSection({
  requests,
  supplierCount,
  actionError,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onCreateSupplier,
  onOpenSettings,
}: {
  requests: ProductRequest[];
  supplierCount: number;
  actionError: string | null;
  onCreate: () => void;
  onEdit: (request: ProductRequest) => void;
  onDelete: (request: ProductRequest) => void;
  onView: (request: ProductRequest) => void;
  onCreateSupplier: () => void;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);

  useEffect(() => {
    getSettings()
      .then((settings) =>
        setAutoApproveEnabled(settings.autoApproveProductRequests),
      )
      .catch(() => {
        setAutoApproveEnabled(false);
      });
  }, []);

  const stats = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((request) => request.apiStatus === "PENDING")
        .length,
      submitted: requests.filter((request) => request.apiStatus === "SUBMITTED")
        .length,
      approved: requests.filter((request) => request.status === "approved")
        .length,
      rejected: requests.filter((request) => request.status === "rejected")
        .length,
    }),
    [requests],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter === "submitted" && request.apiStatus !== "SUBMITTED") {
        return false;
      }
      if (
        statusFilter !== "all" &&
        statusFilter !== "submitted" &&
        request.status !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        request.productName.toLowerCase().includes(q) ||
        request.supplierName.toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  function openRequest(request: ProductRequest) {
    router.push(requestHref(request));
  }

  const filterOptions: { value: RequestStatusFilter; label: string; count: number }[] =
    [
      { value: "all", label: "All", count: stats.all },
      { value: "pending", label: "Pending", count: stats.pending },
      { value: "submitted", label: "Submitted", count: stats.submitted },
      { value: "approved", label: "Approved", count: stats.approved },
      { value: "rejected", label: "Rejected", count: stats.rejected },
    ];

  return (
    <div>
      <PageHeader
        title="Product requests"
        description="Track products requested from your suppliers"
        action={
          <button
            type="button"
            onClick={onCreate}
            disabled={supplierCount === 0}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            New request
          </button>
        }
      />

      {autoApproveEnabled ? (
        <div
          className="mb-4 flex flex-col gap-3 rounded-[12px] border border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="flex items-start gap-2.5">
            <HiOutlineBolt
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-brand-600"
            />
            <p className="text-[13px] text-brand-800">
              Auto-approve is on. Supplier submissions are approved immediately
              without manual review.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="shrink-0 cursor-pointer self-start rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:self-center"
          >
            Manage in Settings
          </button>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="mb-4 text-[13px] text-danger-500">
          {actionError}
        </p>
      ) : null}

      {supplierCount === 0 ? (
        <EmptyState
          title="Add a supplier first"
          description="You need at least one supplier before creating a product request."
          action={
            <button
              type="button"
              onClick={onCreateSupplier}
              className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
            >
              Create new supplier
            </button>
          }
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No product requests yet"
          description="Create a request to track products from your suppliers."
          action={
            <button
              type="button"
              onClick={onCreate}
              className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
            >
              New request
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {filterOptions.map((option) => (
              <RequestStatCard
                key={option.value}
                label={option.label}
                value={option.count}
                active={statusFilter === option.value}
                onClick={() => setStatusFilter(option.value)}
              />
            ))}
          </div>

          <div className="mb-4 rounded-[12px] border border-border-subtle bg-bg-elevated p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <label className="sr-only" htmlFor="product-search">
                  Search product requests
                </label>
                <HiOutlineMagnifyingGlass
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
                />
                <input
                  id="product-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product or supplier"
                  className="h-10 w-full rounded-[9px] border border-border-subtle bg-bg-app py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] text-text-muted">
                  Showing{" "}
                  <span className="font-medium text-text-primary">
                    {filtered.length}
                  </span>{" "}
                  of {requests.length}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-[7px] px-2 py-1 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <HiOutlineXMark aria-hidden="true" className="size-3.5" />
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className="mt-3 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter by status"
            >
              {filterOptions.map((option) => {
                const active = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    aria-pressed={active}
                    className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                      active
                        ? "bg-brand-100 text-brand-700"
                        : "bg-bg-muted/60 text-text-secondary hover:bg-bg-muted"
                    }`}
                  >
                    {option.label}
                    <span
                      className={`rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] ${
                        active
                          ? "bg-brand-200/70 text-brand-800"
                          : "bg-bg-elevated text-text-muted"
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {filtered.length} of {requests.length} product requests shown
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              title="No matching requests"
              description="Try a different search term or status filter."
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {filtered.map((request) => (
                  <ProductRequestMobileCard
                    key={request.id}
                    request={request}
                    onOpen={openRequest}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated md:block">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="border-b border-border-subtle bg-bg-muted/50 text-[12px] text-text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Product</th>
                      <th className="px-4 py-2.5 font-medium">Progress</th>
                      <th className="px-4 py-2.5 font-medium">Supplier</th>
                      <th className="px-4 py-2.5 font-medium">Date of request</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filtered.map((request) => (
                      <tr
                        key={request.id}
                        className="h-14 cursor-pointer transition-colors duration-150 hover:bg-bg-muted/40"
                        onClick={() => openRequest(request)}
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail
                              src={request.productImage}
                              size={40}
                              fit="cover"
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
                          {request.supplierName}
                        </td>
                        <td className="px-4 py-2 font-mono text-[12px] text-text-muted">
                          {formatDate(request.requestedAt)}
                        </td>
                        <td className="px-4 py-2">
                          <RequestStatusBadge request={request} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <ProductRequestActions
                            request={request}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={onView}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
