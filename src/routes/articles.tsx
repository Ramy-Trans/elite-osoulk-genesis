import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer, PageHero, SectionHeader, coastImage } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";
import { getArticles, type Article } from "@/lib/api";
import { useState, useEffect } from "react";
import { Clock, Tag, Search, BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "مقالات عقارية — أصولك" },
      { name: "description", content: "مقالات ودليل شامل للمشترين والمستثمرين في السوق العقاري المصري." },
      { property: "og:title", content: "مقالات عقارية — أصولك" },
    ],
  }),
  component: Articles,
});

const FALLBACK_ARTICLES = [
  { id: "f1", title: "دليل المشتري: كيف تختار عقارك المثالي في مصر", titleAr: "دليل المشتري: كيف تختار عقارك المثالي في مصر", slug: "f1", category: "دليل المشترين", summary: "كل ما تحتاجه لتختار عقارك بذكاء — الموقع، السعر، والتوقيت.", coverImage: coastImage, tags: ["شراء", "استثمار"], readingTime: 4, createdAt: new Date().toISOString(), status: "published" },
  { id: "f2", title: "أفضل مناطق الاستثمار العقاري في مصر 2026", titleAr: "أفضل مناطق الاستثمار العقاري في مصر 2026", slug: "f2", category: "استثمار", summary: "تحليل شامل لأفضل المناطق للاستثمار العقاري في مصر هذا العام.", coverImage: "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80", tags: ["استثمار", "تحليل"], readingTime: 6, createdAt: new Date().toISOString(), status: "published" },
  { id: "f3", title: "حقوق المستأجر والمؤجر في القانون المصري", titleAr: "حقوق المستأجر والمؤجر في القانون المصري", slug: "f3", category: "قانوني", summary: "فهم حقوقك القانونية سواء كنت مستأجراً أو مؤجراً في مصر.", coverImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80", tags: ["قانون", "إيجار"], readingTime: 5, createdAt: new Date().toISOString(), status: "published" },
] as Article[];

const CATEGORIES = ["الكل", "دليل المشترين", "استثمار", "قانوني", "أخبار السوق", "نصائح"];

function ArticleCard({ article }: { article: Article }) {
  const { lang } = useLang();
  const title = lang === "ar" && article.titleAr ? article.titleAr : article.title;
  const summary = lang === "ar" && article.summaryAr ? article.summaryAr : article.summary;

  return (
    <Link to="/articles/$id" params={{ id: article.slug || article.id }} className="block group">
      <article className="property-card overflow-hidden rounded-2xl border bg-card shadow-float h-full">
        <div className="relative h-48 overflow-hidden bg-secondary">
          {article.coverImage ? (
            <img src={article.coverImage} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-navy to-navy/50">
              <BookOpen className="h-12 w-12 text-white/30" />
            </div>
          )}
          {article.featured && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-xs font-black text-navy">
              <Sparkles className="h-3 w-3" /> مميز
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="rounded-full bg-navy/5 px-2.5 py-1 font-bold text-navy">{article.category}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readingTime || 3} د</span>
          </div>
          <h3 className="font-black text-navy text-lg leading-snug group-hover:underline line-clamp-2">{title}</h3>
          {summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{summary}</p>}
          {article.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map(tag => (
                <span key={tag} className="flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />{tag}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{new Date(article.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </article>
    </Link>
  );
}

function Articles() {
  const { t } = useLang();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");

  useEffect(() => {
    getArticles("published").then(data => {
      setArticles(data.length > 0 ? data : FALLBACK_ARTICLES);
      setLoading(false);
    }).catch(() => {
      setArticles(FALLBACK_ARTICLES);
      setLoading(false);
    });
  }, []);

  const featured = articles.find(a => a.featured) || articles[0];
  const rest = articles.filter(a => a.id !== featured?.id);

  const filtered = rest.filter(a => {
    const matchCat = category === "الكل" || a.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.titleAr?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <main>
      <PageHero
        kicker={t("articles.pageKicker")}
        title={t("articles.pageTitle")}
        subtitle={t("articles.pageSubtitle")}
        image={coastImage}
      />

      <section className="py-16">
        <div className="os-container space-y-10">
          {/* Featured Article */}
          {featured && !loading && (
            <Link to="/articles/$id" params={{ id: featured.slug || featured.id }} className="block group">
              <article className="premium-card overflow-hidden grid gap-0 md:grid-cols-[.45fr_.55fr]">
                <div className="relative h-64 md:h-auto overflow-hidden bg-secondary">
                  {featured.coverImage ? (
                    <img src={featured.coverImage} alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-navy to-aqua flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-white/30" />
                    </div>
                  )}
                  <span className="absolute top-4 right-4 rounded-full bg-gold px-3 py-1 text-xs font-black text-navy flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> مقال مميز
                  </span>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <span className="section-kicker">{featured.category}</span>
                  <h2 className="mt-3 text-3xl md:text-4xl font-black text-navy leading-tight group-hover:underline">{featured.title}</h2>
                  {featured.summary && <p className="mt-4 text-muted-foreground leading-relaxed">{featured.summary}</p>}
                  <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{featured.readingTime || 3} دقائق</span>
                    <span>{new Date(featured.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Search + Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في المقالات…"
                className="h-11 w-full rounded-xl border bg-background pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${category === cat ? "bg-navy text-white" : "bg-secondary text-navy hover:bg-navy/10"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles grid */}
          <SectionHeader kicker={t("articles.catKicker")} title={t("articles.catTitle")} />

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1,2,3].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-secondary" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-black text-navy">{search ? "لا توجد نتائج" : "لا توجد مقالات بعد"}</p>
              <p className="mt-2 text-sm text-muted-foreground">سيتم نشر المقالات قريباً من خلال لوحة الإدارة.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
