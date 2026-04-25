import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PACKAGES } from "@/lib/demo-data";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/packages")({
  head: () => ({ meta: [
    { title: "Packages & Pricing — OSOULK" },
    { name: "description", content: "Simple, transparent pricing for sellers and agencies. Start free or upgrade for premium reach." },
  ] }),
  component: PackagesPage,
});

function PackagesPage() {
  return (
    <div className="container-luxe py-16">
      <SectionHeader eyebrow="Packages" title="Subscribe and reach more buyers" description="Transparent pricing. Cancel anytime. Built for serious sellers." />
      <div className="mt-14 grid md:grid-cols-3 gap-6">
        {PACKAGES.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-8 border shadow-card relative overflow-hidden ${p.featured ? "bg-ink text-ivory border-ink shadow-elegant scale-[1.02]" : "bg-card border-border"}`}
          >
            {p.featured && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full gradient-gold text-[10px] uppercase tracking-widest text-[color:var(--gold-foreground)] flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Popular
              </div>
            )}
            <p className={`text-xs uppercase tracking-[0.3em] ${p.featured ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>{p.name}</p>
            <p className="mt-4 font-display text-5xl">{p.price}<span className={`text-sm ml-1 ${p.featured ? "text-ivory/70" : "text-muted-foreground"}`}>EGP / {p.period}</span></p>
            <ul className="mt-6 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`h-4 w-4 mt-0.5 ${p.featured ? "text-[color:var(--gold)]" : "text-foreground"}`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth" className={`mt-8 inline-flex w-full justify-center px-5 py-3 rounded-sm text-sm ${p.featured ? "bg-ivory text-ink hover:bg-[color:var(--gold)]" : "gradient-ink text-ivory"} transition`}>{p.cta}</Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 rounded-2xl gradient-ink p-10 text-ivory text-center">
        <h3 className="font-display text-3xl">Need a custom plan for your agency?</h3>
        <p className="mt-2 text-ivory/80">Volume discounts and white-glove onboarding available.</p>
        <Link to="/contact" className="mt-5 inline-flex px-7 py-3 rounded-sm gradient-gold text-[color:var(--gold-foreground)] text-sm">Talk to Sales</Link>
      </div>
    </div>
  );
}
