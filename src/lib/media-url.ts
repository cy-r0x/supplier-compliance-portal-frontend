const DEFAULT_MINIO_ORIGINS = [
  "http://49.213.52.38:9000",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
] as const;

function configuredOrigins(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_MINIO_PUBLIC_ORIGINS?.split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return fromEnv?.length ? fromEnv : [...DEFAULT_MINIO_ORIGINS];
}

/**
 * Rewrites MinIO http:// URLs to same-origin /minio/... so HTTPS pages
 * avoid mixed-content blocks (Next rewrite proxies /minio → MinIO).
 */
export function toProxiedMediaUrl(
  url: string | null | undefined,
): string | null | undefined {
  if (url == null || url === "") {
    return url;
  }

  if (
    url.startsWith("/minio/") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // Leave other same-origin paths (e.g. /Images/...) unchanged.
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  for (const origin of configuredOrigins()) {
    if (url === origin || url.startsWith(`${origin}/`)) {
      const path = url.slice(origin.length);
      return `/minio${path.startsWith("/") ? path : `/${path}`}`;
    }
  }

  return url;
}

export function rewriteMediaUrlsDeep<T>(value: T): T {
  if (typeof value === "string") {
    return toProxiedMediaUrl(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteMediaUrlsDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = rewriteMediaUrlsDeep(nested);
    }
    return out as T;
  }

  return value;
}
