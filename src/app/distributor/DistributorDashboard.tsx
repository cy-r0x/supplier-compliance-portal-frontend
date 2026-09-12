"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineBolt,
  HiOutlineChevronRight,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentDuplicate,
  HiOutlineEye,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineTruck,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import ProductThumbnail from "@/components/products/ProductThumbnail";
import { useNotifications } from "../../lib/useNotifications";
import AppShell from "../../../components/layouts/AppShell";
import NotificationsInbox from "../../../components/notifications/NotificationsInbox";
import UserSettingsPage from "@/components/settings/UserSettingsPage";
import { TemplatesSection } from "@/components/products/TemplatesSection";
import { Skeleton, SkeletonRows } from "@/components/loading/Skeleton";
import {
  AppWorkspaceSkeleton,
  PageHeaderSkeleton,
} from "@/components/loading/page-skeletons";
import type { AdminEntity } from "../admin/types";
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
import {
  addOrganizationMember,
  getOrganization,
  getOrganizationSettings,
  removeOrganizationMember,
  updateOrganizationMember,
  type OrganizationDetail,
  type OrganizationMemberRole,
} from "@/lib/api/organizations-api";
import { listUsers, type ApiUser } from "@/lib/api/users-api";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: HiOutlineHome },
  { id: "suppliers" as const, label: "Suppliers", icon: HiOutlineTruck },
  {
    id: "templates" as const,
    label: "Templates",
    icon: HiOutlineDocumentDuplicate,
  },
  { id: "team" as const, label: "Team", icon: HiOutlineUsers },
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

function requestHref(
  request: ProductRequest,
  options?: { canManage?: boolean },
): string {
  const canManage = options?.canManage ?? false;
  // Members are read-only — always open the review/view page.
  if (request.apiStatus === "PENDING" && canManage) {
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

function progressHint(value: number): string {
  if (value >= 100) return "Complete";
  if (value <= 0) return "Not started";
  return "In progress";
}

function ProgressCircle({ value, showLabel = false }: { value: number; showLabel?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value));
  const size = 36;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative inline-flex size-9 shrink-0 items-center justify-center"
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
            className={`transition-[stroke-dashoffset] duration-150 ${
              clamped >= 100 ? "text-brand-600" : "text-brand-500"
            }`}
          />
        </svg>
        <span className="absolute font-mono text-[9px] font-medium text-text-primary">
          {clamped}%
        </span>
      </div>
      {showLabel ? (
        <span className="text-[12px] text-text-secondary">{progressHint(clamped)}</span>
      ) : null}
    </div>
  );
}

