"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AnalyticsSummary, LiveWeather,
  getAnalyticsSummary, getWeatherLive,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Card, ConfidenceBar, EmptyState,
  PageHeader, Spinner, ApiOffline, formatDate,
} from "@/components/ui";
import RouteGuard from "@/components/RouteGuard";
import {
  Microscope, CloudSun, MapPin,
  Droplets, Wind, Info, CheckCircle2,
  AlertTriangle, ScanSearch, Pill,
  ShieldCheck, Activity, Leaf,
} from "lucide-react";

// ── Weather ────────────────────────────────────────────────────────────────
function WeatherWidget({ location }: { location: string }) {
  const [w, setW]             = useState<LiveWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(() => {
    if (!location) { setLoading(false); return; }
    setLoading(true);
    setError("");
    getWeatherLive(location)
      .then(setW)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [location]);

  useEffect(load, [load]);

  if (!location) return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gradient-to-r from-gray-50 to-white px-5 py-5 text-sm text-gray-600 shadow-sm dark:border-neutral-700 dark:bg-gradient-to-r dark:from-neutral-800/50 dark:to-neutral-900 dark:text-gray-400">
      <CloudSun className="h-5 w-5 shrink-0 text-sky-400 animate-pulse" />
      Set your location in&nbsp;
      <Link href="/profile" className="font-semibold text-green-600 hover:underline dark:text-green-400">
        Profile
      </Link>
      &nbsp;to see live weather.
    </div>
  );

  if (loading) return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-gray-50 px-5 py-5 text-sm text-gray-500 shadow-sm dark:border-neutral-800 dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-800">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      Loading weather…
    </div>
  );

  if (error || !w) return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 px-5 py-5 text-sm shadow-sm dark:border-neutral-800 dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-800">
      <span className="text-gray-500">{error || "Weather unavailable"}</span>
      <button onClick={load} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
        Retry
      </button>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-sky-50/50 shadow-lg dark:border-neutral-800 dark:bg-gradient-to-r dark:from-neutral-900 dark:to-sky-900/20 card-hover">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: icon + temp */}
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-sky-100/50 blur-md dark:bg-sky-900/20"></div>
            <img src={w.icon_url} alt={w.description} className="relative h-16 w-16 shrink-0 drop-shadow-lg" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5 text-sky-500" />
              {w.location}, {w.country}
            </p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {w.temp}°C
              </span>
              <span className="mb-1 text-base font-medium text-gray-600 dark:text-gray-400">
                {w.description}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Droplets className="h-4 w-4" />
                {w.humidity}% humidity
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                <Wind className="h-4 w-4" />
                {w.wind_speed} m/s {w.wind_direction}
              </span>
              <span className="text-gray-500 dark:text-gray-500">
                Feels like {w.feels_like}°C
              </span>
            </div>
          </div>
        </div>

        {/* Right: advisory */}
        <div className="flex max-w-sm items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 shadow-sm dark:from-amber-900/20 dark:to-orange-900/10">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <div>
            <p className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">Farm Advisory</p>
            <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">{w.advisory}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scan card ──────────────────────────────────────────────────────────────
