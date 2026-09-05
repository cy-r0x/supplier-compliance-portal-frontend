export type DistributorSection =
  | "dashboard"
  | "suppliers"
  | "products"
  | "notifications";

export const DISTRIBUTOR_SECTIONS: DistributorSection[] = [
  "dashboard",
  "suppliers",
  "products",
  "notifications",
];

export function isDistributorSection(
  value: string,
): value is DistributorSection {
  return (DISTRIBUTOR_SECTIONS as string[]).includes(value);
}

export type ProductRequestStatus = "pending" | "approved" | "rejected";

export type ProductRequest = {
  id: string;
  productName: string;
  productImage: string;
  progress: number;
  supplierId: string;
  supplierName: string;
  distributorName: string;
  requestedAt: string;
  status: ProductRequestStatus;
  submitted: boolean;
  submittedAt?: string;
};

export type ProductRequestFormValues = {
  productName: string;
  productImage: string;
  progress: number;
  supplierId: string;
  status: ProductRequestStatus;
};

export function statusLabel(status: ProductRequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}
