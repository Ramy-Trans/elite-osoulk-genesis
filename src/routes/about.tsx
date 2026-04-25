import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, Target, Award, Users, Building2, BadgeCheck } from "lucide-react";
import compound1 from "@/assets/compound-1.jpg";
import { SectionHeader } from "@/components/site/SectionHeader";
import { ConsultationForm } from "@/components/site/ConsultationForm";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About OSOULK — Africa's Largest Prop-Tech" },
    { name: "description", content: "OSOULK is a modern real estate platform built to make finding and investing in property across Egypt smarter, easier, and more transparent." },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="relative aspect-[16/6] overflow-hidden">
        <img src={compound1} alt="Egyptian skyline" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="container-luxe relative h-full flex items-center text-ivory">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--gold)]">About Us</p>
            <h1 className="mt-3 font-display text-5xl md:text-7xl">Africa's largest <span className="italic text-[color:var(--gold)]">prop-tech.</span></h1>
            <p className="mt-3 text-ivory/80">New Cairo · New Capital · 6th of October · North Coast</p>
          </div>
        </div>
      </section>

      <section className="container-luxe py-20 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Get to know</p>
          <h2 className="mt-3 font-display text-4xl">A modern real estate company built for Egypt's next chapter</h2>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p>OSOULK is a modern real estate platform built to make finding and investing in properties across Egypt smarter, easier, and more transparent.</p>
          <p>Since our launch, we've been helping individuals, families, and investors discover their perfect property — whether it's a home to start a new chapter or an investment to build their future.</p>
          <p>At OSOULK, we combine trusted listings, expert insights, and data-driven tools to ensure every customer makes a confident decision. Our goal is simple — to create a seamless real estate journey that connects you directly with Egypt's top compounds, developers, and opportunities.</p>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container-luxe grid md:grid-cols-2 gap-8">
          {[
            { icon: Eye, t: "Our Vision", d: "Become the region's leading prop-tech company and disrupt the real estate ecosystem by offering a fully immersive digitised experience for buyers, sellers & investors." },
            { icon: Target, t: "Our Mission", d: "Empower every Egyptian to make confident, informed property decisions through verified data, refined design, and human expertise." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-card border border-border p-8 shadow-card">
              <c.icon className="h-7 w-7 text-[color:var(--gold)]" />
              <h3 className="mt-4 font-display text-2xl">{c.t}</h3>
              <p className="mt-2 text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-luxe py-20">
        <SectionHeader eyebrow="Who We Are" title="A complete real estate experience" description="Powered by technology and trust. Whether you're looking for your next home or managing multiple listings." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: BadgeCheck, t: "Verified Listings", d: "Every property is reviewed to ensure accuracy." },
            { icon: Users, t: "Direct Connections", d: "Connect directly with verified agents and owners." },
            { icon: Building2, t: "Smart Dashboard", d: "Easily manage listings, leads, and performance data." },
            { icon: Award, t: "Professional Tools", d: "Access advanced tools for property management." },
          ].map((c, i) => (
            <motion.div key={c.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="rounded-md bg-card border border-border p-6 shadow-card">
              <c.icon className="h-6 w-6 text-[color:var(--gold)]" />
              <h4 className="mt-3 font-display text-lg">{c.t}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container-luxe grid md:grid-cols-4 gap-6 text-center">
          {[["15,000+", "Properties"], ["3,500", "Agents"], ["400+", "Compounds"], ["150,000", "Users"]].map(([k, v]) => (
            <div key={v}><p className="font-display text-5xl text-[color:var(--gold)]">{k}</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{v}</p></div>
          ))}
        </div>
      </section>

      <section className="container-luxe py-20"><ConsultationForm /></section>
    </>
  );
}
