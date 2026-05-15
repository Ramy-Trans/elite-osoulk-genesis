import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Copy, Check, Share2, MessageCircle, Home, ChevronRight, QrCode, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer, properties } from "@/components/osoulk/site";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/marketing-kit/$id")({
  head: () => ({
    meta: [
      { title: "Marketing Kit — Osoulk" },
      { name: "description", content: "Share your property with a ready-made social post, QR code, and one-click sharing tools." },
    ],
  }),
  component: MarketingKit,
});

type MiniProp = {
  id: string; title: string; titleAr?: string; price: string;
  location: string; locationAr?: string; image: string;
  status: string; statusAr?: string; ownerPhone?: string;
};

function MarketingKit() {
  const { id } = Route.useParams();
  const { lang } = useLang();
  const [copied, setCopied] = useState<string | null>(null);
  const [userProp, setUserProp] = useState<MiniProp | null>(null);
  const [loading, setLoading] = useState(false);

  const staticProp = properties.find(p => p.id === id) as MiniProp | undefined;

  useEffect(() => {
    if (!staticProp) {
      setLoading(true);
      import("@/lib/api").then(({ getPublicListing }) => {
        getPublicListing(id)
          .then(data => {
            if (data) {
              setUserProp({
                id: data.id, title: data.title, price: data.price,
                location: data.location ?? "", status: data.status ?? "For Sale",
                image: data.imageUrl || (data.images?.[0] ?? ""),
                ownerPhone: data.ownerPhone ?? "+201025812666",
              });
            }
          })
          .catch((err) => { console.error("[marketing-kit] failed:", err); })
          .finally(() => setLoading(false));
      });
    }
  }, [id, staticProp]);

  const prop: MiniProp | null = staticProp ?? userProp;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="premium-card max-w-md p-8 text-center">
          <QrCode className="mx-auto h-10 w-10 text-navy" />
          <h2 className="mt-4 text-xl font-black text-navy">Property Not Found</h2>
          <p className="mt-2 text-muted-foreground">This property may have been removed.</p>
          <Button asChild className="mt-4" variant="outline"><Link to="/explore">Browse Properties</Link></Button>
        </div>
      </div>
    );
  }

  const title = (lang === "ar" && prop.titleAr) ? prop.titleAr : prop.title;
  const location = (lang === "ar" && prop.locationAr) ? prop.locationAr : prop.location;
  const status = (lang === "ar" && prop.statusAr) ? prop.statusAr : prop.status;
  const phone = prop.ownerPhone ?? "+201025812666";

  const origin = typeof window !== "undefined" ? window.location.origin : "https://osoulk.com";
  const pageUrl = `${origin}/properties/${id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pageUrl)}&color=1a2e5a&bgcolor=ffffff&margin=10`;

  const captionAr =
`🏠 ${title}
📍 ${location}
💰 ${prop.price}
🔖 ${status}

✅ عقار موثق على منصة أصولك
🔗 ${pageUrl}

📞 للاستفسار والتواصل: ${phone}

#أصولك #عقارات_مصر #عقارات_للبيع #استثمار_عقاري`;

  const captionEn =
