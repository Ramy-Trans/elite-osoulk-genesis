import { useState, useEffect, useRef } from "react";
import { X, UserPlus, CheckCircle2, AlertCircle, User, Briefcase, Building2, Eye, EyeOff, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerUser, googleLogin, userLogin, forgotPassword, resetPassword, setUserSession, type Role, type CurrentUser } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { useLang } from "@/lib/language";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void; auto_select?: boolean }) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Mode = "signup" | "signin" | "forgot" | "reset";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}

export function SignUpModal({ open, onClose, initialMode = "signup" }: Props) {
  const { t, dir, lang } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);

  // signup fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<Role>("individual");
  const [company, setCompany] = useState("");

  // signin fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPwd, setShowSignInPwd] = useState(false);

  // forgot/reset fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setStatus("idle");
    setMessage("");
  }, [open, initialMode]);

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID || mode !== "signup") return;
    function initGoogle() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline", size: "large",
        width: googleBtnRef.current.offsetWidth || 360,
        locale: lang === "ar" ? "ar" : "en",
      });
    }
    if (window.google) { initGoogle(); }
    else {
      const existing = document.getElementById("google-gsi-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "google-gsi-script"; script.src = "https://accounts.google.com/gsi/client";
        script.async = true; script.defer = true; script.onload = initGoogle;
        document.head.appendChild(script);
      } else { existing.addEventListener("load", initGoogle); }
    }
  }, [open, lang, mode]);

  async function handleGoogleCredential(response: { credential: string }) {
    setStatus("loading");
    try {
      const data = await googleLogin(response.credential);
      if (data?.user) { setUserSession(data.user as CurrentUser); window.dispatchEvent(new Event("storage")); }
      setStatus("success");
      setTimeout(() => { handleClose(); navigate({ to: "/dashboard" }); }, 900);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("signup.error"));
    }
  }

  if (!open) return null;

  function handleClose() {
    setFullName(""); setEmail(""); setPhone(""); setPassword(""); setRole("individual"); setCompany("");
    setSignInEmail(""); setSignInPassword("");
    setForgotEmail(""); setResetToken(""); setNewPassword(""); setGeneratedToken("");
    setStatus("idle"); setMessage(""); setShowPwd(false); setShowSignInPwd(false); setShowNewPwd(false);
    onClose();
  }

  function switchMode(m: Mode) { setMode(m); setStatus("idle"); setMessage(""); }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const data = await registerUser({ fullName, email, phone, password, role, company } as any);
      if (data?.user) { setUserSession(data.user as CurrentUser); window.dispatchEvent(new Event("storage")); }
      setStatus("success");
      setTimeout(() => { handleClose(); navigate({ to: "/dashboard" }); }, 900);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("signup.error"));
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const data = await userLogin(signInEmail, signInPassword);
      if (data?.user) { setUserSession(data.user as CurrentUser); window.dispatchEvent(new Event("storage")); }
      setStatus("success");
      setTimeout(() => { handleClose(); navigate({ to: "/dashboard" }); }, 900);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("signin.errorMsg"));
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const data = await forgotPassword(forgotEmail);
      setGeneratedToken(data.token);
      setStatus("idle");
      setMessage("");
      setMode("reset");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("signup.error"));
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const data = await resetPassword(resetToken || generatedToken, newPassword);
      setMessage(data.message);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("signup.error"));
    }
  }

  const roleOptions: { value: Role; labelAr: string; labelEn: string; descAr: string; descEn: string; icon: React.ElementType }[] = [
    { value: "individual", labelAr: "فرد",     labelEn: "Individual", descAr: "مشتري / مستثمر",   descEn: "Buyer / investor", icon: User },
    { value: "broker",     labelAr: "وسيط",    labelEn: "Broker",     descAr: "بيع العقارات",     descEn: "Sell properties",  icon: Briefcase },
    { value: "developer",  labelAr: "مطور",    labelEn: "Developer",  descAr: "إدارة المشاريع",   descEn: "Manage projects",  icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-card p-8 shadow-premium max-h-[90vh] overflow-y-auto"
        dir={dir}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-navy transition-colors">
          <X className="h-5 w-5" />
        </button>

        {/* SUCCESS — sign up or sign in */}
        {status === "success" && mode !== "reset" && (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-aqua" />
            <h2 className="mt-4 text-2xl font-black text-navy">
              {mode === "signup" ? t("signup.successTitle") : t("signin.successTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mode === "signup" ? t("signup.successMsg") : t("signin.successMsg")}
            </p>
          </div>
        )}

        {/* RESET SUCCESS */}
        {status === "success" && mode === "reset" && (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-aqua" />
            <h2 className="mt-4 text-2xl font-black text-navy">{t("reset.successTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <Button className="mt-6 w-full" onClick={() => switchMode("signin")}>{t("signin.btn")}</Button>
          </div>
        )}

        {/* SIGN UP */}
        {status !== "success" && mode === "signup" && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy shrink-0">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{t("signup.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("signup.subtitle")}</p>
              </div>
            </div>

            {GOOGLE_CLIENT_ID && (
              <div className="mb-4">
                <div ref={googleBtnRef} className="w-full flex justify-center" />
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("signup.orDivider")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-3">
              <input required className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={t("signup.fullName")} value={fullName} onChange={e => setFullName(e.target.value)} />
              <input type="email" required className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={t("signup.email")} value={email} onChange={e => setEmail(e.target.value)} />
              <input type="tel" className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={t("signup.phone")} value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} required minLength={6}
                  className="h-11 w-full rounded-lg border bg-background px-4 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("signup.password")} value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-navy transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-muted-foreground">{t("signup.roleLabel")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(({ value, labelAr, labelEn, descAr, descEn, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setRole(value)}
                      className={`rounded-lg border p-2.5 text-left transition-colors ${role === value ? "border-navy bg-navy text-primary-foreground" : "hover:bg-secondary"}`}>
                      <Icon className="h-4 w-4" />
                      <p className="mt-1 text-sm font-black">{lang === "ar" ? labelAr : labelEn}</p>
                      <p className={`text-[10px] ${role === value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{lang === "ar" ? descAr : descEn}</p>
                    </button>
                  ))}
                </div>
              </div>

              {(role === "broker" || role === "developer") && (
                <input className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={
                    lang === "ar"
                      ? (role === "broker" ? "اسم الوكالة (اختياري)" : "اسم الشركة (اختياري)")
                      : (role === "broker" ? "Agency name (optional)" : "Company name (optional)")
                  }
                  value={company} onChange={e => setCompany(e.target.value)} />
              )}

              {status === "error" && (
                <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{message}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"} variant="luxury">
                {status === "loading" ? t("signup.loading") : t("signup.submit")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t("signup.terms")}</p>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1 text-sm">
              <span className="text-muted-foreground">{t("signup.haveAccount")}</span>
              <button onClick={() => switchMode("signin")} className="font-black text-navy hover:underline">{t("signup.signIn")}</button>
            </div>
          </>
        )}

        {/* SIGN IN */}
        {status !== "success" && mode === "signin" && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy shrink-0">
                <LogIn className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{t("signin.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("signin.subtitle")}</p>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <input type="email" required autoComplete="email"
                className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={t("signup.email")} value={signInEmail} onChange={e => setSignInEmail(e.target.value)} />
              <div className="relative">
                <input
                  type={showSignInPwd ? "text" : "password"} required autoComplete="current-password"
                  className="h-11 w-full rounded-lg border bg-background px-4 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("signup.password")} value={signInPassword} onChange={e => setSignInPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowSignInPwd(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-navy transition-colors">
                  {showSignInPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-bold text-navy hover:underline">
                  {t("signin.forgotPwd")}
                </button>
              </div>

              {status === "error" && (
                <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{message}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"} variant="luxury">
                {status === "loading" ? t("signin.loading") : t("signin.btn")}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-1 text-sm">
              <span className="text-muted-foreground">{t("signin.noAccount")}</span>
              <button onClick={() => switchMode("signup")} className="font-black text-navy hover:underline">{t("signin.createAccount")}</button>
            </div>
          </>
        )}

        {/* FORGOT PASSWORD */}
        {status !== "success" && mode === "forgot" && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 shrink-0">
                <Mail className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{t("forgot.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("forgot.subtitle")}</p>
              </div>
            </div>

            <form onSubmit={handleForgot} className="space-y-3">
              <input type="email" required
                className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={t("forgot.emailPlaceholder")} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />

              {status === "error" && (
                <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{message}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"} variant="luxury">
                {status === "loading" ? t("forgot.loading") : t("forgot.submit")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => switchMode("signin")} className="text-sm font-bold text-navy hover:underline">← {t("forgot.back")}</button>
            </div>
          </>
        )}

        {/* RESET PASSWORD */}
        {status !== "success" && mode === "reset" && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                <KeyRound className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{t("reset.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("reset.subtitle")}</p>
              </div>
            </div>

            {generatedToken && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-bold text-amber-700 mb-1">{t("reset.tokenLabel")}</p>
                <p className="font-mono text-2xl font-black text-amber-800 tracking-widest">{generatedToken}</p>
                <p className="text-xs text-amber-600 mt-1">{t("reset.tokenHint")}</p>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-3">
              <input required
                className="h-11 w-full rounded-lg border bg-background px-4 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-navy/20 uppercase"
                placeholder={t("reset.tokenPlaceholder")}
                value={resetToken || generatedToken}
                onChange={e => setResetToken(e.target.value.toUpperCase())} />
              <div className="relative">
                <input
                  type={showNewPwd ? "text" : "password"} required minLength={6}
                  className="h-11 w-full rounded-lg border bg-background px-4 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("reset.newPwdPlaceholder")}
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-navy transition-colors">
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {status === "error" && (
                <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{message}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"} variant="luxury">
                {status === "loading" ? t("reset.loading") : t("reset.submit")}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button onClick={() => switchMode("forgot")} className="font-bold text-navy hover:underline">{t("reset.requestNew")}</button>
              <span className="text-border">|</span>
              <button onClick={() => switchMode("signin")} className="font-bold text-navy hover:underline">{t("signin.btn")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
