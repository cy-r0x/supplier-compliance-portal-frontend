import Image from "next/image";
import { isEmptyHtml } from "@/lib/html";
import type { PublicProduct } from "@/lib/public-product";
import { PublicDocumentCard } from "./PublicDocumentCard";

function RichTextContent({ html }: { html: string }) {
  if (isEmptyHtml(html)) return null;

  return (
    <div
      className="public-rich-text text-[14px] leading-relaxed text-text-secondary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function formatApprovedDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function PublicProductView({ product }: { product: PublicProduct }) {
  const hasDocuments = product.documents.length > 0;
  const hasTextFields = product.textFields.length > 0;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-app">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <article>
          <div className="overflow-hidden rounded-[14px] border border-border-subtle bg-bg-elevated shadow-sm">
            <div className="border-b border-border-subtle bg-bg-inset/40 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Image
                  src={product.productImage}
                  alt=""
                  width={120}
                  height={120}
                  unoptimized
                  className="size-[120px] shrink-0 rounded-[12px] object-cover outline outline-border-subtle"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brand-700"
                    >
                      <svg aria-hidden className="size-3" fill="none" viewBox="0 0 24 24">
                        <path
                          d="m9 12 2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Approved
                    </span>
                    <span className="text-[12px] text-text-muted">
                      {formatApprovedDate(product.approvedAt)}
                    </span>
                  </div>
                  <h1 className="mt-2 font-display text-[26px] font-semibold tracking-[-0.02em] text-text-primary sm:text-[28px]">
                    {product.productName}
                  </h1>
                  <p className="mt-2 text-[14px] text-text-secondary">
                    Supplied by{" "}
                    <span className="font-medium text-text-primary">
                      {product.supplierName}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-5 py-6 sm:px-6 sm:py-8">
              <section aria-labelledby="public-documents-heading">
                <h2
                  id="public-documents-heading"
                  className="text-[15px] font-medium text-text-primary"
                >
                  Public documents
                </h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Compliance documents shared for this approved product.
                </p>
                {hasDocuments ? (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {product.documents.map((document) => (
                      <li key={document.key}>
                        <PublicDocumentCard document={document} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-[10px] border border-dashed border-border-subtle bg-bg-muted/30 px-4 py-6 text-center text-[13px] text-text-muted">
                    No public documents are available for this product.
                  </p>
                )}
              </section>

              {hasTextFields ? (
                <section aria-labelledby="public-info-heading">
                  <h2
                    id="public-info-heading"
                    className="text-[15px] font-medium text-text-primary"
                  >
                    Product information
                  </h2>
                  <p className="mt-1 text-[13px] text-text-secondary">
                    Safety and product details marked as public by the supplier.
                  </p>
                  <div className="mt-4 space-y-4">
                    {product.textFields.map((field) => (
                      <div
                        key={field.key}
                        className="rounded-[10px] border border-border-subtle bg-bg-muted/20 p-4"
                      >
                        <h3 className="text-[13px] font-medium text-text-primary">
                          {field.label}
                        </h3>
                        <div className="mt-2">
                          <RichTextContent html={field.value} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-border-subtle bg-bg-elevated">
        <div className="mx-auto max-w-4xl px-4 py-5 text-center sm:px-6">
          <p className="text-[12px] text-text-muted">
            Provided via Supplier Compliance Portal
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PublicProductSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-app">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="animate-pulse overflow-hidden rounded-[14px] border border-border-subtle bg-bg-elevated">
          <div className="border-b border-border-subtle p-6">
            <div className="flex gap-5">
              <div className="size-[120px] rounded-[12px] bg-bg-muted" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-5 w-24 rounded-full bg-bg-muted" />
                <div className="h-8 w-3/4 rounded bg-bg-muted" />
                <div className="h-4 w-1/2 rounded bg-bg-muted" />
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="h-4 w-32 rounded bg-bg-muted" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-[10px] bg-bg-muted" />
              <div className="h-24 rounded-[10px] bg-bg-muted" />
              <div className="h-24 rounded-[10px] bg-bg-muted" />
              <div className="h-24 rounded-[10px] bg-bg-muted" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
