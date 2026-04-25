import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Building2, Sparkles, Shield, BadgeCheck, Award, ChevronRight, Plus, Minus } from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/hero-villa.jpg";
import { PROPERTIES, COMPOUNDS, AREAS, FAQS } from "@/lib/demo-data";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SectionHeader } from "@/components/site/SectionHeader";
import { ConsultationForm } from "@/components/site/ConsultationForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OSOULK — Find Your Dream Property in Egypt" },
      { name: "description", content: "Discover luxury homes, villas, and investment properties across Egypt's top compounds. New Cairo, North Coast, New Capital and beyond." },
      { property: "og:title", content: "OSOULK — Luxury Real Estate, Reimagined" },
      { property: "og:description", content: "Verified listings, expert advice, immersive AR previews — the refined way to buy and sell property in Egypt." },
      { property: "og:image", content: "/og-home.jpg" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = PROPERTIES.slice(0, 6);
  const newLaunches = PROPERTIES.filter((p) => p.newLaunch);

  return (
    <>
      {/* HERO */}
      <section className="relative -mt-[88px] lg:-mt-[112px] min-h-[92vh] flex items-end overflow-hidden">
        <img src={heroImage} alt="Luxury villa at sunset" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-ink/30" />
        <div className="container-luxe relative z-10 pb-20 pt-40 text-ivory">
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="text-xs uppercase tracking-[0.4em] text-[color:var(--gold)]"
          >
            Africa's Premier Prop-Tech Platform
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}
            className="mt-5 font-display text-5xl md:text-7xl lg:text-[88px] leading-[0.95] max-w-4xl text-balance"
          >
            Find your dream home<br /><span className="italic text-[color:var(--gold)]">across Egypt.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }}
            className="mt-6 max-w-xl text-base md:text-lg text-ivory/85"
          >
            Verified listings from Egypt's most respected developers — refined search, expert advice, and immersive AR previews.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-10 glass rounded-xl p-2 max-w-3xl shadow-elegant"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
              <select className="bg-transparent text-foreground rounded-sm px-4 py-3 text-sm focus:outline-none">
                <option className="text-ink">Buy</option>
                <option className="text-ink">Rent</option>
                <option className="text-ink">New Launch</option>
              </select>
              <input placeholder="City, compound, keyword…" className="bg-transparent text-foreground placeholder:text-foreground/60 rounded-sm px-4 py-3 text-sm focus:outline-none" />
              <Link to="/explore" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm gradient-ink text-ivory text-sm">
                <Search className="h-4 w-4" /> Search
              </Link>
            </div>
          </motion.div>

          {/* Trust strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              { k: "15,000+", v: "Properties" },
              { k: "30+", v: "Top Developers" },
              { k: "1,500+", v: "Trusted Clients" },
              { k: "100+", v: "Compounds" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
                <p className="font-display text-3xl text-[color:var(--gold)]">{s.k}</p>
                <p className="text-xs uppercase tracking-widest text-ivory/70 mt-1">{s.v}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-24">
        <div className="container-luxe">
          <SectionHeader eyebrow="Featured Listings" title="New homes for sale and rent" description="Discover this week's hand-picked properties from across Egypt." />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
          </div>
          <div className="mt-12 text-center">
            <Link to="/explore" className="inline-flex items-center gap-2 px-7 py-3 rounded-sm border border-ink text-ink text-sm font-medium hover:bg-ink hover:text-ivory transition">
              View all properties <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* MOVE-NOW BANNER */}
      <section className="py-12">
        <div className="container-luxe">
          <div className="relative rounded-2xl overflow-hidden shadow-elegant">
            <div className="absolute inset-0 gradient-ink" />
            <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 20%, var(--gold), transparent 50%)" }} />
            <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 md:p-14 text-ivory">
              <div>
                <p className="text-[color:var(--gold)] text-xs uppercase tracking-[0.3em]">Exclusive Programme</p>
                <h3 className="mt-3 font-display text-4xl md:text-5xl leading-tight">Move Now,<br />Pay Later.</h3>
                <p className="mt-4 max-w-lg text-ivory/85">Access the largest live inventory in New Cairo, October, Zayed and the North Coast — with flexible installment plans curated by our consultants.</p>
                <Link to="/explore" className="mt-6 inline-flex px-7 py-3 rounded-sm bg-ivory text-ink text-sm font-medium hover:bg-[color:var(--gold)] transition">
                  How to Sell on OSOULK
                </Link>
              </div>
              <div className="hidden md:flex justify-end gap-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <Stat k="1,000+" v="Properties" />
                  <Stat k="30+" v="Developers" />
                  <Stat k="100+" v="Compounds" />
                  <Stat k="24/7" v="Support" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW LAUNCHES */}
      <section className="py-24 bg-secondary/40">
        <div className="container-luxe">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeader eyebrow="New Launches" title="Be first on the waitlist" align="left" />
            <Link to="/explore" className="text-sm luxe-link">View All</Link>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newLaunches.map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* TOP COMPOUNDS */}
      <section className="py-24">
        <div className="container-luxe">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeader eyebrow="Top Compounds" title="Egypt's most-loved addresses" align="left" />
            <Link to="/explore" className="text-sm luxe-link">Browse All</Link>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COMPOUNDS.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="group relative aspect-[3/4] rounded-md overflow-hidden shadow-card">
                <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-ivory">
                  <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">{c.area}</p>
                  <h4 className="mt-1 font-display text-xl">{c.name}</h4>
                  <p className="text-xs text-ivory/80">{c.units} units</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP AREAS */}
      <section className="py-24 bg-secondary/40">
        <div className="container-luxe">
          <SectionHeader eyebrow="Top Areas" title="Where Egypt is investing now" />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AREAS.map((a, i) => (
              <Link to="/explore" key={a.name} className="group rounded-md overflow-hidden border border-border bg-card shadow-card hover:shadow-elegant transition" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="aspect-video overflow-hidden"><img src={a.image} alt={a.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /></div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-lg">{a.name}</h4>
                    <p className="text-xs text-muted-foreground">{a.listings} listings</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-24">
        <div className="container-luxe grid lg:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Verified Listings", body: "Every listing is reviewed by our team to ensure accuracy, authenticity, and quality." },
            { icon: BadgeCheck, title: "Trusted Partners", body: "We partner only with Egypt's most reputable developers and certified agencies." },
            { icon: Award, title: "Investor-Grade Insights", body: "Market research, yield projections, and developer briefings — included." },
          ].map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-xl p-8 bg-card border border-border shadow-card">
              <div className="h-12 w-12 grid place-items-center rounded-full bg-ink text-ivory">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-secondary/40">
        <div className="container-luxe grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionHeader eyebrow="FAQs" title="Answers to popular questions" align="left" />
            <p className="mt-5 text-muted-foreground">Need more help? Visit the <Link to="/faqs" className="text-foreground luxe-link">full FAQs page</Link> or <Link to="/contact" className="text-foreground luxe-link">talk to a consultant</Link>.</p>
          </div>
          <FaqList />
        </div>
      </section>

      {/* CONSULTATION */}
      <section className="py-24">
        <div className="container-luxe grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeader eyebrow="Consultation" title="Buy with confidence" align="left" description="Speak to a personal advisor who knows the Egyptian market end-to-end." />
            <div className="mt-8 grid gap-4">
              {[
                { icon: Sparkles, t: "Curated shortlists tailored to your brief" },
                { icon: Building2, t: "Direct access to developers and verified agents" },
                { icon: BadgeCheck, t: "Transparent pricing — no hidden commissions" },
              ].map((b) => (
                <div key={b.t} className="flex items-start gap-4 rounded-md p-4 bg-card border border-border">
                  <div className="h-10 w-10 grid place-items-center rounded-full gradient-gold text-[color:var(--gold-foreground)]"><b.icon className="h-4 w-4" /></div>
                  <p className="text-sm leading-relaxed">{b.t}</p>
                </div>
              ))}
            </div>
          </div>
          <ConsultationForm compact />
        </div>
      </section>
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-ivory/10 backdrop-blur p-4 border border-ivory/15">
      <p className="font-display text-2xl text-[color:var(--gold)]">{k}</p>
      <p className="text-[10px] uppercase tracking-widest text-ivory/75">{v}</p>
    </div>
  );
}

function FaqList() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {FAQS.slice(0, 5).map((f, i) => (
        <button
          key={f.q}
          onClick={() => setOpen(open === i ? -1 : i)}
          className="w-full text-left rounded-md bg-card border border-border p-5 hover:shadow-card transition"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">{f.q}</span>
            {open === i ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
          </div>
          {open === i && (
            <p className="mt-3 text-sm text-muted-foreground animate-[fade-in_0.3s_ease-out]">
              {renderAnswer(f.a, f.links)}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

function renderAnswer(text: string, links?: Record<string, string>) {
  if (!links) return text;
  const parts = text.split(/(\{[a-z]+\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{([a-z]+)\}$/);
    if (match && links[match[1]]) {
      return <Link key={i} to={links[match[1]]} className="text-foreground font-medium luxe-link">{match[1]}</Link>;
    }
    return <span key={i}>{part}</span>;
  });
}
