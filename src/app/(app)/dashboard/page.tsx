"use client";

import { AdminDashboard } from "@/app/admin/AdminDashboard";
import { DistributorDashboard } from "@/app/distributor/DistributorDashboard";
import { NoOrgPage } from "@/app/organization/NoOrgPage";
import { SupplierDashboard } from "@/app/supplier/SupplierDashboard";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "SUPER_ADMIN":
      return <AdminDashboard />;
    case "USER":
      return user.organization ? <DistributorDashboard /> : <NoOrgPage />;
    case "SUPPLIER":
      return <SupplierDashboard />;
    default:
      return (
        <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
          Unsupported role: {user.role}
        </div>
      );
  }
}
