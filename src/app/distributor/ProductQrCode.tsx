"use client";

import { useId, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { ProductRequest } from "./types";

type ProductQrCodeProps = {
  request: ProductRequest;
};

function buildQrPayload(request: ProductRequest) {
  return JSON.stringify({
    id: request.id,
    product: request.productName,
    supplier: request.supplierName,
    status: request.status,
    requestedAt: request.requestedAt,
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function ProductQrCode({ request }: ProductQrCodeProps) {
  const canvasId = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const payload = buildQrPayload(request);

  function handleDownload() {
    const canvas =
      canvasRef.current ??
      (document.getElementById(canvasId) as HTMLCanvasElement | null);
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-${slugify(request.productName) || request.id}.png`;
    link.click();
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="rounded-[6px] border border-border-subtle bg-bg-elevated p-1">
        <QRCodeCanvas
          id={canvasId}
          ref={canvasRef}
          value={payload}
          size={40}
          level="M"
          marginSize={1}
          title={`QR code for ${request.productName}`}
        />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        aria-label={`Download QR code for ${request.productName}`}
        title="Download QR"
        className="cursor-pointer rounded-[7px] px-2 py-1.5 text-[11px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        Download
      </button>
    </div>
  );
}
