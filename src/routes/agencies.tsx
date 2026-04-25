import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Building2 } from "lucide-react";
import { AGENCIES } from "@/lib/demo-data";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/agencies")({
  head: () => ({ meta: [
    { title: "Agencies & Partners — OSOULK" },
    { name: "description", content: "Browse Egypt's top real estate agencies and developer partners on OSOULK." },
  ] }),
  component: AgenciesPage,
});

function AgenciesPage() {
  return (
    <div className="container-luxe py-16">
      <SectionHeader eyebrow="Agencies" title="Egypt's most trusted partners" description="A curated directory of certified agencies and developers we work with daily." />
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENCIES.map((a, i) => (
          <motion.div key={a.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
            <div className="aspect-[16/10] overflow-hidden bg-secondary"><img src={a.logo} alt={a.name} className="h-full w-full object-cover" loading="lazy" /></div>
            <div className="p-6">
              <h3 className="font-display text-xl">{a.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{a.coverage}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm flex items-center gap-1.5"><Building2 className="h-4 w-4 text-[color:var(--gold)]" /> <strong>{a.listings}</strong> listings</span>
                <Link to="/explore" className="text-sm luxe-link">View profile</Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
