"use client";

import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  HiOutlineBell,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineHome,
  HiOutlineUsers,
} from "react-icons/hi2";
import AppShell from "../../../components/layouts/AppShell";
import EntityFormModal from "./EntityFormModal";
import type {
  AdminEntity,
  AdminSection,
  EntityFormValues,
  EntityType,
} from "./types";
import {
  formatDate,
  isAdminSection,
  roleLabel,
} from "./types";
import { useAdminEntities } from "./useAdminEntities";

type ModalState =
  | { open: false }
  | { open: true; mode: "create"; entityType: EntityType }
  | { open: true; mode: "edit"; entityType: EntityType; entity: AdminEntity };

type RoleFilter = "all" | EntityType;

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: HiOutlineHome },
  { id: "users" as const, label: "Users", icon: HiOutlineUsers },
  {
    id: "products" as const,
    label: "Product requests",
    icon: HiOutlineClipboardDocumentList,
  },
  {
    id: "notifications" as const,
    label: "Notifications",
    icon: HiOutlineBell,
  },
  { id: "settings" as const, label: "Settings", icon: HiOutlineCog6Tooth },
];

function RoleBadge({ type }: { type: EntityType }) {
  return (
    <span className="inline-flex rounded-[6px] bg-bg-inset px-2 py-0.5 text-[11px] font-medium text-brand-700">
      {roleLabel(type)}
    </span>
  );
}

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

export function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
          Loading…
        </div>
      }
    >
      <AdminDashboardInner />
    </Suspense>
  );
}

const DASHBOARD_PATH = "/dashboard";

function AdminDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    ready,
    entities,
    distributors,
    suppliers,
    recentUsers,
    addEntity,
    updateEntity,
    deleteEntity,
  } = useAdminEntities();

  const sectionParam = searchParams.get("section");
  const section: AdminSection =
    sectionParam && isAdminSection(sectionParam) ? sectionParam : "dashboard";

  const [modal, setModal] = useState<ModalState>({ open: false });

  const navigate = useCallback(
    (id: string) => {
      if (!isAdminSection(id)) return;
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

  function openCreate(entityType: EntityType = "distributor") {
    setModal({ open: true, mode: "create", entityType });
  }

  function openEdit(entity: AdminEntity) {
    setModal({ open: true, mode: "edit", entityType: entity.type, entity });
  }

  function handleSubmit(values: EntityFormValues, entityType: EntityType) {
    if (!modal.open) return;
    if (modal.mode === "create") {
      addEntity(entityType, values);
      return;
    }
    const password =
      values.password.trim() || modal.entity.password;
    updateEntity(modal.entity.id, { ...values, password }, entityType);
  }

  function handleDelete(entity: AdminEntity) {
    const label = roleLabel(entity.type).toLowerCase();
    if (window.confirm(`Delete ${entity.name} (${label})?`)) {
      deleteEntity(entity.id);
    }
  }

  return (
    <AppShell
      navItems={NAV_ITEMS}
      activeNavId={section}
      onNavigate={navigate}
      notificationCount={0}
    >
      {!ready ? (
        <div>
          <PageHeader title="Dashboard" description="Loading…" />
          <SkeletonRows />
        </div>
      ) : section === "dashboard" ? (
        <DashboardSection
          recentUsers={recentUsers}
          onCreateDistributor={() => openCreate("distributor")}
          onViewUsers={() => navigate("users")}
        />
      ) : section === "users" ? (
        <UsersSection
          entities={entities}
          distributorCount={distributors.length}
          supplierCount={suppliers.length}
          onCreate={() => openCreate("distributor")}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : section === "products" ? (
        <ProductsPlaceholder />
      ) : section === "notifications" ? (
        <NotificationsPlaceholder />
      ) : (
        <SettingsSection user={user} />
      )}

      <EntityFormModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        entityType={modal.open ? modal.entityType : "distributor"}
        initial={modal.open && modal.mode === "edit" ? modal.entity : null}
        onClose={() => setModal({ open: false })}
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}

function DashboardSection({
  recentUsers,
  onCreateDistributor,
  onViewUsers,
}: {
  recentUsers: AdminEntity[];
  onCreateDistributor: () => void;
  onViewUsers: () => void;
}) {
  const latest = recentUsers.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="What needs attention across distributors and suppliers"
        action={
          <button
            type="button"
            onClick={onCreateDistributor}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Create distributor
          </button>
        }
      />

      <div className="space-y-8">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-medium tracking-[-0.01em] text-text-primary">
              Needs attention
            </h2>
          </div>
          <EmptyState
            title="Nothing waiting right now"
            description="Submitted requests and incomplete setups will appear here."
          />
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-medium tracking-[-0.01em] text-text-primary">
              Recent users
            </h2>
            <button
              type="button"
              onClick={onViewUsers}
              className="cursor-pointer text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              View all
            </button>
          </div>

          {latest.length === 0 ? (
            <EmptyState
              title="No users yet"
              description="Create a distributor to get started."
              action={
                <button
                  type="button"
                  onClick={onCreateDistributor}
                  className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
                >
                  Create distributor
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated">
              <table className="min-w-full text-left text-[13px]">
                <thead className="border-b border-border-subtle bg-bg-muted/50 text-[12px] text-text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">Email</th>
                    <th className="px-4 py-2.5 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {latest.map((user) => (
                    <tr key={user.id} className="h-11">
                      <td className="px-4 py-2 font-medium text-text-primary">
                        {user.name}
                      </td>
                      <td className="px-4 py-2">
                        <RoleBadge type={user.type} />
                      </td>
                      <td className="px-4 py-2 text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-4 py-2 font-mono text-[12px] text-text-muted">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-medium tracking-[-0.01em] text-text-primary">
              Recent requests
            </h2>
          </div>
          <EmptyState
            title="No product requests yet"
            description="Requests created by distributors will show up here."
          />
        </section>
      </div>
    </div>
  );
}

function UsersSection({
  entities,
  distributorCount,
  supplierCount,
  onCreate,
  onEdit,
  onDelete,
}: {
  entities: AdminEntity[];
  distributorCount: number;
  supplierCount: number;
  onCreate: () => void;
  onEdit: (entity: AdminEntity) => void;
  onDelete: (entity: AdminEntity) => void;
}) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entities.filter((entity) => {
      if (roleFilter !== "all" && entity.type !== roleFilter) return false;
      if (!q) return true;
      return (
        entity.name.toLowerCase().includes(q) ||
        entity.email.toLowerCase().includes(q)
      );
    });
  }, [entities, roleFilter, search]);

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${distributorCount} distributor${distributorCount === 1 ? "" : "s"} · ${supplierCount} supplier${supplierCount === 1 ? "" : "s"}`}
        action={
          <button
            type="button"
            onClick={onCreate}
            className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Create user
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="user-search">
          Search users
        </label>
        <input
          id="user-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          className="h-10 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25 sm:max-w-xs"
        />
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter by role"
        >
          {(
            [
              ["all", "All"],
              ["distributor", "Distributor"],
              ["supplier", "Supplier"],
            ] as const
          ).map(([value, label]) => {
            const active = roleFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRoleFilter(value)}
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
          title={entities.length === 0 ? "No users yet" : "No matching users"}
          description={
            entities.length === 0
              ? "Create a distributor or supplier to populate this directory."
              : "Try a different search or role filter."
          }
          action={
            entities.length === 0 ? (
              <button
                type="button"
                onClick={onCreate}
                className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
              >
                Create user
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
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Created by</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((entity) => (
                <tr key={entity.id} className="h-11">
                  <td className="px-4 py-2 font-medium text-text-primary">
                    {entity.name}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">{entity.email}</td>
                  <td className="px-4 py-2">
                    <RoleBadge type={entity.type} />
                  </td>
                  <td className="px-4 py-2 text-text-muted">You</td>
                  <td className="px-4 py-2 font-mono text-[12px] text-text-muted">
                    {formatDate(entity.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(entity)}
                        className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entity)}
                        className="cursor-pointer rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-danger-500 transition-colors duration-150 hover:bg-danger-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        Delete
                      </button>
                    </div>
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

function ProductsPlaceholder() {
  return (
    <div>
      <PageHeader
        title="Product requests"
        description="Browse and filter compliance requests across distributors"
      />
      <EmptyState
        title="No product requests yet"
        description="When distributors create requests, they will appear in this list."
      />
    </div>
  );
}

function NotificationsPlaceholder() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Inbox for request and user activity"
      />
      <EmptyState
        title="You're all caught up"
        description="New notifications will show here when activity starts."
      />
    </div>
  );
}

function SettingsSection({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account preferences for this admin session"
      />

      <div className="space-y-6">
        <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <h2 className="text-[15px] font-medium text-text-primary">Account</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12px] text-text-muted">Name</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-text-muted">Email</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-text-muted">Role</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.role ?? "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-text-muted">
            Password change will be available in a later release.
          </p>
        </section>

        <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <h2 className="text-[15px] font-medium text-text-primary">
            Product request defaults
          </h2>
          <p className="mt-2 text-[13px] text-text-secondary">
            Auto-approve applies to distributor accounts only.
          </p>
        </section>
      </div>
    </div>
  );
}
