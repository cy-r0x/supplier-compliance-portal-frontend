"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import TiptapEditor from "../../../components/editor/TiptapEditor";
import {
  DocumentPreviewButton,
  PdfPreviewModal,
  usePdfPreview,
} from "../../../components/documents/pdf-preview";
import { AddDocumentModal } from "@/components/products/AddDocumentModal";
import { RequirementMeta } from "@/components/products/RequirementMeta";
import { RequirementToggles } from "@/components/products/RequirementToggles";
import ProductThumbnail from "@/components/products/ProductThumbnail";
import type { ApiDocumentRequirement } from "@/lib/products/map-product";
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
  rowsFromTemplate,
  type DocumentFormRow,
  type TextFormRow,
} from "@/lib/products/compliance-form";
import { isEmptyHtml } from "@/lib/html";
import {
  getTemplate,
  listTemplates,
  type ApiTemplateListItem,
} from "@/lib/api/templates-api";
import { CreateTemplateModal } from "@/components/products/CreateTemplateModal";
import { TemplateSelect } from "@/components/products/TemplateSelect";
import { AccessDenied } from "@/components/AccessDenied";

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
  const [templates, setTemplates] = useState<ApiTemplateListItem[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  const [addDocumentKey, setAddDocumentKey] = useState<
    DocumentFormRow["key"] | undefined
  >(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { preview, close, openFromFile, openFromUrl } = usePdfPreview();

  const requirementsLocked = isEdit || Boolean(templateId);
  const preselectedSupplier = searchParams.get("supplierId");

  useEffect(() => {
    if (user?.role !== "USER" || user.organization?.role !== "MANAGER") return;

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
          setTemplateId(product.templateId ?? "");
          setTemplateName(product.template?.name ?? null);
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
    Promise.all([
      listUsers({ role: "SUPPLIER", limit: 100, sort: "createdAt:desc" }),
      listTemplates(),
    ])
      .then(([usersResult, templateItems]) => {
        const items = usersResult.items.map(apiUserToAdminEntity);
        setSuppliers(items);
        const initial =
          preselectedSupplier && items.some((s) => s.id === preselectedSupplier)
            ? preselectedSupplier
            : items[0]?.id ?? "";
        setSupplierId(initial);
        setTemplates(templateItems);
      })
      .catch(() => setFormError("Failed to load suppliers or templates"))
      .finally(() => setLoadingSuppliers(false));
  }, [user?.role, user?.organization?.role, preselectedSupplier, isEdit, productId]);

  async function applyTemplate(id: string) {
    if (!id) {
      setTemplateId("");
      setTemplateName(null);
      setDocuments(createEmptyDocumentRows());
      setTextFields(createEmptyTextRows());
      return;
    }

    setLoadingTemplate(true);
    setFormError(null);
    try {
      const detail = await getTemplate(id);
      const rows = rowsFromTemplate(detail);
      setTemplateId(detail.id);
      setTemplateName(detail.name);
      setDocuments(rows.documents);
      setTextFields(rows.textFields);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.templateId;
        return next;
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoadingTemplate(false);
    }
  }

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
      (row) =>
        row.prefillFiles.length > 0 || row.existingPrefills.length > 0,
    ).length;
    const prefilledFileCount = documents.reduce(
      (sum, row) =>
        sum + row.prefillFiles.length + row.existingPrefills.length,
      0,
    );
    const requiredFields = textFields.filter((row) => row.required).length;
    const prefilledFields = textFields.filter((row) => !isEmptyHtml(row.value)).length;

    return {
      requiredDocs,
      prefilledDocs,
      prefilledFileCount,
      requiredFields,
      prefilledFields,
    };
  }, [documents, textFields]);

  const attachedPrefillDocs = useMemo(
    () =>
      documents.filter(
        (row) =>
          row.prefillFiles.length > 0 || row.existingPrefills.length > 0,
      ),
    [documents],
  );

  const addDocumentOptions = useMemo<ApiDocumentRequirement[]>(
    () =>
      documents.map((row) => ({
        id: row.key,
        type: row.type,
        customKey: row.customKey ?? "",
        label: row.label,
        level: row.required ? "REQUIRED" : "OPTIONAL",
        visibility: row.isPublic ? "PUBLIC" : "PRIVATE",
        documents: [],
      })),
    [documents],
  );

  const acceptByType = useMemo(
    () =>
      Object.fromEntries(documents.map((row) => [row.type, row.accept])),
    [documents],
  );

  function addPrefillFiles(key: DocumentFormRow["key"], files: File[]) {
    if (files.length === 0) return;
    setDocuments((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const pending = files.map((file) => ({
          localId: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
        }));
        return {
          ...row,
          prefillFiles: [...row.prefillFiles, ...pending],
        };
      }),
    );
    if (key === "productImage" && files[0]) {
      setPhotoFile(files[0]);
    }
  }

  const displayPhoto = photoPreviewUrl ?? existingPhotoUrl;

  function scrollToSection(section: SetupSection) {
    setActiveSection(section);
    document.getElementById(`setup-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (!user) return null;

  if (user.role !== "USER" || user.organization?.role !== "MANAGER") {
    return (
      <AccessDenied
        description="Only organization managers can create or edit product requests. Members can view requests from the dashboard."
      />
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
    if (!isEdit && !templateId) next.templateId = "Select a template";
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
          templateId,
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
                {!isEdit ? (
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="requirement-template"
                      className="block text-[12px] font-medium text-text-primary"
                    >
                      Requirement template <span className="text-brand-600">*</span>
                    </label>
                    <TemplateSelect
                      id="requirement-template"
                      value={templateId}
                      templates={templates}
                      disabled={loadingTemplate}
                      invalid={Boolean(errors.templateId)}
                      onChange={(id) => void applyTemplate(id)}
                      onCreateNew={() => setCreateTemplateOpen(true)}
                    />
                    {errors.templateId ? (
                      <p className="mt-1 text-[12px] text-danger-500">{errors.templateId}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-text-muted">
                        Requirements are locked to the selected template.
                      </p>
                    )}
                  </div>
                ) : templateName ? (
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-text-primary">
                      Requirement template
                    </label>
                    <p className="mt-1.5 rounded-[9px] border border-border-subtle bg-bg-app px-3 py-2.5 text-[13px] text-text-primary">
                      {templateName}
                      <span className="ml-2 text-[11px] text-text-muted">(locked)</span>
                    </p>
                  </div>
                ) : null}
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
                        <option value="">No suppliers — ask an admin to create one</option>
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-medium text-text-primary">Documents</h2>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    Prefill files for the supplier. Add one or more files per document type.
                    {attachedPrefillDocs.length > 0
                      ? ` · ${requirementStats.prefilledFileCount} file${requirementStats.prefilledFileCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddDocumentKey(undefined);
                    setAddDocumentOpen(true);
                  }}
                  disabled={!templateId && !isEdit}
                  className="inline-flex h-10 min-w-[44px] cursor-pointer items-center gap-1.5 rounded-[9px] bg-brand-500 px-3.5 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlinePlus className="h-4 w-4" aria-hidden />
                  Add document
                </button>
              </div>

              {!templateId && !isEdit ? (
                <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-4 py-10 text-center">
                  <p className="text-[13px] font-medium text-text-primary">
                    Select a template first
                  </p>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    Document types come from the template. Then you can prefill files.
                  </p>
                </div>
              ) : attachedPrefillDocs.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-4 py-10 text-center">
                  <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <HiOutlineArrowUpTray className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-[13px] font-medium text-text-primary">
                    No prefill documents yet
                  </p>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    Optional — add files the supplier already provided so they do not re-upload them.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddDocumentKey(undefined);
                      setAddDocumentOpen(true);
                    }}
                    className="mt-4 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[9px] border border-border-subtle bg-bg-app px-4 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <HiOutlinePlus className="h-4 w-4" aria-hidden />
                    Add your first document
                  </button>
                </div>
              ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                  {attachedPrefillDocs.map((row) => {
                    const count =
                      row.existingPrefills.length + row.prefillFiles.length;
                    return (
                      <li
                        key={row.key}
                        className={`rounded-[12px] border bg-bg-elevated p-4 transition-colors duration-150 ${
                          row.required
                            ? "border-l-[3px] border-border-subtle border-l-amber-300"
                            : "border-border-subtle"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-brand-100 text-brand-700"
                                aria-hidden
                              >
                                <HiOutlineDocumentText className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-text-primary">
                                  {row.label}
                                </p>
                                <p className="mt-0.5 text-[11px] text-text-muted">
                                  {count} file{count === 1 ? "" : "s"} prefilled
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <RequirementMeta
                                level={row.required ? "REQUIRED" : "OPTIONAL"}
                                visibility={row.isPublic ? "PUBLIC" : "PRIVATE"}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAddDocumentKey(row.key);
                              setAddDocumentOpen(true);
                            }}
                            className="inline-flex h-10 min-w-[44px] cursor-pointer items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                          >
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            Add more
                          </button>
                        </div>

                        <ul className="mt-3 space-y-3">
                          {row.existingPrefills.map((file) => (
                            <li
                              key={file.id}
                              className="rounded-[9px] border border-border-subtle bg-bg-app p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <DocumentPreviewButton
                                  fileName={file.fileName}
                                  previewUrl={file.fileUrl}
                                  onPreview={() =>
                                    openFromUrl(
                                      row.label,
                                      file.fileName,
                                      file.fileUrl,
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDocument(row.key, {
                                      existingPrefills: row.existingPrefills.filter(
                                        (item) => item.id !== file.id,
                                      ),
                                      removedPrefillIds: [
                                        ...row.removedPrefillIds,
                                        file.id,
                                      ],
                                    })
                                  }
                                  className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-[7px] px-2 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-danger-500"
                                  aria-label={`Remove ${file.fileName}`}
                                >
                                  <HiOutlineTrash className="h-4 w-4" aria-hidden />
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                          {row.prefillFiles.map((pending) => (
                            <li
                              key={pending.localId}
                              className="rounded-[9px] border border-border-subtle bg-bg-app p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <DocumentPreviewButton
                                  fileName={pending.file.name}
                                  selectedFile={pending.file}
                                  onPreview={() =>
                                    openFromFile(row.label, pending.file)
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDocument(row.key, {
                                      prefillFiles: row.prefillFiles.filter(
                                        (item) => item.localId !== pending.localId,
                                      ),
                                    })
                                  }
                                  className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-[7px] px-2 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-danger-500"
                                  aria-label={`Remove ${pending.file.name}`}
                                >
                                  <HiOutlineTrash className="h-4 w-4" aria-hidden />
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              )}
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
                          disabled={requirementsLocked}
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

      <AddDocumentModal
        open={addDocumentOpen}
        options={addDocumentOptions}
        acceptByType={acceptByType}
        labelFor={(doc) => doc.label || doc.type}
        initialRequirementId={addDocumentKey}
        onClose={() => setAddDocumentOpen(false)}
        onAdd={(requirementId, files) =>
          addPrefillFiles(requirementId as DocumentFormRow["key"], files)
        }
      />

      <CreateTemplateModal
        open={createTemplateOpen}
        onClose={() => setCreateTemplateOpen(false)}
        onCreated={(created) => {
          setTemplates((prev) => {
            if (prev.some((item) => item.id === created.id)) return prev;
            return [
              {
                id: created.id,
                name: created.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              ...prev,
            ];
          });
          void applyTemplate(created.id);
        }}
      />
    </div>
  );
}
