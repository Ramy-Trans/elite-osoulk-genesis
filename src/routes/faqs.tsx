import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer, PageHero, faqs as staticFaqs } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";
import { getFaqs, type FAQ } from "@/lib/api";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, HelpCircle, Tag } from "lucide-react";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "أسئلة شائعة عقارية — أصولك" },
      { name: "description", content: "إجابات على أكثر الأسئلة شيوعاً حول العقارات في مصر — الشراء، الإيجار، الاستثمار." },
      { property: "og:title", content: "أسئلة شائعة — أصولك" },
    ],
  }),
  component: FAQs,
});

const CATEGORIES_AR: Record<string, string> = {
  general: "عام",
  buying: "شراء",
  renting: "إيجار",
  investment: "استثمار",
  legal: "قانوني",
  agents: "وسطاء",
};

function FAQItem({ faq, isOpen, onToggle, lang }: {
  faq: { id: string; question: string; questionAr?: string; answer: string; answerAr?: string; category?: string; categoryAr?: string };
  isOpen: boolean; onToggle: () => void; lang: string;
}) {
  const q = lang === "ar" && faq.questionAr ? faq.questionAr : faq.question;
  const a = lang === "ar" && faq.answerAr ? faq.answerAr : faq.answer;
  const cat = lang === "ar" && faq.categoryAr ? faq.categoryAr : (CATEGORIES_AR[faq.category || ""] || faq.category || "");

  return (
    <div className={`rounded-xl border bg-card transition-all ${isOpen ? "shadow-float" : ""}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-right"
        aria-expanded={isOpen}
      >
        <div className="flex-1 text-right">
          {cat && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-bold text-navy">
              <Tag className="h-3 w-3" />{cat}
            </span>
          )}
          <p className="font-black text-navy leading-snug">{q}</p>
        </div>
        <span className="shrink-0 mt-0.5">
          {isOpen ? <ChevronUp className="h-5 w-5 text-navy" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </span>
      </button>
      {isOpen && (
        <div className="border-t px-5 pb-5 pt-4">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{a}</p>
        </div>
      )}
    </div>
  );
}

function FAQs() {
  const { t, lang } = useLang();
  const [dynamicFaqs, setDynamicFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [schema, setSchema] = useState<string>("");

  useEffect(() => {
    getFaqs("published").then(data => {
      setDynamicFaqs(data);
    }).catch((err) => { console.error("[faqs] API request failed:", err); });
  }, []);

  const allFaqs: typeof staticFaqs = dynamicFaqs.length > 0
    ? dynamicFaqs.map(f => ({ id: f.id, q: f.question, a: f.answer, category: f.category, questionAr: f.questionAr, answerAr: f.answerAr, categoryAr: f.categoryAr }))
    : staticFaqs;

  const categories = ["all", ...Array.from(new Set(allFaqs.map(f => (f as any).category).filter(Boolean)))];

  const filtered = allFaqs.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.q.toLowerCase().includes(q) || ((f as any).questionAr || "").toLowerCase().includes(q);
    const matchCat = cat === "all" || (f as any).category === cat;
    return matchSearch && matchCat;
  });

  useEffect(() => {
    setSchema(JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: filtered.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }));
  }, [filtered]);

  return (
    <main>
      {schema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
      )}
      <PageHero
        kicker={t("faqs.kicker")}
        title={t("faqs.title")}
        subtitle={t("faqs.subtitle")}
      />

      <section className="py-16">
        <div className="os-container max-w-4xl mx-auto space-y-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في الأسئلة الشائعة…"
              className="h-14 w-full rounded-2xl border-2 bg-background pr-12 pl-5 text-base focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            />
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${cat === c ? "bg-navy text-white" : "bg-secondary text-navy hover:bg-navy/10"}`}
                >
                  {c === "all" ? "الكل" : (CATEGORIES_AR[c] || c)}
                </button>
              ))}
            </div>
          )}

          {/* FAQ list */}
          {filtered.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-black text-navy">لا توجد نتائج</p>
              <p className="mt-2 text-sm text-muted-foreground">جرب كلمة بحث مختلفة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(f => (
                <FAQItem
                  key={(f as any).id || f.q}
                  faq={{ id: (f as any).id || f.q, question: f.q, answer: f.a, category: (f as any).category, questionAr: (f as any).questionAr, answerAr: (f as any).answerAr, categoryAr: (f as any).categoryAr }}
                  isOpen={openId === ((f as any).id || f.q)}
                  onToggle={() => setOpenId(openId === ((f as any).id || f.q) ? null : ((f as any).id || f.q))}
                  lang={lang}
                />
              ))}
            </div>
          )}

          {/* CTA section */}
          <div className="premium-card p-8">
            <h2 className="text-2xl font-black text-navy">{t("nav.explore")}</h2>
            <p className="mt-2 text-muted-foreground">ابحث عن عقارك المثالي في مصر أو تواصل مع أحد وسطائنا.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/explore" className="rounded-full bg-navy text-white px-6 py-3 text-sm font-bold hover:bg-navy/80 transition-colors">{t("nav.explore")}</Link>
              <Link to="/contact" className="rounded-full bg-secondary text-navy px-6 py-3 text-sm font-bold hover:bg-navy/10 transition-colors">تواصل معنا</Link>
              <Link to="/articles" className="rounded-full bg-secondary text-navy px-6 py-3 text-sm font-bold hover:bg-navy/10 transition-colors">المقالات</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
