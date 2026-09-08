import axios from "axios";
import { API_BASE_URL } from "./axios";
import { ApiError, type ApiResponse } from "./types";

export type PublicProductDocument = {
  type: string;
  customKey: string;
  label: string | null;
  fileUrl: string;
  fileName: string | null;
};

export type PublicProductTextField = {
  fieldType: string;
  customKey: string;
  label: string | null;
  value: string;
};

export type PublicProductStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export type PublicProductData = {
  name: string;
  status?: PublicProductStatus;
  supplierName: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  documents: PublicProductDocument[];
  textFields: PublicProductTextField[];
};

const PUBLIC_STATUSES = new Set<PublicProductStatus>([
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
]);

export function isPublicProductStatus(
  value: string | undefined | null,
): value is PublicProductStatus {
  return Boolean(value && PUBLIC_STATUSES.has(value as PublicProductStatus));
}

export async function getPublicProduct(
  publicSlug: string,
): Promise<PublicProductData> {
  const { data } = await axios.get<ApiResponse<PublicProductData>>(
    `${API_BASE_URL}/public/${publicSlug}`,
  );

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}
