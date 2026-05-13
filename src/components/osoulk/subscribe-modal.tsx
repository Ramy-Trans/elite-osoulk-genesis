import { useState } from "react";
import { X, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeEmail } from "@/lib/api";
import { useLang } from "@/lib/language";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SubscribeModal({ open, onClose }: Props) {
  const { t, dir } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await subscribeEmail(email, name);
      setStatus("success");
      setMessage(res.message);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("sub.error"));
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-card p-8 shadow-premium"
        dir={dir}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-navy transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {status === "success" ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-aqua" />
            <h2 className="mt-4 text-2xl font-black text-navy">{t("sub.successTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("sub.successHint")}</p>
            <Button className="mt-6 w-full" onClick={onClose}>{t("sub.successBtn")}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy shrink-0">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{t("sub.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("sub.subtitle")}</p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {["sub.b1", "sub.b2", "sub.b3", "sub.b4"].map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-aqua" />{t(key)}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <input
                className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={t("sub.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                required
                className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={t("sub.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {status === "error" && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />{message}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"} variant="luxury">
                {status === "loading" ? t("sub.loading") : t("sub.submit")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t("sub.noSpam")}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
