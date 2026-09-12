"use client";

import Link from "next/link";
import { HiOutlineLockClosed, HiOutlineArrowLeft } from "react-icons/hi2";

type AccessDeniedProps = {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
};

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this page. If you think this is a mistake, contact your organization manager or a platform admin.",
  href = "/dashboard",
  actionLabel = "Back to dashboard",
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-app px-4 py-12">
      <div
        role="alert"
        className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-elevated px-6 py-10 text-center shadow-sm"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-500">
          <HiOutlineLockClosed className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
          {title}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          {description}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex h-10 cursor-pointer items-center gap-2 rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <HiOutlineArrowLeft className="size-4" aria-hidden />
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
