import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Play, Heart, MessageCircle, Upload, ShieldCheck, Lock, Clock } from "lucide-react";
import { useState } from "react";
import { REELS } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Property Reels — OSOULK" },
      { name: "description", content: "Immersive short-form property tours from Egypt's top agents. Browse, save, and submit your own reels." },
      { property: "og:title", content: "Property Reels — OSOULK" },
    ],
  }),
  component: ReelsPage,
});

function ReelsPage() {
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <div className="bg-ink text-ivory min-h-screen">
      <div className="container-luxe py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Reels</p>
            <h1 className="mt-2 font-display text-5xl md:text-6xl text-balance max-w-2xl">Step inside. <span className="italic text-[color:var(--gold)]">Anytime.</span></h1>
            <p className="mt-4 text-ivory/75 max-w-xl">Cinematic, vertical property tours from Egypt's most respected agents and developers.</p>
          </div>
          <button onClick={() => setShowSubmit(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-sm gradient-gold text-[color:var(--gold-foreground)] text-sm font-medium hover:opacity-90 transition">
            <Upload className="h-4 w-4" /> Submit a Reel
          </button>
        </div>

        {/* Permission notice */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { icon: Lock, t: "Permission required", d: "Verified seller account is required to upload." },
            { icon: ShieldCheck, t: "Manual approval", d: "Every reel is reviewed by our moderation team." },
            { icon: Clock, t: "48-hour review", d: "Most submissions are approved within 48 hours." },
          ].map((c) => (
            <div key={c.t} className="rounded-md bg-ivory/5 border border-ivory/10 p-5">
              <c.icon className="h-5 w-5 text-[color:var(--gold)]" />
              <h3 className="mt-3 font-display text-lg">{c.t}</h3>
              <p className="mt-1 text-sm text-ivory/70">{c.d}</p>
            </div>
          ))}
        </div>

        {/* Reels feed */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {REELS.map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-ink border border-ivory/10"
            >
              <img src={r.thumbnail} alt={r.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-ink/70 text-[10px]">{r.duration}</div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-14 w-14 rounded-full glass grid place-items-center group-hover:scale-110 transition">
                  <Play className="h-5 w-5 fill-ivory" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">{r.agency}</p>
                <p className="mt-1 text-sm font-medium line-clamp-2">{r.title}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ivory/70">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> 1.2k</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> 86</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {showSubmit && <SubmitReelModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
}

function SubmitReelModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"check" | "form" | "thanks">("check");

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-ink/80 backdrop-blur-md animate-[fade-in_0.2s]">
      <div className="bg-background text-foreground rounded-xl shadow-elegant max-w-lg w-full p-8 relative animate-[fade-up_0.4s]">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>
        {step === "check" && (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Submit a Reel</p>
            <h3 className="mt-2 font-display text-3xl">Permission required</h3>
            <p className="mt-3 text-sm text-muted-foreground">Reel uploads are limited to verified sellers. If your account is approved, you can submit. Otherwise, request access first.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/auth" className="px-4 py-2.5 rounded-sm border border-border text-sm text-center">Sign in</Link>
              <button onClick={() => setStep("form")} className="px-4 py-2.5 rounded-sm gradient-ink text-ivory text-sm">I have access</button>
            </div>
          </div>
        )}
        {step === "form" && (
          <form onSubmit={(e) => { e.preventDefault(); setStep("thanks"); toast.success("Reel submitted — pending moderation."); }}>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">New reel</p>
            <h3 className="mt-2 font-display text-3xl">Tell us about it</h3>
            <div className="mt-5 grid gap-4">
              <input required placeholder="Title" className="w-full px-3 py-2.5 rounded-sm border border-input bg-card text-sm" />
              <textarea placeholder="Description" rows={3} className="w-full px-3 py-2.5 rounded-sm border border-input bg-card text-sm" />
              <div className="rounded-md border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <Upload className="h-6 w-6 mx-auto mb-2" />
                Drop a video here or <span className="underline">browse</span>
              </div>
              <button className="mt-2 px-5 py-3 rounded-sm gradient-ink text-ivory text-sm">Submit for approval</button>
            </div>
          </form>
        )}
        {step === "thanks" && (
          <div className="text-center py-6">
            <div className="mx-auto h-14 w-14 grid place-items-center rounded-full gradient-gold"><ShieldCheck className="h-6 w-6 text-[color:var(--gold-foreground)]" /></div>
            <h3 className="mt-4 font-display text-2xl">Thank you</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your reel is in moderation. We'll notify you within 48 hours.</p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 rounded-sm gradient-ink text-ivory text-sm">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
