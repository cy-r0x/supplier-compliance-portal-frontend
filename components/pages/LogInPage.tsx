"use client";

import { FocusEvent, FormEvent, useId, useState } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.1 0 8.7 3.7 10 7-.4 1.1-1.1 2.3-2.1 3.3M6.1 6.1C4.1 7.4 2.7 9.3 2 12c1.3 3.3 4.9 7 10 7 1 0 2-.2 2.9-.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BrandMark() {
  return (
    <div
      className="flex size-10 items-center justify-center rounded-[9px] bg-brand-500 text-text-inverse shadow-sm"
      aria-hidden="true"
    >
      <svg className="size-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3 4 7v5c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-4Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function LogInPage() {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const formErrorId = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateEmail(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required";
    if (!isValidEmail(trimmed)) return "Enter a valid email address";
    return null;
  }

  function handleEmailBlur(event: FocusEvent<HTMLInputElement>) {
    setEmailError(validateEmail(event.currentTarget.value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    const emailValue = typeof email === "string" ? email : "";
    const nextEmailError = validateEmail(emailValue);
    setEmailError(nextEmailError);
    if (nextEmailError) return;

    setLoading(true);

    try {
      // Auth API not wired yet — demonstrate loading / error UI states
      await new Promise((resolve) => setTimeout(resolve, 700));
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-[400px]">
      <div className="rounded-[12px] border border-border-subtle bg-bg-elevated p-8 shadow-sm">
        <header className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
            Compliance Portal
          </h1>
          <p className="mt-1.5 text-[14px] text-text-secondary">
            Sign in to continue
          </p>
        </header>

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor={emailId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Email Address{" "}
              <span className="text-brand-600" aria-hidden="true">
                *
              </span>
            </label>
            <div
              className={`mt-1.5 flex h-11 items-center gap-2 rounded-[9px] border bg-bg-elevated px-3 text-text-muted transition-[border-color,box-shadow] duration-150 focus-within:ring-2 ${
                emailError
                  ? "border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20"
                  : "border-border-subtle focus-within:border-focus-ring focus-within:ring-focus-ring/25"
              }`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <rect
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  width="20"
                  x="2"
                  y="4"
                />
                <path
                  d="m3 6 9 7 9-7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                aria-required="true"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? emailErrorId : undefined}
                disabled={loading}
                placeholder="you@company.com"
                onBlur={handleEmailBlur}
                onChange={() => {
                  if (emailError) setEmailError(null);
                  if (error) setError(null);
                }}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
              />
            </div>
            {emailError ? (
              <p
                id={emailErrorId}
                role="alert"
                className="mt-1.5 text-[12px] text-danger-500"
              >
                {emailError}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={passwordId}
              className="block text-[12px] font-medium text-text-primary"
            >
              Password{" "}
              <span className="text-brand-600" aria-hidden="true">
                *
              </span>
            </label>
            <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[9px] border border-border-subtle bg-bg-elevated px-3 text-text-muted transition-[border-color,box-shadow] duration-150 focus-within:border-focus-ring focus-within:ring-2 focus-within:ring-focus-ring/25">
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <rect
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  width="16"
                  x="4"
                  y="10"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
              <input
                id={passwordId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? formErrorId : undefined}
                disabled={loading}
                placeholder="Enter your password"
                onChange={() => {
                  if (error) setError(null);
                }}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={loading}
                onClick={() => setShowPassword((visible) => !visible)}
                className="cursor-pointer shrink-0 rounded p-1 text-text-secondary transition-colors duration-150 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-60"
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          {error ? (
            <p
              id={formErrorId}
              role="alert"
              className="rounded-[9px] border border-danger-500/20 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-500"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[9px] bg-brand-500 text-[13px] font-medium text-text-inverse shadow-[0_2px_4px_rgba(21,149,160,0.2)] transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>
      </div>
    </section>
  );
}
