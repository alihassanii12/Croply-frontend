"use client";

/**
 * Google OAuth callback page.
 *
 * Google redirects here with a URL fragment like:
 *   #access_token=...&id_token=...&state=...
 *
 * Flow:
 *  - Parse the id_token and state from the fragment.
 *  - POST id_token to backend /api/accounts/google/ with the role from state.
 *  - If the backend returns a user with a profile (existing user) → redirect to home.
 *  - If brand-new Google user (no phone/location) → show "complete profile" form
 *    so we can collect extra details before proceeding.
 */

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { googleAuth, updateMe, tokens, setRole, getMe, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { inputCls } from "@/components/ui";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import { Leaf, Phone, MapPin, User } from "lucide-react";

type Stage =
  | "loading"         // parsing hash + calling backend
  | "complete"        // new Google user — collect extra info
  | "role_select"     // needs to select role
  | "error";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [userData, setUserData] = useState<AuthUser | null>(null);

  // Extra-details form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [location, setLocation]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [roleSelecting, setRoleSelecting] = useState(false);

  useEffect(() => {
    async function handle() {
      if (typeof window === "undefined") return;

      // Parse fragment
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const idToken = params.get("id_token");

      if (!idToken) {
        setErrorMsg("No id_token found in the callback URL.");
        setStage("error");
        return;
      }

      try {
        // Call Google auth WITHOUT role (role is optional now)
        const res = await googleAuth(idToken);
        tokens.set(res.access, res.refresh);
        setUser(res.user);
        setUserData(res.user);

        // Check if user needs to select a role
        if (res.needs_role) {
          setStage("role_select");
          return;
        }

        // If user has no phone/location (freshly created Google account)
        // ask them to fill in extra details
        const profile = res.user.profile;
        const isNew = !profile?.phone && !profile?.location;

        if (isNew) {
          setFirstName(res.user.first_name ?? "");
          setLastName(res.user.last_name ?? "");
          setStage("complete");
        } else {
          const role = res.user.profile?.role;
          router.replace(role === "farmer" ? "/" : "/marketplace");
        }
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "Google sign-in failed.");
        setStage("error");
      }
    }

    handle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleComplete(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      } as Parameters<typeof updateMe>[0]);
      setUser(updated);
      router.replace(updated.profile?.role === "farmer" ? "/" : "/marketplace");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Could not save details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleSelect(role: "farmer" | "buyer") {
    setRoleSelecting(true);
    try {
      // Use the new setRole function which should return tokens
      const response = await setRole(role);
      
      // Update tokens if returned
      if (response.access && response.refresh) {
        tokens.set(response.access, response.refresh);
      }
      
      // Update user in state
      if (response.user) {
        setUser(response.user);
        setUserData(response.user);
      }
      
      // Check if user needs to complete profile
      const profile = response.user?.profile;
      const isNew = !profile?.phone && !profile?.location;
      
      if (isNew) {
        setStage("complete");
      } else {
        router.replace(profile?.role === "farmer" ? "/" : "/marketplace");
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to update role.");
      setStage("error");
    } finally {
      setRoleSelecting(false);
    }
  }

  const handleRoleSelectedFromModal = async () => {
    // Role has been set by modal - now fetch updated user data
    // Set stage to loading while fetching
    setStage("loading");
    
    try {
      // Small delay to ensure backend has processed the role update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refetch user data to get updated profile with role
      const updatedUser = await getMe();
      setUser(updatedUser);
      setUserData(updatedUser);
      
      // Check if user needs to complete profile
      const profile = updatedUser.profile;
      const isNew = !profile?.phone && !profile?.location;
      
      if (isNew) {
        setStage("complete");
      } else {
        router.replace(profile?.role === "farmer" ? "/" : "/marketplace");
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load user data.");
      setStage("error");
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (stage === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Signing you in with Google…</p>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────── */
  if (stage === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <p className="font-semibold text-gray-900 dark:text-gray-100">Sign-in failed</p>
        <p className="max-w-sm text-sm text-gray-500">{errorMsg}</p>
        <button
          onClick={() => router.push("/login")}
          className="rounded-xl bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
        >
          Back to Login
        </button>
      </div>
    );
  }

  /* ── Role selection ───────────────────────────────────────────── */
  if (stage === "role_select") {
    return (
      <>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Preparing your account...</p>
        </div>
        <RoleSelectionModal
          isOpen={true}
          onClose={() => {
            setStage("error");
            setErrorMsg("Role selection is required to continue.");
          }}
          onRoleSelected={handleRoleSelectedFromModal}
          userEmail={userData?.email}
        />
      </>
    );
  }

  /* ── Complete profile ────────────────────────────────────────────── */
  if (stage === "complete") {
    return (
      <div className="-mx-4 -my-8 flex min-h-[calc(100vh-4rem)]">
        {/* Brand panel */}
        <div className="hidden w-[420px] shrink-0 flex-col justify-between bg-green-950 px-12 py-16 lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
              <Leaf className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl font-bold text-white">Croply</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">Almost there!</h1>
            <p className="mt-4 text-lg text-green-300">
              Just a few more details to personalise your experience.
            </p>
          </div>
          <p className="text-xs text-green-600">© {new Date().getFullYear()} Croply</p>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700">
                <Leaf className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold text-green-950 dark:text-green-100">Croply</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Complete your profile</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              These details help farmers and buyers connect with you.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleComplete} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input required className={`${inputCls} pl-10`} value={firstName}
                      onChange={e => setFirstName(e.target.value)} placeholder="Ali" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input className={inputCls} value={lastName}
                    onChange={e => setLastName(e.target.value)} placeholder="Khan" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="tel" className={`${inputCls} pl-10`} value={phone}
                    onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input className={`${inputCls} pl-10`} value={location}
                    onChange={e => setLocation(e.target.value)} placeholder="Punjab, Lahore, Pakistan" />
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
                <span className="relative z-10">
                  {saving
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : "Save & Continue"}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-green-700 to-teal-700 transition-transform group-hover:translate-x-0"></span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Should never reach here
  return null;
}