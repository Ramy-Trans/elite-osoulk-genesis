import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Minus, Search } from "lucide-react";
import { FAQS, type FaqItem } from "@/lib/demo-data";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/faqs")({
  head: () => ({ meta: [
    { title: "FAQs — OSOULK Real Estate Help Center" },
    { name: "description", content: "Answers to the most common questions about buying, selling, and investing in property through OSOULK." },
    { name: "keywords", content: "OSOULK FAQ, real estate questions Egypt, how to buy property Egypt, sell property online" },
  ] }),
  component: FaqsPage,
});

function FaqsPage() {
  const [q, setQ] = useState("");
  const filtered = FAQS.filter((f) => f.q.toLowerCase().includes(q.toLowerCase()));

  // Structured data for SEO (FAQ schema)
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\{[a-z]+\}/g, "") },
    })),
  };

  return (
    <div className="container-luxe py-16">
      <SectionHeader eyebrow="Help Center" title="Frequently asked questions" description="Everything you need to know about OSOULK." />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="mt-10 max-w-xl mx-auto relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" className="w-full pl-9 pr-3 py-3 rounded-sm border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="mt-10 max-w-3xl mx-auto space-y-3">
        {filtered.map((f, i) => <FaqRow key={f.q} f={f} defaultOpen={i === 0} />)}
      </div>

      <div className="mt-16 max-w-2xl mx-auto rounded-2xl gradient-ink text-ivory p-10 text-center">
        <h3 className="font-display text-3xl">Still have questions?</h3>
        <p className="mt-2 text-ivory/80">Our team is one click away.</p>
        <Link to="/contact" className="mt-5 inline-flex px-7 py-3 rounded-sm gradient-gold text-[color:var(--gold-foreground)] text-sm">Contact us</Link>
      </div>
    </div>
  );
}

function FaqRow({ f, defaultOpen = false }: { f: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md bg-card border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-secondary/40 transition">
        <span className="font-medium">{f.q}</span>
        {open ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground animate-[fade-in_0.25s_ease-out]">
          {renderAnswer(f.a, f.links)}
        </div>
      )}
    </div>
  );
}

function renderAnswer(text: string, links?: Record<string, string>) {
  if (!links) return text;
  const parts = text.split(/(\{[a-z]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{([a-z]+)\}$/);
        if (m && links[m[1]]) return <a key={i} href={links[m[1]]} className="text-foreground font-medium luxe-link">{m[1]}</a>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
