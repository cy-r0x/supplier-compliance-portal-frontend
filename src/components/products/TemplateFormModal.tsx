"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { HiOutlineDocumentText, HiOutlineXMark } from "react-icons/hi2";
import { RequirementToggles } from "@/components/products/RequirementToggles";
import {
  createEmptyDocumentRows,
  createEmptyTextRows,
  rowsFromTemplate,
  templatePayloadFromRows,
  type DocumentFormRow,
  type TextFormRow,
} from "@/lib/products/compliance-form";
import {
  createTemplate,
  getTemplate,
  getTemplateImpact,
  updateTemplate,
  type RelatedProductsAction,
  type TemplateImpact,
} from "@/lib/api/templates-api";

type TemplateFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  templateId?: string | null;
  onClose: () => void;
  onSaved: (template: { id: string; name: string }) => void;
};

function countRequired(rows: Array<{ required: boolean }>): number {
  return rows.filter((row) => row.required).length;
}

function RequirementRow({
  label,
  required,
  isPublic,
  disabled,
  onRequiredChange,
  onPublicChange,
}: {
  label: string;
  required: boolean;
  isPublic: boolean;
  disabled?: boolean;
  onRequiredChange: (checked: boolean) => void;
  onPublicChange: (checked: boolean) => void;
}) {
  return (
    <li className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex items-start gap-2.5">
        <span
          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
            required ? "bg-brand-500" : "bg-border-subtle"
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-text-primary">{label}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {required ? "Required from supplier" : "Optional"}
            {" · "}
            {isPublic ? "Shown on public page" : "Internal only"}
          </p>
        </div>
      </div>
      <RequirementToggles
        required={required}
        isPublic={isPublic}
        disabled={disabled}
        onRequiredChange={onRequiredChange}
        onPublicChange={onPublicChange}
      />
    </li>
  );
}

