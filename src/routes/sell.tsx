import { createFileRoute, Link } from "@tanstack/react-router";
import { AppCTA, ConsultationForm, Footer, PageHero, TrustSection, icons, villaImage } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Property — Osoulk" },
      { name: "description", content: "Submit, value, and sell premium property with expert support, verified buyer reach, and approval-ready workflows." },
      { property: "og:title", content: "Sell Your Property — Osoulk" },
    ],
  }),
  component: Sell,
});

function Sell() {
  const { t } = useLang();
  const { Check } = icons;

  const steps = [
    t("sell.step1"),
    t("sell.step2"),
    t("sell.step3"),
  ] as const;

  const whyItems = [
    t("sell.why1"),
    t("sell.why2"),
    t("sell.why3"),
    t("sell.why4"),
  ] as const;

  return (
    <main>
      <PageHero
        kicker={t("sell.kicker")}
        title={t("sell.title")}
        subtitle={t("sell.subtitle")}
        image={villaImage}
      />

      <section className="py-16">
        <div className="os-container grid gap-10 lg:grid-cols-2">
          {/* Steps */}
          <div>
            <p className="section-kicker">{t("sell.howKicker")}</p>
            <h2 className="mt-3 text-5xl font-black text-navy">{t("sell.howTitle")}</h2>
            {steps.map((step, i) => (
              <div key={step} className="mt-6 rounded-2xl border bg-card p-6 shadow-float">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-black text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="font-black text-navy">{t("sell.step")} {i + 1} — {step}</h3>
                </div>
                <p className="mt-1 text-muted-foreground">{t("sell.stepDesc")}</p>
              </div>
            ))}
            <Button asChild className="mt-8" size="lg">
              <Link to="/create-listing">{t("sell.createListing")}</Link>
            </Button>
          </div>

          {/* Why sell */}
          <div className="premium-card p-8">
            <p className="section-kicker">{t("sell.whyKicker")}</p>
            <h3 className="mt-3 text-3xl font-black text-navy">{t("sell.whyTitle")}</h3>
            {whyItems.map((item) => (
              <p key={item} className="mt-5 font-bold">
                <Check className="mr-2 inline text-aqua" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <TrustSection />
      <AppCTA />
      <ConsultationForm />
      <Footer />
    </main>
  );
}
