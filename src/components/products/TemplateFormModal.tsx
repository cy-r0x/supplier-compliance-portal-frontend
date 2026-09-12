"use client";

import { FormEvent, useEffect, useState } from "react";
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

export function TemplateFormModal({
  open,
  mode,
  templateId,
  onClose,
  onSaved,
}: TemplateFormModalProps) {
  const [name, setName] = useState("");
  const [documents, setDocuments] = useState<DocumentFormRow[]>(createEmptyDocumentRows);
  const [textFields, setTextFields] = useState<TextFormRow[]>(createEmptyTextRows);
  const [error, setError] = useState<string | null>(null);
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

  function requirementsKey(
    docs: DocumentFormRow[],
    fields: TextFormRow[],
  ): string {
    return JSON.stringify(templatePayloadFromRows(docs, fields));
  }

  useEffect(() => {
    if (!open) return;

    setError(null);
    setSubmitting(false);
    setImpactOpen(false);
    setImpact(null);
    setPendingAction(null);
    setInitialRequirementsKey(null);

    if (mode === "create") {
      setName("");
      setDocuments(createEmptyDocumentRows());
      setTextFields(createEmptyTextRows());
      setLoading(false);
      return;
    }

    if (!templateId) return;

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
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load template");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, templateId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting && !impactOpen) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting, impactOpen]);

  if (!open) return null;

  async function persist(action?: RelatedProductsAction) {
    setSubmitting(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (mode === "create") {
      await persist();
      return;
    }

    if (!templateId) return;

    const requirementsChanged =
      initialRequirementsKey !== null &&
      requirementsKey(documents, textFields) !== initialRequirementsKey;

    // Name-only edits don't affect product compliance — skip the impact popup.
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
      setError(err instanceof Error ? err.message : "Failed to check related products");
    } finally {
      setImpactLoading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4 py-6"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submitting && !impactOpen) {
            onClose();
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Create requirement template" : "Edit requirement template"}
          className="flex max-h-[min(90vh,800px)] w-full max-w-3xl flex-col overflow-hidden rounded-[12px] border border-border-subtle bg-bg-elevated shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">
                {mode === "create" ? "Create template" : "Edit template"}
              </h2>
              <p className="mt-0.5 text-[12px] text-text-secondary">
                {mode === "create"
                  ? "Name the template and set required/optional and public/private for each item."
                  : "Changes apply to every product using this template as the requirement source."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-[7px] px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary disabled:opacity-60"
            >
              Close
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-[13px] text-text-secondary">
              Loading template…
            </div>
          ) : (
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <label className="block text-[12px] font-medium text-text-primary">
                  Template name <span className="text-brand-600">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25"
                  placeholder="e.g. Default EU compliance"
                  autoFocus
                />

                <section className="mt-6">
                  <h3 className="text-[14px] font-medium text-text-primary">
                    Documents
                  </h3>
                  <div className="mt-3 space-y-3">
                    {documents.map((row) => (
                      <div
                        key={row.key}
                        className="flex flex-col gap-3 rounded-[10px] border border-border-subtle bg-bg-app px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="text-[13px] font-medium text-text-primary">
                          {row.label}
                        </p>
                        <RequirementToggles
                          required={row.required}
                          isPublic={row.isPublic}
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
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 pb-2">
                  <h3 className="text-[14px] font-medium text-text-primary">
                    Fields
                  </h3>
                  <div className="mt-3 space-y-3">
                    {textFields.map((row) => (
                      <div
                        key={row.key}
                        className="flex flex-col gap-3 rounded-[10px] border border-border-subtle bg-bg-app px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="text-[13px] font-medium text-text-primary">
                          {row.label}
                        </p>
                        <RequirementToggles
                          required={row.required}
                          isPublic={row.isPublic}
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
                      </div>
                    ))}
                  </div>
                </section>

                {error ? (
                  <p role="alert" className="mt-4 text-[13px] text-danger-500">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-border-subtle bg-bg-elevated px-5 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting || impactLoading}
                  className="h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary hover:bg-bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || impactLoading || loading}
                  className="h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse hover:bg-brand-600 disabled:opacity-60"
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
            </form>
          )}
        </div>
      </div>

      {impactOpen && impact ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-text-primary/50 px-4 py-6"
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
              className="text-[16px] font-semibold text-text-primary"
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
              <label className="flex cursor-pointer gap-3 rounded-[10px] border border-border-subtle p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
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
              <label className="flex cursor-pointer gap-3 rounded-[10px] border border-border-subtle p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
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
                    <span className="truncate text-text-primary">{product.name}</span>
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
                className="h-10 rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary hover:bg-bg-muted disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting || !pendingAction}
                onClick={() => void persist(pendingAction ?? undefined)}
                className="h-10 rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse hover:bg-brand-600 disabled:opacity-60"
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
