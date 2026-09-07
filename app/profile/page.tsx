"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { updateMe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RouteGuard from "@/components/RouteGuard";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import { PageHeader, Card, inputCls, ErrorBanner } from "@/components/ui";
import {
  Camera, User, Mail, Phone, MapPin,
  FileText, Save, CheckCircle2, Tractor, ShoppingBag,
  Trash2, AlertTriangle,
} from "lucide-react";

function ProfileContent() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName]   = useState(user?.last_name  ?? "");
  const [phone, setPhone]         = useState(user?.profile?.phone    ?? "");
  const [location, setLocation]   = useState(user?.profile?.location ?? "");
  const [bio, setBio]             = useState(user?.profile?.bio      ?? "");
  const [avatarPreview, setAvatarPreview] = useState(user?.profile?.avatar_url ?? "");

  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // keep form in sync if auth user changes (e.g. after Google callback)
  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name   ?? "");
    setPhone(user.profile?.phone    ?? "");
    setLocation(user.profile?.location ?? "");
    setBio(user.profile?.bio       ?? "");
    setAvatarPreview(user.profile?.avatar_url ?? "");
  }, [user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview locally — in production you'd upload to S3/Cloudinary
    // and send back the URL. For now we store a data-URL in avatar_url.
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateMe({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        phone:    phone.trim(),
        location: location.trim(),
        bio:      bio.trim(),
        avatar_url: avatarPreview,
      } as Parameters<typeof updateMe>[0]);
      setUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const isFarmer = user?.profile?.role === "farmer";
  const initials = (
    ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")) || (user?.email?.[0] ?? "?")
  ).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your personal information and account settings" />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar + name card */}
        <Card className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md dark:border-neutral-800">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-3xl font-bold text-white ${
                  isFarmer ? "bg-green-600" : "bg-teal-600"
                }`}>
                  {initials}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-700 text-white shadow hover:bg-green-800 dark:border-neutral-800"
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name + role badge */}
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.email}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isFarmer
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
              }`}>
              {isFarmer
                ? <><Tractor className="h-3.5 w-3.5" /> Farmer</>
                : <><ShoppingBag className="h-3.5 w-3.5" /> Buyer</>}
            </div>
          </div>
        </Card>

        {/* Info fields */}
        <Card className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>

          {error && <ErrorBanner message={error} />}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:border-green-700/40 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Profile saved successfully.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className={`${inputCls} pl-10`} value={firstName}
                  onChange={e => setFirstName(e.target.value)} placeholder="Ali" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input className={inputCls} value={lastName}
                onChange={e => setLastName(e.target.value)} placeholder="Khan" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input className={`${inputCls} pl-10 opacity-60`} value={user?.email ?? ""} disabled />
            </div>
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="tel" className={`${inputCls} pl-10`} value={phone}
                  onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className={`${inputCls} pl-10`} value={location}
                  onChange={e => setLocation(e.target.value)} placeholder="Punjab, Lahore, Pakistan" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <textarea rows={3} className={`${inputCls} pl-10`} value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell others a bit about yourself or your farm…" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50">
              {saving
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </Card>
      </form>

      {/* Delete Account Section */}
      <Card className="border-red-200 bg-gradient-to-br from-red-50/50 to-white dark:border-red-900/30 dark:from-red-950/10 dark:to-neutral-900/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Danger Zone</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-white/50 px-4 py-3 dark:border-red-800/30 dark:bg-neutral-800/30">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Delete Your Account</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Permanently remove your account and all associated data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium">What happens when you delete your account:</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                Your profile information will be permanently deleted
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                All your farms, crops, and scan history will be removed
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                Marketplace listings and chat history will be deleted
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                You will be logged out immediately
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RouteGuard>
      <ProfileContent />
    </RouteGuard>
  );
}
