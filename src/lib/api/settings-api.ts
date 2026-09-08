import { api } from "./axios";
import { ApiError, type ApiResponse } from "./types";

export type UserSettings = {
  autoApproveProductRequests: boolean;
};

export async function getSettings(): Promise<UserSettings> {
  const { data } = await api.get<ApiResponse<UserSettings>>("/settings");

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}

export async function updateSettings(
  input: Partial<UserSettings>,
): Promise<UserSettings> {
  const { data } = await api.patch<ApiResponse<UserSettings>>("/settings", input);

  if (!data.success) {
    throw new ApiError(data.message);
  }

  return data.data;
}
