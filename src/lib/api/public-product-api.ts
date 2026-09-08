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

export type PublicProductData = {
  name: string;
  photo: string | null;
  supplierName: string;
  approvedAt: string | null;
  documents: PublicProductDocument[];
  textFields: PublicProductTextField[];
};

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
