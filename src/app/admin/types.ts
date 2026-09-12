export type EntityType = "user" | "supplier";

export type AdminEntity = {
  id: string;
  name: string;
  email: string;
  password: string;
  type: EntityType;
  createdAt: string;
};

export type EntityFormValues = {
  name: string;
  email: string;
  password: string;
};

export type AdminSection =
  | "dashboard"
  | "organizations"
  | "users"
  | "suppliers"
  | "products"
  | "notifications"
  | "settings";

export const ADMIN_SECTIONS: AdminSection[] = [
  "dashboard",
  "organizations",
  "users",
  "suppliers",
  "products",
  "notifications",
  "settings",
];

export function isAdminSection(value: string): value is AdminSection {
  return (ADMIN_SECTIONS as string[]).includes(value);
}

export function roleLabel(type: EntityType): string {
  return type === "user" ? "User" : "Supplier";
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
