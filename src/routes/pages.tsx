import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Footer, PageHero } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";
import { getPublicPages, type CmsPage } from "@/lib/api";
import { useState, useEffect } from "react";
import { Search, FileText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/pages")({
  head: () => ({
    meta: [
      { title: "الصفحات — أصولك" },
      { name: "description", content: "تصفح جميع الصفحات المتاحة على منصة أصولك." },
    ],
  }),
  component: PagesRoute,
});

function PagesRoute() {
  const location = useRouterState({ select: s => s.location.pathname });
  if (location !== "/pages") return <Outlet />;
  return <PagesListing />;
}

function PagesListing() {
  const { lang } = useLang();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicPages()
      .then(data => setPages(data))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pages.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = (lang === "ar" && p.titleAr ? p.titleAr : p.title).toLowerCase();
    return title.includes(q);
  });

  return (
    <main>
      <PageHero
        kicker={lang === "ar" ? "محتوى المنصة" : "Platform Content"}
        title={lang === "ar" ? "الصفحات" : "Pages"}
        subtitle={lang === "ar" ? "تصفح جميع الصفحات المتاحة على المنصة" : "Browse all available pages on the platform"}
      />

      <section className="py-16">
        <div className="os-container max-w-4xl mx-auto space-y-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "ابحث في الصفحات…" : "Search pages…"}
              className="h-14 w-full rounded-2xl border-2 bg-background pr-12 pl-5 text-base focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-black text-navy">
                {search ? (lang === "ar" ? "لا توجد نتائج" : "No results found") : (lang === "ar" ? "لا توجد صفحات منشورة بعد" : "No published pages yet")}
              </p>
              {search && (
                <button onClick={() => setSearch("")} className="mt-3 text-sm text-navy underline">
                  {lang === "ar" ? "مسح البحث" : "Clear search"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(p => {
                const title = lang === "ar" && p.titleAr ? p.titleAr : p.title;
                return (
                  <Link
                    key={p.id}
                    to="/pages/$slug"
                    params={{ slug: p.slug }}
                    className="flex items-center justify-between rounded-2xl border bg-card p-5 hover:shadow-float transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5">
                        <FileText className="h-5 w-5 text-navy" />
                      </div>
                      <div>
                        <p className="font-black text-navy group-hover:underline">{title}</p>
                        {p.seoDescription && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{p.seoDescription}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-navy transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
