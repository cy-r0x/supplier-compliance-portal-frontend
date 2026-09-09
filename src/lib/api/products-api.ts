import { api } from "./axios";
import { ApiError, type ApiResponse, type PaginationMeta } from "./types";
import type {
  ApiProductDetail,
  ApiProductListItem,
  ApiProductStatus,
} from "@/lib/products/map-product";
import {
  buildCreateProductFormData,
  buildUpdateProductFormData,
  type CreateProductComplianceInput,
  type UpdateProductComplianceInput,
} from "@/lib/products/compliance-form";

export type ListProductsParams = {
  page?: number;
  limit?: number;
  sort?: string;
  status?: ApiProductStatus;
  search?: string;
};

export type ProductListResult = {
  items: ApiProductListItem[];
  pagination: PaginationMeta;
};

export async function listProducts(
  params?: ListProductsParams,
): Promise<ProductListResult> {
  const { data } = await api.get<ApiResponse<ApiProductListItem[]>>(
    "/products",
    { params },
  );

  if (!data.success) {
    throw new ApiError(data.message);
  }

  if (!data.pagination) {
    throw new ApiError("Missing pagination metadata");
  }

  return { items: data.data, pagination: data.pagination };
}

export async function getProduct(id: string): Promise<ApiProductDetail> {
  const { data } = await api.get<ApiResponse<ApiProductDetail>>(`/products/${id}`);

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}

export async function createProduct(input: CreateProductComplianceInput): Promise<void> {
  const form = buildCreateProductFormData(input);
  const { data } = await api.post<ApiResponse<null>>("/products", form);

  if (!data.success) {
    throw new ApiError(data.message);
  }
}

export type UpdateProductInput = {
  name?: string;
  sku?: string;
  price?: number;
  photo?: File | null;
};

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<void> {
  const form = new FormData();
  if (input.name !== undefined) form.append("name", input.name);
  if (input.sku !== undefined) form.append("sku", input.sku);
  if (input.price !== undefined) form.append("price", String(input.price));
  if (input.photo) form.append("photo", input.photo);

  const { data } = await api.patch<ApiResponse<null>>(`/products/${id}`, form);

  if (!data.success) {
    throw new ApiError(data.message);
  }
}

export async function updateProductSetup(
  id: string,
  input: UpdateProductComplianceInput,
): Promise<void> {
  const form = buildUpdateProductFormData(input);
  const { data } = await api.patch<ApiResponse<null>>(`/products/${id}`, form);

  if (!data.success) {
    throw new ApiError(data.message);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse<null>>(`/products/${id}`);
  if (!data.success) {
    throw new ApiError(data.message);
  }
}

export type SubmitProductInput = {
  fieldValues: Array<{ requirementId: string; value: string }>;
  files: Array<{ requirementId: string; file: File }>;
};

export async function submitProduct(
  id: string,
  input: SubmitProductInput,
): Promise<void> {
  const form = new FormData();
  form.append("fieldValues", JSON.stringify(input.fieldValues));
  for (const entry of input.files) {
    form.append(`doc__${entry.requirementId}`, entry.file);
  }

  const { data } = await api.post<ApiResponse<null>>(
    `/products/${id}/submit`,
    form,
  );

  if (!data.success) {
    throw new ApiError(data.message);
  }
}

export async function approveProduct(id: string): Promise<void> {
  const { data } = await api.post<ApiResponse<null>>(`/products/${id}/approve`);
  if (!data.success) {
    throw new ApiError(data.message);
  }
}

export async function rejectProduct(
  id: string,
  rejectionReason: string,
): Promise<void> {
  const { data } = await api.post<ApiResponse<null>>(`/products/${id}/reject`, {
    rejectionReason,
  });
  if (!data.success) {
    throw new ApiError(data.message);
  }
}
