import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Footer, PageHero } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";
import { getArticle, getArticles, type Article } from "@/lib/api";
import { Clock, Tag, ChevronLeft, Share2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/articles/$id")({
  loader: async ({ params }): Promise<{ article: Article; related: Article[] }> => {
    try {
      const article = await getArticle(params.id);
      if (!article) throw notFound();
      const all = await getArticles("published");
      const related = (all ?? []).filter(a => a.id !== article.id && (a.category === article.category || a.tags?.some(t => article.tags?.includes(t)))).slice(0, 3);
      return { article, related };
    } catch (err) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { article } = loaderData;
    return {
      meta: [
        { title: article.seoTitle || article.title },
        { name: "description", content: article.seoDescription || article.summary },
        { property: "og:title", content: article.seoTitle || article.title },
        { property: "og:description", content: article.seoDescription || article.summary },
        ...(article.seoImage || article.coverImage ? [{ property: "og:image", content: article.seoImage || article.coverImage }] : []),
        ...(article.canonicalUrl ? [{ name: "canonical", content: article.canonicalUrl }] : []),
        ...(article.seoKeywords?.length ? [{ name: "keywords", content: article.seoKeywords.join(", ") }] : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.summary,
            image: article.coverImage || article.seoImage,
            datePublished: article.createdAt,
            dateModified: article.updatedAt,
            author: { "@type": "Organization", name: "أصولك" },
            publisher: {
              "@type": "Organization",
              name: "أصولك",
              logo: { "@type": "ImageObject", url: "/logo.svg" },
            },
          }),
        },
      ],
    };
  },
  component: ArticleDetail,
});

function ArticleDetail() {
  const { article, related } = Route.useLoaderData();
  const { lang } = useLang();

  const title = lang === "ar" && article.titleAr ? article.titleAr : article.title;
  const summary = lang === "ar" && article.summaryAr ? article.summaryAr : article.summary;
  const content = lang === "ar" && article.contentAr ? article.contentAr : article.content;

  function share() {
    if (navigator.share) {
      navigator.share({ title, text: summary, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <main>
      {article.coverImage && (
        <div className="relative h-72 md:h-[420px] overflow-hidden bg-navy">
          <img src={article.coverImage} alt={title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <div className="os-container">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
                <Link to="/articles" className="hover:text-white">المقالات</Link>
                <span>/</span>
                <span className="text-white">{article.category}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white max-w-3xl leading-tight">{title}</h1>
              {summary && <p className="mt-3 text-white/80 max-w-2xl text-lg">{summary}</p>}
            </div>
          </div>
        </div>
      )}

      {!article.coverImage && (
        <PageHero kicker={article.category} title={title} subtitle={summary} />
      )}

      <section className="py-10">
        <div className="os-container">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <article>
              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b text-sm text-muted-foreground">
                <Link to="/articles" className="flex items-center gap-1 text-navy font-bold hover:underline">
                  <ChevronLeft className="h-4 w-4" /> العودة للمقالات
                </Link>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {article.readingTime || 1} دقيقة قراءة</span>
                <span>{new Date(article.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
                {article.tags?.map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
                <button onClick={share} className="ml-auto flex items-center gap-1 text-navy font-bold hover:underline">
                  <Share2 className="h-4 w-4" /> مشاركة
                </button>
              </div>

              {/* Content */}
              {content ? (
                <div
                  className="prose prose-lg max-w-none text-foreground [&_h2]:text-navy [&_h2]:font-black [&_h3]:text-navy [&_h3]:font-bold [&_a]:text-navy [&_a]:underline [&_strong]:text-navy"
                  style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
                  dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }}
                />
              ) : (
                <div className="premium-card p-8 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-4" />
                  <p>محتوى المقالة قيد التحرير…</p>
                </div>
              )}

              {/* Tags */}
              {article.tags?.length > 0 && (
                <div className="mt-10 pt-6 border-t">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-3">الكلمات المفتاحية</p>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-navy/5 px-4 py-1.5 text-sm font-bold text-navy">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {related.length > 0 && (
                <div className="premium-card p-5">
                  <h3 className="font-black text-navy mb-4">مقالات ذات صلة</h3>
                  <div className="space-y-4">
                    {related.map(a => {
                      const rTitle = lang === "ar" && a.titleAr ? a.titleAr : a.title;
                      const rSummary = lang === "ar" && a.summaryAr ? a.summaryAr : a.summary;
                      return (
                        <Link key={a.id} to="/articles/$id" params={{ id: a.slug || a.id }} className="block group">
                          {a.coverImage && (
                            <img src={a.coverImage} alt={rTitle} className="w-full h-32 object-cover rounded-xl mb-2" />
                          )}
                          <p className="font-bold text-navy group-hover:underline text-sm">{rTitle}</p>
                          {rSummary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rSummary}</p>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="premium-card p-5 bg-navy text-white">
                <h3 className="font-black mb-2">هل تبحث عن عقار؟</h3>
                <p className="text-sm text-white/70 mb-4">تصفح مئات العقارات المميزة في مصر</p>
                <Link to="/explore" className="block text-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:opacity-90 transition-opacity">
                  استكشف الآن
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
