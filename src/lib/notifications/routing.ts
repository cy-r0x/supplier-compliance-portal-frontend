import type { NotificationType } from "@/lib/api/notifications-api";
import type { UserRole } from "@/lib/auth/session";

export function getNotificationProductPath(
  role: UserRole | undefined,
  productRequestId: string,
  _type?: NotificationType,
): string {
  if (role === "USER" || role === "SUPER_ADMIN") {
    return `/products/${productRequestId}/review`;
  }

  return `/products/${productRequestId}`;
}
