"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppWorkspaceSkeleton } from "@/components/loading/page-skeletons";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [isLoading, user, router]);

  return <AppWorkspaceSkeleton label="Starting Compliance Portal" />;
}
