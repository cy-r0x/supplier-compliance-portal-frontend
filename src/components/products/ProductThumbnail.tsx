"use client";

import { useEffect, useState } from "react";

export const FALLBACK_PRODUCT_IMAGE = "/Images/avatar.jpg";

type ProductThumbnailProps = {
  src: string | null | undefined;
  size?: number;
  fit?: "contain" | "cover";
  className?: string;
};

export default function ProductThumbnail({
  src,
  size = 48,
  fit = "contain",
  className = "",
}: ProductThumbnailProps) {
  const initialSrc = src?.trim() || FALLBACK_PRODUCT_IMAGE;
  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(src?.trim() || FALLBACK_PRODUCT_IMAGE);
  }, [src]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[10px] border border-border-subtle bg-bg-elevated ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (imgSrc !== FALLBACK_PRODUCT_IMAGE) {
            setImgSrc(FALLBACK_PRODUCT_IMAGE);
          }
        }}
        className={`size-full object-center ${
          fit === "cover" ? "object-cover" : "object-contain"
        }`}
      />
    </div>
  );
}
