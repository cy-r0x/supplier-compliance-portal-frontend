import { api } from "./axios";
import { ApiError, type ApiResponse, type PaginationMeta } from "./types";

export type ApiUserRole = "DISTRIBUTOR" | "SUPPLIER";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  photo: string | null;
  createdAt: string;
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

  const { data } = await api.post<ApiResponse<ApiUser>>("/users", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}
