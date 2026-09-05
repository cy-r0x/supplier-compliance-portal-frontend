import axios from "axios";
import { authAxios } from "../api/axios";
import type { ApiResponse, AuthTokens } from "../api/types";
import { ApiError } from "../api/types";

function toApiError(error: unknown, fallback: string): ApiError {
  if (axios.isAxiosError(error) && error.response) {
    const body = error.response.data as ApiResponse<AuthTokens> | undefined;
    return new ApiError(
      body?.message || fallback,
      error.response.status,
    );
  }
  return new ApiError(fallback);
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthTokens> {
  try {
    const { data } = await authAxios.post<ApiResponse<AuthTokens>>("/auth/login", {
      email,
      password,
    });

    if (!data.success || !data.data) {
      throw new ApiError(data.message || "Login failed", 401);
    }

    return data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toApiError(error, "Login failed");
  }
}

export async function refreshRequest(
  refreshToken: string,
): Promise<AuthTokens> {
  try {
    const { data } = await authAxios.post<ApiResponse<AuthTokens>>(
      "/auth/refresh",
      { refreshToken },
    );

    if (!data.success || !data.data) {
      throw new ApiError(data.message || "Refresh failed", 401);
    }

    return data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toApiError(error, "Refresh failed");
  }
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  try {
    await authAxios.post("/auth/logout", { refreshToken });
  } catch {
    // Best-effort logout
  }
}
