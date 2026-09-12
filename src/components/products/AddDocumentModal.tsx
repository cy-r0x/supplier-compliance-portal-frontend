"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ApiDocumentRequirement } from "@/lib/products/map-product";
import { RequirementMeta } from "@/components/products/RequirementMeta";

type AddDocumentModalProps = {
  open: boolean;
  options: ApiDocumentRequirement[];
  acceptByType: Record<string, string>;
  labelFor: (doc: ApiDocumentRequirement) => string;
  initialRequirementId?: string;
  onClose: () => void;
  onAdd: (requirementId: string, files: File[]) => void;
};

export function AddDocumentModal({
  open,
  options,
  acceptByType,
  labelFor,
  initialRequirementId,
  onClose,
  onAdd,
}: AddDocumentModalProps) {
  const [requirementId, setRequirementId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const preferred =
      (initialRequirementId &&
        options.find((row) => row.id === initialRequirementId)?.id) ||
      options[0]?.id ||
      "";
    setRequirementId(preferred);
    setFiles([]);
    setError(null);
  }, [open, options, initialRequirementId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const selected = useMemo(
    () => options.find((row) => row.id === requirementId) ?? null,
    [options, requirementId],
  );

  if (!open) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!requirementId) {
      setError("Select a document type");
      return;
    }
    if (files.length === 0) {
      setError("Choose at least one file to upload");
      return;
    }
    onAdd(requirementId, files);
    onClose();
  }

  const accept =
    (selected && acceptByType[selected.type]) ||
    ".pdf,.doc,.docx,.png,.jpg,.jpeg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-document-title"
        className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated shadow-sm"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div>
            <h2
              id="add-document-title"
              className="text-[16px] font-semibold text-text-primary"
            >
              Add document
            </h2>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              Choose the document type, then upload one or more files.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[7px] px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          >
            Close
          </button>
        </div>

        <form className="space-y-4 px-5 py-4" onSubmit={handleSubmit} noValidate>
          {options.length === 0 ? (
            <p className="text-[13px] text-text-secondary">
              No document types are available for this request.
            </p>
          ) : (
            <>
              <div>
                <label
                  htmlFor="add-document-type"
                  className="block text-[12px] font-medium text-text-primary"
                >
                  Document type <span className="text-brand-600">*</span>
                </label>
                <select
                  id="add-document-type"
                  value={requirementId}
                  onChange={(event) => {
                    setRequirementId(event.target.value);
                    setFiles([]);
                    setError(null);
                  }}
                  className="mt-1.5 h-11 w-full rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-[13px] text-text-primary outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25"
                >
                  {options.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {labelFor(doc)}
                      {doc.level === "REQUIRED" ? " (Required)" : " (Optional)"}
                    </option>
                  ))}
                </select>
                {selected ? (
                  <div className="mt-2">
                    <RequirementMeta
                      level={selected.level}
                      visibility={selected.visibility}
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="add-document-file"
                  className="block text-[12px] font-medium text-text-primary"
                >
                  Files <span className="text-brand-600">*</span>
                </label>
                <input
                  id="add-document-file"
                  key={requirementId}
                  type="file"
                  multiple
                  accept={accept}
                  onChange={(event) => {
                    setFiles(Array.from(event.target.files ?? []));
                    setError(null);
                  }}
                  className="mt-1.5 block w-full text-[12px] text-text-secondary file:mr-3 file:cursor-pointer file:rounded-[7px] file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand-700"
                />
                {files.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-[12px] text-text-secondary">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-[12px] text-text-muted">
                    You can select multiple files for this type.
                  </p>
                )}
              </div>
            </>
          )}

          {error ? (
            <p role="alert" className="text-[13px] text-danger-500">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary hover:bg-bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={options.length === 0}
              className="h-10 rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add document{files.length > 1 ? "s" : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
