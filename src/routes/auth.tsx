import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/osoulk-logo.webp";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — OSOULK" }, { name: "description", content: "Access your OSOULK account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/" }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Welcome to OSOULK. Check your inbox to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-luxe py-20 max-w-md">
      <div className="text-center">
        <img src={logo} alt="OSOULK" className="h-10 mx-auto" />
        <h1 className="mt-6 font-display text-3xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Refined property — at your fingertips.</p>
      </div>

      <form onSubmit={submit} className="mt-10 grid gap-4 rounded-xl bg-card border border-border p-7 shadow-card">
        {mode === "signup" && (
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm" required />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm" required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="mt-1.5 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm" required />
        </div>
        <button disabled={loading} className="mt-2 px-5 py-3 rounded-sm gradient-ink text-ivory text-sm disabled:opacity-60">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-xs text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
