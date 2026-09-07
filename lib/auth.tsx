"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthUser, getMe, logout as apiLogout, tokens } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isFarmer: boolean;
  isBuyer: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount — rehydrate from stored access token
  useEffect(() => {
    if (!tokens.getAccess()) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        tokens.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokens.getRefresh();
    if (refresh) {
      try {
        await apiLogout(refresh);
      } catch {
        /* server-side blacklist failure is non-critical */
      }
    }
    tokens.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  const isFarmer = user?.profile?.role === "farmer";
  const isBuyer = user?.profile?.role === "buyer";

  return (
    <AuthContext.Provider
      value={{ user, loading, isFarmer, isBuyer, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
