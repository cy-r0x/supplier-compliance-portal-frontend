export type DistributorSection =
  | "dashboard"
  | "suppliers"
  | "templates"
  | "products"
  | "notifications"
  | "settings";

export const DISTRIBUTOR_SECTIONS: DistributorSection[] = [
  "dashboard",
  "suppliers",
  "templates",
  "products",
  "notifications",
  "settings",
];

export function isDistributorSection(
  value: string,
): value is DistributorSection {
  return (DISTRIBUTOR_SECTIONS as string[]).includes(value);
}

export type ProductRequestStatus = "pending" | "approved" | "rejected";

export type ApiProductStatus =
  | "PENDING"
  | "SUBMITTED"
  | "REJECTED"
  | "APPROVED";

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
  publicSlug?: string;
  rejectionReason?: string;
  apiStatus?: ApiProductStatus;
};

export type ProductRequestFormValues = {
  productName: string;
  productImage: string;
  sku?: string;
  price?: number;
  photoFile?: File | null;
  supplierId: string;
  templateId: string;
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
