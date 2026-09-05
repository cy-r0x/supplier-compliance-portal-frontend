export type UserRole = "SUPER_ADMIN" | "DISTRIBUTOR" | "SUPPLIER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photo: string | null;
};

const ROLES: UserRole[] = ["SUPER_ADMIN", "DISTRIBUTOR", "SUPPLIER"];

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

export function decodeAccessToken(accessToken: string): AuthUser | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(decodeBase64Url(parts[1])) as {
      sub?: string;
      name?: string;
      email?: string;
      role?: string;
      photo?: string | null;
    };

    if (!payload.sub || !payload.name || !payload.email || !payload.role) {
      return null;
    }

    if (!ROLES.includes(payload.role as UserRole)) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole,
      photo: payload.photo ?? null,
    };
  } catch {
    return null;
  }
}

export function getUserFromStoredToken(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("scp-access-token");
  if (!token) return null;
  return decodeAccessToken(token);
}
