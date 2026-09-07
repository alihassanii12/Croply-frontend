"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ScanSearch, Bug, Tractor,
  ShoppingCart, Bell, Leaf, Menu, X,
  LogOut, LogIn, UserPlus, MessageCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const FARMER_LINKS = [
  { href: "/",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/scan",          label: "Scan",         icon: ScanSearch },
  { href: "/diseases",      label: "Diseases",     icon: Bug },
  { href: "/farms",         label: "Farm Manager", icon: Tractor },
  { href: "/marketplace",   label: "Marketplace",  icon: ShoppingCart },
  { href: "/chats",        label: "Chats",        icon: MessageCircle },
  { href: "/notifications", label: "Alerts",       icon: Bell },
];

// Buyers: Marketplace + Alerts only
const BUYER_LINKS = [
  { href: "/marketplace",   label: "Marketplace",  icon: ShoppingCart },
  { href: "/chats",        label: "Chats",        icon: MessageCircle },
  { href: "/notifications", label: "Alerts",       icon: Bell },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isFarmer, logout } = useAuth();

  // Hide navbar completely on login, register, and Google callback pages
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname?.startsWith("/auth/google");
  if (isAuthPage) {
    return null;
  }

  const links = user ? (isFarmer ? FARMER_LINKS : BUYER_LINKS) : [];
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const avatarUrl  = user?.profile?.avatar_url ?? "";
  const initials   = (((user?.first_name?.[0] ?? "") + (user?.last_name?.[0] ?? "")) || (user?.email?.[0] ?? "?")).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-green-900/10 bg-green-950 text-green-50 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">

        {/* Logo */}
        <Link
          href={user ? (isFarmer ? "/" : "/marketplace") : "/login"}
          className="flex shrink-0 items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <Leaf className="h-6 w-6 text-green-400" />
          <span className="text-xl font-bold tracking-tight text-green-100">Croply</span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden flex-1 items-center justify-center gap-0.5 text-sm md:flex lg:gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors lg:px-3 lg:text-sm ${
                  isActive(href)
                    ? "bg-green-700 text-white"
                    : "text-green-200 hover:bg-green-800 hover:text-white"
                }`}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Logged-out buttons */}
          {!loading && !user && (
            <>
              <Link href="/login"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-green-200 transition hover:bg-green-800 hover:text-white sm:inline-flex">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
              <Link href="/register"
                className="hidden items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-500 sm:inline-flex">
                <UserPlus className="h-4 w-4" /> Register
              </Link>
            </>
          )}

          {/* Logged-in — avatar → /profile + sign-out */}
          {!loading && user && (
            <div className="hidden items-center gap-2 sm:flex">
              {/* Avatar links to profile */}
              <Link href="/profile" title="My Profile"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-green-200 transition hover:bg-green-800 hover:text-white">
                <span className="overflow-hidden rounded-full border-2 border-green-600 shadow-sm">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={user.first_name} className="h-8 w-8 object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center bg-green-600 text-xs font-bold text-white">
                      {initials}
                    </span>
                  )}
                </span>
                <span className="hidden max-w-[90px] truncate text-sm lg:block">
                  {user.first_name || user.email.split("@")[0]}
                </span>
              </Link>

              {/* Sign out */}
              <button onClick={() => logout()}
                title="Sign Out"
                className="rounded-lg p-2 text-green-300 transition hover:bg-green-800 hover:text-red-400">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 text-green-200 transition hover:bg-green-800 hover:text-white md:hidden"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-green-900/20 bg-green-950 px-4 pb-5 pt-3 md:hidden">
          {user ? (
            <>
              {/* User strip */}
              <Link href="/profile" onClick={() => setMobileOpen(false)}
                className="mb-3 flex items-center gap-3 rounded-xl bg-green-900/40 px-3 py-2.5">
                <span className="overflow-hidden rounded-full border-2 border-green-600">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-9 w-9 object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center bg-green-600 text-sm font-bold text-white">
                      {initials}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-green-100">
                    {user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.email}
                  </p>
                  <p className="text-xs capitalize text-green-400">{user.profile?.role}</p>
                </div>
              </Link>

              {/* Nav grid */}
              <div className="grid grid-cols-2 gap-1">
                {links.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive(href)
                        ? "bg-green-700 font-semibold text-white"
                        : "text-green-200 hover:bg-green-800 hover:text-white"
                    }`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>

              <button onClick={() => { setMobileOpen(false); logout(); }}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-900/20">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-2.5 text-sm text-green-200 hover:bg-green-800">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500">
                <UserPlus className="h-4 w-4" /> Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
