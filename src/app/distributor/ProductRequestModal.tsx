"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { AdminEntity } from "../admin/types";
import type {
  ProductRequest,
  ProductRequestFormValues,
  ProductRequestStatus,
} from "./types";

type ProductRequestModalProps = {
  open: boolean;
  mode: "create" | "edit";
  suppliers: AdminEntity[];
  initial?: ProductRequest | null;
  onClose: () => void;
  onSubmit: (values: ProductRequestFormValues, supplierName: string) => void;
};

const emptyValues: ProductRequestFormValues = {
  productName: "",
  productImage: "",
  progress: 0,
  supplierId: "",
  status: "pending",
};

type FieldErrors = Partial<Record<keyof ProductRequestFormValues, string>>;

function fieldClass(invalid?: boolean) {
  return `mt-1.5 h-11 w-full rounded-[9px] border bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:ring-2 disabled:opacity-60 ${
    invalid
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
      : "border-border-subtle focus:border-focus-ring focus:ring-focus-ring/25"
  }`;
}

export default function ProductRequestModal({
  open,
  mode,
  suppliers,
  initial,
  onClose,
  onSubmit,
}: ProductRequestModalProps) {
  const titleId = useId();
  const nameId = useId();
  const imageId = useId();
  const progressId = useId();
  const supplierId = useId();
  const statusId = useId();
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const [values, setValues] = useState<ProductRequestFormValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      initial
        ? {
            productName: initial.productName,
            productImage: initial.productImage,
            progress: initial.progress,
            supplierId: initial.supplierId,
            status: initial.status,
          }
        : {
            ...emptyValues,
            supplierId: suppliers[0]?.id ?? "",
          },
    );
    setErrors({});
    setSaving(false);
    const frame = window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, initial, suppliers]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!values.productName.trim()) next.productName = "Product name is required";
    if (!values.supplierId) next.supplierId = "Select a supplier";
    if (
      !Number.isFinite(values.progress) ||
      values.progress < 0 ||
      values.progress > 100
    ) {
      next.progress = "Progress must be between 0 and 100";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const supplier = suppliers.find((item) => item.id === values.supplierId);
    if (!supplier) {
      setErrors({ supplierId: "Select a supplier" });
      return;
    }

    setSaving(true);
    onSubmit(
      {
        productName: values.productName.trim(),
        productImage: values.productImage.trim(),
        progress: Math.round(values.progress),
        supplierId: values.supplierId,
        status: values.status,
      },
      supplier.name,
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
          {mode === "create" ? "New product request" : "Edit product request"}
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Request a product from one of your suppliers.
        </p>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor={nameId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Product name <span className="text-brand-600">*</span>
            </label>
            <input
              id={nameId}
              ref={firstFieldRef}
              required
              value={values.productName}
              disabled={saving}
              aria-invalid={errors.productName ? true : undefined}
              onChange={(event) => {
                setValues((prev) => ({
                  ...prev,
                  productName: event.target.value,
                }));
                if (errors.productName)
                  setErrors((prev) => ({ ...prev, productName: undefined }));
              }}
              className={fieldClass(Boolean(errors.productName))}
              placeholder="Product name"
            />
            {errors.productName ? (
              <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                {errors.productName}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={imageId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Product image URL
            </label>
            <input
              id={imageId}
              type="url"
              value={values.productImage}
              disabled={saving}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  productImage: event.target.value,
                }))
              }
              className={fieldClass()}
              placeholder="https://… (optional)"
            />
          </div>

          <div>
            <label
              htmlFor={supplierId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Supplier <span className="text-brand-600">*</span>
            </label>
            <select
              id={supplierId}
              required
              value={values.supplierId}
              disabled={saving || suppliers.length === 0}
              aria-invalid={errors.supplierId ? true : undefined}
              onChange={(event) => {
                setValues((prev) => ({
                  ...prev,
                  supplierId: event.target.value,
                }));
                if (errors.supplierId)
                  setErrors((prev) => ({ ...prev, supplierId: undefined }));
              }}
              className={fieldClass(Boolean(errors.supplierId))}
            >
              {suppliers.length === 0 ? (
                <option value="">No suppliers yet</option>
              ) : (
                suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))
              )}
            </select>
            {errors.supplierId ? (
              <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                {errors.supplierId}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={progressId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Progress (%) <span className="text-brand-600">*</span>
            </label>
            <input
              id={progressId}
              required
              type="number"
              min={0}
              max={100}
              value={values.progress}
              disabled={saving}
              aria-invalid={errors.progress ? true : undefined}
              onChange={(event) => {
                setValues((prev) => ({
                  ...prev,
                  progress: Number(event.target.value),
                }));
                if (errors.progress)
                  setErrors((prev) => ({ ...prev, progress: undefined }));
              }}
              className={fieldClass(Boolean(errors.progress))}
            />
            {errors.progress ? (
              <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                {errors.progress}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={statusId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Status <span className="text-brand-600">*</span>
            </label>
            <select
              id={statusId}
              required
              value={values.status}
              disabled={saving}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  status: event.target.value as ProductRequestStatus,
                }))
              }
              className={fieldClass()}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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
              disabled={saving || suppliers.length === 0}
              className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Create request"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
