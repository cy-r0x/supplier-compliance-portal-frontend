type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[8px] bg-bg-muted ${className}`}
    />
  );
}

export function SkeletonRows({
  count = 3,
  height = "h-11",
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={`w-full ${height}`} />
      ))}
    </div>
  );
}
