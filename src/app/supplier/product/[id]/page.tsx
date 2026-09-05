"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  DOCUMENT_FIELD_CONFIG,
  TEXT_FIELD_CONFIG,
  emptyComplianceSubmission,
  normalizeComplianceSubmission,
  type ComplianceDocumentField,
  type ComplianceDocuments,
  type ComplianceSubmission,
  type ComplianceTextField,
  type ComplianceTextFields,
} from "../../../../lib/compliance";
import TiptapEditor, { isEmptyHtml } from "../../../../../components/editor/TiptapEditor";
import { useProductRequests } from "../../../distributor/useProductRequests";

const SUPPLIER_NAME = "Alex Supplier";

function FieldCheckboxes({
  required,
  isPublic,
  onRequiredChange,
  onPublicChange,
}: {
  required: boolean;
  isPublic: boolean;
  onRequiredChange: (checked: boolean) => void;
  onPublicChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-text-secondary">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => onRequiredChange(event.target.checked)}
          className="size-3.5 rounded border-border-subtle text-brand-600 focus:ring-focus-ring"
        />
        Required
      </label>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-text-secondary">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => onPublicChange(event.target.checked)}
          className="size-3.5 rounded border-border-subtle text-brand-600 focus:ring-focus-ring"
        />
        Public
      </label>
    </div>
  );
}

export default function SupplierProductCompliancePage() {
  const params = useParams();
  const router = useRouter();
  const requestId = typeof params.id === "string" ? params.id : "";

  const { ready, requests, submitCompliance, getComplianceSubmission } =
    useProductRequests();

  const request = requests.find((item) => item.id === requestId);

  const [values, setValues] = useState<ComplianceSubmission>(
    emptyComplianceSubmission(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    const saved = getComplianceSubmission(requestId);
    if (saved) setValues(normalizeComplianceSubmission(saved));
  }, [requestId, getComplianceSubmission]);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
        Loading…
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 text-center">
        <p className="text-[15px] font-medium text-text-primary">
          Product request not found
        </p>
        <Link
          href="/supplier?section=products"
          className="mt-4 text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          Back to product requests
        </Link>
      </div>
    );
  }

  if (request.submitted) {
    return (
      <div className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/supplier?section=products"
            className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
          >
            ← Back to product requests
          </Link>
          <div className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-6 text-center">
            <p className="text-[15px] font-medium text-text-primary">
              Documents already submitted
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              Compliance documents for {request.productName} were submitted to{" "}
              {request.distributorName}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function updateDocument(
    key: keyof ComplianceDocuments,
    patch: Partial<ComplianceDocumentField>,
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateText(
    key: keyof ComplianceTextFields,
    patch: Partial<ComplianceTextField>,
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    for (const { key, label } of DOCUMENT_FIELD_CONFIG) {
      const field = values[key];
      if (field.required && !field.fileName.trim()) {
        next[key] = `${label} is required`;
      }
    }

    for (const { key, label } of TEXT_FIELD_CONFIG) {
      const field = values[key];
      if (field.required && isEmptyHtml(field.value)) {
        next[key] = `${label} is required`;
      }
    }

    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    submitCompliance(requestId, values, SUPPLIER_NAME);
    router.push("/supplier?section=products");
  }

  return (
    <div className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/supplier?section=products"
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

        <form className="mt-8" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="text-[15px] font-medium text-text-primary">
                Documents
              </h2>
              <div className="mt-4 space-y-4">
                {DOCUMENT_FIELD_CONFIG.map(({ key, label, accept }) => {
                  const field = values[key];
                  const invalid = errors[key];
                  return (
                    <div
                      key={key}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label
                          htmlFor={`file-${key}`}
                          className="text-[13px] font-medium text-text-primary"
                        >
                          {label}
                        </label>
                        <FieldCheckboxes
                          required={field.required}
                          isPublic={field.isPublic}
                          onRequiredChange={(checked) =>
                            updateDocument(key, { required: checked })
                          }
                          onPublicChange={(checked) =>
                            updateDocument(key, { isPublic: checked })
                          }
                        />
                      </div>
                      <input
                        id={`file-${key}`}
                        type="file"
                        accept={accept}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          updateDocument(key, { fileName: file?.name ?? "" });
                        }}
                        className="mt-2 block w-full text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                      />
                      {field.fileName ? (
                        <p className="mt-1 truncate text-[11px] text-text-muted">
                          {field.fileName}
                        </p>
                      ) : null}
                      {invalid ? (
                        <p
                          role="alert"
                          className="mt-2 text-[12px] text-danger-500"
                        >
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
                {TEXT_FIELD_CONFIG.map(({ key, label }) => {
                  const field = values[key];
                  const invalid = errors[key];
                  return (
                    <div
                      key={key}
                      className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label
                          htmlFor={key}
                          className="text-[13px] font-medium text-text-primary"
                        >
                          {label}
                        </label>
                        <FieldCheckboxes
                          required={field.required}
                          isPublic={field.isPublic}
                          onRequiredChange={(checked) =>
                            updateText(key, { required: checked })
                          }
                          onPublicChange={(checked) =>
                            updateText(key, { isPublic: checked })
                          }
                        />
                      </div>
                      <TiptapEditor
                        id={key}
                        value={field.value}
                        invalid={Boolean(invalid)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        onChange={(html) => updateText(key, { value: html })}
                      />
                      {invalid ? (
                        <p
                          role="alert"
                          className="mt-1.5 text-[12px] text-danger-500"
                        >
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
    </div>
  );
}
