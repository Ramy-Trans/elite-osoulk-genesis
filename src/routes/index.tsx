import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppCTA, ConsultationForm, FAQPreview, Footer, ListingGrid,
  PageHero, SectionHeader, TrustSection, agencies, compoundImage, icons, articleCards,
} from "@/components/osoulk/site";
import { articleCardsAr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";
import { QrCode, Share2, Copy, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "أصولك — وساطة عقارية فاخرة في مصر" },
    { name: "description", content: "اكتشف العقارات المميزة والمجمعات والوكالات وأدوات البائعين في مصر." },
    { property: "og:title", content: "أصولك — وساطة عقارية فاخرة في مصر" },
    { property: "og:description", content: "اكتشف العقارات المميزة والمجمعات والوكالات في مصر." },
  ]}),
  component: Index,
});

function Index() {
  const { t, lang } = useLang();
  const { ShieldCheck, Sparkles, ArrowRight } = icons;

  const featKeys = ["feat.0", "feat.1", "feat.2"] as const;
  const featLinks = ["/sell", "/explore", "/contact"] as const;

  const cards = lang === "ar" ? articleCardsAr : articleCards;

  return (
    <main>
      <PageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
      />

      <section className="py-16">
        <div className="os-container">
          <SectionHeader
            kicker={t("props.kicker")}
            title={t("props.title")}
            text={t("props.text")}
          />
          <ListingGrid />
        </div>
      </section>

      <section className="py-12">
        <div className="os-container grid gap-5 md:grid-cols-3">
          {featKeys.map((key, i) => (
            <div key={key} className="premium-card p-7">
              <Sparkles className="text-aqua" />
              <h3 className="mt-4 text-2xl font-black text-navy">{t(key)}</h3>
              <p className="mt-3 text-muted-foreground">{t("feat.text")}</p>
              <Button asChild variant={i === 0 ? "luxury" : "outline"} className="mt-5">
                <Link to={featLinks[i]}>{t("feat.learnMore")} <ArrowRight /></Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="os-container">
          <SectionHeader kicker={t("launches.kicker")} title={t("launches.title")} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {agencies.map(a => (
              <Link to="/agencies/$id" params={{ id: a.id }} key={a.name} className="group overflow-hidden rounded-2xl border bg-card shadow-float">
                <img src={a.logo} alt={lang === "ar" ? a.nameAr : a.name} className="h-40 w-full object-cover transition-transform group-hover:scale-105" />
                <div className="p-4 font-black text-navy">{lang === "ar" ? a.nameAr : a.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="os-container grid gap-6 md:grid-cols-2">
          <div className="premium-card p-8">
            <p className="section-kicker">{t("buy.kicker")}</p>
            <h2 className="mt-3 text-4xl font-black text-navy">{t("buy.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("buy.text")}</p>
            <ul className="mt-6 space-y-3 font-bold text-navy">
              <li><ShieldCheck className="mr-2 inline text-aqua" />{t("buy.verified")}</li>
              <li><ShieldCheck className="mr-2 inline text-aqua" />{t("buy.agency")}</li>
              <li><ShieldCheck className="mr-2 inline text-aqua" />{t("buy.seo")}</li>
            </ul>
          </div>
          <img src={compoundImage} alt="Premium compound" className="h-full min-h-96 rounded-2xl object-cover shadow-premium" />
        </div>
      </section>

      <section className="py-16 bg-navy/4">
        <div className="os-container">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] items-center">
            <div>
              <p className="section-kicker text-gold">
                {lang === "ar" ? "كيت التسويق الجاهز" : "Marketing Kit"}
              </p>
              <h2 className="mt-3 text-4xl font-black text-navy sm:text-5xl">
                {lang === "ar"
                  ? "سوّق عقارك في ثوانٍ."
                  : "Market your property in seconds."
                }
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {lang === "ar"
                  ? "لكل عقار مدرج على أصولك كيت تسويقي جاهز — رابط مشاركة، نص منشور عربي وإنجليزي، رمز QR قابل للطباعة، وأزرار مشاركة فورية على واتساب وفيسبوك."
                  : "Every listing on Osoulk comes with a ready-made marketing kit — shareable link, Arabic & English post captions, printable QR code, and one-click sharing to WhatsApp and Facebook."
                }
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: QrCode, ar: "رمز QR للطباعة", en: "Printable QR Code" },
                  { icon: Copy, ar: "نص منشور جاهز", en: "Ready Post Caption" },
                  { icon: MessageCircle, ar: "مشاركة واتساب فورية", en: "Instant WhatsApp Share" },
                  { icon: Share2, ar: "مشاركة فيسبوك وإنستجرام", en: "Facebook & Instagram Share" },
                ].map(({ icon: Icon, ar, en }) => (
                  <div key={en} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/10">
                      <Icon className="h-4 w-4 text-navy" />
                    </div>
                    <span className="text-sm font-bold text-navy">{lang === "ar" ? ar : en}</span>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" variant="luxury" className="mt-8">
                <Link to="/explore">
                  {lang === "ar" ? "ابحث عن عقار وجرب الكيت" : "Browse a listing and try the kit"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="premium-card overflow-hidden p-0 shadow-premium">
                <div className="bg-navy px-5 py-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-white/60 font-mono">marketing-kit / listing-preview</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-xl bg-secondary h-32 flex items-center justify-center text-muted-foreground text-sm">
                    {lang === "ar" ? "صورة العقار" : "Property Image"}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 flex-1 rounded-lg bg-secondary" />
                    <div className="h-10 w-20 rounded-lg bg-navy flex items-center justify-center">
                      <Copy className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-11 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center gap-2 text-xs font-bold text-[#25D366]">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </div>
                    <div className="h-11 rounded-lg bg-[#1877F2]/20 border border-[#1877F2]/40 flex items-center justify-center gap-2 text-xs font-bold text-[#1877F2]">
                      <Share2 className="h-4 w-4" /> Facebook
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="h-28 w-28 rounded-xl bg-secondary border-2 border-dashed border-navy/30 flex items-center justify-center text-navy/40">
                      <QrCode className="h-12 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="os-container">
          <div className="rounded-3xl bg-navy px-8 py-12 text-center text-primary-foreground sm:px-14 sm:py-16">
            <p className="section-kicker text-gold">
              {lang === "ar" ? "لديك عقار للبيع أو الإيجار؟" : "Have a property to sell or rent?"}
            </p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              {lang === "ar" ? "أدرجه على أصولك اليوم." : "List it on Osoulk today."}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/75">
              {lang === "ar"
                ? "ابدأ بـ 350 جنيه فقط — إدراج موثق، شارة مميزة، وكيت تسويقي جاهز."
                : "Start from EGP 350 only — verified listing, featured badge, and ready marketing kit."
              }
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="xl" variant="gold">
                <Link to="/create-listing">
                  {lang === "ar" ? "أضف عقارك الآن" : "Add Your Property Now"}
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-primary-foreground/35 bg-background/10 text-primary-foreground hover:bg-background/20">
                <Link to="/packages">
                  {lang === "ar" ? "عرض الباقات والأسعار" : "View Packages & Pricing"}
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-primary-foreground/50">
              {lang === "ar"
                ? "كل قائمة تخضع للمراجعة والموافقة قبل النشر لضمان الجودة."
                : "Every listing is reviewed and approved before publishing to ensure quality."
              }
            </p>
          </div>
        </div>
      </section>

      <TrustSection />

      <section className="py-16">
        <div className="os-container">
          <SectionHeader kicker={t("articles.kicker")} title={t("articles.title")} />
          <div className="grid gap-6 md:grid-cols-3">
            {cards.map(a => (
              <Link to={a.href as "/" | "/articles" | "/reels"} key={a.title} className="property-card rounded-2xl border bg-card p-4 shadow-float">
                {"image" in a && <img src={(a as typeof articleCards[0]).image} alt={a.title} className="h-48 w-full rounded-xl object-cover" />}
                <p className="section-kicker mt-4">{a.category}</p>
                <h3 className="mt-2 text-xl font-black text-navy">{a.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AppCTA />
      <ConsultationForm />
      <FAQPreview />
      <Footer />
    </main>
  );
}
