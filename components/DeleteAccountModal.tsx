"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount, tokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, X, Loader2, ShieldAlert } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      setError("Please type 'DELETE MY ACCOUNT' exactly as shown to confirm.");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deleteAccount(confirmText);
      
      // Clear tokens and user data
      tokens.clear();
      setUser(null);
      
      // Close modal and redirect to home
      onClose();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setError(err.message || "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-white to-red-50 shadow-2xl dark:from-neutral-900 dark:to-red-950/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
          aria-label="Close"
          disabled={isDeleting}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-8 pb-4">
          <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-red-100/30 dark:bg-red-900/10"></div>
          
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Delete Your Account
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Confirm with text only - no password needed. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Warning section */}
        <div className="mx-6 mb-4 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-700/30 dark:bg-amber-900/10">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Warning: Irreversible Action
              </p>
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  All your farms, crops, and scan history will be deleted
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Your marketplace listings and chat history will be removed
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  This action cannot be reversed or recovered
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-2 space-y-4">
          {/* Confirmation text */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm deletion
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              disabled={isDeleting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This is the only step required to delete your account. No password needed.
            </p>
          </div>

          {/* User info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/50">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Account to be deleted:</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.email}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Role: <span className="font-medium capitalize">{user?.profile?.role}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 border-t border-gray-200 bg-gray-50 px-6 py-5 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "DELETE MY ACCOUNT"}
              className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Delete Account
                </>
              )}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-red-700 to-orange-700 transition-transform group-hover:translate-x-0"></span>
            </button>
          </div>
          
          <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
            By clicking "Delete Account", you agree to permanently remove all your data from Croply.
          </p>
        </div>
      </div>
    </div>
  );
}