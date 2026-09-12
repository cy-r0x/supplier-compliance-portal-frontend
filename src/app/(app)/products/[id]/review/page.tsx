"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import {
  PdfPreviewModal,
  PublicDocumentPreviewButton,
  isImageFileName,
  isPdfFileName,
  usePdfPreview,
} from "../../../../../../components/documents/pdf-preview";
import { toProxiedMediaUrl } from "@/lib/media-url";
import { RequirementMeta } from "@/components/products/RequirementMeta";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  approveProduct,
  getProduct,
  rejectProduct,
} from "@/lib/api/products-api";
import type { ApiProductDetail } from "@/lib/products/map-product";
import { apiDetailToProductRequest } from "@/lib/products/map-product";
import { isEmptyHtml } from "@/lib/html";
import {
  publicDocumentLabel,
  publicFieldLabel,
} from "@/lib/public-product-labels";
import { ProductReviewPageSkeleton } from "@/components/loading/page-skeletons";
import { formatDate } from "@/app/admin/types";

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

function StatusBanner({ status }: { status: ApiProductDetail["status"] }) {
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
      ? "Awaiting your review"
      : status === "PENDING"
        ? "Waiting for supplier"
        : status === "APPROVED"
          ? "Approved"
          : "Rejected";

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
    <div className="min-w-[140px] flex-1 sm:max-w-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-text-secondary">
          Required progress
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

function CompletionSummary({
  items,
  title,
}: {
  title: string;
  items: Array<{ id: string; label: string; done: boolean }>;
}) {
  if (items.length === 0) return null;
  const doneCount = items.filter((item) => item.done).length;

  return (
    <aside
      aria-label={title}
      className="rounded-[10px] border border-border-subtle bg-bg-elevated px-3.5 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold tracking-wide text-text-secondary uppercase">
          {title}
        </p>
        <p className="text-[11px] font-medium text-text-muted">
          {doneCount}/{items.length} provided
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-[12px]">
            <HiOutlineCheckCircle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                item.done ? "text-brand-600" : "text-text-muted"
              }`}
              aria-hidden
            />
            <span
              className={
                item.done ? "text-text-secondary" : "text-text-muted"
              }
            >
              {item.label}
              {!item.done ? " — missing" : ""}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function ProductReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = typeof params.id === "string" ? params.id : "";
  const rejectReasonId = useId();
  const rejectTitleId = useId();
  const approveTitleId = useId();
  const errorRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const { preview, close, openFromUrl } = usePdfPreview();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(setProduct)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load product"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!rejectOpen && !approveOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !acting) {
        setRejectOpen(false);
        setApproveOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rejectOpen, approveOpen, acting]);

  const canReview =
    user?.role === "SUPER_ADMIN" ||
    (user?.role === "USER" && Boolean(user.organization));

  const reviewStats = useMemo(() => {
    if (!product) return null;

    const requiredDocs = product.documentRequirements
      .filter((doc) => doc.level === "REQUIRED")
      .map((doc) => ({
        id: doc.id,
        label: publicDocumentLabel(doc.type, doc.label),
        done: doc.documents.some((file) => Boolean(file.fileUrl)),
      }));

    const requiredFields = product.fieldRequirements
      .filter((field) => field.level === "REQUIRED")
      .map((field) => ({
        id: field.id,
        label: publicFieldLabel(field.fieldType, field.label),
        done: !isEmptyHtml(field.fieldValue?.value ?? ""),
      }));

    const fileCount = product.documentRequirements.reduce(
      (sum, doc) =>
        sum + doc.documents.filter((file) => Boolean(file.fileUrl)).length,
      0,
    );

    const completed =
      requiredDocs.filter((item) => item.done).length +
      requiredFields.filter((item) => item.done).length;
    const total = requiredDocs.length + requiredFields.length;

    return { requiredDocs, requiredFields, fileCount, completed, total };
  }, [product]);

  if (!user) return null;

  if (!canReview) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">
          Access denied
        </p>
        <Link
          href="/dashboard"
          className="mt-4 text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return <ProductReviewPageSkeleton />;
  }

  if (error || !product || !reviewStats) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">
          {error ?? "Not found"}
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
  const canAct =
    product.status === "SUBMITTED" &&
    user.role === "USER" &&
    user.organization?.role === "MANAGER";
  const missingRequired = reviewStats.total - reviewStats.completed;

  async function handleApprove() {
    setActing(true);
    setActionError(null);
    try {
      await approveProduct(id);
      setApproveOpen(false);
      router.push("/dashboard?section=products");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve");
      window.requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setActing(true);
    setActionError(null);
    try {
      await rejectProduct(id, rejectReason.trim());
      setRejectOpen(false);
      router.push("/dashboard?section=products");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject");
      window.requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setActing(false);
    }
  }

  return (
    <div
      className={`min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8 ${
        canAct ? "pb-28" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard?section=products"
          className="inline-flex text-[13px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          ← Back to product requests
        </Link>

        <header className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-bg-inset outline outline-border-subtle">
                {request.productImage ? (
                  <Image
                    src={request.productImage}
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
                  {product.name}
                </h1>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Supplier{" "}
                  <span className="font-medium text-text-primary">
                    {product.supplier.name}
                  </span>
                  {product.submittedAt ? (
                    <>
                      {" · "}
                      Submitted {formatDate(product.submittedAt)}
                    </>
                  ) : null}
                </p>
                {product.rejectionReason ? (
                  <p className="mt-2 rounded-[8px] border border-danger-500/20 bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
                    Rejection reason: {product.rejectionReason}
                  </p>
                ) : null}
                {product.status === "APPROVED" && product.publicSlug ? (
                  <Link
                    href={`/p/${product.publicSlug}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <HiOutlineGlobeAlt className="h-4 w-4" aria-hidden />
                    View public page
                  </Link>
                ) : null}
              </div>
            </div>
            <ProgressMeter
              completed={reviewStats.completed}
              total={reviewStats.total}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[9px] border border-border-subtle bg-bg-app px-3.5 py-3">
              <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                Files uploaded
              </p>
              <p className="mt-1 font-display text-[20px] font-semibold text-text-primary">
                {reviewStats.fileCount}
              </p>
            </div>
            <div className="rounded-[9px] border border-border-subtle bg-bg-app px-3.5 py-3">
              <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                Required docs
              </p>
              <p className="mt-1 font-display text-[20px] font-semibold text-text-primary">
                {reviewStats.requiredDocs.filter((item) => item.done).length}/
                {reviewStats.requiredDocs.length}
              </p>
            </div>
            <div className="rounded-[9px] border border-border-subtle bg-bg-app px-3.5 py-3">
              <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
                Required fields
              </p>
              <p className="mt-1 font-display text-[20px] font-semibold text-text-primary">
                {reviewStats.requiredFields.filter((item) => item.done).length}/
                {reviewStats.requiredFields.length}
              </p>
            </div>
          </div>
        </header>

        {product.status === "PENDING" ? (
          <p className="mt-4 rounded-[9px] border border-border-subtle bg-bg-elevated px-4 py-3 text-[13px] text-text-secondary">
            The supplier has not submitted compliance yet. Prefills below are
            what you provided at creation; the supplier will complete the rest.
          </p>
        ) : null}

        {product.status === "SUBMITTED" && missingRequired > 0 ? (
          <p className="mt-4 rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            {missingRequired} required item
            {missingRequired === 1 ? " is" : "s are"} still missing. You can
            still approve or reject after reviewing.
          </p>
        ) : null}

        {actionError ? (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mt-4 rounded-[12px] border border-danger-500/30 bg-danger-50 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-danger-500/30"
          >
            <div className="flex items-start gap-2.5">
              <HiOutlineExclamationTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
                aria-hidden
              />
              <p className="text-[13px] font-medium text-danger-500">
                {actionError}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-medium text-text-primary">
                  Documents
                </h2>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  {reviewStats.fileCount} file
                  {reviewStats.fileCount === 1 ? "" : "s"} across{" "}
                  {product.documentRequirements.length} type
                  {product.documentRequirements.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <CompletionSummary
                title="Required documents"
                items={reviewStats.requiredDocs}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {product.documentRequirements.map((doc) => {
                const label = publicDocumentLabel(doc.type, doc.label);
                const files = doc.documents.filter(
                  (item) => item.fileUrl && item.fileName,
                );
                const isRequired = doc.level === "REQUIRED";
                const isMissing = isRequired && files.length === 0;

                return (
                  <div
                    key={doc.id}
                    className={`rounded-[12px] border bg-bg-elevated p-4 ${
                      isMissing
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
                              {label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-text-muted">
                              {files.length} file
                              {files.length === 1 ? "" : "s"}
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
                    </div>

                    {files.length > 0 ? (
                      <ul className="mt-3 space-y-3">
                        {files.map((file) => (
                          <li
                            key={file.id}
                            className="rounded-[9px] border border-border-subtle bg-bg-app p-3"
                          >
                            {isImageFileName(file.fileName!) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openFromUrl(
                                    label,
                                    file.fileName!,
                                    file.fileUrl,
                                  )
                                }
                                className="mb-3 block w-full overflow-hidden rounded-[10px] border border-border-subtle bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                                aria-label={`Preview ${file.fileName}`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    toProxiedMediaUrl(file.fileUrl) ||
                                    file.fileUrl
                                  }
                                  alt=""
                                  className="h-36 w-full object-contain"
                                />
                              </button>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="min-w-0 flex-1 truncate text-[12px] text-text-muted">
                                {file.fileName}
                              </span>
                              <a
                                href={
                                  toProxiedMediaUrl(file.fileUrl) ||
                                  file.fileUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                              >
                                <HiOutlineArrowDownTray
                                  className="h-3.5 w-3.5"
                                  aria-hidden
                                />
                                Download
                              </a>
                              {isPdfFileName(file.fileName!) ||
                              isImageFileName(file.fileName!) ? (
                                <PublicDocumentPreviewButton
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
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-[13px] text-text-muted italic">
                        Not provided
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-[15px] font-medium text-text-primary">
                Product information
              </h2>
              <p className="mt-0.5 text-[12px] text-text-secondary">
                {reviewStats.requiredFields.filter((item) => item.done).length}/
                {reviewStats.requiredFields.length} required fields provided
              </p>
            </div>

            <div className="mb-4">
              <CompletionSummary
                title="Required fields"
                items={reviewStats.requiredFields}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {product.fieldRequirements.map((field) => {
                const label = publicFieldLabel(field.fieldType, field.label);
                const value = field.fieldValue?.value ?? "";
                const isRequired = field.level === "REQUIRED";
                const isMissing = isRequired && isEmptyHtml(value);

                return (
                  <div
                    key={field.id}
                    className={`rounded-[12px] border bg-bg-elevated p-4 ${
                      isMissing
                        ? "border-l-[3px] border-border-subtle border-l-amber-300"
                        : "border-border-subtle"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-medium text-text-primary">
                        {label}
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

      {canAct ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-bg-elevated/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p className="text-[12px] text-text-secondary">
              {missingRequired === 0
                ? "All required items are present. Ready for a decision."
                : `${missingRequired} required item${
                    missingRequired === 1 ? "" : "s"
                  } missing — review carefully before deciding.`}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={acting}
                onClick={() => {
                  setRejectReason("");
                  setRejectOpen(true);
                }}
                className="h-11 min-w-[110px] cursor-pointer rounded-[9px] border border-danger-500 px-4 text-[13px] font-medium text-danger-500 transition-colors duration-150 hover:bg-danger-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => setApproveOpen(true)}
                className="h-11 min-w-[110px] cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {approveOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !acting) {
              setApproveOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={approveTitleId}
            className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <HiOutlineCheckCircle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id={approveTitleId}
                  className="text-[16px] font-semibold text-text-primary"
                >
                  Approve this submission?
                </h2>
                <p className="mt-1.5 text-[13px] text-text-secondary">
                  Approving{" "}
                  <span className="font-medium text-text-primary">
                    {product.name}
                  </span>{" "}
                  makes public fields available on the product page.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={acting}
                onClick={() => setApproveOpen(false)}
                className="h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => void handleApprove()}
                className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
              >
                {acting ? "Approving…" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !acting) {
              setRejectOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={rejectTitleId}
            className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-500">
                <HiOutlineExclamationTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id={rejectTitleId}
                  className="text-[16px] font-semibold text-text-primary"
                >
                  Reject this submission?
                </h2>
                <p className="mt-1.5 text-[13px] text-text-secondary">
                  Tell the supplier what needs to change. They will see this
                  reason on the request.
                </p>
                <label
                  htmlFor={rejectReasonId}
                  className="mt-4 block text-[12px] font-medium text-text-primary"
                >
                  Rejection reason <span className="text-brand-600">*</span>
                </label>
                <textarea
                  id={rejectReasonId}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 py-2 text-[13px] text-text-primary outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25"
                  placeholder="Describe what is missing or incorrect"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={acting}
                onClick={() => setRejectOpen(false)}
                className="h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || acting}
                onClick={() => void handleReject()}
                className="h-10 cursor-pointer rounded-[9px] bg-danger-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-danger-500/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </div>
  );
}
