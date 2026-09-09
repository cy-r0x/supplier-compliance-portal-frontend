import { redirect } from "next/navigation";

type LegacyProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacySupplierProductPage({
  params,
}: LegacyProductPageProps) {
  const { id } = await params;
  redirect(`/products/${id}`);
}
