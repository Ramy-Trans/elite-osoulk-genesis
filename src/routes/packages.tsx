import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer, PageHero, icons } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";
import { useState, useEffect } from "react";
import { getCachedUser } from "@/lib/api";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "الباقات والأسعار — أصولك | Packages & Pricing — Osoulk" },
      { name: "description", content: "باقات أصولك للملاك والوسطاء والمطورين — ابدأ بـ 350 جنيه. Packages for owners, brokers, and developers starting from EGP 350." },
      { property: "og:title", content: "الباقات والأسعار — أصولك" },
    ],
  }),
  component: Packages,
});

type UserType = "owner" | "broker" | "developer";

const plans: Record<UserType, {
  labelAr: string; labelEn: string;
  priceAr: string; priceEn: string;
  periodAr: string; periodEn: string;
  noteAr: string; noteEn: string;
  featuresAr: string[]; featuresEn: string[];
  variant: "luxury" | "gold"; isFeatured: boolean;
}[]> = {
  owner: [
    {
      labelAr: "باقة الإطلاق",
      labelEn: "Launch Package",
      priceAr: "٣٥٠ جنيه",
      priceEn: "EGP 350",
      periodAr: "دفعة واحدة",
      periodEn: "one-time",
      noteAr: "مثالية لبيع أو تأجير عقار واحد",
      noteEn: "Perfect for selling or renting one property",
      featuresAr: [
        "قائمة عقار واحدة",
        "شارة موثق",
        "ظهور في نتائج البحث",
        "صور حتى 5 صور",
        "تواصل مباشر عبر واتساب",
      ],
      featuresEn: [
        "1 property listing",
        "Verified badge",
        "Search result visibility",
        "Up to 5 photos",
        "Direct WhatsApp contact",
      ],
      variant: "luxury",
      isFeatured: false,
    },
    {
      labelAr: "الظهور المميز",
      labelEn: "Featured Visibility",
      priceAr: "٨٥٠ جنيه",
      priceEn: "EGP 850",
      periodAr: "لمدة شهر",
      periodEn: "for 30 days",
      noteAr: "تصدر نتائج البحث وجذب مزيد من المشترين",
      noteEn: "Rise to the top of search results and attract more buyers",
      featuresAr: [
        "قائمة عقار واحدة",
        "ظهور مميز في أعلى البحث",
        "شارة موثق + مميز",
        "صور حتى 15 صورة",
        "كيت التسويق الجاهز",
        "رمز QR قابل للطباعة",
        "أولوية في المراجعة",
      ],
      featuresEn: [
        "1 property listing",
        "Featured at top of search",
        "Verified + Featured badge",
        "Up to 15 photos",
        "Ready-made Marketing Kit",
        "Printable QR code",
        "Priority review",
      ],
      variant: "gold",
      isFeatured: true,
    },
  ],
  broker: [
    {
      labelAr: "باقة الوسيط",
      labelEn: "Broker Plan",
      priceAr: "١٥٠٠ جنيه",
      priceEn: "EGP 1,500",
      periodAr: "شهرياً",
      periodEn: "per month",
      noteAr: "للوسطاء المستقلين والوكالات الصغيرة",
      noteEn: "For independent brokers and small agencies",
      featuresAr: [
        "حتى 5 قوائم عقارية",
        "لوحة تحكم الوسيط",
        "CRM — تتبع العملاء المحتملين",
        "كيت تسويق لكل عقار",
        "رمز QR لكل قائمة",
        "ملف وسيط عام",
        "إحصاءات المشاهدات",
        "دعم أولوية",
      ],
      featuresEn: [
        "Up to 5 property listings",
        "Broker dashboard panel",
        "CRM — leads tracking",
        "Marketing Kit per listing",
        "QR code per listing",
        "Public broker profile",
        "View analytics",
        "Priority support",
      ],
      variant: "luxury",
      isFeatured: false,
    },
    {
      labelAr: "وسيط نخبة",
      labelEn: "Elite Broker",
      priceAr: "٣٠٠٠ جنيه",
      priceEn: "EGP 3,000",
      periodAr: "شهرياً",
      periodEn: "per month",
      noteAr: "للوسطاء المحترفين وفرق المبيعات",
      noteEn: "For professional brokers and sales teams",
      featuresAr: [
        "حتى 20 قائمة عقارية",
        "جميع مزايا باقة الوسيط",
        "ظهور على الصفحة الرئيسية",
        "فيديوهات ريلز معتمدة",
        "نشر على صفحات أصولك",
        "تقارير أداء متقدمة",
        "مدير حساب مخصص",
      ],
      featuresEn: [
        "Up to 20 property listings",
        "All Broker Plan features",
        "Homepage exposure",
        "Approved property reels",
        "Published on Osoulk pages",
        "Advanced performance reports",
        "Dedicated account manager",
      ],
      variant: "gold",
      isFeatured: true,
    },
  ],
  developer: [
    {
      labelAr: "باقة المطور",
      labelEn: "Developer Plan",
      priceAr: "١٠٬٠٠٠ جنيه",
      priceEn: "EGP 10,000",
      periodAr: "شهرياً",
      periodEn: "per month",
      noteAr: "للمطورين العقاريين والشركات الكبرى",
      noteEn: "For real estate developers and large companies",
      featuresAr: [
        "قوائم غير محدودة",
        "لوحة تحكم المطور الكاملة",
        "CRM متقدم — إدارة المشاريع",
        "كيت تسويق لكل مشروع",
        "صفحة هبوط خاصة بالشركة",
        "نشر على صفحات أصولك الرسمية",
        "قسم المجمعات والمشاريع",
        "تقارير مبيعات تفصيلية",
        "فريق دعم مخصص",
      ],
      featuresEn: [
        "Unlimited listings",
        "Full developer dashboard",
        "Advanced CRM — project management",
        "Marketing Kit per project",
        "Dedicated company landing page",
        "Published on Osoulk official pages",
        "Compounds & projects section",
        "Detailed sales reports",
        "Dedicated support team",
      ],
      variant: "gold",
      isFeatured: true,
    },
    {
      labelAr: "الحضور التسويقي",
      labelEn: "Marketing Presence",
      priceAr: "٥٬٠٠٠ جنيه",
      priceEn: "EGP 5,000",
      periodAr: "شهرياً",
      periodEn: "per month",
      noteAr: "للشركات المتوسطة التي تريد حضوراً رقمياً قوياً",
      noteEn: "For mid-size companies wanting strong digital presence",
      featuresAr: [
        "حتى 30 قائمة عقارية",
        "لوحة تحكم المطور",
        "CRM — تتبع المشاريع",
        "كيت تسويق لكل مشروع",
        "ريلز عقارية معتمدة",
        "تقارير أداء المبيعات",
      ],
      featuresEn: [
        "Up to 30 property listings",
        "Developer dashboard",
        "CRM — project tracking",
        "Marketing Kit per project",
        "Approved property reels",
        "Sales performance reports",
      ],
      variant: "luxury",
      isFeatured: false,
    },
  ],
};

