export type EntityType = "distributor" | "supplier";

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
  | "users"
  | "products"
  | "notifications"
  | "settings";

export const ADMIN_SECTIONS: AdminSection[] = [
  "dashboard",
  "users",
  "products",
  "notifications",
  "settings",
];

export function isAdminSection(value: string): value is AdminSection {
  return (ADMIN_SECTIONS as string[]).includes(value);
}

export function roleLabel(type: EntityType): string {
  return type === "distributor" ? "Distributor" : "Supplier";
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
