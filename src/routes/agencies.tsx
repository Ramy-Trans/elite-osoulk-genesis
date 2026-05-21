import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Footer, PageHero, SectionHeader, agencies } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "الوكالات العقارية — أصولك | Real Estate Agencies — Osoulk" },
      { name: "description", content: "دليل الوكالات العقارية الشريكة في أصولك. تصفح مناطق التغطية وأفضل العروض والملفات الشخصية المميزة." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "أصولك" },
      { property: "og:title", content: "الوكالات العقارية — أصولك" },
      { property: "og:description", content: "دليل الوكالات العقارية الشريكة في أصولك." },
      { property: "og:image", content: "/properties/ahel-masr-walkway/01.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Real Estate Agencies — Osoulk" },
      { name: "twitter:description", content: "Partner agency directory with coverage areas, listing stats, and premium profile cards." },
      { name: "twitter:image", content: "/properties/ahel-masr-walkway/01.webp" },
    ],
    links: [{ rel: "canonical", href: "https://osoulk.com/agencies" }],
  }),
  component: Agencies,
});

function Agencies() {
  const { t, lang } = useLang();
  const { location } = useRouterState();
  const isChildRoute = location.pathname.startsWith("/agencies/") && location.pathname !== "/agencies/";

  if (isChildRoute) return <Outlet />;

  return (
    <main>
      <PageHero
        kicker={t("agencies.kicker")}
        title={t("agencies.title")}
        subtitle={t("agencies.subtitle")}
      />

      <section className="py-16">
        <div className="os-container">
          <SectionHeader
            kicker={t("agencies.dirKicker")}
            title={t("agencies.dirTitle")}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {agencies.map((a) => {
              const name = lang === "ar" ? a.nameAr : a.name;
              const area = lang === "ar" ? a.areaAr : a.area;
              return (
                <article key={a.name} className="premium-card p-6 text-center transition-shadow hover:shadow-premium">
                  <img
                    src={a.logo}
                    alt={name}
                    className="mx-auto h-36 w-36 rounded-2xl object-cover"
                    loading="lazy"
                  />
                  <h2 className="mt-5 text-xl font-black text-navy">{name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("agencies.coverage")}: {area}
                  </p>
                  <p className="mt-2 font-black text-navy">
                    {t("agencies.properties")}: {a.listings}
                  </p>
                  <Button variant="outline" className="mt-5 w-full" asChild>
                    <Link to="/agencies/$id" params={{ id: a.id }}>{t("agencies.viewProfile")}</Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
