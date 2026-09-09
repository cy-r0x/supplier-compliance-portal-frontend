import { refreshRequest } from "./auth-api";
import {
  notifySessionCleared,
  notifyTokensUpdated,
} from "./auth-events";
import { decodeAccessToken } from "./session";
import {
  clearTokens,
  getRefreshToken,
  setTokens,
} from "./tokens";
import { SessionExpiredError } from "../api/types";

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    notifySessionCleared();
    throw new SessionExpiredError();
  }

  try {
    const tokens = await refreshRequest(refreshToken);
    setTokens(tokens.accessToken, tokens.refreshToken);

    const user = decodeAccessToken(tokens.accessToken);
    if (!user) {
      clearTokens();
      notifySessionCleared();
      throw new SessionExpiredError();
    }

    notifyTokensUpdated(tokens.accessToken, user);
    return tokens.accessToken;
  } catch {
    clearTokens();
    notifySessionCleared();
    throw new SessionExpiredError();
  }
}

export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
