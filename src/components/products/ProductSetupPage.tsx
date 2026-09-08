"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import TiptapEditor from "../../../components/editor/TiptapEditor";
import {
  DocumentPreviewButton,
  PdfPreviewModal,
  usePdfPreview,
} from "../../../components/documents/pdf-preview";
import { RequirementToggles } from "@/components/products/RequirementToggles";
import { ProductFormPageSkeleton } from "@/components/loading/page-skeletons";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listUsers } from "@/lib/api/users-api";
import {
  createProduct,
  getProduct,
  updateProductSetup,
} from "@/lib/api/products-api";
import { apiUserToAdminEntity } from "@/lib/users/map-user";
import type { AdminEntity } from "@/app/admin/types";
import {
  createEmptyDocumentRows,
  createEmptyTextRows,
  parseOptionalPrice,
  rowsFromApiProduct,
  type DocumentFormRow,
  type TextFormRow,
} from "@/lib/products/compliance-form";

function fieldClass(invalid?: boolean) {
  return `mt-1.5 h-11 w-full rounded-[9px] border bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:ring-2 disabled:opacity-60 ${
    invalid
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
      : "border-border-subtle focus:border-focus-ring focus:ring-focus-ring/25"
  }`;
}

type ProductSetupPageProps = {
  mode: "create" | "edit";
  productId?: string;
};

