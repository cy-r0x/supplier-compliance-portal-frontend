"use client";

import {
  PdfPreviewModal,
  PublicDocumentPreviewButton,
  isPdfFileName,
  usePdfPreview,
} from "../../../components/documents/pdf-preview";
import { HiOutlineArrowDownTray, HiOutlineDocumentText } from "react-icons/hi2";
import type { PublicProductDocument } from "@/lib/public-product";

function fileKindLabel(fileName: string): string {
  if (isPdfFileName(fileName)) return "PDF document";
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(fileName)) return "Image";
  return "File";
}

export function PublicDocumentRow({ document }: { document: PublicProductDocument }) {
  const { preview, close, openFromUrl } = usePdfPreview();
  const canDownload = Boolean(document.downloadUrl);
  const canPreview =
    isPdfFileName(document.fileName) && Boolean(document.downloadUrl);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-100 text-brand-700">
          <HiOutlineDocumentText aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-text-primary">
            {document.label}
          </p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            {fileKindLabel(document.fileName)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
          {canDownload ? (
            <a
              href={document.downloadUrl}
              download
              aria-label={`Download ${document.label}`}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-brand-600 transition-colors duration-150 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <HiOutlineArrowDownTray aria-hidden="true" className="size-5" />
            </a>
          ) : null}
        </div>
      </div>

      {preview ? <PdfPreviewModal preview={preview} onClose={close} /> : null}
    </>
  );
}
