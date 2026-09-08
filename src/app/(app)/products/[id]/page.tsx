"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import TiptapEditor from "../../../../../components/editor/TiptapEditor";
import {
  DocumentPreviewButton,
  PdfPreviewModal,
  usePdfPreview,
} from "../../../../../components/documents/pdf-preview";
import { DOCUMENT_FIELD_CONFIG } from "@/lib/compliance";
import { isEmptyHtml } from "@/lib/html";
import type {
  ApiDocumentRequirement,
  ApiFieldRequirement,
  ApiProductDetail,
} from "@/lib/products/map-product";
import { apiDetailToProductRequest } from "@/lib/products/map-product";
import { useProductRequests } from "@/app/distributor/useProductRequests";

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

import { RequirementMeta } from "@/components/products/RequirementMeta";

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
          <svg aria-hidden className="size-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="m9 12 2 2 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text-primary">Submitted successfully</p>
          <p className="mt-1 text-[12px] text-text-secondary">
            After distributor approval, public fields will appear on{" "}
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
          className="shrink-0 cursor-pointer rounded p-1 text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
        >
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

  const { getProductDetail, submitCompliance } = useProductRequests();

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [prefilledDocs, setPrefilledDocs] = useState<
    Record<string, { fileName: string; fileUrl: string }>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitTooltip, setShowSubmitTooltip] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { preview, close, openFromFile, openFromUrl } = usePdfPreview();

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
        const initialPrefilled: Record<string, { fileName: string; fileUrl: string }> =
          {};
        for (const doc of detail.documentRequirements) {
          if (doc.document?.fileName && doc.document?.fileUrl) {
            initialPrefilled[doc.id] = {
              fileName: doc.document.fileName,
              fileUrl: doc.document.fileUrl,
            };
          }
        }
        setPrefilledDocs(initialPrefilled);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load product");
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
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
        Loading…
      </div>
    );
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

  if (!canEdit) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">
          This request has already been submitted
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

  function docLabel(doc: ApiDocumentRequirement) {
    return doc.label || doc.type;
  }

  function fieldLabel(field: ApiFieldRequirement) {
    return field.label || field.fieldType;
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    for (const doc of product!.documentRequirements) {
      const hasFile = Boolean(documentFiles[doc.id] || prefilledDocs[doc.id]);
      if (doc.level === "REQUIRED" && !hasFile) {
        next[doc.id] = `${docLabel(doc)} is required`;
      }
    }

    for (const field of product!.fieldRequirements) {
      const value = textValues[field.id] ?? "";
      if (field.level === "REQUIRED" && isEmptyHtml(value)) {
        next[field.id] = `${fieldLabel(field)} is required`;
      }
    }

    return next;
  }

  function resetForm() {
    const initialText: Record<string, string> = {};
    for (const field of product!.fieldRequirements) {
      initialText[field.id] = "";
    }
    setTextValues(initialText);
    setDocumentFiles({});
    setPrefilledDocs({});
    setErrors({});
    setFormKey((key) => key + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const fieldValues = product!.fieldRequirements.map((field) => ({
        requirementId: field.id,
        value: textValues[field.id] ?? "",
      }));
      const files = Object.entries(documentFiles).map(([requirementId, file]) => ({
        requirementId,
        file,
      }));

      await submitCompliance(requestId, fieldValues, files);
      resetForm();
      setShowSubmitTooltip(true);
      router.push("/dashboard?section=products");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8">
      {showSubmitTooltip ? (
        <SubmitSuccessTooltip
          publicSlug={product.publicSlug}
          onClose={() => setShowSubmitTooltip(false)}
        />
      ) : null}

      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard?section=products"
          className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to product requests
        </Link>

        <header className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <div className="flex items-start gap-4">
            <Image
              src={request.productImage}
              alt=""
              width={72}
              height={72}
              unoptimized
              className="size-[72px] shrink-0 rounded-[10px] object-cover outline outline-border-subtle"
            />
            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
                {request.productName}
              </h1>
              <p className="mt-1 text-[13px] text-text-secondary">
                Requested by{" "}
                <span className="font-medium text-text-primary">
                  {request.distributorName}
                </span>
              </p>
            </div>
          </div>
        </header>

        <form key={formKey} className="mt-8" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="text-[15px] font-medium text-text-primary">Documents</h2>
              <div className="mt-4 space-y-4">
                {product.documentRequirements.map((doc) => {
                  const invalid = errors[doc.id];
                  const selectedFile = documentFiles[doc.id];
                  const prefilled = prefilledDocs[doc.id];
                  const fileName = selectedFile?.name ?? prefilled?.fileName ?? "";
                  const previewUrl = selectedFile ? undefined : prefilled?.fileUrl;
                  const accept = TYPE_TO_ACCEPT[doc.type] ?? ".pdf,.doc,.docx,.png,.jpg,.jpeg";

                  return (
                    <div
                      key={doc.id}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label
                          htmlFor={`file-${doc.id}`}
                          className="text-[13px] font-medium text-text-primary"
                        >
                          {docLabel(doc)}
                        </label>
                        <RequirementMeta level={doc.level} visibility={doc.visibility} />
                      </div>
                      <input
                        id={`file-${doc.id}`}
                        type="file"
                        accept={accept}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setDocumentFiles((prev) => ({ ...prev, [doc.id]: file }));
                          } else {
                            setDocumentFiles((prev) => {
                              const next = { ...prev };
                              delete next[doc.id];
                              return next;
                            });
                          }
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[doc.id];
                            return next;
                          });
                        }}
                        className="mt-2 block w-full text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                      />
                      {fileName ? (
                        <DocumentPreviewButton
                          fileName={fileName}
                          selectedFile={selectedFile}
                          previewUrl={previewUrl}
                          onPreview={() => {
                            if (selectedFile) {
                              openFromFile(docLabel(doc), selectedFile);
                            } else if (previewUrl) {
                              openFromUrl(docLabel(doc), fileName, previewUrl);
                            }
                          }}
                        />
                      ) : null}
                      {invalid ? (
                        <p role="alert" className="mt-2 text-[12px] text-danger-500">
                          {invalid}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-[15px] font-medium text-text-primary">
                Product information
              </h2>
              <div className="mt-4 space-y-4">
                {product.fieldRequirements.map((field) => {
                  const invalid = errors[field.id];
                  return (
                    <div
                      key={field.id}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label
                          htmlFor={field.id}
                          className="text-[13px] font-medium text-text-primary"
                        >
                          {fieldLabel(field)}
                        </label>
                        <RequirementMeta level={field.level} visibility={field.visibility} />
                      </div>
                      <TiptapEditor
                        key={`${field.id}-${formKey}`}
                        id={field.id}
                        value={textValues[field.id] ?? ""}
                        invalid={Boolean(invalid)}
                        placeholder={`Enter ${fieldLabel(field).toLowerCase()}`}
                        onChange={(html) => {
                          setTextValues((prev) => ({ ...prev, [field.id]: html }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.id];
                            return next;
                          });
                        }}
                      />
                      {invalid ? (
                        <p role="alert" className="mt-1.5 text-[12px] text-danger-500">
                          {invalid}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-end border-t border-border-subtle pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-5 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </div>
  );
}
