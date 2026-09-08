"use client";

import { useId, useRef } from "react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { QRCodeCanvas } from "qrcode.react";
import type { ProductRequest } from "./types";

type ProductQrCodeProps = {
  request: ProductRequest;
};

const DISPLAY_SIZE = 40;
const RENDER_SIZE = 160;
const EXPORT_SIZE = 1024;

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
  const publicSlug = request.publicSlug ?? request.id;
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${publicSlug}`
      : `/p/${publicSlug}`;

  function handleDownload() {
    const canvas =
      canvasRef.current ??
      (document.getElementById(canvasId) as HTMLCanvasElement | null);
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, EXPORT_SIZE, EXPORT_SIZE);

    const link = document.createElement("a");
    link.href = exportCanvas.toDataURL("image/png");
    link.download = `qr-${slugify(request.productName) || request.id}.png`;
    link.click();
  }

  return (
    <div className="group relative shrink-0 rounded-[6px] border border-border-subtle bg-bg-elevated p-1">
      <QRCodeCanvas
        id={canvasId}
        ref={canvasRef}
        value={publicUrl}
        size={RENDER_SIZE}
        level="H"
        marginSize={2}
        title={`QR code for ${request.productName}`}
        className="block size-10"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleDownload();
        }}
        aria-label={`Download QR code for ${request.productName}`}
        title="Download QR code"
        className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-[5px] bg-text-primary/55 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <HiOutlineArrowDownTray
          aria-hidden="true"
          className="size-5 text-text-inverse drop-shadow-sm"
        />
      </button>
    </div>
  );
}
