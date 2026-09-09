"use client";

import { useEffect, useState } from "react";
import { toProxiedMediaUrl } from "@/lib/media-url";

export const FALLBACK_AVATAR = "/Images/avatar.jpg";

type UserAvatarProps = {
  src: string | null | undefined;
  size?: number;
  className?: string;
};

export default function UserAvatar({
  src,
  size = 32,
  className = "",
}: UserAvatarProps) {
  const initialSrc = toProxiedMediaUrl(src?.trim()) || FALLBACK_AVATAR;
  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(toProxiedMediaUrl(src?.trim()) || FALLBACK_AVATAR);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover outline outline-border-subtle ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        if (imgSrc !== FALLBACK_AVATAR) {
          setImgSrc(FALLBACK_AVATAR);
        }
      }}
    />
  );
}
