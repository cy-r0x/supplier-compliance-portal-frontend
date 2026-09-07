import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  PublicProductSkeleton,
  PublicProductView,
} from "@/components/public/PublicProductView";
import { getPublicProduct } from "@/lib/public-product";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function PublicProductContent({ id }: { id: string }) {
  const product = await getPublicProduct(id);
  if (!product) notFound();
  return <PublicProductView product={product} />;
}

export default async function PublicProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<PublicProductSkeleton />}>
      <PublicProductContent id={id} />
    </Suspense>
  );
}
