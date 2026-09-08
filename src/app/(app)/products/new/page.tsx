"use client";

import { Suspense } from "react";
import { ProductFormPageSkeleton } from "@/components/loading/page-skeletons";
import NewProductRequestPage from "./NewProductRequestPage";

export default function NewProductPage() {
  return (
    <Suspense fallback={<ProductFormPageSkeleton />}>
      <NewProductRequestPage />
    </Suspense>
  );
}
