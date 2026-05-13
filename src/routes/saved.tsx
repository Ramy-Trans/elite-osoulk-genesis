import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getSavedIds } from "@/lib/saved";
import { properties, PropertyCard, Footer, SectionHeader } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "العقارات المحفوظة — أصولك" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useLang();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(getSavedIds());
    const onStorage = () => setSavedIds(getSavedIds());
    window.addEventListener("storage", onStorage);
    window.addEventListener("osoulk-saved-change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("osoulk-saved-change", onStorage);
    };
  }, []);

  const saved = properties.filter((p) => savedIds.includes(p.id));

  return (
    <main className="min-h-screen">
      <section className="bg-navy py-16">
        <div className="os-container text-center text-primary-foreground">
          <Heart className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">{t("saved.heroTitle")}</h1>
          <p className="mt-3 text-primary-foreground/80">
            {saved.length > 0
              ? t(saved.length === 1 ? "saved.heroCount" : "saved.heroCountPlural").replace("{n}", String(saved.length))
              : t("saved.heroEmpty")}
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="os-container">
          {saved.length > 0 ? (
            <>
              <SectionHeader
                kicker={t("saved.kicker")}
                title={t("saved.title")}
                text={t("saved.text")}
              />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {saved.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-md py-16 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-navy">{t("saved.emptyTitle")}</h2>
              <p className="mt-3 text-muted-foreground">{t("saved.emptyText")}</p>
              <Button asChild className="mt-6" size="lg" variant="luxury">
                <Link to="/explore">{t("saved.browse")}</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
