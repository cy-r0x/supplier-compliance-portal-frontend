"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toProxiedMediaUrl } from "@/lib/media-url";

export type PdfPreviewPayload = {
  label: string;
  fileName: string;
  url: string;
  /** Revoke blob URLs when the modal closes */
  revokeOnClose?: boolean;
};

export function isPdfFileName(fileName: string) {
  return /\.pdf$/i.test(fileName);
}

export function isImageFileName(fileName: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);
}

export function isPdfFile(file: File, fileName?: string) {
  if (file.type === "application/pdf") return true;
  return isPdfFileName(fileName ?? file.name);
}

export function isImageFile(file: File, fileName?: string) {
  if (file.type.startsWith("image/")) return true;
  return isImageFileName(fileName ?? file.name);
}

export function isPreviewableFileName(fileName: string) {
  return isPdfFileName(fileName) || isImageFileName(fileName);
}

export function PdfPreviewModal({
  preview,
  onClose,
}: {
  preview: PdfPreviewPayload;
  onClose: () => void;
}) {
  const isImage = isImageFileName(preview.fileName);
  const src =
    toProxiedMediaUrl(preview.url) || preview.url;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
        aria-label={`Preview ${preview.fileName}`}
        className="flex h-[min(90vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] border border-border-subtle bg-bg-elevated shadow-sm"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-text-primary">
              {preview.label}
            </p>
            <p className="truncate text-[12px] text-text-muted">{preview.fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-[7px] px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary"
          >
            Close
          </button>
        </div>
        {isImage ? (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-bg-muted p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={preview.fileName}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <iframe
            src={src}
            title={`PDF preview: ${preview.fileName}`}
            className="min-h-0 flex-1 w-full bg-bg-muted"
          />
        )}
      </div>
    </div>
  );
}

function revokeIfNeeded(preview: PdfPreviewPayload | null) {
  if (preview?.revokeOnClose && preview.url.startsWith("blob:")) {
    URL.revokeObjectURL(preview.url);
  }
}

export function usePdfPreview() {
  const [preview, setPreview] = useState<PdfPreviewPayload | null>(null);

  useEffect(() => {
    return () => revokeIfNeeded(preview);
  }, [preview]);

  const close = useCallback(() => {
    setPreview((prev) => {
      revokeIfNeeded(prev);
      return null;
    });
  }, []);

  const openFromFile = useCallback((label: string, file: File) => {
    setPreview((prev) => {
      revokeIfNeeded(prev);
      return {
        label,
        fileName: file.name,
        url: URL.createObjectURL(file),
        revokeOnClose: true,
      };
    });
  }, []);

  const openFromUrl = useCallback((label: string, fileName: string, url: string) => {
    setPreview((prev) => {
      revokeIfNeeded(prev);
      return { label, fileName, url, revokeOnClose: false };
    });
  }, []);

  return { preview, close, openFromFile, openFromUrl };
}

const previewButtonClass =
  "shrink-0 cursor-pointer rounded-[7px] border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[11px] font-medium text-brand-600 transition-colors duration-150 hover:border-brand-100 hover:bg-brand-100/50 hover:text-brand-700";

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

export function DocumentPreviewButton({
  fileName,
  selectedFile,
  previewUrl,
  onPreview,
}: {
  fileName: string;
  selectedFile?: File;
  /** Remote URL for distributor-prefilled documents (no local File yet) */
  previewUrl?: string;
  onPreview: () => void;
}) {
  const objectUrl = useObjectUrl(
    selectedFile && isImageFile(selectedFile, fileName) ? selectedFile : undefined,
  );

  const thumbSrc = useMemo(() => {
    if (objectUrl) return objectUrl;
    if (previewUrl && isImageFileName(fileName)) {
      return toProxiedMediaUrl(previewUrl) || previewUrl;
    }
    return null;
  }, [objectUrl, previewUrl, fileName]);

  if (!fileName) return null;

  const canPreview =
    (selectedFile &&
      (isPdfFile(selectedFile, fileName) || isImageFile(selectedFile, fileName))) ||
    Boolean(previewUrl && isPreviewableFileName(fileName));

  return (
    <div className="mt-2 space-y-2">
      {thumbSrc ? (
        <button
          type="button"
          onClick={onPreview}
          className="block overflow-hidden rounded-[10px] border border-border-subtle bg-bg-muted"
          aria-label={`Preview ${fileName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt=""
            className="h-28 w-full max-w-xs object-contain"
          />
        </button>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[11px] text-text-muted">
          {fileName}
        </p>
        {canPreview ? (
          <button type="button" onClick={onPreview} className={previewButtonClass}>
            Preview
          </button>
        ) : selectedFile ? (
          <span className="text-[10px] text-text-muted">
            Preview available for PDF and image files
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function PublicDocumentPreviewButton({
  fileName,
  previewUrl,
  onPreview,
}: {
  fileName: string;
  previewUrl?: string;
  onPreview: () => void;
}) {
  if (!previewUrl || !isPreviewableFileName(fileName)) return null;

  return (
    <button type="button" onClick={onPreview} className={previewButtonClass}>
      Preview
    </button>
  );
}
