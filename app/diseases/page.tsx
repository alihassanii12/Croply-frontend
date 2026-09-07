"use client";

import { useCallback, useEffect, useState } from "react";
import { Disease, getDiseases } from "@/lib/api";
import RouteGuard from "@/components/RouteGuard";
import { ApiOffline, EmptyState, PageHeader, Spinner } from "@/components/ui";
import {
  Bug, CheckCircle2, Search, ShieldCheck,
  Stethoscope, Sprout, X, Activity,
} from "lucide-react";

// ── Detail panel (slide-in from right) ────────────────────────────────────
function DetailPanel({
  disease,
  onClose,
}: {
  disease: Disease | null;
  onClose: () => void;
}) {
  if (!disease) return null;

  const sections = [
    { icon: <Sprout className="h-4 w-4 text-green-500" />,     label: "Description", text: disease.description },
    { icon: <Activity className="h-4 w-4 text-red-400" />,     label: "Symptoms",    text: disease.symptoms },
    { icon: <Stethoscope className="h-4 w-4 text-blue-400" />, label: "Treatment",   text: disease.treatment },
    { icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, label: "Prevention", text: disease.prevention },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className={`px-6 py-5 ${disease.is_healthy ? "bg-green-600" : "bg-red-500"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                {disease.plant}
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                {disease.display_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-white/80 hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            disease.is_healthy
              ? "bg-white/20 text-white"
              : "bg-white/20 text-white"
          }`}>
            {disease.is_healthy
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Healthy Plant</>
              : <><Bug className="h-3.5 w-3.5" /> Disease</>}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 divide-y divide-gray-100 dark:divide-neutral-800">
          {sections.map(s => s.text ? (
            <div key={s.label} className="px-6 py-5">
              <div className="mb-2 flex items-center gap-2">
                {s.icon}
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {s.label}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {s.text}
              </p>
            </div>
          ) : null)}
        </div>
      </div>
    </>
  );
}

// ── Disease card ───────────────────────────────────────────────────────────
function DiseaseCard({
  disease,
  onClick,
}: {
  disease: Disease;
  onClick: (d: Disease) => void;
}) {
  return (
    <button
      onClick={() => onClick(disease)}
      className="group w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:border-green-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-green-700"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          disease.is_healthy
            ? "bg-green-100 dark:bg-green-900/40"
            : "bg-red-100 dark:bg-red-900/30"
        }`}>
          {disease.is_healthy
            ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            : <Bug className="h-5 w-5 text-red-500 dark:text-red-400" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
            {disease.display_name}
          </p>
          <p className="mt-0.5 text-sm text-gray-400">{disease.plant}</p>

          {/* Short preview */}
          {disease.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {disease.description}
            </p>
          )}

          {/* Tags */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {disease.symptoms && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                Symptoms
              </span>
            )}
            {disease.treatment && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                Treatment
              </span>
            )}
            {disease.prevention && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                Prevention
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
function DiseasesContent() {
  const [diseases, setDiseases]   = useState<Disease[]>([]);
  const [loading, setLoading]     = useState(true);
  const [offline, setOffline]     = useState(false);
  const [query, setQuery]         = useState("");
  const [selected, setSelected]   = useState<Disease | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "healthy" | "diseased">("all");

  const load = useCallback(() => {
    setLoading(true);
    setOffline(false);
    getDiseases()
      .then(setDiseases)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = diseases.filter(d => {
    const matchesQuery =
      d.display_name.toLowerCase().includes(query.toLowerCase()) ||
      d.plant.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (activeTab === "healthy") return d.is_healthy;
    if (activeTab === "diseased") return !d.is_healthy;
    return true;
  });

  const totalHealthy  = diseases.filter(d => d.is_healthy).length;
  const totalDiseased = diseases.filter(d => !d.is_healthy).length;

  if (loading) return <Spinner />;
  if (offline)  return <ApiOffline onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Disease Library"
        subtitle={`${diseases.length} plant conditions — ${totalDiseased} diseases, ${totalHealthy} healthy`}
      />

      {/* Search + filter tabs */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search disease or plant…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 dark:focus:ring-green-900/40"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          {([
            { key: "all",      label: `All (${diseases.length})` },
            { key: "diseased", label: `Diseases (${totalDiseased})` },
            { key: "healthy",  label: `Healthy (${totalHealthy})` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState message="No results found." icon={<Bug className="h-7 w-7" />} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <DiseaseCard key={d.id} disease={d} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* Detail panel */}
      <DetailPanel disease={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function DiseasesPage() {
  return (
    <RouteGuard>
      <DiseasesContent />
    </RouteGuard>
  );
}
