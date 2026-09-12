"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import TiptapEditor from "../../../../../components/editor/TiptapEditor";
import {
  DocumentPreviewButton,
  PdfPreviewModal,
  usePdfPreview,
} from "../../../../../components/documents/pdf-preview";
import { DOCUMENT_FIELD_CONFIG } from "@/lib/compliance";
import { isEmptyHtml } from "@/lib/html";
import { toProxiedMediaUrl } from "@/lib/media-url";
import type {
  ApiDocumentRequirement,
  ApiFieldRequirement,
  ApiProductDetail,
  ApiProductStatus,
} from "@/lib/products/map-product";
import { apiDetailToProductRequest } from "@/lib/products/map-product";
import { useProductRequests } from "@/app/distributor/useProductRequests";
import { ComplianceFormPageSkeleton } from "@/components/loading/page-skeletons";
import { AddDocumentModal } from "@/components/products/AddDocumentModal";
import { RequirementMeta } from "@/components/products/RequirementMeta";
import {
  publicDocumentLabel,
  publicFieldLabel,
} from "@/lib/public-product-labels";

const TYPE_TO_ACCEPT = Object.fromEntries(
  DOCUMENT_FIELD_CONFIG.map(({ key, accept }) => {
    const typeMap: Record<string, string> = {
      testReport: "TEST_REPORT",
      declarationOfConformity: "DECLARATION_OF_CONFORMITY",
      manualOrInstructions: "MANUAL_OR_INSTRUCTIONS",
      certificate: "CERTIFICATE",
      productImage: "PRODUCT_IMAGE",
      safetyImage: "SAFETY_IMAGE",
      regulatoryDocument: "REGULATORY_DOCUMENT",
      other: "OTHER",
    };
    return [typeMap[key], accept];
  }),
);

