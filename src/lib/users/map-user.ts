import type { AdminEntity, EntityType } from "@/app/admin/types";
import type { ApiUser } from "@/lib/api/users-api";

export function apiUserToAdminEntity(user: ApiUser): AdminEntity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: "",
    type: user.role === "DISTRIBUTOR" ? "distributor" : "supplier",
    createdAt: user.createdAt,
  };
}

export function entityTypeToApiRole(type: EntityType): "DISTRIBUTOR" | "SUPPLIER" {
  return type === "distributor" ? "DISTRIBUTOR" : "SUPPLIER";
}
