"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppWorkspaceSkeleton } from "@/components/loading/page-skeletons";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <AppWorkspaceSkeleton label="Preparing your workspace" />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
