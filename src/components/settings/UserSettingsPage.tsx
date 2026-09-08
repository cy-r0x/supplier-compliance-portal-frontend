"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/api/settings-api";
import type { AuthUser } from "@/lib/auth/session";

function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-text-primary">{label}</p>
        <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "bg-brand-500" : "bg-border-subtle"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-bg-elevated shadow-sm transition-transform duration-150 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

type UserSettingsPageProps = {
  user: AuthUser | null;
};

export default function UserSettingsPage({ user }: UserSettingsPageProps) {
  const isDistributor = user?.role === "DISTRIBUTOR";
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(isDistributor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isDistributor) return;

    setLoading(true);
    setError(null);
    getSettings()
      .then((settings) => setAutoApprove(settings.autoApproveProductRequests))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load settings"),
      )
      .finally(() => setLoading(false));
  }, [isDistributor]);

  async function handleAutoApproveChange(next: boolean) {
    const previous = autoApprove;
    setAutoApprove(next);
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const settings = await updateSettings({
        autoApproveProductRequests: next,
      });
      setAutoApprove(settings.autoApproveProductRequests);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setAutoApprove(previous);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account preferences for your profile"
      />

      <div className="space-y-6">
        <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
          <h2 className="text-[15px] font-medium text-text-primary">Account</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12px] text-text-muted">Name</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-text-muted">Email</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-text-muted">Role</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.role ?? "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-text-muted">
            Password change will be available in a later release.
          </p>
        </section>

        {isDistributor ? (
          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            <h2 className="text-[15px] font-medium text-text-primary">
              Product request defaults
            </h2>
            {loading ? (
              <p className="mt-4 text-[13px] text-text-muted">Loading…</p>
            ) : (
              <div className="mt-4">
                <ToggleSwitch
                  checked={autoApprove}
                  disabled={saving}
                  label="Auto-approve submissions"
                  description="When enabled, supplier compliance submissions are approved immediately without manual review."
                  onChange={(next) => void handleAutoApproveChange(next)}
                />
              </div>
            )}
            {error ? (
              <p role="alert" className="mt-3 text-[12px] text-danger-500">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="mt-3 text-[12px] text-brand-600">Settings saved.</p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