const tabLabels: Record<UserType, { ar: string; en: string; desc: { ar: string; en: string } }> = {
  owner: {
    ar: "مالك / بائع",
    en: "Owner / Seller",
    desc: { ar: "تبيع أو تؤجر عقاراً بشكل مستقل", en: "Selling or renting a property independently" },
  },
  broker: {
    ar: "وسيط / وكيل",
    en: "Broker / Agent",
    desc: { ar: "وسيط مستقل أو وكالة صغيرة", en: "Independent broker or small agency" },
  },
  developer: {
    ar: "مطور / شركة",
    en: "Developer / Company",
    desc: { ar: "شركة تطوير عقاري أو مطور كبير", en: "Real estate developer or large company" },
  },
};

function roleToTab(role: string | undefined): UserType {
  if (role === "broker") return "broker";
  if (role === "developer") return "developer";
  return "owner";
}

function Packages() {
  const { t, lang } = useLang();
  const { Check, Crown } = icons;

  const [activeType, setActiveType] = useState<UserType>("owner");
  const [loggedInType, setLoggedInType] = useState<UserType | null>(null);

  useEffect(() => {
    const user = getCachedUser();
    if (user?.role) {
      const mapped = roleToTab(user.role);
      setActiveType(mapped);
      setLoggedInType(mapped);
    }
  }, []);

  const activePlans = plans[activeType];
  const tabs = Object.entries(tabLabels) as [UserType, typeof tabLabels[UserType]][];

  return (
    <main>
      <PageHero
        kicker={t("packages.kicker")}
        title={lang === "ar" ? "باقات مصممة لكل دور عقاري." : "Packages built for every real estate role."}
        subtitle={lang === "ar"
          ? "اختر نوع حسابك وشاهد الباقة المناسبة لك — مالك، وسيط، أو مطور."
          : "Choose your account type and see the right plan — owner, broker, or developer."
        }
      />

      <section className="py-16">
        <div className="os-container">
          <div className="mb-10 flex flex-col items-center gap-4">
            {loggedInType ? (
              /* Logged-in: show role label only, no switcher */
              <div className="flex items-center gap-2 rounded-2xl border bg-secondary/50 px-6 py-3">
                <span className="text-sm font-black text-navy">
                  {lang === "ar" ? tabLabels[loggedInType].ar : tabLabels[loggedInType].en}
                </span>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
                  {lang === "ar" ? "حسابك الحالي" : "Your account"}
                </span>
              </div>
            ) : (
              /* Guest: show full tab switcher */
              <>
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  {lang === "ar" ? "اختر نوع حسابك" : "Select your account type"}
                </p>
                <div className="flex flex-wrap justify-center gap-3 rounded-2xl border bg-secondary/50 p-2">
                  {tabs.map(([type, labels]) => (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className={`rounded-xl px-6 py-3 text-sm font-black transition-all ${
                        activeType === type
                          ? "bg-navy text-white shadow-float"
                          : "text-muted-foreground hover:text-navy"
                      }`}
                    >
                      {lang === "ar" ? labels.ar : labels.en}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? tabLabels[activeType].desc.ar : tabLabels[activeType].desc.en}
            </p>
          </div>

          <div className={`grid gap-6 ${activePlans.length === 1 ? "max-w-md mx-auto" : "md:grid-cols-2 max-w-3xl mx-auto"}`}>
            {activePlans.map(plan => {
              const label = lang === "ar" ? plan.labelAr : plan.labelEn;
              const price = lang === "ar" ? plan.priceAr : plan.priceEn;
              const period = lang === "ar" ? plan.periodAr : plan.periodEn;
              const note = lang === "ar" ? plan.noteAr : plan.noteEn;
              const features = lang === "ar" ? plan.featuresAr : plan.featuresEn;
              return (
                <article
                  key={label}
                  className={`premium-card p-7 transition-shadow hover:shadow-premium relative ${plan.isFeatured ? "ring-2 ring-gold" : ""}`}
                >
                  {plan.isFeatured && (
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-black text-gold">
                      <Crown className="h-3.5 w-3.5" />
                      {lang === "ar" ? "الأكثر اختياراً" : "Most Popular"}
                    </div>
                  )}
                  {!plan.isFeatured && <Crown className="h-6 w-6 text-gold" />}
                  <h2 className="mt-4 text-2xl font-black text-navy">{label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{note}</p>
                  <div className="mt-4 border-t pt-4">
                    <span className="text-4xl font-black text-navy">{price}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{period}</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {features.map(feat => (
                      <p key={feat} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                        {feat}
                      </p>
                    ))}
                  </div>
                  <Button asChild className="mt-7 w-full" variant={plan.variant} size="lg">
                    <Link to="/create-listing">
                      {lang === "ar" ? "ابدأ الآن" : "Get Started"}
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>

          <div className="mt-14 rounded-2xl border bg-navy/5 p-8 text-center">
            <p className="section-kicker">{lang === "ar" ? "غير متأكد؟" : "Not sure which plan?"}</p>
            <h3 className="mt-3 text-2xl font-black text-navy">
              {lang === "ar" ? "تحدث مع أحد مستشارينا مجاناً" : "Talk to one of our consultants — free"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {lang === "ar"
                ? "سنساعدك في اختيار الباقة المناسبة لأهدافك العقارية."
                : "We'll help you choose the right plan for your property goals."
              }
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="luxury">
                <Link to="/contact">{lang === "ar" ? "تواصل معنا" : "Contact Us"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="https://wa.me/201025812666" target="_blank" rel="noopener noreferrer">
                  {lang === "ar" ? "واتساب مباشر" : "WhatsApp Chat"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
