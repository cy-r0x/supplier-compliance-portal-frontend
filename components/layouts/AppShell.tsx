"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  HiOutlineBell,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from "react-icons/hi2";
import { useAuth } from "../../src/lib/auth/AuthProvider";

const COLLAPSE_STORAGE_KEY = "scp-sidebar-collapsed";

function formatNotificationCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function NotificationCountBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold leading-none text-text-inverse ${className}`}
    >
      {formatNotificationCount(count)}
    </span>
  );
}

export type AppShellNavItem = {
  id: string;
  label: string;
  icon: IconType;
  badge?: number;
};

type AppShellProps = {
  navItems: AppShellNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  notificationCount?: number;
};

export default function AppShell({
  navItems,
  activeNavId,
  onNavigate,
  children,
  notificationCount = 0,
}: AppShellProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [collapseReady, setCollapseReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const userName = user?.name ?? "";
  const userRole = user?.role ?? "";
  const avatarSrc = user?.photo || "/Images/avatar.jpg";

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setCollapseReady(true);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const resolvedNavItems = navItems.map((item) =>
    item.id === "notifications" && notificationCount > 0
      ? { ...item, badge: notificationCount }
      : item,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg-app text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-elevated">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
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
              <HiOutlineBell aria-hidden="true" className="size-5" />
              {notificationCount > 0 ? (
                <NotificationCountBadge
                  count={notificationCount}
                  className="absolute -top-0.5 -right-0.5"
                />
              ) : null}
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                onClick={() => setProfileOpen((open) => !open)}
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
                className={`absolute right-0 top-full z-40 mt-1 w-44 origin-top-right rounded-[9px] border border-border-subtle bg-bg-elevated py-1 shadow-sm transition duration-150 ${
                  profileOpen
                    ? "visible opacity-100"
                    : "pointer-events-none invisible opacity-0"
                }`}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate("settings");
                  }}
                  className="block w-full cursor-pointer px-3.5 py-2 text-left text-[12px] text-text-primary transition-colors duration-150 hover:bg-bg-muted hover:text-brand-600"
                >
                  Settings
                </button>
                <div className="my-1 border-t border-border-subtle" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    void logout();
                  }}
                  className="block w-full cursor-pointer px-3.5 py-2 text-left text-[12px] text-text-primary transition-colors duration-150 hover:bg-bg-muted hover:text-brand-600"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`relative hidden shrink-0 border-r border-border-subtle bg-bg-elevated transition-[width] duration-150 md:flex md:flex-col ${
            collapseReady && collapsed ? "w-[72px]" : "w-60"
          }`}
        >
          <div
            className={`flex items-center border-b border-border-subtle px-2 py-2 ${
              collapsed ? "justify-center" : "justify-end"
            }`}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-controls="app-shell-nav"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="cursor-pointer rounded-[9px] p-2 text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {collapsed ? (
                <HiOutlineChevronDoubleRight
                  aria-hidden="true"
                  className="size-4"
                />
              ) : (
                <HiOutlineChevronDoubleLeft
                  aria-hidden="true"
                  className="size-4"
                />
              )}
            </button>
          </div>

          <nav
            id="app-shell-nav"
            className="flex flex-col gap-0.5 p-2"
            aria-label="Primary"
          >
            {resolvedNavItems.map((item) => {
              const active = activeNavId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex cursor-pointer items-center rounded-[9px] py-2.5 text-left text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                    collapsed ? "justify-center px-2" : "justify-between gap-2 px-3"
                  } ${
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
                  <span
                    className={`flex min-w-0 items-center gap-2.5 ${
                      collapsed ? "" : "flex-1"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </span>
                  {!collapsed && item.badge && item.badge > 0 ? (
                    <NotificationCountBadge count={item.badge} />
                  ) : null}
                  {collapsed && item.badge && item.badge > 0 ? (
                    <NotificationCountBadge
                      count={item.badge}
                      className="absolute -top-0.5 -right-0.5"
                    />
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
            {resolvedNavItems.map((item) => {
              const active = activeNavId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 py-2 text-[12px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-brand-100 text-brand-700"
                      : "text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
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
