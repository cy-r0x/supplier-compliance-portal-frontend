"use client";

import { isEmptyHtml } from "@/lib/html";
import type { PublicProduct } from "@/lib/public-product";
import type { PublicProductStatus } from "@/lib/api/public-product-api";
import { PublicDocumentRow } from "./PublicDocumentRow";

function RichTextContent({ html }: { html: string }) {
  if (isEmptyHtml(html)) return null;

  return (
    <div
      className="public-rich-text text-[14px] leading-relaxed text-text-secondary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const STATUS_BADGE: Record<
  PublicProductStatus,
  { label: string; className: string }
> = {
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-amber-100 text-amber-800",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-danger-50 text-danger-500",
  },
};

function PublicStatusBadge({ status }: { status: PublicProductStatus }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.APPROVED;

  return (
    <span
      className={`inline-flex rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function PublicProductView({ product }: { product: PublicProduct }) {
  const statusDate =
    product.status === "APPROVED" || product.status === "REJECTED"
      ? product.reviewedAt
      : product.submittedAt;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-app">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
        <article className="rounded-[12px] border border-border-subtle bg-bg-elevated">
          <header className="border-b border-border-subtle px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <PublicStatusBadge status={product.status} />
              {statusDate ? (
                <span className="text-[12px] text-text-muted">
                  {formatDate(statusDate)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
              {product.productName}
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Supplied by{" "}
              <span className="font-medium text-text-primary">
                {product.supplierName}
              </span>
            </p>

            {product.status === "REJECTED" && product.rejectionReason ? (
              <p className="mt-3 rounded-[8px] border border-danger-50 bg-danger-50/60 px-3 py-2 text-[13px] text-danger-500">
                {product.rejectionReason}
              </p>
            ) : null}
          </header>

          <div className="space-y-6 px-5 py-6">
            {product.textFields.length > 0 ? (
              <section aria-labelledby="public-info-heading">
                <h2
                  id="public-info-heading"
                  className="text-[14px] font-medium text-text-primary"
                >
                  Product information
                </h2>
                <div className="mt-3 space-y-3">
                  {product.textFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-[10px] border border-border-subtle bg-bg-muted/20 px-4 py-3"
                    >
                      <h3 className="text-[13px] font-medium text-text-primary">
                        {field.label}
                      </h3>
                      <div className="mt-1.5">
                        <RichTextContent html={field.value} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {product.documents.length > 0 ? (
              <section aria-labelledby="public-documents-heading">
                <h2
                  id="public-documents-heading"
                  className="text-[14px] font-medium text-text-primary"
                >
                  Documents
                </h2>
                <ul className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-[10px] border border-border-subtle">
                  {product.documents.map((document) => (
                    <li key={document.key}>
                      <PublicDocumentRow document={document} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.textFields.length === 0 &&
            product.documents.length === 0 ? (
              <p className="rounded-[10px] border border-dashed border-border-subtle px-4 py-8 text-center text-[13px] text-text-muted">
                No public information has been published for this product yet.
              </p>
            ) : null}
          </div>
        </article>
      </main>

      <footer className="border-t border-border-subtle bg-bg-elevated px-4 py-4 text-center">
        <p className="text-[12px] text-text-muted">
          Product information · {product.supplierName}
        </p>
      </footer>
    </div>
  );
}

export function PublicProductSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-app">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
        <div className="animate-pulse rounded-[12px] border border-border-subtle bg-bg-elevated">
          <div className="border-b border-border-subtle px-5 py-5">
            <div className="h-6 w-20 rounded-[6px] bg-bg-muted" />
            <div className="mt-3 h-7 w-3/4 rounded bg-bg-muted" />
            <div className="mt-2 h-4 w-1/2 rounded bg-bg-muted" />
          </div>
          <div className="space-y-3 px-5 py-6">
            <div className="h-4 w-32 rounded bg-bg-muted" />
            <div className="h-20 rounded-[10px] bg-bg-muted" />
            <div className="h-20 rounded-[10px] bg-bg-muted" />
          </div>
        </div>
      </main>
    </div>
  );
}
