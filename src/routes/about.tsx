import { createFileRoute } from "@tanstack/react-router";
import { Footer, PageHero, TrustSection, icons, interiorImage } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Osoulk — Premium Real Estate Company" },
      { name: "description", content: "Learn about Osoulk's mission, vision, values, and premium real estate platform strategy." },
      { property: "og:title", content: "About Osoulk" },
    ],
  }),
  component: About,
});

function About() {
  const { t } = useLang();
  const { Gem, ShieldCheck, Users } = icons;

  const values = [
    { icon: Gem, key: "about.val1" },
    { icon: ShieldCheck, key: "about.val2" },
    { icon: Users, key: "about.val3" },
  ] as const;

  return (
    <main>
      <PageHero
        kicker={t("about.kicker")}
        title={t("about.title")}
        subtitle={t("about.subtitle")}
        image={interiorImage}
      />

      <section className="py-16">
        <div className="os-container grid gap-8 lg:grid-cols-2">
          <div>
            <p className="section-kicker">{t("about.storyKicker")}</p>
            <h2 className="mt-3 text-5xl font-black text-navy">{t("about.storyTitle")}</h2>
            <p className="mt-5 leading-8 text-muted-foreground">{t("about.storyText")}</p>
          </div>
          <div className="grid gap-4">
            {values.map(({ icon: Icon, key }) => (
              <div key={key} className="premium-card p-6">
                <Icon className="h-6 w-6 text-aqua" />
                <h3 className="mt-3 text-2xl font-black text-navy">{t(key)}</h3>
                <p className="mt-2 text-muted-foreground">{t("about.valDesc")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TrustSection />
      <Footer />
    </main>
  );
}
