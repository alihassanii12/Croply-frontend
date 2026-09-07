"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

/**
 * Wraps a page that requires authentication.
 * role="farmer"  → only farmers allowed
 * role="buyer"   → only buyers allowed
 * role omitted   → any authenticated user
 */
export default function RouteGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "farmer" | "buyer";
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role === "farmer" && user.profile?.role !== "farmer") {
      router.replace("/marketplace");
    }
    if (role === "buyer" && user.profile?.role !== "buyer") {
      router.replace("/");
    }
  }, [user, loading, role, router]);

  if (loading) return <Spinner label="Checking session…" />;
  if (!user) return null;
  if (role === "farmer" && user.profile?.role !== "farmer") return null;
  if (role === "buyer" && user.profile?.role !== "buyer") return null;

  return <>{children}</>;
}
