"use client";

import { FormEvent, useEffect, useState } from "react";

type EntityType = "distributor" | "supplier";

type AdminEntity = {
  id: string;
  name: string;
  email: string;
  password: string;
  type: EntityType;
};

type EntityFormValues = {
  name: string;
  email: string;
  password: string;
};

type EntityFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  entityType: EntityType;
  initial?: AdminEntity | null;
  onClose: () => void;
  onSubmit: (values: EntityFormValues, entityType: EntityType) => void;
};

const emptyValues: EntityFormValues = {
  name: "",
  email: "",
  password: "",
};

export default function EntityFormModal({
  open,
  mode,
  entityType,
  initial,
  onClose,
  onSubmit,
}: EntityFormModalProps) {
  const [values, setValues] = useState<EntityFormValues>(emptyValues);
  const [selectedRole, setSelectedRole] = useState<EntityType>(entityType);

  useEffect(() => {
    if (!open) return;
    setSelectedRole(entityType);
    setValues(
      initial
        ? { name: initial.name, email: initial.email, password: initial.password ?? "" }
        : emptyValues,
    );
  }, [open, initial, entityType]);

  if (!open) return null;

  const title = mode === "create" ? "Add new User" : "Edit user";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values, selectedRole);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123a3c]/45 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-form-title"
        className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-[0_16px_40px_rgba(18,58,60,0.18)]"
      >
        <h2 id="entity-form-title" className="text-[18px] font-medium tracking-[-0.02em] text-[#123a3c]">
          {title}
        </h2>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-[12px] font-medium text-[#123a3c]">
            <span>
              Role <span className="text-[#168aa0]">*</span>
            </span>
            <select
              required
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as EntityType)}
              className="mt-1.5 h-11 w-full rounded-[9px] border border-[#e3e3e3] bg-white px-3 text-[12px] text-[#123a3c] outline-none focus:border-[#55aeb5]"
            >
              <option value="distributor">Distributor</option>
              <option value="supplier">Supplier</option>
            </select>
          </label>

          <label className="block text-[12px] font-medium text-[#123a3c]">
            <span>
              Name <span className="text-[#168aa0]">*</span>
            </span>
            <input
              required
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-[9px] border border-[#e3e3e3] px-3 text-[12px] text-[#123a3c] outline-none placeholder:text-[#9ca3a3] focus:border-[#55aeb5]"
              placeholder="Enter name"
            />
          </label>

          <label className="block text-[12px] font-medium text-[#123a3c]">
            <span>
              Email <span className="text-[#168aa0]">*</span>
            </span>
            <input
              required
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-[9px] border border-[#e3e3e3] px-3 text-[12px] text-[#123a3c] outline-none placeholder:text-[#9ca3a3] focus:border-[#55aeb5]"
              placeholder="Enter email"
            />
          </label>

          <label className="block text-[12px] font-medium text-[#123a3c]">
            <span>
              Password <span className="text-[#168aa0]">*</span>
            </span>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-[9px] border border-[#e3e3e3] px-3 text-[12px] text-[#123a3c] outline-none placeholder:text-[#9ca3a3] focus:border-[#55aeb5]"
              placeholder="Enter password"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[9px] px-4 text-[13px] font-medium text-[#123a3c] transition-colors hover:bg-[#f3fafa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-[9px] bg-[#1595a0] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#117f89]"
            >
              {mode === "create" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
