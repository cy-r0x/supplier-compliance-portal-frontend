"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { AdminEntity, EntityFormValues, EntityType } from "./types";
import { roleLabel } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EntityFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  entityType: EntityType;
  /** When set, hides the role selector and always submits this role. */
  fixedRole?: EntityType;
  initial?: AdminEntity | null;
  onClose: () => void;
  onSubmit: (values: EntityFormValues, entityType: EntityType) => void;
};

const emptyValues: EntityFormValues = {
  name: "",
  email: "",
  password: "",
};

type FieldErrors = Partial<Record<keyof EntityFormValues | "role", string>>;

function fieldClass(invalid?: boolean) {
  return `mt-1.5 h-11 w-full rounded-[9px] border bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:ring-2 disabled:opacity-60 ${
    invalid
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
      : "border-border-subtle focus:border-focus-ring focus:ring-focus-ring/25"
  }`;
}

export default function EntityFormModal({
  open,
  mode,
  entityType,
  fixedRole,
  initial,
  onClose,
  onSubmit,
}: EntityFormModalProps) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const roleId = useId();
  const firstFieldRef = useRef<HTMLSelectElement | HTMLInputElement | null>(
    null,
  );

  const [values, setValues] = useState<EntityFormValues>(emptyValues);
  const [selectedRole, setSelectedRole] = useState<EntityType>(entityType);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedRole(fixedRole ?? entityType);
    setValues(
      initial
        ? {
            name: initial.name,
            email: initial.email,
            password: initial.password ?? "",
          }
        : emptyValues,
    );
    setErrors({});
    setSaving(false);
    const frame = window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, initial, entityType, fixedRole]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const title =
    mode === "create"
      ? fixedRole
        ? `Create ${roleLabel(fixedRole).toLowerCase()}`
        : "Create user"
      : `Edit ${roleLabel(selectedRole).toLowerCase()}`;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = "Name is required";
    const email = values.email.trim();
    if (!email) next.email = "Email address is required";
    else if (!EMAIL_PATTERN.test(email)) next.email = "Enter a valid email address";
    if (mode === "create" && !values.password.trim()) {
      next.password = "Temporary password is required";
    } else if (values.password.trim() && values.password.trim().length < 6) {
      next.password = "Password must be at least 6 characters";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    onSubmit(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      fixedRole ?? selectedRole,
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated p-6 shadow-sm"
      >
        <h2
          id={titleId}
          className="font-display text-[18px] font-semibold tracking-[-0.02em] text-text-primary"
        >
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          {mode === "create"
            ? "Creates the account with default user settings."
            : "Update profile details for this account."}
        </p>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
          {mode === "create" && !fixedRole ? (
            <div>
              <label
                htmlFor={roleId}
                className="block text-[12px] font-medium text-text-primary"
              >
                Role <span className="text-brand-600">*</span>
              </label>
              <select
                id={roleId}
                ref={firstFieldRef as RefObject<HTMLSelectElement>}
                required
                value={selectedRole}
                disabled={saving}
                onChange={(event) =>
                  setSelectedRole(event.target.value as EntityType)
                }
                className={fieldClass()}
              >
                <option value="distributor">Distributor</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          ) : null}

          <div>
            <label
              htmlFor={nameId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Name <span className="text-brand-600">*</span>
            </label>
            <input
              id={nameId}
              ref={
                mode === "edit" || fixedRole
                  ? (firstFieldRef as RefObject<HTMLInputElement>)
                  : undefined
              }
              required
              value={values.name}
              disabled={saving}
              aria-invalid={errors.name ? true : undefined}
              onChange={(event) => {
                setValues((prev) => ({ ...prev, name: event.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={fieldClass(Boolean(errors.name))}
              placeholder="Full name"
            />
            {errors.name ? (
              <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={emailId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Email <span className="text-brand-600">*</span>
            </label>
            <input
              id={emailId}
              required
              type="email"
              inputMode="email"
              autoComplete="off"
              value={values.email}
              disabled={saving}
              aria-invalid={errors.email ? true : undefined}
              onChange={(event) => {
                setValues((prev) => ({ ...prev, email: event.target.value }));
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={fieldClass(Boolean(errors.email))}
              placeholder="you@company.com"
            />
            {errors.email ? (
              <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={passwordId}
              className="block text-[12px] font-medium text-text-primary"
            >
              {mode === "create" ? "Temporary password" : "Password"}{" "}
              {mode === "create" ? (
                <span className="text-brand-600">*</span>
              ) : (
                <span className="font-normal text-text-muted">(optional)</span>
              )}
            </label>
            <input
              id={passwordId}
              required={mode === "create"}
              type="password"
              autoComplete="new-password"
              value={values.password}
              disabled={saving}
              aria-invalid={errors.password ? true : undefined}
              onChange={(event) => {
                setValues((prev) => ({ ...prev, password: event.target.value }));
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={fieldClass(Boolean(errors.password))}
              placeholder={
                mode === "create"
                  ? "Set a temporary password"
                  : "Leave blank to keep current"
              }
            />
            {errors.password ? (
              <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 cursor-pointer rounded-[9px] px-4 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving
                ? "Saving…"
                : mode === "create"
                  ? `Create ${roleLabel(fixedRole ?? selectedRole).toLowerCase()}`
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
