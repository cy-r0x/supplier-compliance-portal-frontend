"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PublicProductSkeleton,
  PublicProductView,
} from "@/components/public/PublicProductView";
import { clearLegacyComplianceFileStorage } from "@/lib/compliance-files";
import {
  getPublicProductFromStorage,
  revokePublicProductUrls,
  type PublicProduct,
} from "@/lib/public-product";

function PublicProductNotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-app">
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="font-display text-[20px] font-semibold text-text-primary">
          Product not found
        </p>
        <p className="mt-2 text-[14px] text-text-secondary">
          This product may not exist, has not been approved yet, or has no
          public compliance data to display.
        </p>
      </main>
    </div>
  );
}

export default function PublicProductPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [product, setProduct] = useState<PublicProduct | null | undefined>(
    undefined,
  );

  useEffect(() => {
    clearLegacyComplianceFileStorage();

    if (!id) {
      setProduct(null);
      return;
    }

    let active = true;

    getPublicProductFromStorage(id).then((next) => {
      if (active) setProduct(next);
    });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (product) revokePublicProductUrls(product);
    };
  }, [product]);

  if (product === undefined) {
    return <PublicProductSkeleton />;
  }

  if (!product) {
    return <PublicProductNotFound />;
  }

  return <PublicProductView product={product} />;
}
