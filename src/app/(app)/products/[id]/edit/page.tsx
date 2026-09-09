"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ProductFormPageSkeleton } from "@/components/loading/page-skeletons";
import ProductSetupPage from "@/components/products/ProductSetupPage";

function EditProductRequestContent() {
  const params = useParams();
  const productId = typeof params.id === "string" ? params.id : "";

  return <ProductSetupPage mode="edit" productId={productId} />;
}

export default function EditProductRequestPage() {
  return (
    <Suspense fallback={<ProductFormPageSkeleton />}>
      <EditProductRequestContent />
    </Suspense>
  );
}
