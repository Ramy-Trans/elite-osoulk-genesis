import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Scan, Cuboid, Smartphone, Sparkles } from "lucide-react";
import arHero from "@/assets/ar-hero.jpg";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/ar")({
  head: () => ({ meta: [
    { title: "AR Property Experience — OSOULK" },
    { name: "description", content: "Step inside any property — anytime, anywhere — with OSOULK's immersive AR experience." },
  ] }),
  component: ARPage,
});

function ARPage() {
  return (
    <>
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-ink text-ivory">
        <img src={arHero} alt="AR property preview" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="container-luxe relative py-24">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--gold)]">AR Experience</p>
          <h1 className="mt-3 font-display text-6xl md:text-8xl max-w-3xl leading-[0.95]">Step inside.<br /><span className="italic text-[color:var(--gold)]">Anywhere.</span></h1>
          <p className="mt-6 max-w-xl text-ivory/85">Tour properties in true 1:1 scale through our augmented-reality experience. Available on iPhone and Android.</p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link to="/explore" className="px-7 py-3 rounded-sm gradient-gold text-[color:var(--gold-foreground)] text-sm">Try a property in AR</Link>
            <Link to="/contact" className="px-7 py-3 rounded-sm border border-ivory/40 text-ivory text-sm">Request a demo</Link>
          </div>
        </div>
      </section>

      <section className="container-luxe py-24">
        <SectionHeader eyebrow="How it works" title="Three taps to walk through any home" />
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {[
            { icon: Smartphone, t: "Open the app", d: "Launch OSOULK on your phone or tablet." },
            { icon: Scan, t: "Scan the floor", d: "Point your camera. We map your space in seconds." },
            { icon: Cuboid, t: "Place the property", d: "Walk through the property in true scale, anywhere." },
          ].map((c, i) => (
            <motion.div key={c.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-xl bg-card border border-border p-7 shadow-card">
              <div className="h-12 w-12 grid place-items-center rounded-full gradient-ink text-ivory"><c.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-2xl">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-ivory py-20">
        <div className="container-luxe text-center">
          <Sparkles className="h-7 w-7 mx-auto text-[color:var(--gold)]" />
          <h3 className="mt-4 font-display text-4xl max-w-2xl mx-auto">The future of property is immersive.</h3>
          <p className="mt-3 text-ivory/75 max-w-xl mx-auto">From skyline penthouses to coastal villas — explore Egypt's finest properties from your living room.</p>
          <Link to="/explore" className="mt-7 inline-flex px-7 py-3 rounded-sm gradient-gold text-[color:var(--gold-foreground)] text-sm">Browse AR-enabled listings</Link>
        </div>
      </section>
    </>
  );
}
