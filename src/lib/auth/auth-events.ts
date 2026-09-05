import type { AuthUser } from "./session";

type TokensUpdatedHandler = (accessToken: string, user: AuthUser) => void;
type SessionClearedHandler = () => void;

let onTokensUpdated: TokensUpdatedHandler | null = null;
let onSessionCleared: SessionClearedHandler | null = null;

export function registerAuthEventHandlers(handlers: {
  onTokensUpdated?: TokensUpdatedHandler;
  onSessionCleared?: SessionClearedHandler;
}) {
  if (handlers.onTokensUpdated) onTokensUpdated = handlers.onTokensUpdated;
  if (handlers.onSessionCleared) onSessionCleared = handlers.onSessionCleared;
}

export function notifyTokensUpdated(accessToken: string, user: AuthUser) {
  onTokensUpdated?.(accessToken, user);
}

export function notifySessionCleared() {
  onSessionCleared?.();
}
