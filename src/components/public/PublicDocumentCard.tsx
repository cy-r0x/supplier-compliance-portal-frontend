"use client";

import {
  PdfPreviewModal,
  PublicDocumentPreviewButton,
  isPdfFileName,
  usePdfPreview,
} from "../../../components/documents/pdf-preview";
import type { PublicProductDocument } from "@/lib/public-product";

function DocumentIcon({ fileName }: { fileName: string }) {
  const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(fileName);
  const isPdf = isPdfFileName(fileName);

  if (isImage) {
    return (
      <svg aria-hidden className="size-5 text-brand-600" fill="none" viewBox="0 0 24 24">
        <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="4" />
        <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
        <path d="m3 16 5.5-5.5L14 16" stroke="currentColor" strokeWidth="1.7" />
        <path d="M14 13l3-3 4 4v6H3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (isPdf) {
    return (
      <svg aria-hidden className="size-5 text-brand-600" fill="none" viewBox="0 0 24 24">
        <path
          d="M8 4h7l3 3v13H8V4Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M15 4v3h3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M10 13h4M10 16h4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="size-5 text-brand-600" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 4h7l3 3v13H8V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M15 4v3h3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function PublicDocumentCard({ document }: { document: PublicProductDocument }) {
  const { preview, close, openFromUrl } = usePdfPreview();
  const canDownload = Boolean(document.downloadUrl);
  const canPreview =
    isPdfFileName(document.fileName) && Boolean(document.downloadUrl);

  return (
    <>
      <div className="flex items-start gap-3 rounded-[10px] border border-border-subtle bg-bg-elevated p-4 transition-shadow duration-150 hover:shadow-sm">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-brand-100">
          <DocumentIcon fileName={document.fileName} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text-primary">{document.label}</p>
          <p className="mt-0.5 truncate text-[12px] text-text-muted">{document.fileName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {canDownload ? (
              <a
                href={document.downloadUrl}
                download
                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700"
              >
                Download
                <svg aria-hidden className="size-3.5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 4v10m0 0 4-4m-4 4-4-4M4 18h16"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : (
              <p className="text-[11px] text-text-muted">Download available soon</p>
            )}
            {canPreview ? (
              <PublicDocumentPreviewButton
                fileName={document.fileName}
                previewUrl={document.downloadUrl}
                onPreview={() =>
                  openFromUrl(
                    document.label,
                    document.fileName,
                    document.downloadUrl!,
                  )
                }
              />
            ) : null}
          </div>
        </div>
      </div>

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </>
  );
}
