"use client";

import { useAuth } from "@/lib/auth/AuthProvider";

export function NoOrgPage() {
  const { logout } = useAuth();

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-bg-app px-4">
      <section className="w-full max-w-lg rounded-[12px] border border-border-subtle bg-bg-elevated p-8 text-center">
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          No organization assigned
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-text-secondary">
          Your account is active, but it has not been added to an organization.
          Contact an administrator to request access.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors hover:bg-brand-600"
        >
          Log out
        </button>
      </section>
    </main>
  );
}
