"use client";

import { ReactNode } from "react";
import { WifiOff, Leaf, RefreshCw } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-8 animate-slide-in-left">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-lg dark:border-neutral-800 dark:bg-gradient-to-br dark:from-neutral-900 dark:to-emerald-900/10 ${
        hover ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}

export function ApiOffline({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-6 py-12 text-center dark:border-amber-500/40 dark:bg-amber-500/10">
      <WifiOff className="h-8 w-8 text-amber-500 dark:text-amber-400" />
      <p className="font-semibold text-amber-800 dark:text-amber-300">
        API offline
      </p>
      <p className="max-w-md text-sm text-amber-700 dark:text-amber-400">
        We couldn&apos;t reach the Croply backend. Make sure the API server is
        running, then try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-green-900/20 px-6 py-12 text-center text-gray-500 dark:border-green-100/20 dark:text-gray-400">
      <span className="flex h-10 w-10 items-center justify-center text-green-400 dark:text-green-600">
        {icon ?? <Leaf className="h-7 w-7" />}
      </span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
      {message}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-green-900/20 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-green-600 focus:ring-1 focus:ring-green-600 dark:border-green-100/20 dark:bg-neutral-800 dark:text-gray-100";

export const btnCls =
  "rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50";

export const btnDangerCls =
  "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnOutlineCls =
  "rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-50";

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-green-600" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
        {pct}%
      </span>
    </div>
  );
}

/** Modal overlay + dialog box */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-green-900/10 px-6 py-4 dark:border-green-100/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
