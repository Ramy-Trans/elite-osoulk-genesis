import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { getPublicPage, type CmsPage } from "@/lib/api";
import { Footer, PageHero } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/pages/$slug")({
  loader: async ({ params }) => {
    try {
      const page = await getPublicPage(params.slug);
      if (!page) throw notFound();
      return page;
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const p = loaderData as CmsPage;
    return {
      meta: [
        { title: p.seoTitle || p.titleAr || p.title || "صفحة — أصولك" },
        { name: "description", content: p.seoDescription || "" },
        { name: "keywords", content: p.seoKeywords || "" },
        { property: "og:title", content: p.seoTitle || p.titleAr || p.title || "" },
        { property: "og:image", content: p.ogImage || "" },
      ],
    };
  },
  component: CmsPageRoute,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-16 w-16 text-muted-foreground/40" />
      <h1 className="text-3xl font-black text-navy">الصفحة غير موجودة</h1>
      <Link to="/"><Button>الرئيسية</Button></Link>
    </div>
  ),
});

function CmsPageRoute() {
  const { lang } = useLang();
  const page = Route.useLoaderData() as CmsPage;
  const ar = lang === "ar";

  const isDraft = page.publishStatus !== "published";
  const title = ar ? (page.titleAr || page.title) : page.title;
  const heroTitle = ar ? (page.heroTitleAr || page.heroTitle || title) : (page.heroTitle || title);
  const content = ar ? (page.contentAr || page.content) : page.content;

  return (
    <div className="min-h-screen bg-background">
      {isDraft && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-sm font-black text-amber-950">
          <span>⚠</span>
          <span>{ar ? "معاينة مسودة — هذه الصفحة غير منشورة بعد ولا يراها الزوار" : "Draft Preview — This page is not published yet and is not visible to visitors"}</span>
        </div>
      )}

      <PageHero
        kicker=""
        title={heroTitle}
        subtitle=""
        image={page.heroImage}
      />

      <div className="os-container py-12">
        <div className="mx-auto max-w-3xl">
          {content ? (
            <div
              className="prose prose-navy max-w-none leading-relaxed text-foreground [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-navy [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-navy [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-navy [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:text-muted-foreground [&_a]:text-aqua [&_a]:font-bold [&_strong]:text-navy"
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br />") }}
            />
          ) : (
            <div className="premium-card p-12 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4">{ar ? "لا يوجد محتوى لهذه الصفحة بعد" : "No content for this page yet"}</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
