"use client";

import Image from "next/image";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";

type NavbarProps = {
  name?: string;
  role?: string;
  avatar?: string;
  notificationCount?: number;
};

export default function Navbar({
  name = "Prantor",
  role = "Admin",
  avatar = "/Images/avatar.jpg",
  notificationCount = 0,
}: NavbarProps) {
  return (
    <header className="bg-[#1595a0]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-white">
              {name}
            </p>
            <p className="truncate text-[11px] text-left text-white/75">{role}</p>
          </div>

          <div className="group relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-label="Open profile menu"
              className="relative flex rounded-full outline-none ring-white transition focus-visible:ring-2"
            >
              <Image
                src={avatar}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full object-cover outline outline-white/40"
              />
            </button>

            <div
              role="menu"
              aria-label="Profile"
              className="invisible absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-[9px] border border-[#e3e3e3] bg-white py-1 opacity-0 shadow-[0_8px_24px_rgba(18,58,60,0.12)] transition duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            >
              <Link
                href="#"
                role="menuitem"
                className="block px-3.5 py-2 text-[12px] text-[#123a3c] transition-colors hover:bg-[#f3fafa] hover:text-[#1595a0]"
              >
                Your profile
              </Link>
              <Link
                href="#"
                role="menuitem"
                className="block px-3.5 py-2 text-[12px] text-[#123a3c] transition-colors hover:bg-[#f3fafa] hover:text-[#1595a0]"
              >
                Settings
              </Link>
              <div className="my-1 border-t border-[#e3e3e3]" />
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3.5 py-2 text-left text-[12px] text-[#123a3c] transition-colors hover:bg-[#f3fafa] hover:text-[#1595a0]"
              >
                Log out
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label={
              notificationCount > 0
                ? `Notifications, ${notificationCount} unread`
                : "Notifications"
            }
            className="relative rounded-full p-2 text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <BellIcon aria-hidden="true" className="size-5" />
            {notificationCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-white" />
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
