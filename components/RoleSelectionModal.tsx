"use client";

import { useState, useEffect } from "react";
import { Tractor, ShoppingBag, CheckCircle2, X, Loader2 } from "lucide-react";
import { updateGoogleRole } from "@/lib/api";
import { tokens } from "@/lib/api";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelected: () => void;
  userEmail?: string;
}

export default function RoleSelectionModal({ 
  isOpen, 
  onClose, 
  onRoleSelected,
  userEmail 
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<"farmer" | "buyer" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(null);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleRoleSelect = (role: "farmer" | "buyer") => {
    setSelectedRole(role);
    setError("");
  };

  const handleConfirm = async () => {
    if (!selectedRole) {
      setError("Please select a role to continue");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Call the updated role selection endpoint
      const response = await updateGoogleRole(selectedRole);
      
      // Get tokens from SetRoleView response (should be in the response if it's the new SetRoleView)
      // The updated SetRoleView should return tokens
      const accessToken = (response as any)?.access;
      const refreshToken = (response as any)?.refresh;
      
      if (accessToken && refreshToken) {
        tokens.set(accessToken, refreshToken);
      }
      
      // Notify parent - let parent handle modal closing and navigation
      // Don't call onClose() here as it triggers error state in Google callback
      onRoleSelected();
    } catch (err: any) {
      console.error("Role selection error:", err);
      setError(err.message || "Failed to set role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 shadow-2xl dark:from-neutral-900 dark:to-green-950/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
          aria-label="Close"
          disabled={isSubmitting}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-8 pb-4">
          <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-green-100/50 dark:bg-green-900/20"></div>
          <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-teal-100/30 dark:bg-teal-900/10"></div>
          
          <div className="relative">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Choose Your Role
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {userEmail ? `Welcome, ${userEmail}! ` : ""}
              Select how you want to use Croply. You can't change this later.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Role selection cards */}
        <div className="px-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Farmer Card */}
            <button
              onClick={() => handleRoleSelect("farmer")}
              disabled={isSubmitting}
              className={`relative flex flex-col items-center gap-4 rounded-xl border-2 p-5 text-center transition-all duration-300 ${
                selectedRole === "farmer"
                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg ring-2 ring-green-200 ring-offset-1 dark:from-green-950/40 dark:to-emerald-950/20 dark:ring-green-800/40"
                  : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-green-500/40"
              } ${isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {selectedRole === "farmer" && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              
              <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                selectedRole === "farmer"
                  ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-gray-400"
              }`}>
                <Tractor className="h-8 w-8" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Farmer</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                  Manage farms, crops, AI disease detection, and sell produce directly to buyers
                </p>
              </div>
              
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Grow & Sell
              </div>
            </button>

            {/* Buyer Card */}
            <button
              onClick={() => handleRoleSelect("buyer")}
              disabled={isSubmitting}
              className={`relative flex flex-col items-center gap-4 rounded-xl border-2 p-5 text-center transition-all duration-300 ${
                selectedRole === "buyer"
                  ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg ring-2 ring-teal-200 ring-offset-1 dark:from-teal-950/40 dark:to-cyan-950/20 dark:ring-teal-800/40"
                  : "border-gray-200 bg-white hover:border-teal-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-teal-500/40"
              } ${isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {selectedRole === "buyer" && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              
              <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                selectedRole === "buyer"
                  ? "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400"
                  : "bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-gray-400"
              }`}>
                <ShoppingBag className="h-8 w-8" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Buyer</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                  Browse fresh farm produce, connect with farmers directly, and make purchases
                </p>
              </div>
              
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                Browse & Buy
              </div>
            </button>
          </div>

          {/* Selection hints */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                <span className="text-xs font-medium">i</span>
              </div>
              <span>Choose <strong>Farmer</strong> if you grow crops or manage a farm</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                <span className="text-xs font-medium">i</span>
              </div>
              <span>Choose <strong>Buyer</strong> if you want to purchase fresh produce</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 border-t border-gray-200 bg-gray-50 px-6 py-5 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedRole || isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-green-600 disabled:hover:to-teal-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting Role...
                </>
              ) : (
                <>
                  Confirm & Continue
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}