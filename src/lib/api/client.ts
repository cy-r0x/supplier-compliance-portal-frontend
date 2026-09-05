import { api } from "./axios";
import { ApiError, type ApiResponse } from "./types";

export function unwrap<T>(envelope: ApiResponse<T>): T {
  if (!envelope.success) {
    throw new ApiError(envelope.message);
  }
  return envelope.data;
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params });
  return unwrap(data);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body);
  return unwrap(data);
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiResponse<T>>(url, body);
  return unwrap(data);
}

export async function apiPostForm<T>(url: string, formData: FormData): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(data);
}

export type PaginatedResult<T> = {
  items: T;
  pagination: NonNullable<ApiResponse<T>["pagination"]>;
};

export async function apiGetPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResult<T>> {
  const { data } = await api.get<ApiResponse<T>>(url, { params });
  if (!data.success) {
    throw new ApiError(data.message);
  }
  if (!data.pagination) {
    throw new ApiError("Missing pagination metadata");
  }
  return { items: data.data, pagination: data.pagination };
}
