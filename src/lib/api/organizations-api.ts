import { api } from "./axios";
import { ApiError, type ApiResponse } from "./types";

export type OrganizationMemberRole = "MANAGER" | "MEMBER";

export type OrganizationUser = {
  id: string;
  name: string;
  email: string;
  photo?: string | null;
};

export type OrganizationMember = {
  id: string;
  role: OrganizationMemberRole;
  createdAt: string;
  user: OrganizationUser;
};

export type OrganizationSettings = {
  autoApproveProductRequests: boolean;
};

export type OrganizationListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  productRequestCount: number;
  managers: Array<{
    membershipId: string;
    role: "MANAGER";
    user: OrganizationUser;
  }>;
  settings: OrganizationSettings;
};

export type OrganizationDetail = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  productRequestCount: number;
  settings: OrganizationSettings;
  members: OrganizationMember[];
};

export type CreateOrganizationInput = {
  name: string;
  managerUserIds: string[];
  memberUserIds?: string[];
};

function messageFromAxios(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }
  const body = (error as { response?: { data?: unknown } }).response?.data;
  if (!body || typeof body !== "object") return null;

  const nested = (body as { error?: { message?: string | string[] } }).error
    ?.message;
  if (typeof nested === "string" && nested.trim()) return nested;
  if (Array.isArray(nested) && nested.length > 0) return nested.join(", ");

  const top = (body as { message?: string | string[] }).message;
  if (typeof top === "string" && top.trim()) return top;
  if (Array.isArray(top) && top.length > 0) return top.join(", ");

  return null;
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const { data } = await request;
    if (!data.success) throw new ApiError(data.message);
    return data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message = messageFromAxios(error);
    if (message) throw new ApiError(message);
    throw error;
  }
}

export function listOrganizations(): Promise<OrganizationListItem[]> {
  return unwrap(api.get<ApiResponse<OrganizationListItem[]>>("/organizations"));
}

export function createOrganization(
  input: CreateOrganizationInput,
): Promise<OrganizationListItem> {
  return unwrap(api.post<ApiResponse<OrganizationListItem>>("/organizations", input));
}

export function getOrganization(id: string): Promise<OrganizationDetail> {
  return unwrap(api.get<ApiResponse<OrganizationDetail>>(`/organizations/${id}`));
}

export function updateOrganization(
  id: string,
  input: { name: string },
): Promise<OrganizationListItem> {
  return unwrap(api.patch<ApiResponse<OrganizationListItem>>(`/organizations/${id}`, input));
}

export function addOrganizationMember(
  organizationId: string,
  input: { userId: string; role: OrganizationMemberRole },
): Promise<OrganizationMember> {
  return unwrap(
    api.post<ApiResponse<OrganizationMember>>(
      `/organizations/${organizationId}/members`,
      input,
    ),
  );
}

export function updateOrganizationMember(
  organizationId: string,
  membershipId: string,
  input: { role: OrganizationMemberRole },
): Promise<OrganizationMember> {
  return unwrap(
    api.patch<ApiResponse<OrganizationMember>>(
      `/organizations/${organizationId}/members/${membershipId}`,
      input,
    ),
  );
}

export async function removeOrganizationMember(
  organizationId: string,
  membershipId: string,
): Promise<void> {
  await unwrap(
    api.delete<ApiResponse<null>>(
      `/organizations/${organizationId}/members/${membershipId}`,
    ),
  );
}

export function getOrganizationSettings(
  organizationId: string,
): Promise<OrganizationSettings> {
  return unwrap(
    api.get<ApiResponse<OrganizationSettings>>(
      `/organizations/${organizationId}/settings`,
    ),
  );
}

export function updateOrganizationSettings(
  organizationId: string,
  input: Partial<OrganizationSettings>,
): Promise<OrganizationSettings> {
  return unwrap(
    api.patch<ApiResponse<OrganizationSettings>>(
      `/organizations/${organizationId}/settings`,
      input,
    ),
  );
}