function RequiredChecklist({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; done: boolean }>;
}) {
  if (items.length === 0) return null;

  const doneCount = items.filter((item) => item.done).length;

  return (
    <aside
      aria-label={title}
      className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold tracking-wide text-amber-800 uppercase">
          {title}
        </p>
        <p className="text-[11px] font-medium text-amber-800/80">
          {doneCount}/{items.length} done
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-[12px]">
            <HiOutlineCheckCircle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                item.done ? "text-brand-600" : "text-amber-400"
              }`}
              aria-hidden
            />
            <span
              className={
                item.done
                  ? "text-amber-900/60 line-through"
                  : "text-amber-900/90"
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function RichTextContent({ html }: { html: string }) {
  if (isEmptyHtml(html)) {
    return <p className="text-[13px] text-text-muted italic">Not provided</p>;
  }
  return (
    <div
      className="public-rich-text text-[14px] leading-relaxed text-text-secondary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function StatusBanner({ status }: { status: ApiProductStatus }) {
  const styles =
    status === "APPROVED"
      ? "bg-brand-100 text-brand-700"
      : status === "REJECTED"
        ? "bg-danger-50 text-danger-500"
        : status === "SUBMITTED"
          ? "bg-amber-50 text-amber-800"
          : "bg-bg-inset text-text-secondary";

  const label =
    status === "SUBMITTED"
      ? "Awaiting review"
      : status === "APPROVED"
        ? "Approved"
        : status === "REJECTED"
          ? "Rejected"
          : "Pending";

  return (
    <span
      className={`inline-flex rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

function ProgressMeter({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-text-secondary">
          Suggested progress
        </p>
        <p className="text-[12px] font-semibold text-text-primary">
          {completed}/{total} · {percent}%
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-bg-inset"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Required compliance progress"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SubmitSuccessTooltip({
  publicSlug,
  onClose,
}: {
  publicSlug: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className="fixed left-4 top-4 z-50 max-w-sm rounded-[10px] border border-brand-100 bg-bg-elevated px-4 py-3 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text-primary">
            Submitted successfully
          </p>
          <p className="mt-1 text-[12px] text-text-secondary">
            After organization approval, public fields will appear on{" "}
            <Link
              href={`/p/${publicSlug}`}
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              /p/{publicSlug}
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="shrink-0 cursor-pointer rounded p-1 text-text-muted transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary"
        >
          <span className="sr-only">Dismiss</span>
          <svg aria-hidden className="size-4" fill="none" viewBox="0 0 24 24">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ProductCompliancePage() {
  const params = useParams();
  const router = useRouter();
  const requestId = typeof params.id === "string" ? params.id : "";
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const { getProductDetail, submitCompliance } = useProductRequests();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<
    Record<string, Array<{ localId: string; file: File }>>
  >({});
  const [existingDocs, setExistingDocs] = useState<
    Record<string, Array<{ id: string; fileName: string; fileUrl: string }>>
  >({});
  const [removedAnswerIds, setRemovedAnswerIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitTooltip, setShowSubmitTooltip] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  const [addDocumentRequirementId, setAddDocumentRequirementId] = useState<
    string | undefined
  >(undefined);
  const [confirmIncompleteOpen, setConfirmIncompleteOpen] = useState(false);
  const [productImagePreviewUrl, setProductImagePreviewUrl] = useState<
    string | null
  >(null);
  const { preview, close, openFromFile, openFromUrl } = usePdfPreview();

  const productImageRequirementId = product?.documentRequirements.find(
    (doc) => doc.type === "PRODUCT_IMAGE",
  )?.id;
  const selectedProductImageFile = productImageRequirementId
    ? pendingFiles[productImageRequirementId]?.at(-1)?.file
    : undefined;

  useEffect(() => {
    if (!selectedProductImageFile) {
      setProductImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedProductImageFile);
    setProductImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedProductImageFile]);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setProduct(null);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    getProductDetail(requestId)
      .then((detail) => {
        if (!active) return;
        setProduct(detail);
        const initialText: Record<string, string> = {};
        for (const field of detail.fieldRequirements) {
          initialText[field.id] = field.fieldValue?.value ?? "";
        }
        setTextValues(initialText);
        const initialExisting: Record<
          string,
          Array<{ id: string; fileName: string; fileUrl: string }>
        > = {};
        for (const doc of detail.documentRequirements) {
          const files = doc.documents
            .filter((item) => item.fileUrl && item.fileName)
            .map((item) => ({
              id: item.id,
              fileName: item.fileName!,
              fileUrl: item.fileUrl,
            }));
          if (files.length > 0) {
            initialExisting[doc.id] = files;
          }
        }
        setExistingDocs(initialExisting);
        setPendingFiles({});
        setRemovedAnswerIds([]);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load product",
        );
        setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestId, getProductDetail]);

  if (loading) {
    return <ComplianceFormPageSkeleton />;
  }

  if (loadError || !product) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">
          {loadError ?? "Product request not found"}
        </p>
        <Link
          href="/dashboard?section=products"
          className="mt-4 text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          Back to product requests
        </Link>
      </div>
    );
  }

  const request = apiDetailToProductRequest(product);
  const canEdit = product.status === "PENDING";
  const headerImageSrc =
    productImagePreviewUrl ||
    product.photo ||
    (productImageRequirementId
      ? existingDocs[productImageRequirementId]?.at(-1)?.fileUrl
      : undefined) ||
    request.productImage;

  function docLabel(doc: ApiDocumentRequirement) {
    return publicDocumentLabel(doc.type, doc.label);
  }

  function fieldLabel(field: ApiFieldRequirement) {
    return publicFieldLabel(field.fieldType, field.label);
  }

  function hasDoc(id: string) {
    return (
      (existingDocs[id]?.length ?? 0) > 0 || (pendingFiles[id]?.length ?? 0) > 0
    );
  }

  function fileCount(id: string) {
    return (existingDocs[id]?.length ?? 0) + (pendingFiles[id]?.length ?? 0);
  }

  function resetForm() {
    const initialText: Record<string, string> = {};
    for (const field of product!.fieldRequirements) {
      initialText[field.id] = "";
    }
    setTextValues(initialText);
    setPendingFiles({});
    setExistingDocs({});
    setRemovedAnswerIds([]);
    setSubmitError(null);
    setConfirmIncompleteOpen(false);
    setFormKey((key) => key + 1);
  }

  async function performSubmit() {
    setSubmitError(null);
    setConfirmIncompleteOpen(false);
    setSubmitting(true);
    try {
      const fieldValues = product!.fieldRequirements.map((field) => ({
        requirementId: field.id,
        value: textValues[field.id] ?? "",
      }));
      const files = Object.entries(pendingFiles).flatMap(
        ([requirementId, rows]) =>
          rows.map((row) => ({ requirementId, file: row.file })),
      );

      await submitCompliance(
        requestId,
        fieldValues,
        files,
        removedAnswerIds,
      );
      resetForm();
      setShowSubmitTooltip(true);
      router.push("/dashboard?section=products");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit compliance",
      );
      window.requestAnimationFrame(() => {
        errorSummaryRef.current?.focus();
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const incompleteDocs = product!.documentRequirements.filter(
      (doc) => doc.level === "REQUIRED" && !hasDoc(doc.id),
    );
    const incompleteFields = product!.fieldRequirements.filter(
      (field) =>
        field.level === "REQUIRED" &&
        isEmptyHtml(textValues[field.id] ?? ""),
    );

    if (incompleteDocs.length > 0 || incompleteFields.length > 0) {
      setConfirmIncompleteOpen(true);
      return;
    }

    void performSubmit();
  }

  const attachedDocs = product.documentRequirements.filter((doc) =>
    hasDoc(doc.id),
  );
  const availableDocs = product.documentRequirements;

  const requiredDocItems = product.documentRequirements
    .filter((doc) => doc.level === "REQUIRED")
    .map((doc) => ({
      id: doc.id,
      label: docLabel(doc),
      done: hasDoc(doc.id),
    }));

  const requiredFieldItems = product.fieldRequirements
    .filter((field) => field.level === "REQUIRED")
    .map((field) => ({
      id: field.id,
      label: fieldLabel(field),
      done: !isEmptyHtml(textValues[field.id] ?? ""),
    }));

  const requiredTotal = requiredDocItems.length + requiredFieldItems.length;
  const requiredCompleted =
    requiredDocItems.filter((item) => item.done).length +
    requiredFieldItems.filter((item) => item.done).length;
  const incompleteItems = [
    ...requiredDocItems.filter((item) => !item.done),
    ...requiredFieldItems.filter((item) => !item.done),
  ];

  if (!canEdit) {
    return (
      <div className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard?section=products"
            className="inline-flex text-[13px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            ← Back to product requests
          </Link>

          <header className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-bg-inset outline outline-border-subtle">
                  {headerImageSrc ? (
                    <Image
                      src={headerImageSrc}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-text-muted">
                      <HiOutlineDocumentText className="h-7 w-7" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <StatusBanner status={product.status} />
                  <h1 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-balance text-text-primary">
                    {request.productName}
                  </h1>
                  <p className="mt-1 text-[13px] text-text-secondary">
                    Requested by{" "}
                    <span className="font-medium text-text-primary">
                      {request.organizationName}
                    </span>
                  </p>
                  {product.rejectionReason ? (
                    <p className="mt-2 text-[13px] text-danger-500">
                      Rejection reason: {product.rejectionReason}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <p className="mt-4 rounded-[9px] border border-border-subtle bg-bg-elevated px-4 py-3 text-[13px] text-text-secondary">
            This submission is read-only. You can review the documents and
            information you provided.
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-[15px] font-medium text-text-primary">
                Documents
              </h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {product.documentRequirements.map((doc) => {
                  const label = docLabel(doc);
                  const files = doc.documents.filter(
                    (item) => item.fileUrl && item.fileName,
                  );
                  return (
                    <div
                      key={doc.id}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-text-primary">
                            {label}
                          </p>
                          <p className="mt-1 text-[11px] text-text-muted">
                            {files.length} file{files.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <RequirementMeta
                          level={doc.level}
                          visibility={doc.visibility}
                        />
                      </div>
                      {files.length > 0 ? (
                        <ul className="mt-3 space-y-3">
                          {files.map((file) => (
                            <li key={file.id} className="space-y-2">
                              <DocumentPreviewButton
                                fileName={file.fileName!}
                                previewUrl={file.fileUrl}
                                onPreview={() =>
                                  openFromUrl(
                                    label,
                                    file.fileName!,
                                    file.fileUrl,
                                  )
                                }
                              />
                              <a
                                href={
                                  toProxiedMediaUrl(file.fileUrl) || file.fileUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex text-[12px] font-medium text-brand-600 hover:text-brand-700"
                              >
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[13px] text-text-muted italic">
                          Not provided
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-[15px] font-medium text-text-primary">
                Product information
              </h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {product.fieldRequirements.map((field) => {
                  const value = field.fieldValue?.value ?? "";
                  return (
                    <div
                      key={field.id}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium text-text-primary">
                          {fieldLabel(field)}
                        </p>
                        <RequirementMeta
                          level={field.level}
                          visibility={field.visibility}
                        />
                      </div>
                      <div className="mt-3">
                        <RichTextContent html={value} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-bg-app px-4 py-8 pb-28 sm:px-6 lg:px-8">
      {showSubmitTooltip ? (
        <SubmitSuccessTooltip
          publicSlug={product.publicSlug}
          onClose={() => setShowSubmitTooltip(false)}
        />
      ) : null}

      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard?section=products"
          className="inline-flex text-[13px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          ← Back to product requests
        </Link>

        <header className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-bg-inset outline outline-border-subtle">
                {headerImageSrc ? (
                  <Image
                    src={headerImageSrc}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-text-muted">
                    <HiOutlineDocumentText className="h-7 w-7" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                  Compliance submission
                </p>
                <h1 className="mt-0.5 font-display text-[22px] font-semibold tracking-[-0.02em] text-balance text-text-primary">
                  {request.productName}
                </h1>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Requested by{" "}
                  <span className="font-medium text-text-primary">
                    {request.organizationName}
                  </span>
                </p>
              </div>
            </div>
            <ProgressMeter
              completed={requiredCompleted}
              total={requiredTotal}
            />
          </div>
        </header>

        <form
          key={formKey}
          id="compliance-submit-form"
          className="mt-8"
          noValidate
          onSubmit={handleSubmit}
        >
          {submitError ? (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              role="alert"
              className="mb-6 rounded-[12px] border border-danger-500/30 bg-danger-50 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-danger-500/30"
            >
              <div className="flex items-start gap-2.5">
                <HiOutlineExclamationTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
                  aria-hidden
                />
                <p className="text-[13px] font-medium text-danger-500">
                  {submitError}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-8">
            <section id="documents-section" className="scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-medium text-text-primary">
                    Documents
                  </h2>
                  <p className="mt-0.5 text-[12px] text-text-secondary">
                    {attachedDocs.length} type
                    {attachedDocs.length === 1 ? "" : "s"} with files ·{" "}
                    {attachedDocs.reduce((sum, doc) => sum + fileCount(doc.id), 0)}{" "}
                    file
                    {attachedDocs.reduce(
                      (sum, doc) => sum + fileCount(doc.id),
                      0,
                    ) === 1
                      ? ""
                      : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddDocumentRequirementId(undefined);
                    setAddDocumentOpen(true);
                  }}
                  disabled={availableDocs.length === 0}
                  className="inline-flex h-10 min-w-[44px] cursor-pointer items-center gap-1.5 rounded-[9px] bg-brand-500 px-3.5 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlinePlus className="h-4 w-4" aria-hidden />
                  Add document
                </button>
              </div>

              <div className="mt-4">
                <RequiredChecklist
                  title="Required documents"
                  items={requiredDocItems}
                />

                {attachedDocs.length === 0 ? (
                  <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-4 py-10 text-center">
                    <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <HiOutlineArrowUpTray className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="mt-3 text-[13px] font-medium text-text-primary">
                      No documents added yet
                    </p>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      Add one or more files per document type. Required ones are
                      listed above.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAddDocumentRequirementId(undefined);
                        setAddDocumentOpen(true);
                      }}
                      disabled={availableDocs.length === 0}
                      className="mt-4 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[9px] border border-border-subtle bg-bg-app px-4 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
                    >
                      <HiOutlinePlus className="h-4 w-4" aria-hidden />
                      Add your first document
                    </button>
                  </div>
                ) : (
                  <ul className="grid gap-4 lg:grid-cols-2">
                    {attachedDocs.map((doc) => {
                      const existing = existingDocs[doc.id] ?? [];
                      const pending = pendingFiles[doc.id] ?? [];
                      const isRequired = doc.level === "REQUIRED";
                      const count = existing.length + pending.length;

                      return (
                        <li
                          key={doc.id}
                          className={`rounded-[12px] border bg-bg-elevated p-4 transition-colors duration-150 ${
                            isRequired
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
                                    {docLabel(doc)}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-text-muted">
                                    {count} file{count === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <RequirementMeta
                                  level={doc.level}
                                  visibility={doc.visibility}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAddDocumentRequirementId(doc.id);
                                setAddDocumentOpen(true);
                              }}
                              className="inline-flex h-10 min-w-[44px] cursor-pointer items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                            >
                              <HiOutlinePlus className="h-4 w-4" aria-hidden />
                              Add more
                            </button>
                          </div>

                          <ul className="mt-3 space-y-3">
                            {existing.map((file) => (
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
                                        docLabel(doc),
                                        file.fileName,
                                        file.fileUrl,
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRemovedAnswerIds((prev) => [
                                        ...prev,
                                        file.id,
                                      ]);
                                      setExistingDocs((prev) => {
                                        const next = {
                                          ...prev,
                                          [doc.id]: (prev[doc.id] ?? []).filter(
                                            (row) => row.id !== file.id,
                                          ),
                                        };
                                        if ((next[doc.id]?.length ?? 0) === 0) {
                                          delete next[doc.id];
                                        }
                                        return next;
                                      });
                                    }}
                                    className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-[7px] px-2 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-danger-500"
                                    aria-label={`Remove ${file.fileName}`}
                                  >
                                    <HiOutlineTrash
                                      className="h-4 w-4"
                                      aria-hidden
                                    />
                                    Remove
                                  </button>
                                </div>
                              </li>
                            ))}
                            {pending.map((row) => (
                              <li
                                key={row.localId}
                                className="rounded-[9px] border border-border-subtle bg-bg-app p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <DocumentPreviewButton
                                    fileName={row.file.name}
                                    selectedFile={row.file}
                                    onPreview={() =>
                                      openFromFile(docLabel(doc), row.file)
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPendingFiles((prev) => {
                                        const next = {
                                          ...prev,
                                          [doc.id]: (prev[doc.id] ?? []).filter(
                                            (item) =>
                                              item.localId !== row.localId,
                                          ),
                                        };
                                        if ((next[doc.id]?.length ?? 0) === 0) {
                                          delete next[doc.id];
                                        }
                                        return next;
                                      });
                                    }}
                                    className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-[7px] px-2 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-danger-500"
                                    aria-label={`Remove ${row.file.name}`}
                                  >
                                    <HiOutlineTrash
                                      className="h-4 w-4"
                                      aria-hidden
                                    />
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
              </div>
            </section>

            <section id="fields-section" className="scroll-mt-28">
              <div>
                <h2 className="text-[15px] font-medium text-text-primary">
                  Product information
                </h2>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  {requiredFieldItems.filter((item) => item.done).length}/
                  {requiredFieldItems.length} required fields complete
                </p>
              </div>

              <div className="mt-4">
                <RequiredChecklist
                  title="Required fields"
                  items={requiredFieldItems}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  {product.fieldRequirements.map((field) => {
                    const isRequired = field.level === "REQUIRED";
                    return (
                      <div
                        key={field.id}
                        id={`field-${field.id}`}
                        className={`scroll-mt-28 rounded-[12px] border bg-bg-elevated p-4 ${
                          isRequired
                            ? "border-l-[3px] border-border-subtle border-l-amber-300"
                            : "border-border-subtle"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label
                            htmlFor={field.id}
                            className="text-[13px] font-medium text-text-primary"
                          >
                            {fieldLabel(field)}
                            {isRequired ? (
                              <span className="text-brand-600"> *</span>
                            ) : null}
                          </label>
                          <RequirementMeta
                            level={field.level}
                            visibility={field.visibility}
                          />
                        </div>
                        <TiptapEditor
                          key={`${field.id}-${formKey}`}
                          id={field.id}
                          value={textValues[field.id] ?? ""}
                          placeholder={`Enter ${fieldLabel(field).toLowerCase()}`}
                          onChange={(html) => {
                            setTextValues((prev) => ({
                              ...prev,
                              [field.id]: html,
                            }));
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-bg-elevated/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <p className="hidden text-[12px] text-text-secondary sm:block">
            {requiredCompleted === requiredTotal
              ? "All suggested required items are complete."
              : `You can submit now — ${requiredTotal - requiredCompleted} suggested item${
                  requiredTotal - requiredCompleted === 1 ? "" : "s"
                } still open.`}
          </p>
          <button
            type="submit"
            form="compliance-submit-form"
            disabled={submitting}
            className="ml-auto h-11 min-w-[140px] cursor-pointer rounded-[9px] bg-brand-500 px-5 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting…" : "Submit compliance"}
          </button>
        </div>
      </div>

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}

      <AddDocumentModal
        open={addDocumentOpen}
        options={availableDocs}
        acceptByType={TYPE_TO_ACCEPT}
        labelFor={docLabel}
        initialRequirementId={addDocumentRequirementId}
        onClose={() => {
          setAddDocumentOpen(false);
          setAddDocumentRequirementId(undefined);
        }}
        onAdd={(requirementId, files) => {
          setPendingFiles((prev) => ({
            ...prev,
            [requirementId]: [
              ...(prev[requirementId] ?? []),
              ...files.map((file) => ({
                localId: `${requirementId}-${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                file,
              })),
            ],
          }));
        }}
      />

      {confirmIncompleteOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setConfirmIncompleteOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="incomplete-submit-title"
            className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <HiOutlineExclamationTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="incomplete-submit-title"
                  className="text-[16px] font-semibold text-text-primary"
                >
                  Submission is not totally complete
                </h2>
                <p className="mt-1.5 text-[13px] text-text-secondary">
                  Some suggested required items are still missing. Do you still
                  want to submit?
                </p>
                {incompleteItems.length > 0 ? (
                  <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-[9px] border border-border-subtle bg-bg-app px-3 py-2 text-[12px] text-text-secondary">
                    {incompleteItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400"
                          aria-hidden
                        />
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmIncompleteOpen(false)}
                className="h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted disabled:opacity-60"
              >
                Keep editing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void performSubmit()}
                className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit anyway"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