`🏠 ${title}
📍 ${location}
💰 ${prop.price}
🔖 ${status}

✅ Verified property on Osoulk
🔗 ${pageUrl}

📞 Inquiries: ${phone}

#Osoulk #EgyptRealEstate #PropertyForSale #RealEstate`;

  const caption = lang === "ar" ? captionAr : captionEn;

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2200);
    });
  }

  const waText = lang === "ar"
    ? `شاهد هذا العقار على أصولك:\n${pageUrl}`
    : `Check out this property on Osoulk:\n${pageUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

  return (
    <main>
      <section className="bg-navy/5 py-10">
        <div className="os-container">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-navy flex items-center gap-1"><Home className="h-3.5 w-3.5" />{lang === "ar" ? "الرئيسية" : "Home"}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/explore" className="hover:text-navy">{lang === "ar" ? "استكشف" : "Properties"}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/properties/$id" params={{ id }} className="hover:text-navy max-w-[12rem] truncate">{title}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-bold text-navy">{lang === "ar" ? "كيت التسويق" : "Marketing Kit"}</span>
          </nav>

          <div className="mb-8">
            <p className="section-kicker">{lang === "ar" ? "أدوات التسويق" : "Marketing Tools"}</p>
            <h1 className="mt-2 text-3xl font-black text-navy sm:text-4xl">
              {lang === "ar" ? "كيت التسويق الجاهز" : "Ready-Made Marketing Kit"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {lang === "ar"
                ? "شارك عقارك في ثوانٍ — رابط، نص جاهز، رمز QR، وأزرار مشاركة فورية."
                : "Share this property in seconds — link, ready post, QR code, and instant sharing buttons."
              }
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="premium-card overflow-hidden">
                <div className="relative h-64 bg-secondary">
                  {prop.image && (
                    <img
                      src={prop.image}
                      alt={title}
                      ref={el => { if (!el) return; if (el.complete) el.classList.add("loaded"); else el.onload = () => el.classList.add("loaded"); }}
                      className="fade-img h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-xl font-black text-white leading-tight">{title}</h2>
                    <p className="mt-1 text-white/75 text-sm">{location} · {prop.price}</p>
                  </div>
                  <Link
                    to="/properties/$id" params={{ id }}
                    className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-black/70"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {lang === "ar" ? "عرض العقار" : "View Listing"}
                  </Link>
                </div>
              </div>

              <div className="premium-card p-6">
                <h3 className="flex items-center gap-2 text-base font-black text-navy">
                  <Share2 className="h-5 w-5" />
                  {lang === "ar" ? "رابط المشاركة" : "Shareable Link"}
                </h3>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    readOnly value={pageUrl}
                    className="h-11 flex-1 rounded-xl border bg-background px-4 text-xs font-mono text-muted-foreground min-w-0"
                  />
                  <Button size="sm" onClick={() => copy(pageUrl, "link")} className="shrink-0">
                    {copied === "link" ? <><Check className="h-4 w-4" />{lang === "ar" ? "تم" : "Copied!"}</> : <><Copy className="h-4 w-4" />{lang === "ar" ? "نسخ" : "Copy"}</>}
                  </Button>
                </div>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="flex items-center gap-2 text-base font-black text-navy">
                    <MessageCircle className="h-5 w-5" />
                    {lang === "ar" ? "نص النشر الجاهز" : "Ready-Made Post Caption"}
                  </h3>
                  <Button size="sm" onClick={() => copy(caption, "caption")}>
                    {copied === "caption"
                      ? <><Check className="h-4 w-4" />{lang === "ar" ? "تم النسخ!" : "Copied!"}</>
                      : <><Copy className="h-4 w-4" />{lang === "ar" ? "نسخ النص" : "Copy Caption"}</>
                    }
                  </Button>
                </div>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-secondary p-4 text-sm leading-relaxed text-foreground font-sans" dir="auto">
                  {caption}
                </pre>
              </div>

              <div className="premium-card p-6">
                <h3 className="text-base font-black text-navy mb-5">
                  {lang === "ar" ? "أدوات المشاركة الفورية" : "One-Click Share Tools"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white" size="lg">
                      <MessageCircle className="h-5 w-5" />
                      {lang === "ar" ? "مشاركة واتساب" : "Share on WhatsApp"}
                    </Button>
                  </a>
                  <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white" size="lg">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      {lang === "ar" ? "مشاركة فيسبوك" : "Share on Facebook"}
                    </Button>
                  </a>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => copy(pageUrl, "inst")}>
                    <Copy className="h-5 w-5" />
                    {lang === "ar" ? "نسخ رابط إنستجرام/تيك توك" : "Copy for Instagram / TikTok"}
                    {copied === "inst" && <Check className="h-4 w-4 text-emerald-600" />}
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => {
                    if (navigator.share) { navigator.share({ title, url: pageUrl }); }
                    else { copy(pageUrl, "native"); }
                  }}>
                    <Share2 className="h-5 w-5" />
                    {lang === "ar" ? "مشاركة مباشرة" : "Native Share"}
                    {copied === "native" && <Check className="h-4 w-4 text-emerald-600" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="premium-card p-6 text-center">
                <h3 className="font-black text-navy mb-4">
                  {lang === "ar" ? "رمز QR — للطباعة والمشاركة" : "QR Code — Print & Share"}
                </h3>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="mx-auto h-[220px] w-[220px] rounded-xl border shadow-float"
                />
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  {lang === "ar"
                    ? "ضعه على البروشور أو اللافتة لتوجيه المشترين مباشرة لصفحة العقار"
                    : "Place on brochures or signage to send buyers directly to the listing page"
                  }
                </p>
                <a href={qrUrl} download={`qr-osoulk-${id}.png`} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                  <Button variant="outline" className="w-full" size="sm">
                    <Download className="h-4 w-4" />
                    {lang === "ar" ? "تحميل رمز QR" : "Download QR Code"}
                  </Button>
                </a>
              </div>

              <div className="premium-card p-6">
                <h3 className="font-black text-navy mb-4">
                  {lang === "ar" ? "ملخص العقار" : "Property Summary"}
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    [lang === "ar" ? "العنوان" : "Title", title],
                    [lang === "ar" ? "الموقع" : "Location", location],
                    [lang === "ar" ? "السعر" : "Price", prop.price],
                    [lang === "ar" ? "الحالة" : "Status", status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                      <span className="text-muted-foreground shrink-0">{k}</span>
                      <span className="font-bold text-navy text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-navy/5 p-4">
                <p className="text-sm font-bold text-navy">
                  {lang === "ar"
                    ? "💡 نصيحة: أضف صوراً عالية الجودة وفيديو لزيادة التحويل على هذا العقار"
                    : "💡 Tip: Add high-quality photos and video to boost conversion on this listing"
                  }
                </p>
              </div>

              <Button asChild variant="luxury" className="w-full" size="lg">
                <Link to="/properties/$id" params={{ id }}>
                  {lang === "ar" ? "عرض صفحة العقار" : "View Full Property Page"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
