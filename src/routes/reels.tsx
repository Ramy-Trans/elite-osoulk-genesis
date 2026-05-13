import { createFileRoute } from "@tanstack/react-router";
import { Footer, PageHero, icons, interiorImage, villaImage, coastImage } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";
import { useState } from "react";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Property Reels — Osoulk" },
      { name: "description", content: "Browse premium property reels and request permission to submit approved real estate videos." },
      { property: "og:title", content: "Property Reels — Osoulk" },
    ],
  }),
  component: Reels,
});

function Reels() {
  const { t } = useLang();
  const { Play, Upload, ShieldCheck, Video } = icons;
  const [requestSent, setRequestSent] = useState(false);

  const reels = [interiorImage, villaImage, coastImage];
  const flowSteps = [
    { icon: Upload, label: t("reels.flow1") },
    { icon: ShieldCheck, label: t("reels.flow2") },
    { icon: Video, label: t("reels.flow3") },
  ] as const;

  return (
    <main>
      <PageHero
        kicker={t("reels.kicker")}
        title={t("reels.title")}
        subtitle={t("reels.subtitle")}
      />

      {/* Reel cards */}
      <section className="py-16">
        <div className="os-container grid gap-6 md:grid-cols-3">
          {reels.map((img, i) => (
            <article
              key={img}
              className="group relative h-[560px] overflow-hidden rounded-3xl shadow-premium cursor-pointer"
            >
              <img
                src={img}
                alt={`${t("reels.featured")} ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
              <div className="absolute bottom-0 p-6 text-primary-foreground">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background/20 backdrop-blur-sm">
                  <Play className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black">{t("reels.featured")} #{i + 1}</h2>
                <p className="mt-2 text-sm opacity-85">{t("reels.desc")}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Approval flow */}
      <section className="py-12">
        <div className="os-container premium-card p-8">
          <h2 className="text-4xl font-black text-navy">{t("reels.flowTitle")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {flowSteps.map(({ icon: Icon, label }, i) => (
              <div key={label} className="rounded-2xl bg-background p-6 shadow-float">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-black text-primary-foreground">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-aqua" />
                </div>
                <h3 className="mt-4 font-black text-navy">{label}</h3>
                <p className="mt-2 text-muted-foreground">{t("reels.flowDesc")}</p>
              </div>
            ))}
          </div>
          {requestSent ? (
            <div className="mt-8 flex items-center gap-3 rounded-xl bg-emerald-50 px-6 py-4 text-emerald-700 font-bold">
              <ShieldCheck className="h-5 w-5" />
              Request sent! We'll review and contact you within 48 hours.
            </div>
          ) : (
            <Button className="mt-8" size="lg" onClick={() => setRequestSent(true)}>
              {t("reels.requestBtn")}
            </Button>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
