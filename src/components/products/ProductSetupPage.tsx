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
import ProductThumbnail from "@/components/products/ProductThumbnail";
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
import { isEmptyHtml } from "@/lib/html";

type SetupSection = "details" | "documents" | "fields";

function fieldClass(invalid?: boolean) {
  return `mt-1.5 h-11 w-full rounded-[9px] border bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
    invalid
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
      : "border-border-subtle focus:border-focus-ring focus:ring-focus-ring/25"
  }`;
}

function SectionNav({
  active,
  documentCount,
  fieldCount,
  onSelect,
}: {
  active: SetupSection;
  documentCount: number;
  fieldCount: number;
  onSelect: (section: SetupSection) => void;
}) {
  const items: { id: SetupSection; label: string }[] = [
    { id: "details", label: "Product details" },
    { id: "documents", label: `Documents (${documentCount})` },
    { id: "fields", label: `Fields (${fieldCount})` },
  ];

  return (
    <nav
      className="sticky top-0 z-20 -mx-1 mb-6 overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated/95 p-1 backdrop-blur-sm"
      aria-label="Setup sections"
    >
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "step" : undefined}
              className={`cursor-pointer rounded-[8px] px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                isActive
                  ? "bg-brand-100 text-brand-700"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-border-subtle bg-bg-app px-3 py-2">
      <p className="text-[10px] font-medium text-text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-[14px] font-medium text-text-primary">
        {value}
      </p>
    </div>
  );
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
  const [editBlocked, setEditBlocked] = useState(false);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SetupSection>("details");
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
            setEditBlocked(true);
            setFormError("Only pending requests can be edited.");
            return;
          }
          setName(product.name);
          setSku(product.sku ?? "");
          setPrice(product.price != null ? String(product.price) : "");
          setSupplierId(product.supplier.id);
          setExistingPhotoUrl(product.photo);
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

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const supplierName = useMemo(
    () => suppliers.find((s) => s.id === supplierId)?.name ?? "",
    [suppliers, supplierId],
  );

  const requirementStats = useMemo(() => {
    const requiredDocs = documents.filter((row) => row.required).length;
    const prefilledDocs = documents.filter(
      (row) => row.prefillFile || row.existingPrefill,
    ).length;
    const requiredFields = textFields.filter((row) => row.required).length;
    const prefilledFields = textFields.filter((row) => !isEmptyHtml(row.value)).length;

    return {
      requiredDocs,
      prefilledDocs,
      requiredFields,
      prefilledFields,
    };
  }, [documents, textFields]);

  const displayPhoto = photoPreviewUrl ?? existingPhotoUrl;

  function scrollToSection(section: SetupSection) {
    setActiveSection(section);
    document.getElementById(`setup-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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

  if (editBlocked) {
    return (
      <div className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-[12px] border border-border-subtle bg-bg-elevated px-6 py-10">
            <p className="text-[15px] font-medium text-text-primary">
              This request can no longer be edited
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              {formError ?? "Only pending requests can be updated."}
            </p>
            <Link
              href={`/products/${productId}/review`}
              className="mt-5 inline-flex h-10 items-center rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse hover:bg-brand-600"
            >
              View submission
            </Link>
          </div>
        </div>
      </div>
    );
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
    if (Object.keys(nextErrors).length > 0) {
      scrollToSection("details");
      return;
    }

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
    <div className="min-h-full flex-1 bg-bg-app pb-24">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard?section=products"
            className="inline-flex items-center text-[13px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700"
          >
            ← Back to product requests
          </Link>

          <header className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <ProductThumbnail
                src={displayPhoto}
                size={72}
                fit="cover"
                className="rounded-[12px]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[6px] bg-bg-inset px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                    {isEdit ? "Pending setup" : "New request"}
                  </span>
                  {isEdit ? (
                    <span className="rounded-[6px] bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                      Editable
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
                  {isEdit ? "Edit product setup" : "New product request"}
                </h1>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {isEdit
                    ? "Update requirements and prefills before the supplier submits compliance."
                    : `Configure compliance for ${supplierName || "your supplier"}.`}
                </p>
                {supplierName ? (
                  <p className="mt-2 text-[12px] text-text-muted">
                    Supplier:{" "}
                    <span className="font-medium text-text-primary">{supplierName}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatPill label="Required documents" value={requirementStats.requiredDocs} />
              <StatPill label="Prefilled documents" value={requirementStats.prefilledDocs} />
              <StatPill label="Required fields" value={requirementStats.requiredFields} />
              <StatPill label="Prefilled fields" value={requirementStats.prefilledFields} />
            </div>
          </header>

          <SectionNav
            active={activeSection}
            documentCount={documents.length}
            fieldCount={textFields.length}
            onSelect={scrollToSection}
          />

          <form id="product-setup-form" className="space-y-8" noValidate onSubmit={handleSubmit}>
            <section
              id="setup-details"
              className="scroll-mt-28 rounded-[12px] border border-border-subtle bg-bg-elevated p-5"
            >
              <h2 className="text-[15px] font-medium text-text-primary">Product details</h2>
              <p className="mt-1 text-[12px] text-text-secondary">
                Basic product information sent to the supplier.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-text-primary">
                    Product name <span className="text-brand-600">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass(Boolean(errors.name))}
                    placeholder="e.g. Wooden toy train set"
                  />
                  {errors.name ? (
                    <p className="mt-1 text-[12px] text-danger-500">{errors.name}</p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-text-primary">SKU</label>
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={fieldClass()}
                    placeholder="Optional"
                  />
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
                    placeholder="0.00"
                  />
                  {errors.price ? (
                    <p className="mt-1 text-[12px] text-danger-500">{errors.price}</p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-text-primary">
                    Supplier {!isEdit ? <span className="text-brand-600">*</span> : null}
                  </label>
                  {isEdit ? (
                    <div className="mt-1.5 flex h-11 items-center rounded-[9px] border border-border-subtle bg-bg-muted/40 px-3 text-[13px] text-text-primary">
                      {supplierName || "—"}
                    </div>
                  ) : (
                    <select
                      value={supplierId}
                      disabled={loadingSuppliers || suppliers.length === 0}
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
                  )}
                  {errors.supplierId ? (
                    <p className="mt-1 text-[12px] text-danger-500">{errors.supplierId}</p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-text-primary">
                    Product photo
                  </label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <ProductThumbnail src={displayPhoto} size={48} fit="cover" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                      className="min-w-0 flex-1 text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                    />
                  </div>
                  {photoFile ? (
                    <p className="mt-1 text-[11px] text-text-muted">
                      New photo selected: {photoFile.name}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section id="setup-documents" className="scroll-mt-28">
              <div className="mb-4">
                <h2 className="text-[15px] font-medium text-text-primary">Documents</h2>
                <p className="mt-1 text-[12px] text-text-secondary">
                  Set required vs optional and public vs private. Upload a file to prefill for the
                  supplier.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {documents.map((row) => {
                  const displayFileName =
                    row.prefillFile?.name ?? row.existingPrefill?.fileName ?? "";
                  const previewUrl = row.prefillFile
                    ? undefined
                    : row.existingPrefill?.fileUrl;
                  const hasPrefill = Boolean(displayFileName);

                  return (
                    <div
                      key={row.key}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-text-primary">{row.label}</p>
                          {hasPrefill ? (
                            <p className="mt-1 text-[11px] text-brand-700">
                              Prefilled · {displayFileName}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] text-text-muted">No prefill yet</p>
                          )}
                        </div>
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
                          if (row.key === "productImage" && file) {
                            setPhotoFile(file);
                          }
                        }}
                        className="mt-3 block w-full text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                      />
                      {hasPrefill ? (
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

            <section id="setup-fields" className="scroll-mt-28">
              <div className="mb-4">
                <h2 className="text-[15px] font-medium text-text-primary">Product information</h2>
                <p className="mt-1 text-[12px] text-text-secondary">
                  Text fields the supplier must complete. Prefill when you already know the answer.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {textFields.map((row) => {
                  const hasPrefill = !isEmptyHtml(row.value);
                  return (
                    <div
                      key={row.key}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-text-primary">{row.label}</p>
                          <p className="mt-1 text-[11px] text-text-muted">
                            {hasPrefill ? "Prefilled" : "No prefill yet"}
                          </p>
                        </div>
                        <RequirementToggles
                          required={row.required}
                          isPublic={row.isPublic}
                          onRequiredChange={(v) => updateText(row.key, { required: v })}
                          onPublicChange={(v) => updateText(row.key, { isPublic: v })}
                        />
                      </div>
                      <div className="mt-3">
                        <TiptapEditor
                          id={`prefill-${row.key}`}
                          value={row.value}
                          placeholder={`Optional prefill for ${row.label.toLowerCase()}`}
                          onChange={(html: string) => updateText(row.key, { value: html })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {formError ? (
              <p role="alert" className="rounded-[9px] border border-danger-500/30 bg-danger-50 px-4 py-3 text-[13px] text-danger-500">
                {formError}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-bg-elevated/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="hidden text-[12px] text-text-muted sm:block">
            {isEdit
              ? "Changes apply to this pending request."
              : "Supplier will be notified after creation."}
          </p>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => router.push("/dashboard?section=products")}
              className="h-10 cursor-pointer rounded-[9px] px-4 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-setup-form"
              disabled={submitting || (!isEdit && suppliers.length === 0)}
              className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-5 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      </div>

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </div>
  );
}
