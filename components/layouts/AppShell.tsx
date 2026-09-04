"use client";

import Image from "next/image";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export type AppShellNavItem = {
  id: string;
  label: string;
  badge?: number;
};

type AppShellProps = {
  navItems: AppShellNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  userName?: string;
  userRole?: string;
  avatarSrc?: string;
  notificationCount?: number;
};

export default function AppShell({
  navItems,
  activeNavId,
  onNavigate,
  children,
  userName = "Prantor",
  userRole = "SUPER_ADMIN",
  avatarSrc = "/Images/avatar.jpg",
  notificationCount = 0,
}: AppShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg-app text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-elevated">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-500 text-text-inverse"
              aria-hidden="true"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 3 4 7v5c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-4Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
                <path
                  d="m9 12 2 2 4-4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </span>
            <span className="truncate font-display text-[15px] font-semibold tracking-[-0.02em] text-text-primary">
              Compliance Portal
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label={
                notificationCount > 0
                  ? `Notifications, ${notificationCount} unread`
                  : "Notifications"
              }
              onClick={() => onNavigate("notifications")}
              className="relative cursor-pointer rounded-[9px] p-2 text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <BellIcon aria-hidden="true" className="size-5" />
              {notificationCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-500" />
              ) : null}
            </button>

            <div className="group relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-label="Open profile menu"
                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] py-1 pr-1 pl-2 transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-[13px] font-medium text-text-primary">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">{userRole}</p>
                </div>
                <Image
                  src={avatarSrc}
                  alt=""
                  width={32}
                  height={32}
                  priority
                  className="size-8 rounded-full object-cover outline outline-border-subtle"
                />
              </button>

              <div
                role="menu"
                aria-label="Profile"
                className="invisible absolute right-0 z-40 mt-2 w-44 origin-top-right rounded-[9px] border border-border-subtle bg-bg-elevated py-1 opacity-0 shadow-sm transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onNavigate("settings")}
                  className="block w-full cursor-pointer px-3.5 py-2 text-left text-[12px] text-text-primary transition-colors duration-150 hover:bg-bg-muted hover:text-brand-600"
                >
                  Settings
                </button>
                <div className="my-1 border-t border-border-subtle" />
                <Link
                  href="/"
                  role="menuitem"
                  className="block px-3.5 py-2 text-[12px] text-text-primary transition-colors duration-150 hover:bg-bg-muted hover:text-brand-600"
                >
                  Log out
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border-subtle bg-bg-elevated md:flex md:flex-col">
          <nav className="flex flex-col gap-0.5 p-3" aria-label="Primary">
            {navItems.map((item) => {
              const active = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex cursor-pointer items-center justify-between rounded-[9px] px-3 py-2.5 text-left text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                    active
                      ? "bg-brand-100/60 font-medium text-brand-700"
                      : "font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary"
                  }`}
                >
                  {active ? (
                    <span
                      className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-brand-500"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-text-inverse">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav
            className="flex gap-1 overflow-x-auto border-b border-border-subtle bg-bg-elevated px-3 py-2 md:hidden"
            aria-label="Primary mobile"
          >
            {navItems.map((item) => {
              const active = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`cursor-pointer whitespace-nowrap rounded-[9px] px-3 py-2 text-[12px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-brand-100 text-brand-700"
                      : "text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  {item.label}
                  {item.badge && item.badge > 0 ? ` (${item.badge})` : ""}
                </button>
              );
            })}
          </nav>

          <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
