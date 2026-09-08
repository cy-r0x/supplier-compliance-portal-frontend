"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PdfPreviewModal,
  PublicDocumentPreviewButton,
  isPdfFileName,
  usePdfPreview,
} from "../../../../../../components/documents/pdf-preview";
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
import { ProductReviewPageSkeleton } from "@/components/loading/page-skeletons";

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
    <span className={`inline-flex rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${styles}`}>
      {label}
    </span>
  );
}

export default function ProductReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
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

  if (!user) return null;

  const canReview =
    user.role === "DISTRIBUTOR" || user.role === "SUPER_ADMIN";

  if (!canReview) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">Access denied</p>
        <Link href="/dashboard" className="mt-4 text-[13px] font-medium text-brand-600">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return <ProductReviewPageSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">{error ?? "Not found"}</p>
        <Link href="/dashboard?section=products" className="mt-4 text-[13px] font-medium text-brand-600">
          Back to product requests
        </Link>
      </div>
    );
  }

  const request = apiDetailToProductRequest(product);

  async function handleApprove() {
    if (!window.confirm(`Approve ${product!.name}?`)) return;
    setActing(true);
    setActionError(null);
    try {
      await approveProduct(id);
      router.push("/dashboard?section=products");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve");
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
    } finally {
      setActing(false);
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

        <header className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src={request.productImage}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="size-[72px] shrink-0 rounded-[10px] object-cover outline outline-border-subtle"
              />
              <div>
                <StatusBanner status={product.status} />
                <h1 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
                  {product.name}
                </h1>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Supplier: <span className="font-medium text-text-primary">{product.supplier.name}</span>
                  {" · "}
                  Progress: <span className="font-mono">{product.progress.percent}%</span>
                </p>
                {product.rejectionReason ? (
                  <p className="mt-2 text-[13px] text-danger-500">
                    Rejection reason: {product.rejectionReason}
                  </p>
                ) : null}
              </div>
            </div>
            {product.status === "SUBMITTED" && user.role === "DISTRIBUTOR" ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleApprove()}
                  className="h-10 rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse hover:bg-brand-600 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => setRejectOpen(true)}
                  className="h-10 rounded-[9px] border border-danger-500 px-4 text-[13px] font-medium text-danger-500 hover:bg-danger-50 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {product.status === "PENDING" ? (
          <p className="mt-4 rounded-[9px] border border-border-subtle bg-bg-elevated px-4 py-3 text-[13px] text-text-secondary">
            The supplier has not submitted compliance yet. Prefilled values below are what you
            provided at creation; the supplier will complete the rest.
          </p>
        ) : null}

        {actionError ? (
          <p role="alert" className="mt-4 text-[13px] text-danger-500">{actionError}</p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-[15px] font-medium text-text-primary">Documents</h2>
            <div className="mt-4 space-y-4">
              {product.documentRequirements.map((doc) => {
                const label = doc.label || doc.type;
                const fileName = doc.document?.fileName ?? "";
                const fileUrl = doc.document?.fileUrl;
                return (
                  <div
                    key={doc.id}
                    className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-medium text-text-primary">{label}</p>
                      <RequirementMeta level={doc.level} visibility={doc.visibility} />
                    </div>
                    {fileUrl && fileName ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-[12px] text-text-muted">{fileName}</span>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-medium text-brand-600 hover:text-brand-700"
                        >
                          Download
                        </a>
                        {isPdfFileName(fileName) ? (
                          <PublicDocumentPreviewButton
                            fileName={fileName}
                            previewUrl={fileUrl}
                            onPreview={() => openFromUrl(label, fileName, fileUrl)}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-[13px] text-text-muted italic">Not provided</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-text-primary">Product information</h2>
            <div className="mt-4 space-y-4">
              {product.fieldRequirements.map((field) => {
                const label = field.label || field.fieldType;
                const value = field.fieldValue?.value ?? "";
                return (
                  <div
                    key={field.id}
                    className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-medium text-text-primary">{label}</p>
                      <RequirementMeta level={field.level} visibility={field.visibility} />
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

      {rejectOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRejectOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated p-6 shadow-sm">
            <h2 className="font-display text-[18px] font-semibold text-text-primary">Reject request</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 py-2 text-[13px]"
              placeholder="Rejection reason"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="h-10 rounded-[9px] px-4 text-[13px] font-medium hover:bg-bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || acting}
                onClick={() => void handleReject()}
                className="h-10 rounded-[9px] bg-danger-500 px-4 text-[13px] font-medium text-text-inverse disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </div>
  );
}
