"use client";

import { useState } from "react";
import EntityFormModal from "./EntityFormModal";
import type { AdminEntity, EntityFormValues, EntityType } from "./types";
import { useAdminEntities } from "./useAdminEntities";

type Section = "dashboard" | "users" | "settings";

type ModalState =
  | { open: false }
  | { open: true; mode: "create"; entityType: EntityType }
  | { open: true; mode: "edit"; entityType: EntityType; entity: AdminEntity };

const navItems: { id: Section; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "settings", label: "Settings" },
];

export default function AdminDashboard() {
  const { ready, distributors, suppliers, addEntity, updateEntity, deleteEntity } =
    useAdminEntities();
  const [section, setSection] = useState<Section>("dashboard");
  const [modal, setModal] = useState<ModalState>({ open: false });

  function openCreate() {
    setModal({ open: true, mode: "create", entityType: "distributor" });
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
    updateEntity(modal.entity.id, values, entityType);
  }

  function handleDelete(entity: AdminEntity) {
    const label = entity.type === "distributor" ? "distributor" : "supplier";
    if (window.confirm(`Delete ${entity.name} (${label})?`)) {
      deleteEntity(entity.id);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 bg-[#f7fbfb] text-[#123a3c]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#e3e3e3] bg-white">
        <div className="border-b border-[#e3e3e3] px-5 py-4">
          <p className="text-[13px] font-medium tracking-[-0.01em]">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-1 p-3" aria-label="Admin">
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`rounded-[9px] px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[#1595a0] text-white"
                    : "text-[#123a3c] hover:bg-[#f3fafa]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-6 sm:px-8">
        {!ready ? (
          <p className="text-[13px] text-[#9ca3a3]">Loading…</p>
        ) : section === "dashboard" ? (
          <DashboardSection
            distributorCount={distributors.length}
            supplierCount={suppliers.length}
            onAddUser={openCreate}
          />
        ) : section === "users" ? (
          <UsersSection
            distributors={distributors}
            suppliers={suppliers}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ) : (
          <SettingsSection />
        )}
      </main>

      <EntityFormModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        entityType={modal.open ? modal.entityType : "distributor"}
        initial={modal.open && modal.mode === "edit" ? modal.entity : null}
        onClose={() => setModal({ open: false })}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function DashboardSection({
  distributorCount,
  supplierCount,
  onAddUser,
}: {
  distributorCount: number;
  supplierCount: number;
  onAddUser: () => void;
}) {
  return (
    <div>
      <h1 className="text-[24px] font-medium tracking-[-0.02em]">Admin Dashboard</h1>
      <p className="mt-1 text-[13px] text-[#9ca3a3]">
        Overview of distributors and suppliers
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
          <p className="text-[12px] font-medium text-[#9ca3a3]">Distributors</p>
          <p className="mt-2 text-[32px] font-medium tracking-[-0.03em] text-[#1595a0]">
            {distributorCount}
          </p>
        </section>

        <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5">
          <p className="text-[12px] font-medium text-[#9ca3a3]">Suppliers</p>
          <p className="mt-2 text-[32px] font-medium tracking-[-0.03em] text-[#1595a0]">
            {supplierCount}
          </p>
        </section>
      </div>

      <button
        type="button"
        onClick={onAddUser}
        className="mt-6 h-10 rounded-[9px] bg-[#1595a0] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#117f89]"
      >
        Add new User
      </button>
    </div>
  );
}

function UsersSection({
  distributors,
  suppliers,
  onEdit,
  onDelete,
}: {
  distributors: AdminEntity[];
  suppliers: AdminEntity[];
  onEdit: (entity: AdminEntity) => void;
  onDelete: (entity: AdminEntity) => void;
}) {
  return (
    <div>
      <h1 className="text-[24px] font-medium tracking-[-0.02em]">Users</h1>
      <p className="mt-1 text-[13px] text-[#9ca3a3]">
        {distributors.length} distributor{distributors.length === 1 ? "" : "s"} ·{" "}
        {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <EntityList
          title="Distributors"
          count={distributors.length}
          entities={distributors}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <EntityList
          title="Suppliers"
          count={suppliers.length}
          entities={suppliers}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function EntityList({
  title,
  count,
  entities,
  onEdit,
  onDelete,
}: {
  title: string;
  count: number;
  entities: AdminEntity[];
  onEdit: (entity: AdminEntity) => void;
  onDelete: (entity: AdminEntity) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-medium tracking-[-0.01em]">{title}</h2>
        <span className="text-[12px] text-[#9ca3a3]">{count}</span>
      </div>

      {entities.length === 0 ? (
        <p className="rounded-[9px] border border-dashed border-[#e3e3e3] bg-white px-4 py-6 text-[12px] text-[#9ca3a3]">
          No {title.toLowerCase()} yet
        </p>
      ) : (
        <ul className="divide-y divide-[#e3e3e3] overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white">
          {entities.map((entity) => (
            <li key={entity.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{entity.name}</p>
                <p className="truncate text-[11px] text-[#9ca3a3]">
                  {entity.email} ·{" "}
                  {entity.type === "distributor" ? "Distributor" : "Supplier"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(entity)}
                className="rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-[#1595a0] transition-colors hover:bg-[#f3fafa]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(entity)}
                className="rounded-[7px] px-2.5 py-1.5 text-[12px] font-medium text-[#b42318] transition-colors hover:bg-[#fff5f4]"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SettingsSection() {
  return (
    <div>
      <h1 className="text-[24px] font-medium tracking-[-0.02em]">Settings</h1>
      <p className="mt-8 rounded-[12px] border border-dashed border-[#e3e3e3] bg-white px-5 py-10 text-center text-[13px] text-[#9ca3a3]">
        Coming soon
      </p>
    </div>
  );
}
