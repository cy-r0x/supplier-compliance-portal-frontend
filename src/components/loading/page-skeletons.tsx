import { Skeleton, SkeletonRows } from "./Skeleton";

function LoadingStatus({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>;
}

export function PageHeaderSkeleton({
  action = false,
}: {
  action?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-10 w-32 shrink-0 rounded-[9px]" /> : null}
    </div>
  );
}

export function AppWorkspaceSkeleton({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-dvh flex-col bg-bg-app text-text-primary"
    >
      <header className="border-b border-border-subtle bg-bg-elevated">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-[9px]" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-[9px]" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border-subtle bg-bg-elevated p-2 md:block">
          <div className="space-y-1">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-[9px]" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
          <DashboardContentSkeleton />
        </main>
      </div>

      <LoadingStatus label={label} />
    </div>
  );
}

export function DashboardContentSkeleton() {
  return (
    <div aria-hidden="true">
      <PageHeaderSkeleton action />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[12px] border border-border-subtle bg-bg-elevated p-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="mt-4">
          <SkeletonRows count={4} height="h-14" />
        </div>
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-bg-app px-5 py-12"
    >
      <div className="w-full max-w-[400px] rounded-[12px] border border-border-subtle bg-bg-elevated p-6">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="mx-auto mt-2 h-4 w-56" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-11 w-full rounded-[9px]" />
          <Skeleton className="h-11 w-full rounded-[9px]" />
          <Skeleton className="h-10 w-full rounded-[9px]" />
        </div>
      </div>
      <LoadingStatus label="Loading login" />
    </div>
  );
}

export function ProductFormPageSkeleton({
  label = "Loading product setup",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-4 w-40" />

        <div className="mt-6">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>

        <div className="mt-8 space-y-8">
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-11 sm:col-span-2" />
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </section>

          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              <SkeletonRows count={3} height="h-16" />
            </div>
          </section>

          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              <SkeletonRows count={2} height="h-24" />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24 rounded-[9px]" />
            <Skeleton className="h-10 w-36 rounded-[9px]" />
          </div>
        </div>
      </div>
      <LoadingStatus label={label} />
    </div>
  );
}

export function ProductReviewPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-4 w-40" />

        <section className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="size-[72px] shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-7 w-64 max-w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-[9px]" />
              <Skeleton className="h-10 w-24 rounded-[9px]" />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              <SkeletonRows count={3} height="h-14" />
            </div>
          </section>
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              <SkeletonRows count={3} height="h-20" />
            </div>
          </section>
        </div>
      </div>
      <LoadingStatus label="Loading submission" />
    </div>
  );
}

export function ComplianceFormPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-full flex-1 bg-bg-app px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-4 w-40" />

        <section className="mt-6 rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="size-[72px] shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-64 max-w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              <SkeletonRows count={4} height="h-12" />
            </div>
          </section>
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              <SkeletonRows count={3} height="h-28" />
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Skeleton className="h-10 w-40 rounded-[9px]" />
        </div>
      </div>
      <LoadingStatus label="Loading compliance form" />
    </div>
  );
}
