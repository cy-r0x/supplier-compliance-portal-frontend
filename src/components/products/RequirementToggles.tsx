"use client";

function SegmentGroup({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium tracking-wide text-text-muted uppercase">
        {label}
      </span>
      <div
        className="inline-flex rounded-[8px] border border-border-subtle bg-bg-muted/40 p-0.5"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={`cursor-pointer rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="flex shrink-0 flex-wrap items-end gap-3">
      <SegmentGroup
        label="Level"
        value={required ? "required" : "optional"}
        disabled={disabled}
        options={[
          { id: "required", label: "Required" },
          { id: "optional", label: "Optional" },
        ]}
        onChange={(id) => onRequiredChange(id === "required")}
      />
      <SegmentGroup
        label="Visibility"
        value={isPublic ? "public" : "private"}
        disabled={disabled}
        options={[
          { id: "public", label: "Public" },
          { id: "private", label: "Private" },
        ]}
        onChange={(id) => onPublicChange(id === "public")}
      />
    </div>
  );
}
