"use client";

import Image from "next/image";
import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  HiOutlineBell,
  HiOutlineClipboardDocumentList,
  HiOutlineHome,
  HiOutlineTruck,
} from "react-icons/hi2";
import { useNotifications } from "../../lib/useNotifications";
import AppShell from "../../../components/layouts/AppShell";
import NotificationsInbox from "../../../components/notifications/NotificationsInbox";
import UserSettingsPage from "@/components/settings/UserSettingsPage";
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
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
          Loading…
        </div>
      }
    >
      <DistributorDashboardInner />
    </Suspense>
  );
}

const DASHBOARD_PATH = "/dashboard";

function DistributorDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const distributorName = user?.name ?? "";

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
          <div>
            <PageHeader title="Dashboard" description="Loading…" />
            <SkeletonRows />
          </div>
        ) : section === "dashboard" ? (
          <DashboardSection
            supplierCount={suppliers.length}
            onCreateSupplier={openCreateSupplier}
            onViewSuppliers={() => navigate("suppliers")}
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
          <UserSettingsPage user={user} />
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

function DashboardSection({
  supplierCount,
  onCreateSupplier,
  onViewSuppliers,
}: {
  supplierCount: number;
  onCreateSupplier: () => void;
  onViewSuppliers: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your supplier network"
      />

      <section className="max-w-sm rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
        <p className="text-[12px] font-medium text-text-muted">Suppliers</p>
        <p className="mt-2 font-display text-[32px] font-semibold tracking-[-0.03em] text-brand-600">
          {supplierCount}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreateSupplier}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Create new supplier
          </button>
          <button
            type="button"
            onClick={onViewSuppliers}
            className="h-10 cursor-pointer rounded-[9px] px-4 text-[13px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            View details
          </button>
        </div>
      </section>
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

function ProductRequestsSection({
  requests,
  supplierCount,
  actionError,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onCreateSupplier,
}: {
  requests: ProductRequest[];
  supplierCount: number;
  actionError: string | null;
  onCreate: () => void;
  onEdit: (request: ProductRequest) => void;
  onDelete: (request: ProductRequest) => void;
  onView: (request: ProductRequest) => void;
  onCreateSupplier: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ProductRequestStatus | "submitted"
  >("all");

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

  return (
    <div>
      <PageHeader
        title="Product request"
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

      {actionError ? (
        <p role="alert" className="mb-4 text-[13px] text-danger-500">{actionError}</p>
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="product-search">
              Search product requests
            </label>
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or supplier"
              className="h-10 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25 sm:max-w-xs"
            />
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label="Filter by status"
            >
              {(
                [
                  ["all", "All"],
                  ["pending", "Pending"],
                  ["submitted", "Submitted"],
                  ["approved", "Approved"],
                  ["rejected", "Rejected"],
                ] as const
              ).map(([value, label]) => {
                const active = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    aria-pressed={active}
                    className={`h-9 cursor-pointer rounded-[9px] px-3 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                      active
                        ? "bg-brand-100 text-brand-700"
                        : "bg-bg-elevated text-text-secondary hover:bg-bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No matching requests"
              description="Try a different search or status filter."
            />
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated">
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
                        {request.supplierName}
                      </td>
                      <td className="px-4 py-2 font-mono text-[12px] text-text-muted">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-4 py-2">
                        <RequestStatusBadge request={request} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex gap-1">
                            {request.apiStatus !== "PENDING" ? (
                              <button
                                type="button"
                                onClick={() => onView(request)}
                                className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60"
                              >
                                View submission
                              </button>
                            ) : null}
                            {request.apiStatus === "PENDING" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEdit(request)}
                                  className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete(request)}
                                  className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-danger-500 transition-colors duration-150 hover:bg-danger-50"
                                >
                                  Delete
                                </button>
                              </>
                            ) : null}
                          </div>
                          {request.apiStatus === "APPROVED" && request.publicSlug ? (
                            <ProductQrCode request={request} />
                          ) : null}
                        </div>
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
