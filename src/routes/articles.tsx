import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Clock, User } from "lucide-react";
import { ARTICLES } from "@/lib/demo-data";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/articles")({
  head: () => ({ meta: [
    { title: "Articles & Insights — OSOULK Real Estate Blog" },
    { name: "description", content: "Buyer guides, market insights, investment analysis, and lifestyle stories from OSOULK — Egypt's premium real estate platform." },
    { name: "keywords", content: "Egypt real estate blog, New Cairo property guide, North Coast investment, Ras El Hekma, mortgage Egypt" },
    { property: "og:title", content: "OSOULK Articles — Egypt Real Estate Insights" },
  ] }),
  component: ArticlesPage,
});

const CATEGORIES = ["All", "Buyer Guide", "Investment", "Sellers", "Finance", "Compounds", "Lifestyle"];

function ArticlesPage() {
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);

  return (
    <div className="container-luxe py-16">
      <SectionHeader eyebrow="Articles & Insights" title="The OSOULK editorial" description="Expert guidance on buying, selling, and investing in Egyptian real estate." />

      <div className="mt-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} className="px-4 py-2 rounded-full border border-border text-xs hover:bg-secondary transition">{c}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search articles…" className="pl-9 pr-3 py-2 rounded-sm border border-input bg-card text-sm w-64" />
        </div>
      </div>

      {/* Featured */}
      <Link to="/articles" className="mt-10 group block rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-elegant transition">
        <div className="grid md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
            <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Featured · {featured.category}</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">{featured.title}</h2>
            <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
            <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {featured.author}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featured.read} min read</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((a, i) => (
          <motion.article
            key={a.slug}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="rounded-md overflow-hidden bg-card border border-border shadow-card hover:shadow-elegant transition group"
          >
            <Link to="/articles" className="block">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={a.cover} alt={a.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              </div>
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">{a.category}</p>
                <h3 className="mt-2 font-display text-xl leading-snug line-clamp-2">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{a.author}</span><span>·</span><span>{a.read} min</span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
