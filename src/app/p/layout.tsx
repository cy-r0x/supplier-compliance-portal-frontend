import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product information",
  description: "Verified safety and compliance information for this product.",
};

export default function PublicProductLayout({
  children,
}: LayoutProps<"/p">) {
  return children;
}
