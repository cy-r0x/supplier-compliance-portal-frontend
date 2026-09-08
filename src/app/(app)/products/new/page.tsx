"use client";

import { Suspense } from "react";
import NewProductRequestPage from "./NewProductRequestPage";

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
          Loading…
        </div>
      }
    >
      <NewProductRequestPage />
    </Suspense>
  );
}