export function TemplateFormModal({
  open,
  mode,
  templateId,
  onClose,
  onSaved,
}: TemplateFormModalProps) {
  const titleId = useId();
  const nameFieldId = useId();
  const nameErrorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("");
  const [documents, setDocuments] =
    useState<DocumentFormRow[]>(createEmptyDocumentRows);
  const [textFields, setTextFields] =
    useState<TextFormRow[]>(createEmptyTextRows);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [impact, setImpact] = useState<TemplateImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<RelatedProductsAction | null>(null);
  const [initialRequirementsKey, setInitialRequirementsKey] = useState<
    string | null
  >(null);

  const requiredDocs = useMemo(() => countRequired(documents), [documents]);
  const requiredFields = useMemo(() => countRequired(textFields), [textFields]);

  function requirementsKey(
    docs: DocumentFormRow[],
    fields: TextFormRow[],
  ): string {
    return JSON.stringify(templatePayloadFromRows(docs, fields));
  }

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    setError(null);
    setNameError(null);
    setSubmitting(false);
    setImpactOpen(false);
    setImpact(null);
    setPendingAction(null);
    setInitialRequirementsKey(null);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (mode === "create") {
      setName("");
      setDocuments(createEmptyDocumentRows());
      setTextFields(createEmptyTextRows());
      setLoading(false);
      window.setTimeout(() => nameInputRef.current?.focus(), 0);
      return () => {
        document.body.style.overflow = previousOverflow;
        previouslyFocusedRef.current?.focus?.();
      };
    }

    if (!templateId) {
      return () => {
        document.body.style.overflow = previousOverflow;
        previouslyFocusedRef.current?.focus?.();
      };
    }

    let cancelled = false;
    setLoading(true);
    getTemplate(templateId)
      .then((detail) => {
        if (cancelled) return;
        setName(detail.name);
        const rows = rowsFromTemplate(detail);
        setDocuments(rows.documents);
        setTextFields(rows.textFields);
        setInitialRequirementsKey(
          requirementsKey(rows.documents, rows.textFields),
        );
        window.setTimeout(() => nameInputRef.current?.focus(), 0);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load template",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, mode, templateId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting && !impactOpen) {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting, impactOpen]);

  if (!open) return null;

  async function persist(action?: RelatedProductsAction) {
    setSubmitting(true);
    setError(null);
    setNameError(null);
    try {
      const payload = templatePayloadFromRows(documents, textFields);
      if (mode === "create") {
        const created = await createTemplate({
          name: name.trim(),
          documents: payload.documents,
          fields: payload.fields,
        });
        onSaved({ id: created.id, name: created.name });
        onClose();
        return;
      }

      if (!templateId) {
        throw new Error("Template id is required");
      }

      const updated = await updateTemplate(templateId, {
        name: name.trim(),
        documents: payload.documents,
        fields: payload.fields,
        ...(action ? { relatedProductsAction: action } : {}),
      });
      onSaved({ id: updated.id, name: updated.name });
      setImpactOpen(false);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save template";
      setError(message);
      if (/name/i.test(message)) {
        setNameError(message);
        window.setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }, 0);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      const message = "Template name is required";
      setNameError(message);
      setError(message);
      window.setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }, 0);
      return;
    }

    setNameError(null);
    setError(null);

    if (mode === "create") {
      await persist();
      return;
    }

    if (!templateId) return;

    const requirementsChanged =
      initialRequirementsKey !== null &&
      requirementsKey(documents, textFields) !== initialRequirementsKey;

    if (!requirementsChanged) {
      await persist();
      return;
    }

    setImpactLoading(true);
    setError(null);
    try {
      const impactData = await getTemplateImpact(templateId);
      if (impactData.relatedProductCount > 0) {
        setImpact(impactData);
        setPendingAction("NOTIFY_AND_RESET");
        setImpactOpen(true);
        return;
      }
      await persist();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check related products",
      );
    } finally {
      setImpactLoading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-text-primary/40 px-0 py-0 sm:items-center sm:px-4 sm:py-6"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !submitting &&
            !impactOpen
          ) {
            onClose();
          }
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex max-h-[min(100dvh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[16px] border border-border-subtle bg-bg-elevated shadow-sm sm:max-h-[min(90vh,820px)] sm:rounded-[12px]"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-brand-100/70 text-brand-700">
                  <HiOutlineDocumentText className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="font-display text-[16px] font-semibold tracking-[-0.02em] text-text-primary"
                  >
                    {mode === "create" ? "Create template" : "Edit template"}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-text-secondary">
                    {mode === "create"
                      ? "Name the template, then set required and visibility for each item."
                      : "Changes apply to every product using this template."}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
              className="cursor-pointer rounded-[8px] p-2 text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineXMark className="size-5" aria-hidden />
            </button>
          </div>

          {loading ? (
            <div
              className="px-5 py-14 text-center text-[13px] text-text-secondary"
              role="status"
              aria-live="polite"
            >
              Loading template…
            </div>
          ) : (
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 border-b border-border-subtle bg-bg-elevated px-5 py-4">
                  <div>
                    <label
                      htmlFor={nameFieldId}
                      className="block text-[12px] font-medium text-text-primary"
                    >
                      Template name{" "}
                      <span className="text-brand-600" aria-hidden="true">
                        *
                      </span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id={nameFieldId}
                      value={name}
                      aria-invalid={nameError ? true : undefined}
                      aria-describedby={
                        nameError ? nameErrorId : undefined
                      }
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError(null);
                        if (error === "Template name is required") {
                          setError(null);
                        }
                      }}
                      className={`mt-1.5 h-11 w-full rounded-[9px] border bg-bg-app px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 focus:ring-2 ${
                        nameError
                          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                          : "border-border-subtle focus:border-focus-ring focus:ring-focus-ring/25"
                      }`}
                      placeholder="e.g. Default EU compliance"
                      autoComplete="off"
                    />
                    {nameError ? (
                      <p
                        id={nameErrorId}
                        role="alert"
                        className="mt-1.5 text-[12px] text-danger-500"
                      >
                        {nameError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-text-muted">
                        Used when assigning this template to product requests.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-5 px-5 py-5">
                  <section aria-labelledby="template-docs-heading">
                    <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h3
                          id="template-docs-heading"
                          className="text-[14px] font-medium text-text-primary"
                        >
                          Documents
                        </h3>
                        <p className="mt-0.5 text-[12px] text-text-muted">
                          Files suppliers upload for each product.
                        </p>
                      </div>
                      <p className="rounded-[7px] bg-bg-muted px-2 py-1 font-mono text-[11px] text-text-secondary">
                        {requiredDocs}/{documents.length} required
                      </p>
                    </div>
                    <ul className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-app">
                      {documents.map((row) => (
                        <RequirementRow
                          key={row.key}
                          label={row.label}
                          required={row.required}
                          isPublic={row.isPublic}
                          disabled={submitting}
                          onRequiredChange={(required) =>
                            setDocuments((prev) =>
                              prev.map((item) =>
                                item.key === row.key
                                  ? { ...item, required }
                                  : item,
                              ),
                            )
                          }
                          onPublicChange={(isPublic) =>
                            setDocuments((prev) =>
                              prev.map((item) =>
                                item.key === row.key
                                  ? { ...item, isPublic }
                                  : item,
                              ),
                            )
                          }
                        />
                      ))}
                    </ul>
                  </section>

                  <section aria-labelledby="template-fields-heading">
                    <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h3
                          id="template-fields-heading"
                          className="text-[14px] font-medium text-text-primary"
                        >
                          Fields
                        </h3>
                        <p className="mt-0.5 text-[12px] text-text-muted">
                          Text answers suppliers provide with the submission.
                        </p>
                      </div>
                      <p className="rounded-[7px] bg-bg-muted px-2 py-1 font-mono text-[11px] text-text-secondary">
                        {requiredFields}/{textFields.length} required
                      </p>
                    </div>
                    <ul className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-app">
                      {textFields.map((row) => (
                        <RequirementRow
                          key={row.key}
                          label={row.label}
                          required={row.required}
                          isPublic={row.isPublic}
                          disabled={submitting}
                          onRequiredChange={(required) =>
                            setTextFields((prev) =>
                              prev.map((item) =>
                                item.key === row.key
                                  ? { ...item, required }
                                  : item,
                              ),
                            )
                          }
                          onPublicChange={(isPublic) =>
                            setTextFields((prev) =>
                              prev.map((item) =>
                                item.key === row.key
                                  ? { ...item, isPublic }
                                  : item,
                              ),
                            )
                          }
                        />
                      ))}
                    </ul>
                  </section>
                </div>
              </div>

              <div className="shrink-0 border-t border-border-subtle bg-bg-elevated px-5 py-4">
                {error && error !== nameError ? (
                  <p role="alert" className="mb-3 text-[13px] text-danger-500">
                    {error}
                  </p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[12px] text-text-muted">
                    {requiredDocs} required document
                    {requiredDocs === 1 ? "" : "s"}
                    {" · "}
                    {requiredFields} required field
                    {requiredFields === 1 ? "" : "s"}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting || impactLoading}
                      className="h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || impactLoading || loading}
                      className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {impactLoading
                        ? "Checking…"
                        : submitting
                          ? "Saving…"
                          : mode === "create"
                            ? "Save template"
                            : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {impactOpen && impact ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/50 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setImpactOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-impact-title"
            className="w-full max-w-lg rounded-[12px] border border-border-subtle bg-bg-elevated p-5 shadow-sm"
          >
            <h3
              id="template-impact-title"
              className="font-display text-[16px] font-semibold tracking-[-0.02em] text-text-primary"
            >
              Related products
            </h3>
            <p className="mt-2 text-[13px] text-text-secondary">
              This template is used by{" "}
              <span className="font-medium text-text-primary">
                {impact.relatedProductCount}
              </span>{" "}
              non-rejected product
              {impact.relatedProductCount === 1 ? "" : "s"}
              {impact.resettableCount > 0
                ? ` (${impact.resettableCount} submitted/approved will return to pending if you notify)`
                : ""}
              . Choose what should happen:
            </p>

            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Related products action</legend>
              <label className="flex cursor-pointer gap-3 rounded-[10px] border border-border-subtle p-3 transition-colors duration-150 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input
                  type="radio"
                  name="related-products-action"
                  className="mt-1"
                  checked={pendingAction === "NOTIFY_AND_RESET"}
                  onChange={() => setPendingAction("NOTIFY_AND_RESET")}
                />
                <span>
                  <span className="block text-[13px] font-medium text-text-primary">
                    Update product status and notify suppliers
                  </span>
                  <span className="mt-0.5 block text-[12px] text-text-secondary">
                    Submitted/approved requests return to pending. Every related
                    supplier gets a requirements-updated notification.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-[10px] border border-border-subtle p-3 transition-colors duration-150 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input
                  type="radio"
                  name="related-products-action"
                  className="mt-1"
                  checked={pendingAction === "KEEP_AS_IS"}
                  onChange={() => setPendingAction("KEEP_AS_IS")}
                />
                <span>
                  <span className="block text-[13px] font-medium text-text-primary">
                    Keep everything as it is
                  </span>
                  <span className="mt-0.5 block text-[12px] text-text-secondary">
                    Only update the template. Product statuses stay unchanged and
                    no notifications are sent.
                  </span>
                </span>
              </label>
            </fieldset>

            {impact.products.length > 0 ? (
              <ul className="mt-4 max-h-36 overflow-y-auto rounded-[9px] border border-border-subtle bg-bg-app px-3 py-2 text-[12px] text-text-secondary">
                {impact.products.slice(0, 8).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-2 border-b border-border-subtle py-1.5 last:border-b-0"
                  >
                    <span className="truncate text-text-primary">
                      {product.name}
                    </span>
                    <span className="shrink-0">
                      {product.supplierName} · {product.status}
                    </span>
                  </li>
                ))}
                {impact.products.length > 8 ? (
                  <li className="py-1.5 text-text-muted">
                    +{impact.products.length - 8} more
                  </li>
                ) : null}
              </ul>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setImpactOpen(false)}
                className="h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || !pendingAction}
                onClick={() => void persist(pendingAction ?? undefined)}
                className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Confirm & save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** @deprecated Prefer TemplateFormModal — kept for existing create call sites */
export function CreateTemplateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (template: { id: string; name: string }) => void;
}) {
  return (
    <TemplateFormModal
      open={open}
      mode="create"
      onClose={onClose}
      onSaved={onCreated}
    />
  );
}
