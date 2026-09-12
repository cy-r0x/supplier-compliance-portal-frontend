"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  HiOutlineDocumentDuplicate,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineXMark,
} from "react-icons/hi2";
import { TemplateFormModal } from "@/components/products/TemplateFormModal";
import { Skeleton, SkeletonRows } from "@/components/loading/Skeleton";
import {
  getTemplate,
  listTemplates,
  type ApiTemplateDetail,
  type ApiTemplateListItem,
} from "@/lib/api/templates-api";
import { formatDate } from "@/app/admin/types";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  TEST_REPORT: "Test Report",
  DECLARATION_OF_CONFORMITY: "Declaration of Conformity",
  MANUAL_OR_INSTRUCTIONS: "Manual or Instructions",
  CERTIFICATE: "Certificate",
  PRODUCT_IMAGE: "Product Image",
  SAFETY_IMAGE: "Safety Image",
  REGULATORY_DOCUMENT: "Regulatory Document",
  OTHER: "Other",
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  SAFETY_NOTICE_TEXT: "Safety notice text",
  WARNING_TEXT: "Warning text",
  AGE_GRADING: "Age grading",
  MATERIAL_INFORMATION: "Material information",
  USAGE_RESTRICTIONS: "Usage restrictions",
  SAFETY_INSTRUCTIONS: "Safety instructions",
  ADDITIONAL_NOTES: "Additional notes",
  OTHER: "Other",
};

function documentLabel(type: string, label: string | null, customKey: string) {
  if (type === "OTHER") return label?.trim() || customKey || "Other";
  return DOCUMENT_TYPE_LABELS[type] ?? type;
}

function fieldLabel(fieldType: string, label: string | null, customKey: string) {
  if (fieldType === "OTHER") return label?.trim() || customKey || "Other";
  return FIELD_TYPE_LABELS[fieldType] ?? fieldType;
}

function LevelBadge({ level }: { level: "REQUIRED" | "OPTIONAL" }) {
  return (
    <span
      className={`rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium ${
        level === "REQUIRED"
          ? "bg-brand-100 text-brand-700"
          : "bg-bg-inset text-text-secondary"
      }`}
    >
      {level === "REQUIRED" ? "Required" : "Optional"}
    </span>
  );
}

function VisibilityBadge({
  visibility,
}: {
  visibility: "PUBLIC" | "PRIVATE";
}) {
  return (
    <span className="rounded-[6px] bg-bg-inset px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
      {visibility === "PUBLIC" ? "Public" : "Private"}
    </span>
  );
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-border-subtle bg-bg-elevated px-5 py-10 text-center">
      <p className="text-[14px] font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

function TemplateDetailDrawer({
  template,
  loading,
  error,
  onClose,
}: {
  template: ApiTemplateDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-text-primary/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Template details"
        className="flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-bg-elevated shadow-sm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
              Template
            </p>
            <h2 className="mt-0.5 truncate text-[16px] font-semibold text-text-primary">
              {template?.name ?? (loading ? "Loading…" : "Template")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <SkeletonRows count={5} height="h-10" />
            </div>
          ) : error ? (
            <p className="text-[13px] text-danger-500">{error}</p>
          ) : template ? (
            <div className="space-y-6">
              <section>
                <h3 className="text-[13px] font-medium text-text-primary">
                  Documents
                  <span className="ml-2 text-[12px] font-normal text-text-muted">
                    {template.documents.length}
                  </span>
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {template.documents.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-[9px] border border-border-subtle px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-[13px] text-text-primary">
                        {documentLabel(row.type, row.label, row.customKey)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <LevelBadge level={row.level} />
                        <VisibilityBadge visibility={row.visibility} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-[13px] font-medium text-text-primary">
                  Text fields
                  <span className="ml-2 text-[12px] font-normal text-text-muted">
                    {template.fields.length}
                  </span>
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {template.fields.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-[9px] border border-border-subtle px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-[13px] text-text-primary">
                        {fieldLabel(row.fieldType, row.label, row.customKey)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <LevelBadge level={row.level} />
                        <VisibilityBadge visibility={row.visibility} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <p className="text-[12px] text-text-muted">
                Templates define the ask matrix for product requests. Level and
                visibility stay locked after a request uses the template.
              </p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function TemplatesSection() {
  const [templates, setTemplates] = useState<ApiTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiTemplateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listTemplates();
      setTemplates(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!viewId) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    getTemplate(viewId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailError(
            err instanceof Error ? err.message : "Failed to load template",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((tpl) => tpl.name.toLowerCase().includes(q));
  }, [templates, search]);

  return (
    <div>
      <PageHeader
        title="Templates"
        description={`${templates.length} requirement template${templates.length === 1 ? "" : "s"}`}
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <HiOutlinePlus className="h-4 w-4" aria-hidden />
            Create template
          </button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-[9px] border border-danger-500/30 bg-danger-50 px-3 py-2 text-[13px] text-danger-500">
          {error}{" "}
          <button
            type="button"
            onClick={() => void loadTemplates()}
            className="cursor-pointer font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="mb-4">
        <label className="sr-only" htmlFor="template-search">
          Search templates
        </label>
        <input
          id="template-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
          className="h-10 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-muted focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25 sm:max-w-xs"
        />
      </div>

      {loading ? (
        <div
          className="rounded-[12px] border border-border-subtle bg-bg-elevated p-4"
          role="status"
          aria-busy="true"
        >
          <SkeletonRows count={4} height="h-12" />
          <span className="sr-only">Loading templates</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            templates.length === 0 ? "No templates yet" : "No matching templates"
          }
          description={
            templates.length === 0
              ? "Create a requirement template to reuse across product requests."
              : "Try a different search."
          }
          action={
            templates.length === 0 ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="h-9 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600"
              >
                Create template
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-border-subtle bg-bg-elevated">
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-border-subtle bg-bg-muted/50 text-[12px] text-text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Products</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((tpl) => (
                <tr key={tpl.id} className="h-12">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-brand-100 text-brand-700"
                        aria-hidden
                      >
                        <HiOutlineDocumentDuplicate className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-text-primary">
                        {tpl.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {tpl.productRequestCount ?? 0}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {formatDate(tpl.updatedAt)}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">
                    {formatDate(tpl.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewId(tpl.id)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <HiOutlineEye className="h-4 w-4" aria-hidden />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(tpl.id)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TemplateFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={(created) => {
          setTemplates((prev) => {
            if (prev.some((item) => item.id === created.id)) return prev;
            const now = new Date().toISOString();
            return [
              {
                id: created.id,
                name: created.name,
                createdAt: now,
                updatedAt: now,
                productRequestCount: 0,
              },
              ...prev,
            ];
          });
          setViewId(created.id);
        }}
      />

      <TemplateFormModal
        open={Boolean(editId)}
        mode="edit"
        templateId={editId}
        onClose={() => setEditId(null)}
        onSaved={(updated) => {
          setTemplates((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    name: updated.name,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          );
          void loadTemplates();
          if (viewId === updated.id) {
            setViewId(null);
            setTimeout(() => setViewId(updated.id), 0);
          }
        }}
      />

      {viewId ? (
        <TemplateDetailDrawer
          template={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setViewId(null)}
        />
      ) : null}
    </div>
  );
}
