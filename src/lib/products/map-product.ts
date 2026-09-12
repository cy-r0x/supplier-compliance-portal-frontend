import type { ProductRequest, ProductRequestStatus } from "@/app/distributor/types";

export type ApiProductStatus =
  | "PENDING"
  | "SUBMITTED"
  | "REJECTED"
  | "APPROVED";

export type ApiProductProgress = {
  completed: number;
  total: number;
  percent: number;
};

export type ApiProductParty = {
  id: string;
  name: string;
  email: string;
};

export type ApiProductListItem = {
  id: string;
  name: string;
  sku: string | null;
  photo: string | null;
  price: string | number | null;
  status: ApiProductStatus;
  publicSlug: string;
  createdAt: string;
  updatedAt: string;
  distributor: ApiProductParty;
  supplier: ApiProductParty;
  progress: ApiProductProgress;
};

export type ApiDocumentFile = {
  id: string;
  fileUrl: string;
  fileName: string | null;
};

export type ApiDocumentRequirement = {
  id: string;
  type: string;
  customKey: string;
  label: string | null;
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
  documents: ApiDocumentFile[];
};

export type ApiFieldRequirement = {
  id: string;
  fieldType: string;
  customKey: string;
  label: string | null;
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
  fieldValue: { value: string } | null;
};

export type ApiProductDetail = ApiProductListItem & {
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  templateId?: string | null;
  template?: { id: string; name: string } | null;
  documentRequirements: ApiDocumentRequirement[];
  fieldRequirements: ApiFieldRequirement[];
};

const STATUS_MAP: Record<ApiProductStatus, ProductRequestStatus> = {
  PENDING: "pending",
  SUBMITTED: "pending",
  REJECTED: "rejected",
  APPROVED: "approved",
};

export function mapApiStatus(status: ApiProductStatus): ProductRequestStatus {
  if (status === "SUBMITTED") return "pending";
  return STATUS_MAP[status];
}

export function mapUiStatusToApi(
  status: ProductRequestStatus,
): ApiProductStatus | undefined {
  switch (status) {
    case "pending":
      return "PENDING";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    default:
      return undefined;
  }
}

const FALLBACK_IMAGE = "/Images/avatar.jpg";

export function apiProductToProductRequest(
  product: ApiProductListItem,
): ProductRequest {
  return {
    id: product.id,
    productName: product.name,
    productImage: product.photo || FALLBACK_IMAGE,
    progress: product.progress.percent,
    supplierId: product.supplier.id,
    supplierName: product.supplier.name,
    distributorName: product.distributor.name,
    requestedAt: product.createdAt,
    status: mapApiStatus(product.status),
    submitted: product.status === "SUBMITTED" || product.status === "APPROVED",
    submittedAt: undefined,
    publicSlug: product.publicSlug,
    rejectionReason: undefined,
    apiStatus: product.status,
  };
}

export function apiDetailToProductRequest(
  product: ApiProductDetail,
): ProductRequest {
  return {
    ...apiProductToProductRequest(product),
    submittedAt: product.submittedAt ?? undefined,
    rejectionReason: product.rejectionReason ?? undefined,
    submitted:
      product.status === "SUBMITTED" ||
      product.status === "APPROVED" ||
      product.status === "REJECTED",
  };
}
