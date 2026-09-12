import { api } from "./axios";
import { ApiError, type ApiResponse, type PaginationMeta } from "./types";

export type ApiUserRole = "USER" | "SUPPLIER";

export type ApiUserOrganization = {
  membershipId: string;
  role: "MANAGER" | "MEMBER";
  id: string;
  name: string;
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole | "SUPER_ADMIN";
  photo: string | null;
  createdAt: string;
  organization: ApiUserOrganization | null;
};

export type ListUsersParams = {
  role?: ApiUserRole;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type UserListResult = {
  items: ApiUser[];
  pagination: PaginationMeta;
};

export async function listUsers(
  params?: ListUsersParams,
): Promise<UserListResult> {
  const { data } = await api.get<ApiResponse<ApiUser[]>>("/users", { params });

  if (!data.success) {
    throw new ApiError(data.message);
  }

  if (!data.pagination) {
    throw new ApiError("Missing pagination metadata");
  }

  return { items: data.data, pagination: data.pagination };
}

export async function getCurrentUser(): Promise<ApiUser> {
  const { data } = await api.get<ApiResponse<ApiUser>>("/users/me");

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: ApiUserRole;
  photo?: File | null;
};

export async function createUser(input: CreateUserInput): Promise<ApiUser> {
  const form = new FormData();
  form.append("name", input.name);
  form.append("email", input.email);
  form.append("password", input.password);
  form.append("role", input.role);
  if (input.photo) {
    form.append("photo", input.photo);
  }

  const { data } = await api.post<ApiResponse<ApiUser>>("/users", form);

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}

export async function updateMyProfilePhoto(photo: File): Promise<ApiUser> {
  const form = new FormData();
  form.append("photo", photo);

  const { data } = await api.patch<ApiResponse<ApiUser>>(
    "/users/me/photo",
    form,
  );

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}
