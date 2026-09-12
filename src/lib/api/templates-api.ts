import { api } from "./axios";
import { ApiError, type ApiResponse } from "./types";

export type ApiTemplateListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  productRequestCount?: number;
};

export type ApiTemplateDocument = {
  id: string;
  type: string;
  customKey: string;
  label: string | null;
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
};

export type ApiTemplateField = {
  id: string;
  fieldType: string;
  customKey: string;
  label: string | null;
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
};

export type ApiTemplateDetail = ApiTemplateListItem & {
  documents: ApiTemplateDocument[];
  fields: ApiTemplateField[];
};

export type CreateTemplateInput = {
  name: string;
  documents: Array<{
    type: string;
    customKey?: string;
    label?: string;
    level: "REQUIRED" | "OPTIONAL";
    visibility: "PUBLIC" | "PRIVATE";
  }>;
  fields: Array<{
    fieldType: string;
    customKey?: string;
    label?: string;
    level: "REQUIRED" | "OPTIONAL";
    visibility: "PUBLIC" | "PRIVATE";
  }>;
};

export type RelatedProductsAction = "NOTIFY_AND_RESET" | "KEEP_AS_IS";

export type UpdateTemplateInput = CreateTemplateInput & {
  relatedProductsAction?: RelatedProductsAction;
};

export type TemplateImpact = {
  relatedProductCount: number;
  resettableCount: number;
  products: Array<{
    id: string;
    name: string;
    status: string;
    supplierId: string;
    supplierName: string;
  }>;
};

export async function listTemplates(): Promise<ApiTemplateListItem[]> {
  const { data } = await api.get<ApiResponse<ApiTemplateListItem[]>>("/templates");
  if (!data.success) {
    throw new ApiError(data.message);
  }
  return data.data;
}

export async function getTemplate(id: string): Promise<ApiTemplateDetail> {
  const { data } = await api.get<ApiResponse<ApiTemplateDetail>>(`/templates/${id}`);
  if (!data.success) {
    throw new ApiError(data.message);
  }
  return data.data;
}

export async function getTemplateImpact(id: string): Promise<TemplateImpact> {
  const { data } = await api.get<ApiResponse<TemplateImpact>>(
    `/templates/${id}/impact`,
  );
  if (!data.success) {
    throw new ApiError(data.message);
  }
  return data.data;
}

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<ApiTemplateDetail> {
  const { data } = await api.post<ApiResponse<ApiTemplateDetail>>(
    "/templates",
    input,
  );
  if (!data.success) {
    throw new ApiError(data.message);
  }
  return data.data;
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
): Promise<ApiTemplateDetail> {
  const { data } = await api.patch<ApiResponse<ApiTemplateDetail>>(
    `/templates/${id}`,
    input,
  );
  if (!data.success) {
    throw new ApiError(data.message);
  }
  return data.data;
}
