"use client";

export function RequirementToggles({
  required,
  isPublic,
  onRequiredChange,
  onPublicChange,
  disabled = false,
}: {
  required: boolean;
  isPublic: boolean;
  onRequiredChange: (checked: boolean) => void;
  onPublicChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-text-secondary">
        <input
          type="checkbox"
          checked={required}
          disabled={disabled}
          onChange={(event) => onRequiredChange(event.target.checked)}
          className="size-3.5 rounded border-border-subtle text-brand-600 focus:ring-focus-ring disabled:opacity-60"
        />
        Required
      </label>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-text-secondary">
        <input
          type="checkbox"
          checked={isPublic}
          disabled={disabled}
          onChange={(event) => onPublicChange(event.target.checked)}
          className="size-3.5 rounded border-border-subtle text-brand-600 focus:ring-focus-ring disabled:opacity-60"
        />
        Public
      </label>
    </div>
  );
}
