"use client";

export function RequirementMeta({
  level,
  visibility,
}: {
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <span className="rounded-[6px] bg-bg-inset px-2 py-0.5 text-[10px] font-medium text-text-secondary">
        {level === "REQUIRED" ? "Required" : "Optional"}
      </span>
      <span className="rounded-[6px] bg-bg-inset px-2 py-0.5 text-[10px] font-medium text-text-secondary">
        {visibility === "PUBLIC" ? "Public" : "Private"}
      </span>
    </div>
  );
}