function ScanCard({
  scan,
  distribution,
}: {
  scan: AnalyticsSummary["recent_scans"][0];
  distribution: { name: string; count: number }[];
}) {
  const healthy  = scan.predicted_class?.toLowerCase().includes("healthy");
  const d        = scan.disease_detail;
  const maxCount = distribution.length > 0 ? distribution[0].count : 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50/30 shadow-lg dark:border-neutral-800 dark:bg-gradient-to-br dark:from-neutral-900 dark:to-emerald-900/10 card-hover">
      {/* Top: image + main info */}
      <div className="flex gap-5 p-6">
        <div className="relative">
          <div className="absolute -inset-3 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 opacity-50 blur-md dark:from-green-900/20 dark:to-teal-900/20"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scan.image}
            alt={scan.predicted_class}
            className="relative h-28 w-28 shrink-0 rounded-xl object-cover shadow-lg sm:h-32 sm:w-32"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {/* Plant + badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {scan.plant}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm ${
              healthy
                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/40 dark:to-emerald-900/20 dark:text-green-300"
                : "bg-gradient-to-r from-red-100 to-orange-100 text-red-800 dark:from-red-900/40 dark:to-orange-900/20 dark:text-red-300"
            }`}>
              {healthy
                ? <CheckCircle2 className="h-4 w-4" />
                : <AlertTriangle className="h-4 w-4" />}
              {scan.disease_name}
            </span>
          </div>

          {/* Confidence */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              AI Detection Confidence
            </p>
            <ConfidenceBar value={scan.confidence ?? 0} />
          </div>

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="text-gray-400">Scanned on </span>
            {formatDate(scan.created_at)}
          </p>
        </div>
      </div>

      {/* Disease detail */}
      {d && !healthy && (
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-white px-5 py-4 dark:border-neutral-800 dark:bg-gradient-to-r dark:from-neutral-900/50 dark:to-neutral-800/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Disease Analysis
          </p>
          <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-neutral-700 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { icon: <Activity className="h-5 w-5 text-red-500" />, label: "Symptoms",   text: d.symptoms },
              { icon: <Pill className="h-5 w-5 text-blue-500" />, label: "Treatment", text: d.treatment },
              { icon: <ShieldCheck className="h-5 w-5 text-green-500" />, label: "Prevention", text: d.prevention },
            ].map(({ icon, label, text }) => text ? (
              <div key={label} className="flex gap-4 px-5 py-4">
                <span className="mt-0.5 shrink-0 rounded-lg bg-white p-2 shadow-sm dark:bg-neutral-800">
                  {icon}
                </span>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {label}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {text}
                  </p>
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Disease distribution */}
      {distribution.length > 0 && (
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-white px-5 py-5 dark:border-neutral-800 dark:bg-gradient-to-r dark:from-neutral-900/50 dark:to-neutral-800/50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Disease Distribution
          </p>
          <div className="space-y-3">
            {distribution.map(item => (
              <div key={item.name} className="animate-fade-in">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-gray-700 dark:text-gray-300">
                    {item.name.replaceAll("___", " — ").replaceAll("_", " ")}
                  </span>
                  <span className="ml-3 shrink-0 font-bold text-gray-600 dark:text-gray-400">
                    {item.count}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-teal-500 dark:from-green-600 dark:to-teal-600"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardContent() {
  const { user }              = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const location              = user?.profile?.location ?? "";

  const load = useCallback(() => {
    setLoading(true);
    setOffline(false);
    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <Spinner />;
  if (offline || !summary) return <ApiOffline onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="mb-8 animate-slide-in-left">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Good {greeting()}, {user?.first_name || "Farmer"}! 👋
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Here's your personalized farm overview for today
            </p>
          </div>
        </div>
      </div>

      {/* Weather */}
      <WeatherWidget location={location} />

      {/* Scans */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/40 dark:to-teal-900/40">
              <ScanSearch className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Scan Results
          </h2>
          <Link
            href="/scan"
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              + New Scan
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-green-700 to-teal-700 transition-transform group-hover:translate-x-0"></span>
          </Link>
        </div>

        {summary.recent_scans.length === 0 ? (
          <EmptyState
            message="No scans yet. Tap New Scan to upload a leaf image."
            icon={<Microscope className="h-8 w-8" />}
          />
        ) : (
          <div className="space-y-4">
            {summary.recent_scans.map((scan, idx) => (
              <ScanCard
                key={scan.id}
                scan={scan}
                /* show distribution only on the first card */
                distribution={idx === 0 ? summary.disease_distribution : []}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

export default function DashboardPage() {
  return (
    <RouteGuard role="farmer">
      <DashboardContent />
    </RouteGuard>
  );
}
