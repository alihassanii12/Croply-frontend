"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Listing, getListings, createListing, deleteListing } from "@/lib/api";
import {
  ApiOffline, Card, EmptyState, ErrorBanner, Modal, PageHeader,
  Spinner, btnCls, btnDangerCls, btnOutlineCls, formatDate, inputCls,
} from "@/components/ui";
import RouteGuard from "@/components/RouteGuard";
import { useAuth } from "@/lib/auth";
import { usePush } from "@/lib/usePush";
import {
  ShoppingCart, Plus, Trash2, Phone, User,
  PackageOpen, CalendarDays, MessageCircle, Bell, X,
} from "lucide-react";

const EMPTY: Partial<Listing> = {
  title: "", description: "", price: "",
  quantity: "", unit: "kg", contact: "",
};

function MarketplaceContent() {
  const router = useRouter();
  const { isFarmer, isBuyer } = useAuth();
  const { isSupported, permission, subscribe, requestPermission, loading: pushLoading, error: pushError } = usePush();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Listing>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Push notification prompt state
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushPromptDismissed, setPushPromptDismissed] = useState(false);

  // Check if push prompt was previously dismissed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("croply_push_prompt_dismissed");
      setPushPromptDismissed(dismissed === "true");
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setOffline(false);
    getListings()
      .then(setListings)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Show push notification prompt for buyers
  useEffect(() => {
    if (
      isBuyer &&
      isSupported &&
      permission === "default" &&
      !pushPromptDismissed &&
      listings.length > 0
    ) {
      setShowPushPrompt(true);
    }
  }, [isBuyer, isSupported, permission, pushPromptDismissed, listings.length]);

  const handleEnablePushNotifications = async () => {
    try {
      await requestPermission();
      if (permission === "granted") {
        await subscribe();
      }
      setShowPushPrompt(false);
    } catch (err) {
      console.error("Failed to enable push notifications:", err);
    }
  };

  const handleDismissPushPrompt = () => {
    setShowPushPrompt(false);
    setPushPromptDismissed(true);
    // Could store this in localStorage to persist across sessions
    localStorage.setItem("croply_push_prompt_dismissed", "true");
  };

  async function handleSave() {
    if (!form.title?.trim()) { setFormError("Title is required."); return; }
    if (form.price === "" || form.price === undefined) { setFormError("Price is required."); return; }
    setSaving(true); setFormError("");
    try {
      const created = await createListing(form);
      setListings((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteListing(deleteTarget.id);
      setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  return (
    <div>
      <PageHeader
        title="Marketplace"
        subtitle={isFarmer ? "Buy and sell farm produce" : "Browse available produce"}
      />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </p>
        {isFarmer && (
          <button onClick={() => { setForm(EMPTY); setFormError(""); setModalOpen(true); }}
            className={`${btnCls} flex items-center gap-2`}>
            <Plus className="h-4 w-4" />
            New Listing
          </button>
        )}
      </div>

      {/* Push notification prompt for buyers */}
      {showPushPrompt && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700/50 dark:bg-green-950/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Stay updated on new listings
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Get instant notifications when farmers post new produce for sale.
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={handleEnablePushNotifications}
                    disabled={pushLoading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {pushLoading ? "Enabling..." : "Enable Notifications"}
                  </button>
                  <button
                    onClick={handleDismissPushPrompt}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/30"
                  >
                    Maybe Later
                  </button>
                </div>
                {pushError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {pushError}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDismissPushPrompt}
              className="rounded-lg p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : offline ? <ApiOffline onRetry={load} /> :
        listings.length === 0 ? (
          <EmptyState
            message={isFarmer ? "No listings yet. Post your first item for sale." : "No listings available right now."}
            icon={<ShoppingCart className="h-7 w-7" />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                      {listing.title}
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                      PKR {Number(listing.price).toLocaleString()}
                      {listing.unit && (
                        <span className="ml-1 text-sm font-normal text-gray-500">
                          / {listing.unit}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Only show delete to the listing owner (farmer) */}
                  {listing.is_mine && (
                    <button onClick={() => setDeleteTarget(listing)}
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {listing.description && (
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {listing.description}
                  </p>
                )}

                <div className="space-y-1.5 border-t border-gray-100 pt-3 text-sm text-gray-600 dark:border-neutral-800 dark:text-gray-400">
                  {listing.quantity && (
                    <div className="flex items-center gap-2">
                      <PackageOpen className="h-3.5 w-3.5 shrink-0" />
                      <span>{listing.quantity} {listing.unit}</span>
                    </div>
                  )}
                  {/* Seller with avatar */}
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-neutral-700">
                      {listing.seller_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.seller_avatar}
                          alt={listing.seller_name}
                          className="h-5 w-5 object-cover"
                        />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center bg-green-100 text-green-700 text-xs font-bold dark:bg-green-900/40 dark:text-green-400">
                          {listing.seller_name?.[0]?.toUpperCase() ?? <User className="h-3 w-3" />}
                        </span>
                      )}
                    </span>
                    <span className="truncate">{listing.seller_name}</span>
                  </div>
                  {listing.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{listing.contact}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDate(listing.created_at)}</span>
                  </div>
                </div>

                {/* Chat button for buyers only (not listing owners) */}
                {!listing.is_mine && (
                  <div className="border-t border-gray-100 pt-3 dark:border-neutral-800">
                    <button
                      onClick={() => router.push(`/marketplace/${listing.id}/chat/${listing.seller_id}`)}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat with Farmer
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      }

      {/* Create modal — farmers only */}
      {isFarmer && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Listing">
          <div className="space-y-4">
            {formError && <ErrorBanner message={formError} />}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input className={inputCls} value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Fresh Wheat — 50kg bags" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea rows={3} className={inputCls} value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Details about the product" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Price (PKR) *</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.price ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 2500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
                <input className={inputCls} value={form.unit ?? "kg"}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, bag, litre…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <input type="number" step="0.01" min="0" className={inputCls}
                  value={form.quantity ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="e.g. 100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact</label>
                <input className={inputCls} value={form.contact ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="Phone / email" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className={btnOutlineCls}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className={btnCls}>
                {saving ? "Saving…" : "Post Listing"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Listing">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remove <span className="font-semibold">{deleteTarget?.title}</span> from the marketplace?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className={btnOutlineCls}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className={btnDangerCls}>
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <RouteGuard>
      <MarketplaceContent />
    </RouteGuard>
  );
}
