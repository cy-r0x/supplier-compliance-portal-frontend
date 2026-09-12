"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "@/lib/api/organizations-api";
import { updateMyProfilePhoto } from "@/lib/api/users-api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toProxiedMediaUrl } from "@/lib/media-url";

const FALLBACK_AVATAR = "/Images/avatar.jpg";

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

function ProfilePhotoField({
  photo,
  uploading,
  error,
  onSelect,
}: {
  photo: string | null;
  uploading: boolean;
  error: string | null;
  onSelect: (file: File) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const displaySrc = toProxiedMediaUrl(photo) || FALLBACK_AVATAR;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-bg-muted">
        <img
          src={displaySrc}
          alt=""
          width={64}
          height={64}
          className="size-full object-cover"
        />
        {uploading ? (
          <div
            className="absolute inset-0 flex items-center justify-center bg-text-primary/40"
            aria-hidden="true"
          >
            <span className="size-5 animate-spin rounded-full border-2 border-text-inverse border-t-transparent" />
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="text-[13px] font-medium text-text-primary">Profile photo</p>
        <p className="mt-0.5 text-[12px] text-text-secondary">
          JPG, PNG, or WebP. Max 5 MB.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onSelect(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-9 cursor-pointer rounded-[9px] border border-border-subtle bg-bg-app px-3 text-[12px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-[12px] text-danger-500">
            {error}
          </p>
        ) : null}
      </div>
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

export default function UserSettingsPage() {
  const { user, updateUser } = useAuth();
  const canManageOrganization =
    user?.role === "USER" && user.organization?.role === "MANAGER";
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.photo ?? null,
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(canManageOrganization);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPhotoPreview(user?.photo ?? null);
  }, [user?.photo]);

  useEffect(() => {
    if (!canManageOrganization || !user?.organization) return;

    setLoading(true);
    setError(null);
    getOrganizationSettings(user.organization.id)
      .then((settings) => setAutoApprove(settings.autoApproveProductRequests))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load settings"),
      )
      .finally(() => setLoading(false));
  }, [canManageOrganization, user?.organization]);

  async function handlePhotoSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be 5 MB or smaller.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setPhotoUploading(true);
    setPhotoError(null);
    setPhotoSaved(false);

    try {
      const updated = await updateMyProfilePhoto(file);
      updateUser({
        name: updated.name,
        email: updated.email,
        photo: updated.photo,
      });
      setPhotoPreview(updated.photo);
      setPhotoSaved(true);
      window.setTimeout(() => setPhotoSaved(false), 2500);
    } catch (err) {
      setPhotoPreview(user?.photo ?? null);
      setPhotoError(
        err instanceof Error ? err.message : "Failed to update profile photo",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setPhotoUploading(false);
    }
  }

  async function handleAutoApproveChange(next: boolean) {
    const previous = autoApprove;
    setAutoApprove(next);
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      if (!user?.organization) return;
      const settings = await updateOrganizationSettings(user.organization.id, {
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

          <div className="mt-4 border-b border-border-subtle pb-5">
            <ProfilePhotoField
              photo={photoPreview}
              uploading={photoUploading}
              error={photoError}
              onSelect={(file) => void handlePhotoSelect(file)}
            />
            {photoSaved ? (
              <p className="mt-3 text-[12px] text-brand-600">Photo updated.</p>
            ) : null}
          </div>

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
              <dt className="text-[12px] text-text-muted">Account type</dt>
              <dd className="mt-1 text-[13px] text-text-primary">
                {user?.role === "SUPER_ADMIN"
                  ? "Super admin"
                  : user?.role === "SUPPLIER"
                    ? "Supplier"
                    : user?.role === "USER"
                      ? "Organization user"
                      : (user?.role ?? "—")}
              </dd>
            </div>
            {user?.organization ? (
              <>
                <div>
                  <dt className="text-[12px] text-text-muted">Organization</dt>
                  <dd className="mt-1 text-[13px] text-text-primary">
                    {user.organization.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-text-muted">
                    Organization role
                  </dt>
                  <dd className="mt-1 text-[13px] text-text-primary">
                    {user.organization.role === "MANAGER"
                      ? "Manager"
                      : "Member"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
          <p className="mt-4 text-[12px] text-text-muted">
            Password change will be available in a later release.
          </p>
        </section>

        {canManageOrganization ? (
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
