import type { AdminEntity, EntityType } from "@/app/admin/types";
import type { ApiUser } from "@/lib/api/users-api";

export function apiUserToAdminEntity(user: ApiUser): AdminEntity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: "",
    type: user.role === "USER" ? "user" : "supplier",
    createdAt: user.createdAt,
  };
}

export function entityTypeToApiRole(type: EntityType): "USER" | "SUPPLIER" {
  return type === "user" ? "USER" : "SUPPLIER";
}
