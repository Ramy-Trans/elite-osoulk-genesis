import { createFileRoute } from "@tanstack/react-router";
import { Footer, PageHero, icons, arImage } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: "تجربة AR العقارية — أصولك | AR Property Experience — Osoulk" },
      { name: "description", content: "تجربة مستقبلية لاستعراض العقارات عبر الواقع المعزز على الهاتف المحمول." },
      { property: "og:title", content: "AR Property Experience — Osoulk" },
      { property: "og:description", content: "View premium property spaces through an immersive AR-ready concept." },
    ],
  }),
  component: AR,
});

function AR() {
  const { Eye, Layers3, Camera } = icons;
  const { lang } = useLang();

  const features = [
    {
      Icon: Eye,
      ar: "مسح العقار",
      en: "Scan Property",
      descAr: "وجّه كاميرتك نحو العقار لبدء تجربة AR.",
      descEn: "Point your camera at the property to start the AR experience.",
    },
    {
      Icon: Layers3,
      ar: "وضع النموذج",
      en: "Place Model",
      descAr: "ضع نموذجاً ثلاثي الأبعاد للعقار في مساحتك الحقيقية.",
      descEn: "Place a 3D model of the property in your real space.",
    },
    {
      Icon: Camera,
      ar: "حجز معاينة",
      en: "Book Viewing",
      descAr: "احجز معاينة فورية من خلال التجربة.",
      descEn: "Book an instant viewing directly from the experience.",
    },
  ];

  return (
    <main>
      <PageHero
        kicker={lang === "ar" ? "تجربة AR" : "AR Experience"}
        title={lang === "ar" ? "شاهد المساحة قبل أن تصل." : "View spaces before you arrive."}
        subtitle={lang === "ar"
          ? "مفهوم مستقبلي للهاتف أولاً — مسح، عرض في الفضاء، وتصور موجّه للعقارات المميزة."
          : "A futuristic, mobile-first AR concept for scan, view-in-space, and guided property visualization."
        }
        image={arImage}
      />
      <section className="py-16">
        <div className="os-container grid gap-6 lg:grid-cols-3">
          {features.map(({ Icon, ar, en, descAr, descEn }) => (
            <div key={en} className="premium-card p-8">
              <Icon className="text-aqua" />
              <h2 className="mt-4 text-3xl font-black text-navy">{lang === "ar" ? ar : en}</h2>
              <p className="mt-3 text-muted-foreground">{lang === "ar" ? descAr : descEn}</p>
            </div>
          ))}
        </div>
        <div className="os-container mt-10 rounded-3xl bg-navy p-8 text-primary-foreground shadow-premium">
          <p className="section-kicker text-gold-soft">
            {lang === "ar" ? "واجهة تجريبية" : "Demo interface"}
          </p>
          <h2 className="mt-3 text-4xl font-black">
            {lang === "ar" ? "امسح. قارن. قرر." : "Scan. Compare. Decide."}
          </h2>
          <Button variant="gold" className="mt-6">
            {lang === "ar" ? "ابدأ تجربة AR" : "Start AR Demo"}
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
