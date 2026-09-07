"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Farm, Crop, Listing,
  getFarms, createFarm, updateFarm, deleteFarm,
  getCrops, createCrop, updateCrop, deleteCrop,
  getListings, createListing, deleteListing,
} from "@/lib/api";
import RouteGuard from "@/components/RouteGuard";
import { useAuth } from "@/lib/auth";
import {
  ApiOffline, EmptyState, ErrorBanner,
  Modal, PageHeader, Spinner,
  btnCls, btnDangerCls, btnOutlineCls, formatDate, inputCls,
} from "@/components/ui";
import {
  Tractor, Wheat, ShoppingCart, Plus, Pencil, Trash2,
  MapPin, Scaling, CalendarDays, Tag, PackageOpen,
  Phone, ChevronDown, ChevronUp,
} from "lucide-react";

type Tab = "farms" | "crops" | "listings";

const STATUS_OPTIONS = ["planted", "growing", "harvested", "failed"];
const STATUS_STYLES: Record<string, string> = {
  planted:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  growing:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  harvested: "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-300",
  failed:    "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

const TABS = [
  { key: "farms"    as Tab, label: "Farms",    icon: Tractor },
  { key: "crops"    as Tab, label: "Crops",    icon: Wheat },
  { key: "listings" as Tab, label: "Listings", icon: ShoppingCart },
];

// ── Farm card ──────────────────────────────────────────────────────────────
function FarmCard({
  farm, crops,
  onEdit, onDelete,
}: {
  farm: Farm; crops: Crop[];
  onEdit: (f: Farm) => void; onDelete: (f: Farm) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const farmCrops = crops.filter(c => c.farm === farm.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-100 dark:bg-lime-900/30">
              <Tractor className="h-5 w-5 text-lime-700 dark:text-lime-400" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-bold text-gray-900 dark:text-gray-100">{farm.name}</h3>
              {farm.location && (
                <p className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
                  <MapPin className="h-3 w-3 shrink-0" />{farm.location}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => onEdit(farm)}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(farm)}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-3">
          {farm.size_hectares && (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-neutral-800">
              <Scaling className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{farm.size_hectares} ha</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-neutral-800">
            <Wheat className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{farmCrops.length} crop{farmCrops.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-neutral-800">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">{formatDate(farm.created_at)}</span>
          </div>
        </div>

        {farm.description && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{farm.description}</p>
        )}
      </div>

      {/* Crops toggle */}
      {farmCrops.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex w-full items-center justify-between border-t border-gray-100 px-5 py-3 text-xs font-semibold text-gray-400 transition hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            <span className="uppercase tracking-wide">Crops on this farm</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded && (
            <div className="grid gap-2 border-t border-gray-100 px-5 py-4 dark:border-neutral-800 sm:grid-cols-2">
              {farmCrops.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-neutral-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wheat className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                    <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{c.name}</span>
                  </div>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Crop card ──────────────────────────────────────────────────────────────
function CropCard({
  crop, onEdit, onDelete,
}: {
  crop: Crop; onEdit: (c: Crop) => void; onDelete: (c: Crop) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
              <Wheat className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-bold text-gray-900 dark:text-gray-100">{crop.name}</h3>
              <p className="flex items-center gap-1 text-sm text-gray-400">
                <Tractor className="h-3 w-3 shrink-0" />{crop.farm_name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => onEdit(crop)}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(crop)}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[crop.status] ?? ""}`}>
            <Tag className="h-3 w-3" />
            {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
          </span>
          {crop.planted_date && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
              <CalendarDays className="h-3 w-3" />
              Planted {crop.planted_date}
            </span>
          )}
        </div>

        {crop.notes && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{crop.notes}</p>
        )}
      </div>
    </div>
  );
}

// ── Listing card ───────────────────────────────────────────────────────────
function ListingCard({
  lst, onDelete,
}: {
  lst: Listing; onDelete: (l: Listing) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-gray-900 dark:text-gray-100">{lst.title}</h3>
            <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
              PKR {Number(lst.price).toLocaleString()}
              <span className="ml-1 text-sm font-normal text-gray-400">/ {lst.unit}</span>
            </p>
          </div>
          {lst.is_mine && (
            <button onClick={() => onDelete(lst)}
              className="shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {lst.description && (
          <p className="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{lst.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
          {lst.quantity && (
            <span className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-neutral-800">
              <PackageOpen className="h-3.5 w-3.5" />{lst.quantity} {lst.unit}
            </span>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-neutral-800">
            {lst.seller_avatar
              ? <img src={lst.seller_avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> // eslint-disable-line @next/next/no-img-element
              : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  {lst.seller_name?.[0]?.toUpperCase()}
                </span>}
            <span className="truncate">{lst.seller_name}</span>
          </div>
          {lst.contact && (
            <span className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-neutral-800">
              <Phone className="h-3.5 w-3.5" />{lst.contact}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-400">{formatDate(lst.created_at)}</p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
function FarmCropListingContent() {
  const { isFarmer } = useAuth();
  const [tab, setTab] = useState<Tab>("farms");

  const [farms, setFarms]       = useState<Farm[]>([]);
  const [crops, setCrops]       = useState<Crop[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [offline, setOffline]   = useState(false);

  const load = useCallback(() => {
    setLoading(true); setOffline(false);
    Promise.all([getFarms(), getCrops(), getListings()])
      .then(([f, c, l]) => { setFarms(f); setCrops(c); setListings(l); })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  // ── Farm modal state ──────────────────────────────────────────────────────
  const EF: Partial<Farm> = { name: "", location: "", size_hectares: "", description: "" };
  const [farmModal, setFarmModal]   = useState(false);
  const [editFarm, setEditFarm]     = useState<Farm | null>(null);
  const [farmForm, setFarmForm]     = useState<Partial<Farm>>(EF);
  const [farmSaving, setFarmSaving] = useState(false);
  const [farmErr, setFarmErr]       = useState("");
  const [delFarm, setDelFarm]       = useState<Farm | null>(null);
  const [farmDeling, setFarmDeling] = useState(false);

  function openFarmCreate() { setEditFarm(null); setFarmForm(EF); setFarmErr(""); setFarmModal(true); }
  function openFarmEdit(f: Farm) { setEditFarm(f); setFarmForm({ name: f.name, location: f.location, size_hectares: f.size_hectares, description: f.description }); setFarmErr(""); setFarmModal(true); }
  async function saveFarm() {
    if (!farmForm.name?.trim()) { setFarmErr("Farm name is required."); return; }
    setFarmSaving(true); setFarmErr("");
    try {
      if (editFarm) { const u = await updateFarm(editFarm.id, farmForm); setFarms(p => p.map(x => x.id === editFarm.id ? u : x)); }
      else { const c = await createFarm(farmForm); setFarms(p => [c, ...p]); }
      setFarmModal(false);
    } catch (e: unknown) { setFarmErr(e instanceof Error ? e.message : "Save failed."); }
    finally { setFarmSaving(false); }
  }
  async function doDelFarm() {
    if (!delFarm) return; setFarmDeling(true);
    try { await deleteFarm(delFarm.id); setFarms(p => p.filter(x => x.id !== delFarm.id)); setDelFarm(null); }
    catch { /**/ } finally { setFarmDeling(false); }
  }

  // ── Crop modal state ──────────────────────────────────────────────────────
  const EC: Partial<Crop> = { name: "", farm: undefined, planted_date: "", status: "planted", notes: "" };
  const [cropModal, setCropModal]   = useState(false);
  const [editCrop, setEditCrop]     = useState<Crop | null>(null);
  const [cropForm, setCropForm]     = useState<Partial<Crop>>(EC);
  const [cropSaving, setCropSaving] = useState(false);
  const [cropErr, setCropErr]       = useState("");
  const [delCrop, setDelCrop]       = useState<Crop | null>(null);
  const [cropDeling, setCropDeling] = useState(false);

  function openCropCreate() { setEditCrop(null); setCropForm({ ...EC, farm: farms[0]?.id }); setCropErr(""); setCropModal(true); }
  function openCropEdit(c: Crop) { setEditCrop(c); setCropForm({ name: c.name, farm: c.farm, planted_date: c.planted_date, status: c.status, notes: c.notes }); setCropErr(""); setCropModal(true); }
  async function saveCrop() {
    if (!cropForm.name?.trim()) { setCropErr("Crop name is required."); return; }
    if (!cropForm.farm) { setCropErr("Please select a farm."); return; }
    setCropSaving(true); setCropErr("");
    try {
      if (editCrop) { const u = await updateCrop(editCrop.id, cropForm); setCrops(p => p.map(x => x.id === editCrop.id ? u : x)); }
      else { const c = await createCrop(cropForm); setCrops(p => [c, ...p]); }
      setCropModal(false);
    } catch (e: unknown) { setCropErr(e instanceof Error ? e.message : "Save failed."); }
    finally { setCropSaving(false); }
  }
  async function doDelCrop() {
    if (!delCrop) return; setCropDeling(true);
    try { await deleteCrop(delCrop.id); setCrops(p => p.filter(x => x.id !== delCrop.id)); setDelCrop(null); }
    catch { /**/ } finally { setCropDeling(false); }
  }

  // ── Listing modal state ───────────────────────────────────────────────────
  const EL: Partial<Listing> = { title: "", description: "", price: "", quantity: "", unit: "kg", contact: "" };
  const [lstModal, setLstModal]   = useState(false);
  const [lstForm, setLstForm]     = useState<Partial<Listing>>(EL);
  const [lstSaving, setLstSaving] = useState(false);
  const [lstErr, setLstErr]       = useState("");
  const [delLst, setDelLst]       = useState<Listing | null>(null);
  const [lstDeling, setLstDeling] = useState(false);

  async function saveListing() {
    if (!lstForm.title?.trim()) { setLstErr("Title is required."); return; }
    if (!lstForm.price) { setLstErr("Price is required."); return; }
    setLstSaving(true); setLstErr("");
    try { const c = await createListing(lstForm); setListings(p => [c, ...p]); setLstModal(false); }
    catch (e: unknown) { setLstErr(e instanceof Error ? e.message : "Save failed."); }
    finally { setLstSaving(false); }
  }
  async function doDelLst() {
    if (!delLst) return; setLstDeling(true);
    try { await deleteListing(delLst.id); setListings(p => p.filter(x => x.id !== delLst.id)); setDelLst(null); }
    catch { /**/ } finally { setLstDeling(false); }
  }

  const counts = { farms: farms.length, crops: crops.length, listings: listings.length };

  return (
    <div>
      <PageHeader title="Farm Manager" subtitle="Farms, crops and marketplace listings" />

      {/* Tabs + action */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex rounded-2xl border border-gray-100 bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                tab === key
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800"
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${
                tab === key ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-gray-400"
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {tab === "farms" && (
          <button onClick={openFarmCreate} className={`${btnCls} flex shrink-0 items-center gap-2`}>
            <Plus className="h-4 w-4" /> Add Farm
          </button>
        )}
        {tab === "crops" && (
          <button onClick={openCropCreate} disabled={farms.length === 0}
            title={farms.length === 0 ? "Add a farm first" : undefined}
            className={`${btnCls} flex shrink-0 items-center gap-2`}>
            <Plus className="h-4 w-4" /> Add Crop
          </button>
        )}
        {tab === "listings" && isFarmer && (
          <button onClick={() => { setLstForm(EL); setLstErr(""); setLstModal(true); }}
            className={`${btnCls} flex shrink-0 items-center gap-2`}>
            <Plus className="h-4 w-4" /> New Listing
          </button>
        )}
      </div>

      {loading ? <Spinner /> : offline ? <ApiOffline onRetry={load} /> : (
        <>
          {tab === "farms" && (
            farms.length === 0
              ? <EmptyState message="No farms yet. Add your first farm." icon={<Tractor className="h-7 w-7" />} />
              : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {farms.map(f => (
                    <FarmCard key={f.id} farm={f} crops={crops}
                      onEdit={openFarmEdit} onDelete={setDelFarm} />
                  ))}
                </div>
          )}

          {tab === "crops" && (
            crops.length === 0
              ? <EmptyState
                  message={farms.length === 0 ? "Add a farm first, then add crops." : "No crops yet."}
                  icon={<Wheat className="h-7 w-7" />}
                />
              : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {crops.map(c => (
                    <CropCard key={c.id} crop={c}
                      onEdit={openCropEdit} onDelete={setDelCrop} />
                  ))}
                </div>
          )}

          {tab === "listings" && (
            listings.length === 0
              ? <EmptyState message="No listings yet." icon={<ShoppingCart className="h-7 w-7" />} />
              : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map(l => (
                    <ListingCard key={l.id} lst={l} onDelete={setDelLst} />
                  ))}
                </div>
          )}
        </>
      )}

      {/* ── Farm modal ───────────────────────────────────────────── */}
      <Modal open={farmModal} onClose={() => setFarmModal(false)} title={editFarm ? "Edit Farm" : "Add Farm"}>
        <div className="space-y-4">
          {farmErr && <ErrorBanner message={farmErr} />}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
            <input className={inputCls} value={farmForm.name ?? ""} onChange={e => setFarmForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. North Field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input className={inputCls} value={farmForm.location ?? ""} onChange={e => setFarmForm(f => ({ ...f, location: e.target.value }))} placeholder="Punjab, Pakistan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Size (ha)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={farmForm.size_hectares ?? ""} onChange={e => setFarmForm(f => ({ ...f, size_hectares: e.target.value }))} placeholder="5.5" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea rows={2} className={inputCls} value={farmForm.description ?? ""} onChange={e => setFarmForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setFarmModal(false)} className={btnOutlineCls}>Cancel</button>
            <button onClick={saveFarm} disabled={farmSaving} className={btnCls}>{farmSaving ? "Saving…" : editFarm ? "Save Changes" : "Add Farm"}</button>
          </div>
        </div>
      </Modal>
      <Modal open={!!delFarm} onClose={() => setDelFarm(null)} title="Delete Farm">
        <p className="text-sm text-gray-600 dark:text-gray-400">Delete <span className="font-semibold">{delFarm?.name}</span>? This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setDelFarm(null)} className={btnOutlineCls}>Cancel</button>
          <button onClick={doDelFarm} disabled={farmDeling} className={btnDangerCls}>{farmDeling ? "Deleting…" : "Delete"}</button>
        </div>
      </Modal>

      {/* ── Crop modal ───────────────────────────────────────────── */}
      <Modal open={cropModal} onClose={() => setCropModal(false)} title={editCrop ? "Edit Crop" : "Add Crop"}>
        <div className="space-y-4">
          {cropErr && <ErrorBanner message={cropErr} />}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Crop Name *</label>
              <input className={inputCls} value={cropForm.name ?? ""} onChange={e => setCropForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wheat" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Farm *</label>
              <select className={inputCls} value={cropForm.farm ?? ""} onChange={e => setCropForm(f => ({ ...f, farm: Number(e.target.value) }))}>
                <option value="">Select farm</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Planted Date</label>
              <input type="date" className={inputCls} value={cropForm.planted_date ?? ""} onChange={e => setCropForm(f => ({ ...f, planted_date: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select className={inputCls} value={cropForm.status ?? "planted"} onChange={e => setCropForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea rows={2} className={inputCls} value={cropForm.notes ?? ""} onChange={e => setCropForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setCropModal(false)} className={btnOutlineCls}>Cancel</button>
            <button onClick={saveCrop} disabled={cropSaving} className={btnCls}>{cropSaving ? "Saving…" : editCrop ? "Save Changes" : "Add Crop"}</button>
          </div>
        </div>
      </Modal>
      <Modal open={!!delCrop} onClose={() => setDelCrop(null)} title="Delete Crop">
        <p className="text-sm text-gray-600 dark:text-gray-400">Delete <span className="font-semibold">{delCrop?.name}</span>?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setDelCrop(null)} className={btnOutlineCls}>Cancel</button>
          <button onClick={doDelCrop} disabled={cropDeling} className={btnDangerCls}>{cropDeling ? "Deleting…" : "Delete"}</button>
        </div>
      </Modal>

      {/* ── Listing modal ─────────────────────────────────────────── */}
      {isFarmer && (
        <Modal open={lstModal} onClose={() => setLstModal(false)} title="New Listing">
          <div className="space-y-4">
            {lstErr && <ErrorBanner message={lstErr} />}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input className={inputCls} value={lstForm.title ?? ""} onChange={e => setLstForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Fresh Wheat — 50kg bags" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea rows={2} className={inputCls} value={lstForm.description ?? ""} onChange={e => setLstForm(f => ({ ...f, description: e.target.value }))} placeholder="Details about the product" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Price (PKR) *</label>
                <input type="number" step="0.01" min="0" className={inputCls} value={lstForm.price ?? ""} onChange={e => setLstForm(f => ({ ...f, price: e.target.value }))} placeholder="2500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
                <input className={inputCls} value={lstForm.unit ?? "kg"} onChange={e => setLstForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, bag…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <input type="number" step="0.01" min="0" className={inputCls} value={lstForm.quantity ?? ""} onChange={e => setLstForm(f => ({ ...f, quantity: e.target.value }))} placeholder="100" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact</label>
                <input className={inputCls} value={lstForm.contact ?? ""} onChange={e => setLstForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone / email" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setLstModal(false)} className={btnOutlineCls}>Cancel</button>
              <button onClick={saveListing} disabled={lstSaving} className={btnCls}>{lstSaving ? "Saving…" : "Post Listing"}</button>
            </div>
          </div>
        </Modal>
      )}
      <Modal open={!!delLst} onClose={() => setDelLst(null)} title="Remove Listing">
        <p className="text-sm text-gray-600 dark:text-gray-400">Remove <span className="font-semibold">{delLst?.title}</span>?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setDelLst(null)} className={btnOutlineCls}>Cancel</button>
          <button onClick={doDelLst} disabled={lstDeling} className={btnDangerCls}>{lstDeling ? "Removing…" : "Remove"}</button>
        </div>
      </Modal>
    </div>
  );
}

export default function FarmsPage() {
  return (
    <RouteGuard role="farmer">
      <FarmCropListingContent />
    </RouteGuard>
  );
}