function TableActionButton({
  label,
  icon,
  onClick,
  variant = "ghost",
}: {
  label: string;
  icon: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: "ghost" | "primary" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "bg-brand-500 text-text-inverse hover:bg-brand-600"
      : variant === "danger"
        ? "text-danger-500 hover:bg-danger-50"
        : "text-text-secondary hover:bg-bg-muted hover:text-text-primary";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${styles}`}
    >
      {icon}
      {variant !== "danger" ? <span>{label}</span> : null}
    </button>
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
  const isManager = user?.organization?.role === "MANAGER";
  const navItems = useMemo(
    () =>
      isManager
        ? NAV_ITEMS
        : NAV_ITEMS.filter(
            (item) => item.id !== "suppliers" && item.id !== "templates" && item.id !== "team",
          ),
    [isManager],
  );

  const {
    ready: entitiesReady,
    suppliers,
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
        navItems={navItems}
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
            organizationName={user?.organization?.name}
            organizationRole={user?.organization?.role}
            requests={requests}
            supplierCount={suppliers.length}
            unreadCount={unreadCount}
            onCreateRequest={openCreateRequest}
            canManage={isManager}
            onViewRequests={() => navigate("products")}
            onViewNotifications={() => navigate("notifications")}
            onOpenRequest={(request) =>
              router.push(requestHref(request, { canManage: isManager }))
            }
          />
        ) : section === "suppliers" && isManager ? (
          <SuppliersSection suppliers={suppliers} />
        ) : section === "templates" && isManager ? (
          <TemplatesSection />
        ) : section === "team" && isManager && user?.organization ? (
          <TeamSection organizationId={user.organization.id} />
        ) : section === "products" ? (
          <ProductRequestsSection
            requests={requests}
            supplierCount={suppliers.length}
            actionError={actionError}
            onCreate={openCreateRequest}
            onEdit={openEditRequest}
            onDelete={handleDeleteRequest}
            onView={openViewSubmission}
            onOpenSettings={() => navigate("settings")}
            canManage={isManager}
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
  organizationName,
  organizationRole,
  requests,
  supplierCount,
  unreadCount,
  onCreateRequest,
  onViewRequests,
  onViewNotifications,
  onOpenRequest,
  canManage,
}: {
  organizationName?: string;
  organizationRole?: "MANAGER" | "MEMBER";
  requests: ProductRequest[];
  supplierCount: number;
  unreadCount: number;
  onCreateRequest: () => void;
  onViewRequests: () => void;
  onViewNotifications: () => void;
  onOpenRequest: (request: ProductRequest) => void;
  canManage: boolean;
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
  const orgRoleLabel =
    organizationRole === "MANAGER"
      ? "Manager"
      : organizationRole === "MEMBER"
        ? "Member"
        : null;

  return (
    <div>
      <PageHeader
        title={organizationName ?? "Dashboard"}
        description={
          organizationName
            ? `Signed in as ${orgRoleLabel ?? "member"} · What needs attention`
            : "What needs your attention right now"
        }
        action={canManage ? (
          <button
            type="button"
            onClick={onCreateRequest}
            disabled={hasNoSuppliers}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            New product request
          </button>
        ) : undefined}
      />

      {hasNoSuppliers && canManage ? (
        <EmptyState
          title="No suppliers available"
          description="Ask a platform admin to create supplier accounts before you send product compliance requests."
        />
      ) : hasNoRequests ? (
        <EmptyState
          title="No product requests yet"
          description="Create a request to start collecting compliance from your suppliers."
          action={canManage ? (
            <button
              type="button"
              onClick={onCreateRequest}
              className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
            >
              New product request
            </button>
          ) : undefined}
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
}: {
  suppliers: AdminEntity[];
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
        description={`${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"} available for product requests. Accounts are managed by platform admins.`}
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
              ? "Ask a platform admin to create suppliers. Once available, you can assign them to product requests."
              : "Try a different search."
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
  layout = "table",
}: {
  request: ProductRequest;
  onEdit: (request: ProductRequest) => void;
  onDelete: (request: ProductRequest) => void;
  onView: (request: ProductRequest) => void;
  layout?: "table" | "compact";
}) {
  const { user } = useAuth();
  const canManage = user?.organization?.role === "MANAGER";
  const stop = (event: MouseEvent) => event.stopPropagation();

  if (request.apiStatus === "PENDING" && canManage) {
    return (
      <div
        className={`inline-flex items-center rounded-[8px] border border-border-subtle bg-bg-muted/30 p-0.5 ${
          layout === "compact" ? "flex-wrap justify-end" : ""
        }`}
      >
        <TableActionButton
          label="Edit"
          icon={<HiOutlinePencilSquare aria-hidden="true" className="size-3.5" />}
          onClick={(event) => {
            stop(event);
            onEdit(request);
          }}
        />
        <TableActionButton
          label="Delete"
          variant="danger"
          icon={<HiOutlineTrash aria-hidden="true" className="size-3.5" />}
          onClick={(event) => {
            stop(event);
            onDelete(request);
          }}
        />
      </div>
    );
  }

  const viewLabel =
    request.apiStatus === "SUBMITTED" && canManage ? "Review" : "View submission";
  const viewVariant =
    request.apiStatus === "SUBMITTED" && canManage ? "primary" : "ghost";
  const showQr =
    request.apiStatus === "APPROVED" && Boolean(request.publicSlug);

  return (
    <div
      className={`inline-flex items-center gap-2 ${
        layout === "compact" ? "flex-wrap justify-end" : "justify-end"
      }`}
    >
      <TableActionButton
        label={viewLabel}
        variant={viewVariant}
        icon={
          request.apiStatus === "SUBMITTED" ? (
            <HiOutlineClipboardDocumentList aria-hidden="true" className="size-3.5" />
          ) : (
            <HiOutlineEye aria-hidden="true" className="size-3.5" />
          )
        }
        onClick={(event) => {
          stop(event);
          onView(request);
        }}
      />
      {showQr ? <ProductQrCode request={request} size={32} /> : null}
    </div>
  );
}

function ProductRequestTableRow({
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
    <tr
      className="group cursor-pointer transition-colors duration-150 hover:bg-bg-muted/40"
      onClick={() => onOpen(request)}
    >
      <td className="px-4 py-3">
        <div className="flex min-w-[220px] items-center gap-3">
          <ProductThumbnail src={request.productImage} size={44} fit="cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-text-primary">
              {request.productName}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-text-secondary">
              {request.supplierName}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <ProgressCircle value={request.progress} showLabel />
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-text-muted">
        {formatDate(request.requestedAt)}
      </td>
      <td className="px-4 py-3">
        <RequestStatusBadge request={request} />
      </td>
      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-end">
          <ProductRequestActions
            request={request}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </div>
      </td>
      <td className="w-8 px-2 py-3">
        <HiOutlineChevronRight
          aria-hidden="true"
          className="size-4 text-text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
      </td>
    </tr>
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
                layout="compact"
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
  onOpenSettings,
  canManage,
}: {
  requests: ProductRequest[];
  supplierCount: number;
  actionError: string | null;
  onCreate: () => void;
  onEdit: (request: ProductRequest) => void;
  onDelete: (request: ProductRequest) => void;
  onView: (request: ProductRequest) => void;
  onOpenSettings: () => void;
  canManage: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);

  useEffect(() => {
    if (!canManage || !user?.organization) return;
    getOrganizationSettings(user.organization.id)
      .then((settings) =>
        setAutoApproveEnabled(settings.autoApproveProductRequests),
      )
      .catch(() => {
        setAutoApproveEnabled(false);
      });
  }, [canManage, user?.organization]);

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
    router.push(requestHref(request, { canManage }));
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
        action={canManage ? (
          <button
            type="button"
            onClick={onCreate}
            disabled={supplierCount === 0}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            New request
          </button>
        ) : undefined}
      />

      {autoApproveEnabled && canManage ? (
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

      {supplierCount === 0 && canManage ? (
        <EmptyState
          title="No suppliers available"
          description="Ask a platform admin to create suppliers before you can start a product request."
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
                    onEdit={canManage ? onEdit : onView}
                    onDelete={canManage ? onDelete : onView}
                    onView={onView}
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[12px] border border-border-subtle bg-bg-elevated md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[13px]">
                    <thead className="border-b border-border-subtle bg-bg-muted/50 text-[11px] font-medium tracking-[0.02em] text-text-muted uppercase">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Progress</th>
                        <th className="px-4 py-3">Requested</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                        <th className="w-8 px-2 py-3">
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filtered.map((request) => (
                        <ProductRequestTableRow
                          key={request.id}
                          request={request}
                          onOpen={openRequest}
                          onEdit={canManage ? onEdit : onView}
                          onDelete={canManage ? onDelete : onView}
                          onView={onView}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TeamSection({ organizationId }: { organizationId: string }) {
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [candidates, setCandidates] = useState<ApiUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<OrganizationMemberRole>("MEMBER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, users] = await Promise.all([
        getOrganization(organizationId),
        listUsers({ role: "USER", limit: 100, sort: "name:asc" }),
      ]);
      setOrganization(detail);
      const available = users.items.filter(
        (candidate) => !candidate.organization,
      );
      setCandidates(available);
      setSelectedUserId(
        available.find(
          (candidate) =>
            !detail.members.some((member) => member.user.id === candidate.id),
        )?.id ?? "",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addableUsers = candidates.filter(
    (candidate) =>
      !candidate.organization &&
      !organization?.members.some((member) => member.user.id === candidate.id),
  );

  async function handleAdd() {
    if (!selectedUserId) return;
    setSaving(true);
    setError(null);
    try {
      await addOrganizationMember(organizationId, {
        userId: selectedUserId,
        role: selectedRole,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add team member");
    } finally {
      setSaving(false);
    }
  }

  const managerCount =
    organization?.members.filter((member) => member.role === "MANAGER").length ??
    0;

  async function handleRoleChange(
    membershipId: string,
    role: OrganizationMemberRole,
  ) {
    const target = organization?.members.find(
      (member) => member.id === membershipId,
    );
    if (
      target?.role === "MANAGER" &&
      role === "MEMBER" &&
      managerCount === 1
    ) {
      setError("Cannot demote the last manager of an organization");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateOrganizationMember(organizationId, membershipId, { role });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(membershipId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this organization?`)) return;
    setSaving(true);
    setError(null);
    try {
      await removeOrganizationMember(organizationId, membershipId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description={`Manage access to ${organization?.name ?? "your organization"}`}
      />
      {error ? (
        <p className="mb-4 rounded-[9px] border border-danger-500/30 bg-danger-50 px-4 py-3 text-[13px] text-danger-500">
          {error}
        </p>
      ) : null}
      <section className="mb-5 rounded-[12px] border border-border-subtle bg-bg-elevated p-4">
        <h2 className="text-[14px] font-medium text-text-primary">Add member</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedUserId}
            disabled={saving || addableUsers.length === 0}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-[9px] border border-border-subtle bg-bg-app px-3 text-[13px]"
          >
            {addableUsers.length === 0 ? (
              <option value="">No unassigned users available</option>
            ) : (
              addableUsers.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.email})
                </option>
              ))
            )}
          </select>
          <select
            value={selectedRole}
            disabled={saving}
            onChange={(event) =>
              setSelectedRole(event.target.value as OrganizationMemberRole)
            }
            className="h-10 rounded-[9px] border border-border-subtle bg-bg-app px-3 text-[13px]"
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
          </select>
          <button
            type="button"
            disabled={saving || !selectedUserId}
            onClick={() => void handleAdd()}
            className="h-10 rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse disabled:opacity-60"
          >
            Add to team
          </button>
        </div>
      </section>
      {loading ? (
        <SkeletonRows />
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-border-subtle bg-bg-muted/50 text-[12px] text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Organization role</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {organization?.members.map((member) => {
                const isLastManager =
                  member.role === "MANAGER" && managerCount === 1;
                return (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {member.user.name}
                    {isLastManager ? (
                      <p className="mt-0.5 text-[11px] font-normal text-text-muted">
                        Last manager — add another before removing or demoting.
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{member.user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role}
                      disabled={saving}
                      onChange={(event) =>
                        void handleRoleChange(
                          member.id,
                          event.target.value as OrganizationMemberRole,
                        )
                      }
                      className="h-9 rounded-[8px] border border-border-subtle bg-bg-app px-2 text-[12px]"
                    >
                      <option value="MEMBER" disabled={isLastManager}>
                        Member
                      </option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={saving || isLastManager}
                      title={
                        isLastManager
                          ? "Cannot remove the last manager"
                          : undefined
                      }
                      onClick={() => void handleRemove(member.id, member.user.name)}
                      className="rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-danger-500 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
