"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Scan, createScan, getScans, deleteScan } from "@/lib/api";
import RouteGuard from "@/components/RouteGuard";
import {
  ApiOffline,
  Card,
  ConfidenceBar,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
  btnCls,
  btnDangerCls,
  formatDate,
} from "@/components/ui";
import {
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Microscope,
  ImagePlus,
  X,
} from "lucide-react";

function ScanContent() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [result, setResult] = useState<Scan | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadScans = useCallback(() => {
    setLoading(true);
    setOffline(false);
    getScans()
      .then(setScans)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadScans, [loadScans]);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setUploadError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setUploadError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleScan() {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setResult(null);
    try {
      const scan = await createScan(file);
      setResult(scan);
      setScans((prev) => [scan, ...prev]);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (result?.id === id) setResult(null);
    } catch {
      /* ignore */
    }
  }

  const isHealthy = (s: Scan) =>
    s.predicted_class?.toLowerCase().includes("healthy");

  return (
    <div>
      <PageHeader
        title="Leaf Scanner"
        subtitle="Upload a leaf image to detect diseases using AI"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload panel */}
        <div className="space-y-4">
          <Card>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !file && inputRef.current?.click()}
              className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
                file
                  ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                  : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-green-600 dark:hover:bg-green-950/20"
              }`}
            >
              {preview ? (
                <div className="relative w-full px-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="mx-auto max-h-56 rounded-lg object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="absolute right-6 top-0 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag &amp; drop or click to select an image
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleScan}
                disabled={!file || uploading}
                className={`${btnCls} flex flex-1 items-center justify-center gap-2`}
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Scan Leaf
                  </>
                )}
              </button>
              {file && (
                <button
                  onClick={clearFile}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-800"
                >
                  Clear
                </button>
              )}
            </div>

            {uploadError && <ErrorBanner message={uploadError} />}
          </Card>

          {/* Result card */}
          {result && (
            <Card>
              <div className="mb-3 flex items-center gap-2">
                {isHealthy(result) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Scan Result
                </h3>
              </div>

              {result.inference_error ? (
                <ErrorBanner message={result.inference_error} />
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Plant
                      </p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                        {result.plant || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Condition
                      </p>
                      <p className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                        {result.disease_name || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      Confidence
                    </p>
                    <ConfidenceBar value={result.confidence ?? 0} />
                  </div>

                  {result.top_predictions?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Top predictions
                      </p>
                      <div className="space-y-1.5">
                        {result.top_predictions.slice(0, 3).map((p) => (
                          <div key={p.class_name}>
                            <div className="mb-0.5 flex items-center justify-between text-xs">
                              <span className="truncate text-gray-700 dark:text-gray-300">
                                {p.class_name
                                  .replaceAll("___", " — ")
                                  .replaceAll("_", " ")}
                              </span>
                              <span className="ml-2 text-gray-500">
                                {Math.round(p.confidence * 100)}%
                              </span>
                            </div>
                            <ConfidenceBar value={p.confidence} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.disease_detail && (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        Treatment
                      </p>
                      <p className="mt-1 text-amber-700 dark:text-amber-400">
                        {result.disease_detail.treatment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* History */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-green-950 dark:text-green-100">
            Scan History
          </h2>

          {loading ? (
            <Spinner />
          ) : offline ? (
            <ApiOffline onRetry={loadScans} />
          ) : scans.length === 0 ? (
            <EmptyState
              message="No scans yet. Upload a leaf image to get started."
              icon={<Microscope className="h-7 w-7" />}
            />
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => (
                <Card key={scan.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scan.image}
                    alt={scan.predicted_class}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isHealthy(scan) ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {scan.plant} — {scan.disease_name}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(scan.created_at)}
                    </p>
                    <div className="mt-1">
                      <ConfidenceBar value={scan.confidence ?? 0} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(scan.id)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <RouteGuard role="farmer">
      <ScanContent />
    </RouteGuard>
  );
}
