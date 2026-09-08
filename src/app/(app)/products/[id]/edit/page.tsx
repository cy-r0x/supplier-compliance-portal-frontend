"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductSetupPage from "@/components/products/ProductSetupPage";

function EditProductRequestContent() {
  const params = useParams();
  const productId = typeof params.id === "string" ? params.id : "";

  return <ProductSetupPage mode="edit" productId={productId} />;
}

export default function EditProductRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
          Loading…
        </div>
      }
    >
      <EditProductRequestContent />
    </Suspense>
  );
}
