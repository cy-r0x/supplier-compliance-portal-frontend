import Link from "next/link";

export default function PublicProductNotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-app">
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="font-display text-[20px] font-semibold text-text-primary">
          Product not found
        </p>
        <p className="mt-2 text-[14px] text-text-secondary">
          This product may not exist, is not approved yet, or is no longer
          publicly available.
        </p>
        <Link
          href="/login"
          className="mt-6 text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          Sign in to the portal
        </Link>
      </main>
    </div>
  );
}
