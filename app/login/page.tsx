"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, tokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// small growing-plant mark that sits next to the wordmark
function GrowthMark({ stage }: { stage: 0 | 1 | 2 | 3 }) {
    return (
        <div className="relative h-6 w-5 shrink-0">
            <div className="absolute bottom-0 left-1/2 h-[1px] w-3 -translate-x-1/2 rounded-full bg-[#333336]" />
            <div
                className="absolute bottom-[1px] left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-[#7FAE7A] transition-all duration-1000 ease-out"
                style={{ height: stage === 0 ? "20%" : stage === 1 ? "45%" : stage === 2 ? "70%" : "90%" }}
            />
            <div
                className="absolute left-1/2 h-2 w-3 rounded-tr-full rounded-bl-full bg-[#9AC494] transition-all duration-700 ease-out"
                style={{
                    bottom: "35%",
                    transform: `translateX(1px) rotate(-20deg) scale(${stage >= 1 ? 1 : 0})`,
                    opacity: stage >= 1 ? 1 : 0,
                }}
            />
            <div
                className="absolute left-1/2 h-2 w-3 rounded-tl-full rounded-br-full bg-[#7FAE7A] transition-all duration-700 ease-out"
                style={{
                    bottom: "58%",
                    transform: `translateX(-13px) rotate(20deg) scale(${stage >= 2 ? 1 : 0})`,
                    opacity: stage >= 2 ? 1 : 0,
                    transitionDelay: "150ms",
                }}
            />
            <div
                className="absolute left-1/2 flex gap-[2px] transition-all duration-700 ease-out"
                style={{
                    bottom: "88%",
                    transform: `translateX(-50%) scale(${stage >= 3 ? 1 : 0})`,
                    opacity: stage >= 3 ? 1 : 0,
                    transitionDelay: "250ms",
                }}
            >
                <span className="h-1 w-1 rounded-full bg-[#5C8A5C]" />
                <span className="h-1 w-1 rounded-full bg-[#7FAE7A]" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRoleModal, setShowRoleModal] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!email.trim() || !password) return;
        setLoading(true);
        setError("");
        try {
            const res = await login(email.trim(), password);
            tokens.set(res.access, res.refresh);
            setUser(res.user);
            router.replace(res.user.profile?.role === "farmer" ? "/" : "/marketplace");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setLoading(false);
        }
    }

    function handleGoogle() {
        setGoogleLoading(true);
        setError("");
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            setError("Google login is not configured.");
            setGoogleLoading(false);
            return;
        }
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        window.location.href =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token%20id_token` +
            `&scope=${encodeURIComponent("openid email profile")}` +
            `&nonce=${Math.random().toString(36).slice(2)}` +
            `&state=${encodeURIComponent(JSON.stringify({ from: "login" }))}`;
    }

    const handleRoleSelected = () => {
        router.push("/");
    };

    // 0 = empty, 1 = email filled, 2 = both filled, 3 = submitting
    const stage: 0 | 1 | 2 | 3 = loading ? 3 : password.length > 0 && email.length > 0 ? 2 : email.length > 0 ? 1 : 0;

    return (
        <>
            {/* full-viewport background, independent of parent layout padding */}
            <div className="fixed inset-0 -z-10 bg-black" />

            <div className="-mx-4 -my-8 flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
                <div style={{ fontFamily: "'Public Sans', sans-serif" }} className="flex w-full max-w-sm flex-col items-center text-center">
                    {/* wordmark with inline growth mark */}
                    <div className="flex items-center gap-2">
                        <GrowthMark stage={stage} />
                        <span style={{ fontFamily: "'Fraunces', serif" }} className="text-[15px] font-medium tracking-tight text-white">
              Croply
            </span>
                    </div>

                    <h1 style={{ fontFamily: "'Fraunces', serif" }} className="mt-8 text-[2.25rem] leading-[1.05] text-white">
                        Welcome back
                    </h1>
                    <p className="mt-3 text-[15px] text-[#9CA3AF]">Sign in to tend your fields.</p>

                    {error && <p className="mt-5 text-[13px] text-[#F2A38A]">{error}</p>}

                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="mt-7 flex items-center gap-2.5 text-[14px] text-white transition-opacity hover:opacity-70 disabled:opacity-40"
                    >
                        <GoogleIcon />
                        {googleLoading ? "Redirecting…" : "Continue with Google"}
                    </button>

                    <p className="mt-6 text-[12px] text-[#6B7280]">or with your email</p>

                    <form onSubmit={handleSubmit} className="mt-4 w-full space-y-6 text-left">
                        <label className="block">
                            <span className="text-[13px] text-[#9CA3AF]">Email address</span>
                            <div className="mt-1.5 flex items-center gap-2 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                <Mail className="h-4 w-4 text-[#6B7280]" />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-[13px] text-[#9CA3AF]">Password</span>
                            <div className="mt-1.5 flex items-center gap-2 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                <Lock className="h-4 w-4 text-[#6B7280]" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    tabIndex={-1}
                                    className="text-[#6B7280] hover:text-[#9CA3AF]"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded-full bg-white px-7 py-3 text-[14px] font-medium text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-8 text-[14px] text-[#9CA3AF]">
                        New to Croply?{" "}
                        <Link href="/register" className="text-white underline decoration-[#7FAE7A] decoration-2 underline-offset-4">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>

            <RoleSelectionModal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                onRoleSelected={handleRoleSelected}
            />

            <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Public+Sans:wght@400;500&display=swap");
      `}</style>
        </>
    );
}