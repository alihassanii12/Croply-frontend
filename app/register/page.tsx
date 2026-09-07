"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, tokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import {
    Tractor, ShoppingBag, User, Mail, Lock,
    Eye, EyeOff, Phone, MapPin, ChevronRight, ChevronLeft, CheckCircle2,
} from "lucide-react";

type Role = "farmer" | "buyer";
type Step = 1 | 2 | 3;

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const STEPS = [
    { n: 1, label: "Role" },
    { n: 2, label: "Details" },
    { n: 3, label: "Account" },
];

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

export default function RegisterPage() {
    const router = useRouter();
    const { setUser } = useAuth();

    const [step, setStep] = useState<Step>(1);

    const [role, setRole] = useState<Role | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function goNext() {
        setError("");
        if (step === 1) {
            if (!role) { setError("Please select your role."); return; }
            setStep(2);
        } else if (step === 2) {
            if (!firstName.trim()) { setError("First name is required."); return; }
            setStep(3);
        }
    }

    const handleRoleSelected = () => {
        router.push("/");
    };

    function goBack() {
        setError("");
        setStep((s) => (s - 1) as Step);
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
            `&state=${encodeURIComponent(JSON.stringify({ from: "register" }))}`;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (!email.trim()) { setError("Email is required."); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }

        setLoading(true);
        try {
            const res = await register({
                email: email.trim(),
                password,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                role: role!,
                phone: phone.trim(),
                location: location.trim(),
            });
            tokens.set(res.access, res.refresh);
            setUser(res.user);
            router.replace(res.user.profile?.role === "farmer" ? "/" : "/marketplace");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed.");
        } finally {
            setLoading(false);
        }
    }

    const passStrength = password.length === 0 ? 0
        : password.length < 8 ? 1
            : password.length < 12 ? 2
                : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 4 : 3;

    const passStrengthColor = ["", "bg-[#E08767]", "bg-[#C9A878]", "bg-[#7FAE7A]", "bg-[#5C8A5C]"][passStrength];
    const passStrengthLabel = ["", "Too short", "Weak", "Good", "Strong"][passStrength];

    // wordmark growth mark ties to wizard step
    const stage: 0 | 1 | 2 | 3 = loading ? 3 : ((step - 1) as 0 | 1 | 2);

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
                        Create account
                    </h1>
                    <p className="mt-3 text-[15px] text-[#9CA3AF]">
                        {step === 1 && "Choose your role to get started."}
                        {step === 2 && "Tell us a bit about yourself."}
                        {step === 3 && "Set up your login credentials."}
                    </p>

                    {/* step indicator — minimal dots + connecting line, no boxes */}
                    <div className="mt-5 flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div key={s.n} className="flex items-center gap-2">
                                <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                                        step > s.n
                                            ? "bg-[#5C8A5C] text-white"
                                            : step === s.n
                                                ? "bg-[#7FAE7A] text-black"
                                                : "bg-[#2A2A2E] text-[#6B7280]"
                                    }`}
                                >
                                    {step > s.n ? <CheckCircle2 className="h-3 w-3" /> : s.n}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`h-px w-8 ${step > s.n ? "bg-[#5C8A5C]" : "bg-[#2A2A2E]"}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && <p className="mt-5 text-[13px] text-[#E08767]">{error}</p>}

                    {/* Google + divider (always visible) */}
                    <div className="mt-7 w-full">
                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={googleLoading}
                            className="flex w-full items-center justify-center gap-2.5 text-[14px] text-white transition-opacity hover:opacity-70 disabled:opacity-40"
                        >
                            <GoogleIcon />
                            {googleLoading ? "Redirecting…" : "Continue with Google"}
                        </button>
                        <p className="mt-6 text-[12px] text-[#6B7280]">or register with email</p>
                    </div>

                    {/* ── STEP 1: Role ─────────────────────────────────── */}
                    {step === 1 && (
                        <div className="mt-6 w-full">
                            <div className="flex gap-6">
                                <RoleCard
                                    selected={role === "farmer"}
                                    onClick={() => setRole("farmer")}
                                    icon={<Tractor className="h-6 w-6" />}
                                    title="Farmer"
                                    desc="Farms, crops, AI scan, sell"
                                />
                                <RoleCard
                                    selected={role === "buyer"}
                                    onClick={() => setRole("buyer")}
                                    icon={<ShoppingBag className="h-6 w-6" />}
                                    title="Buyer"
                                    desc="Browse & buy produce"
                                />
                            </div>

                            <button
                                onClick={goNext}
                                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-medium text-black transition-transform hover:-translate-y-0.5"
                            >
                                Continue with Email
                                <ChevronRight className="h-4 w-4" />
                            </button>

                            <p className="mt-6 text-[14px] text-[#9CA3AF]">
                                Already have an account?{" "}
                                <Link href="/login" className="text-white underline decoration-[#7FAE7A] decoration-2 underline-offset-4">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* ── STEP 2: Personal details ───────────────────────── */}
                    {step === 2 && (
                        <div className="mt-6 w-full space-y-6 text-left">
                            <div className="grid grid-cols-2 gap-5">
                                <label className="block">
                                    <span className="text-[13px] text-[#9CA3AF]">First name *</span>
                                    <div className="mt-1.5 flex items-center gap-2 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                        <User className="h-4 w-4 text-[#6B7280]" />
                                        <input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Ali"
                                            className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                        />
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-[13px] text-[#9CA3AF]">Last name</span>
                                    <div className="mt-1.5 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                        <input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Khan"
                                            className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                        />
                                    </div>
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-[13px] text-[#9CA3AF]">Phone</span>
                                <div className="mt-1.5 flex items-center gap-2 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                    <Phone className="h-4 w-4 text-[#6B7280]" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+92 300 0000000"
                                        className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-[13px] text-[#9CA3AF]">Location</span>
                                <div className="mt-1.5 flex items-center gap-2 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                    <MapPin className="h-4 w-4 text-[#6B7280]" />
                                    <input
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Punjab, Lahore, Pakistan"
                                        className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                    />
                                </div>
                            </label>

                            <div className="flex items-center gap-5 pt-1">
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-1.5 text-[14px] text-[#9CA3AF] transition-colors hover:text-white"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                                <button
                                    onClick={goNext}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-medium text-black transition-transform hover:-translate-y-0.5"
                                >
                                    Continue <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Credentials ────────────────────────────── */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit} className="mt-6 w-full space-y-6 text-left">
                            <label className="block">
                                <span className="text-[13px] text-[#9CA3AF]">Email *</span>
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
                                <span className="text-[13px] text-[#9CA3AF]">Password *</span>
                                <div className="mt-1.5 flex items-center gap-2 border-b border-[#333336] pb-2 transition-colors focus-within:border-[#7FAE7A]">
                                    <Lock className="h-4 w-4 text-[#6B7280]" />
                                    <input
                                        type={showPass ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                        className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPass((v) => !v)}
                                        className="text-[#6B7280] hover:text-[#9CA3AF]"
                                    >
                                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {password.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex flex-1 gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                                        passStrength >= i ? passStrengthColor : "bg-[#2A2A2E]"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[11px] text-[#6B7280]">{passStrengthLabel}</span>
                                    </div>
                                )}
                            </label>

                            <label className="block">
                                <span className="text-[13px] text-[#9CA3AF]">Confirm password *</span>
                                <div
                                    className={`mt-1.5 flex items-center gap-2 border-b pb-2 transition-colors ${
                                        confirmPassword && confirmPassword !== password
                                            ? "border-[#E08767]"
                                            : "border-[#333336] focus-within:border-[#7FAE7A]"
                                    }`}
                                >
                                    <Lock className="h-4 w-4 text-[#6B7280]" />
                                    <input
                                        type={showPass ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#4B5563]"
                                    />
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="mt-1 text-[12px] text-[#E08767]">Passwords do not match</p>
                                )}
                            </label>

                            <div className="flex items-center gap-5 pt-1">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="flex items-center gap-1.5 text-[14px] text-[#9CA3AF] transition-colors hover:text-white"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-medium text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? "Creating…" : "Create account"}
                                </button>
                            </div>

                            <p className="text-[14px] text-[#9CA3AF]">
                                Already have an account?{" "}
                                <Link href="/login" className="text-white underline decoration-[#7FAE7A] decoration-2 underline-offset-4">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}
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

function RoleCard({
                      selected,
                      onClick,
                      icon,
                      title,
                      desc,
                  }: {
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-1 flex-col items-center gap-2 border-b-2 pb-4 pt-2 transition-colors ${
                selected ? "border-[#7FAE7A] text-white" : "border-[#2A2A2E] text-[#6B7280] hover:text-[#9CA3AF]"
            }`}
        >
            <span className={selected ? "text-[#7FAE7A]" : "text-[#6B7280]"}>{icon}</span>
            <span className="text-[14px] font-medium">{title}</span>
            <span className="text-[11px] leading-tight text-[#6B7280]">{desc}</span>
        </button>
    );
}