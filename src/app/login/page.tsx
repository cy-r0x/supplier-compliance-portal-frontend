"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LogInPage from "../../../components/pages/LogInPage";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-bg-app text-[13px] text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-5 py-12">
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-[9px] focus:bg-bg-elevated focus:px-3 focus:py-2 focus:text-[13px] focus:text-text-primary focus:shadow-sm"
      >
        Skip to login
      </a>
      <div id="login-form" className="w-full max-w-[400px]">
        <LogInPage />
      </div>
    </main>
  );
}