export default function ProductSetupPage({ mode, productId }: ProductSetupPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isEdit = mode === "edit";

  const [suppliers, setSuppliers] = useState<AdminEntity[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(!isEdit);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentFormRow[]>(createEmptyDocumentRows);
  const [textFields, setTextFields] = useState<TextFormRow[]>(createEmptyTextRows);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { preview, close, openFromFile, openFromUrl } = usePdfPreview();

  const preselectedSupplier = searchParams.get("supplierId");

  useEffect(() => {
    if (user?.role !== "DISTRIBUTOR") return;

    if (isEdit && productId) {
      setLoadingProduct(true);
      getProduct(productId)
        .then((product) => {
          if (product.status !== "PENDING") {
            setFormError("Only pending requests can be edited");
            return;
          }
          setName(product.name);
          setSku(product.sku ?? "");
          setPrice(product.price != null ? String(product.price) : "");
          setSupplierId(product.supplier.id);
          const rows = rowsFromApiProduct(product);
          setDocuments(rows.documents);
          setTextFields(rows.textFields);
          setSuppliers([
            {
              id: product.supplier.id,
              name: product.supplier.name,
              email: product.supplier.email,
              type: "supplier",
              password: "",
              createdAt: product.createdAt,
            },
          ]);
        })
        .catch(() => setFormError("Failed to load product request"))
        .finally(() => setLoadingProduct(false));
      return;
    }

    setLoadingSuppliers(true);
    listUsers({ role: "SUPPLIER", limit: 100, sort: "createdAt:desc" })
      .then((result) => {
        const items = result.items.map(apiUserToAdminEntity);
        setSuppliers(items);
        const initial =
          preselectedSupplier && items.some((s) => s.id === preselectedSupplier)
            ? preselectedSupplier
            : items[0]?.id ?? "";
        setSupplierId(initial);
      })
      .catch(() => setFormError("Failed to load suppliers"))
      .finally(() => setLoadingSuppliers(false));
  }, [user?.role, preselectedSupplier, isEdit, productId]);

  const supplierName = useMemo(
    () => suppliers.find((s) => s.id === supplierId)?.name ?? "",
    [suppliers, supplierId],
  );

  if (!user) return null;

  if (user.role !== "DISTRIBUTOR") {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">Access denied</p>
        <Link href="/dashboard" className="mt-4 text-[13px] font-medium text-brand-600">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loadingProduct || (!isEdit && loadingSuppliers)) {
    return <ProductFormPageSkeleton />;
  }

  function updateDocument(
    key: DocumentFormRow["key"],
    patch: Partial<DocumentFormRow>,
  ) {
    setDocuments((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function updateText(key: TextFormRow["key"], patch: Partial<TextFormRow>) {
    setTextFields((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Product name is required";
    if (!isEdit && !supplierId) next.supplierId = "Select a supplier";
    const parsedPrice = parseOptionalPrice(price);
    if (Number.isNaN(parsedPrice)) {
      next.price = "Enter a valid price";
    }
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const parsedPrice = parseOptionalPrice(price);

    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && productId) {
        await updateProductSetup(productId, {
          name: name.trim(),
          sku: sku.trim(),
          price: parsedPrice,
          photo: photoFile,
          documents,
          textFields,
        });
      } else {
        await createProduct({
          name: name.trim(),
          supplierId,
          sku: sku.trim() || undefined,
          price: parsedPrice,
          photo: photoFile,
          documents,
          textFields,
        });
      }
      router.push("/dashboard?section=products");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to save changes"
            : "Failed to create request",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard?section=products"
          className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to product requests
        </Link>

        <header className="mt-6">
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
            {isEdit ? "Edit product setup" : "New product request"}
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            {isEdit
              ? "Update compliance requirements and prefills for this request."
              : `Configure compliance requirements for ${supplierName || "your supplier"} and optionally prefill documents or text.`}
          </p>
        </header>

        <form className="mt-8 space-y-8" noValidate onSubmit={handleSubmit}>
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <h2 className="text-[15px] font-medium text-text-primary">Product details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-text-primary">
                  Product name <span className="text-brand-600">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass(Boolean(errors.name))}
                  placeholder="Product name"
                />
                {errors.name ? (
                  <p className="mt-1 text-[12px] text-danger-500">{errors.name}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-primary">SKU</label>
                <input value={sku} onChange={(e) => setSku(e.target.value)} className={fieldClass()} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-primary">Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={fieldClass(Boolean(errors.price))}
                />
                {errors.price ? (
                  <p className="mt-1 text-[12px] text-danger-500">{errors.price}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-primary">
                  Supplier {!isEdit ? <span className="text-brand-600">*</span> : null}
                </label>
                <select
                  value={supplierId}
                  disabled={isEdit || loadingSuppliers || suppliers.length === 0}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className={fieldClass(Boolean(errors.supplierId))}
                >
                  {suppliers.length === 0 ? (
                    <option value="">No suppliers yet</option>
                  ) : (
                    suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-primary">Product photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="text-[15px] font-medium text-text-primary">Documents</h2>
              <p className="mt-1 text-[12px] text-text-secondary">
                Mark each document required or optional, public or private. Upload a file to prefill for the supplier.
              </p>
              <div className="mt-4 space-y-4">
                {documents.map((row) => {
                  const displayFileName =
                    row.prefillFile?.name ?? row.existingPrefill?.fileName ?? "";
                  const previewUrl = row.prefillFile
                    ? undefined
                    : row.existingPrefill?.fileUrl;

                  return (
                    <div
                      key={row.key}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="text-[13px] font-medium text-text-primary">{row.label}</label>
                        <RequirementToggles
                          required={row.required}
                          isPublic={row.isPublic}
                          onRequiredChange={(v) => updateDocument(row.key, { required: v })}
                          onPublicChange={(v) => updateDocument(row.key, { isPublic: v })}
                        />
                      </div>
                      <input
                        type="file"
                        accept={row.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          updateDocument(row.key, { prefillFile: file });
                        }}
                        className="mt-2 block w-full text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                      />
                      {displayFileName ? (
                        <DocumentPreviewButton
                          fileName={displayFileName}
                          selectedFile={row.prefillFile ?? undefined}
                          previewUrl={previewUrl}
                          onPreview={() => {
                            if (row.prefillFile) {
                              openFromFile(row.label, row.prefillFile);
                            } else if (previewUrl) {
                              openFromUrl(row.label, displayFileName, previewUrl);
                            }
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-[15px] font-medium text-text-primary">Product information</h2>
              <p className="mt-1 text-[12px] text-text-secondary">
                Configure text fields the supplier must complete. Prefill content when you already know the answer.
              </p>
              <div className="mt-4 space-y-4">
                {textFields.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="text-[13px] font-medium text-text-primary">{row.label}</label>
                      <RequirementToggles
                        required={row.required}
                        isPublic={row.isPublic}
                        onRequiredChange={(v) => updateText(row.key, { required: v })}
                        onPublicChange={(v) => updateText(row.key, { isPublic: v })}
                      />
                    </div>
                    <TiptapEditor
                      id={`prefill-${row.key}`}
                      value={row.value}
                      placeholder={`Optional prefill for ${row.label.toLowerCase()}`}
                      onChange={(html: string) => updateText(row.key, { value: html })}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {formError ? (
            <p role="alert" className="text-[13px] text-danger-500">{formError}</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border-subtle pt-6">
            <button
              type="button"
              onClick={() => router.push("/dashboard?section=products")}
              className="h-10 rounded-[9px] px-4 text-[13px] font-medium text-text-primary hover:bg-bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!isEdit && suppliers.length === 0)}
              className="h-10 rounded-[9px] bg-brand-500 px-5 text-[13px] font-medium text-text-inverse hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create request"}
            </button>
          </div>
        </form>
      </div>

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </div>
  );
}
