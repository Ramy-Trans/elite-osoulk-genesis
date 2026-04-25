import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import property2 from "@/assets/property-2.jpg";
import { ConsultationForm } from "@/components/site/ConsultationForm";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Property — OSOULK" },
      { name: "description", content: "Sell smarter with OSOULK. List your property with verified buyers, expert advice, and the largest premium audience in Egypt." },
      { property: "og:title", content: "Sell Smarter with OSOULK" },
    ],
  }),
  component: SellPage,
});

const STEPS = [
  { n: "01", t: "Register & get approved", d: "Create your free seller account in minutes. Our team reviews your profile to ensure trusted listings." },
  { n: "02", t: "Verify your identity", d: "Submit your ID and ownership documents. Verification takes less than 24 hours." },
  { n: "03", t: "List your property & go live", d: "Add photos, details, and pricing. Your listing reaches qualified buyers within minutes." },
];

function SellPage() {
  return (
    <>
      <section className="container-luxe py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Sellers</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">Sell smarter with <span className="italic text-[color:var(--gold)]">OSOULK</span></h1>
        <p className="mt-5 max-w-2xl mx-auto text-muted-foreground">Turn your property into opportunity. List with OSOULK and reach serious buyers across Egypt in just a few steps.</p>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/create-listing" className="px-7 py-3 rounded-sm gradient-ink text-ivory text-sm">Register as a Seller</Link>
          <a href="#how" className="px-7 py-3 rounded-sm border border-ink text-ink text-sm">How It Works</a>
        </div>
      </section>

      <section className="container-luxe py-12">
        <div className="relative rounded-2xl overflow-hidden shadow-elegant gradient-ink p-8 md:p-12 text-ivory">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[color:var(--gold)] text-xs uppercase tracking-[0.3em]">Move Now Pay Later</p>
              <h2 className="mt-3 font-display text-4xl">Reach 1,000+ qualified buyers actively searching today</h2>
              <p className="mt-4 text-ivory/80">From New Cairo to North Coast — our audience is the most active buyer pool in Egypt's premium segment.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["1,000+", "Properties listed"], ["30+", "Top developers"], ["100+", "Compounds"], ["1,500+", "Verified clients"]].map(([k, v]) => (
                <div key={v} className="bg-ivory/10 border border-ivory/15 rounded-md p-5">
                  <p className="font-display text-3xl text-[color:var(--gold)]">{k}</p>
                  <p className="text-[11px] uppercase tracking-widest text-ivory/75">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="container-luxe py-24">
        <SectionHeader eyebrow="How It Works" title="From listing to sold in 3 steps" description="A refined process designed by professionals, for serious sellers." />
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="rounded-xl bg-card border border-border p-7 shadow-card">
              <p className="font-display text-5xl text-[color:var(--gold)]">{s.n}</p>
              <h3 className="mt-4 font-display text-xl">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-24">
        <div className="container-luxe grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden shadow-elegant aspect-[4/3]">
            <img src={property2} alt="Luxury villa for sale" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Why OSOULK</p>
            <h2 className="mt-3 font-display text-4xl">Trusted by 1,500+ sellers across Egypt</h2>
            <p className="mt-4 text-muted-foreground">We combine deep market knowledge with a client-first approach — every detail handled with care, from the first conversation to the final closing.</p>
            <ul className="mt-6 space-y-3">
              {["Verified buyer pool", "Transparent commissions", "Advanced CRM & lead routing", "Premium photography on request", "Featured placement options"].map((b) => (
                <li key={b} className="flex items-start gap-3"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-1" /><span className="text-sm">{b}</span></li>
              ))}
            </ul>
            <Link to="/create-listing" className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-sm gradient-ink text-ivory text-sm">Turn your property into opportunity <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="container-luxe py-24">
        <ConsultationForm />
      </section>
    </>
  );
}
