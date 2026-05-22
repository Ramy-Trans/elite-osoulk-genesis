import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BedDouble, Bath, Maximize2, Tag, Phone, Calendar,
  Heart, Share2, MapPin, Sparkles,
  ChevronLeft, ChevronRight, Eye, MessageCircle, X, Home, QrCode, GitCompare,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { properties } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/osoulk/site";
import { useEffect, useState } from "react";
import { trackPropertyView, getPropertyViews, getPublicListing } from "@/lib/api";
import { useLang } from "@/lib/language";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80";

type NormalizedProperty = {
  id: string; title: string; price: string; location: string;
  type: string; status: string; bedrooms: number; bathrooms: number; size: string;
  image: string; images: string[]; description: string[]; features: string[];
  tags: string[]; ownerPhone: string; ownerName?: string;
  isUserListing: boolean;
  titleAr?: string; locationAr?: string; statusAr?: string;
  descriptionAr?: string[]; featuresAr?: string[]; tagsAr?: string[];
  videoUrl?: string; tourUrl?: string;
  lat?: number; lng?: number;
  address?: string; governorate?: string; nearbyLandmarks?: string[];
};

export const Route = createFileRoute("/properties/$id")({
  loader: async ({ params }): Promise<NormalizedProperty> => {
    try {
      const staticProp = properties.find((p) => p.id === params.id);
      if (staticProp) {
        return {
          ...staticProp,
          description: staticProp.description,
          features: staticProp.features,
          tags: staticProp.tags,
          isUserListing: false,
        } as NormalizedProperty;
      }

      const userListing = await getPublicListing(params.id);
      if (userListing) {
        const img = userListing.images?.[0] || userListing.imageUrl || PLACEHOLDER_IMAGE;
        return {
          id: userListing.id,
          title: userListing.title,
          price: userListing.price,
          location: userListing.location,
          type: userListing.type,
          status: userListing.status,
          bedrooms: userListing.bedrooms || 0,
          bathrooms: userListing.bathrooms || 0,
          size: userListing.size || "",
          image: img,
          images: userListing.images?.length ? userListing.images : [img],
          description: userListing.description ? [userListing.description] : [],
          features: [],
          tags: userListing.tags || [userListing.status],
          ownerPhone: userListing.ownerPhone || "+201025812666",
          ownerName: userListing.ownerName,
          isUserListing: true,
          videoUrl: (userListing as any).videoUrl,
          tourUrl: (userListing as any).tourUrl,
          lat: (userListing as any).lat,
          lng: (userListing as any).lng,
          address: (userListing as any).address,
          governorate: (userListing as any).governorate,
          nearbyLandmarks: (userListing as any).nearbyLandmarks,
        };
      }
    } catch {
      throw notFound();
    }

    throw notFound();
  },
  head: ({ loaderData }) => {
    const p = loaderData;
    if (!p) return { meta: [] };
    const ogImg = p.image || PLACEHOLDER_IMAGE;
    const desc = p.description?.[0] || `${p.type} in ${p.location} — ${p.price}`;
    return {
      meta: [
        { title: `${p.title} — Osoulk` },
        { name: "description", content: desc },
        { name: "keywords", content: `${p.type}, ${p.location}, ${p.status}, real estate Egypt, عقارات مصر` },
        { property: "og:title", content: `${p.title} — Osoulk` },
        { property: "og:description", content: desc },
        { property: "og:image", content: ogImg },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${p.title} — Osoulk` },
        { name: "twitter:image", content: ogImg },
      ],
    };
  },
  component: PropertyDetail,
  notFoundComponent: NotFoundProperty,
});

function NotFoundProperty() {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black text-navy">{t("property.notFound")}</h1>
        <Link to="/explore" className="mt-4 inline-block font-bold text-navy underline">
          {t("property.browseAll")}
        </Link>
      </div>
    </div>
  );
}

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  function prev() { setCurrent(i => (i - 1 + images.length) % images.length); }
  function next() { setCurrent(i => (i + 1) % images.length); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="relative overflow-hidden bg-black">
        <div
          className="relative h-72 w-full cursor-pointer sm:h-96 lg:h-[480px]"
          onClick={() => setLightbox(true)}
        >
          <img
            key={current}
            ref={el => { if (!el) return; if (el.complete) { el.classList.add("loaded"); return; } el.onload = () => el.classList.add("loaded"); }}
            src={images[current]}
            alt={`${title} — ${current + 1}`}
            decoding="async"
            fetchPriority={current === 0 ? "high" : "auto"}
            className="fade-img h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            {current + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-black/90 p-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 overflow-hidden rounded-lg transition-all ${i === current ? "ring-2 ring-white ring-offset-1 ring-offset-black" : "opacity-60 hover:opacity-100"}`}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  ref={el => { if (!el) return; if (el.complete) { el.classList.add("loaded"); return; } el.onload = () => el.classList.add("loaded"); }}
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="fade-img h-16 w-24 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={images[current]}
            alt={`${title} — ${current + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-bold text-white">
            {current + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

function CompareButton({ id, title, image }: { id: string; title: string; image: string }) {
  const { lang } = useLang();
  const [inList, setInList] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("osoulk_compare") || "[]") as string[];
      setInList(raw.includes(id));
      setFull(raw.length >= 3);
    } catch { /* ignore */ }
  }, [id]);

  function toggle() {
    try {
      const raw = JSON.parse(localStorage.getItem("osoulk_compare") || "[]") as string[];
      let next: string[];
      if (raw.includes(id)) {
        next = raw.filter(i => i !== id);
      } else {
        if (raw.length >= 3) return;
        next = [...raw, id];
      }
      localStorage.setItem("osoulk_compare", JSON.stringify(next));
      setInList(next.includes(id));
      setFull(next.length >= 3);
    } catch { /* ignore */ }
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={toggle}
        disabled={!inList && full}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-colors ${
          inList
            ? "border-navy/40 bg-navy/8 text-navy"
            : full
            ? "border-muted-foreground/20 text-muted-foreground cursor-not-allowed"
            : "border-muted-foreground/30 text-muted-foreground hover:border-navy/30 hover:text-navy"
        }`}
      >
        <GitCompare className="h-4 w-4" />
        {inList ? (lang === "ar" ? "✓ مضاف للمقارنة" : "✓ Added to Compare") : (lang === "ar" ? "قارن العقار" : "Compare Property")}
      </button>
      {inList && (
        <Link
          to="/compare"
          className="flex items-center rounded-xl border border-navy bg-navy px-3 py-2.5 text-sm font-black text-white transition-colors hover:bg-navy/90"
        >
          →
        </Link>
      )}
    </div>
  );
}

function ViewingModal({ propertyId, propertyTitle, phone }: { propertyId: string; propertyTitle: string; phone: string }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "10:00", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

  function openModal() { setOpen(true); setStatus("idle"); }
  function closeModal() { setOpen(false); setStatus("idle"); setForm({ name: "", phone: "", date: "", time: "10:00", notes: "" }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.date) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, propertyTitle, ...form, contactPhone: phone }),
      });
      if (res.ok) { setStatus("success"); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <button
        onClick={openModal}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/25 px-4 py-3 text-sm font-black text-navy transition-all hover:bg-secondary active:scale-95"
      >
        <Calendar className="h-4 w-4" />
        {lang === "ar" ? "حجز معاينة" : "Schedule Viewing"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-md rounded-2xl border bg-background shadow-premium p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">
                {lang === "ar" ? "حجز موعد معاينة" : "Schedule a Viewing"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-secondary transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
              {lang === "ar" ? "العقار: " : "Property: "}<span className="font-bold text-navy">{propertyTitle}</span>
            </p>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <p className="font-black text-navy text-lg">{lang === "ar" ? "تم تأكيد الحجز!" : "Viewing Booked!"}</p>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "سيتواصل معك فريقنا لتأكيد الموعد." : "Our team will contact you to confirm the appointment."}
                </p>
                <button onClick={closeModal} className="mt-2 rounded-xl bg-navy px-6 py-2.5 text-sm font-black text-white hover:bg-navy/85 transition-colors">
                  {lang === "ar" ? "حسناً" : "Done"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                  placeholder={lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
                  className="h-11 w-full rounded-xl border bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(s => ({ ...s, phone: e.target.value }))}
                  placeholder={lang === "ar" ? "رقم الهاتف *" : "Phone Number *"}
                  className="h-11 w-full rounded-xl border bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">{lang === "ar" ? "التاريخ *" : "Date *"}</label>
                    <input
                      required
                      type="date"
                      min={today}
                      value={form.date}
                      onChange={e => setForm(s => ({ ...s, date: e.target.value }))}
                      className="h-11 w-full rounded-xl border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-muted-foreground">{lang === "ar" ? "الوقت" : "Time"}</label>
                    <select
                      value={form.time}
                      onChange={e => setForm(s => ({ ...s, time: e.target.value }))}
                      className="h-11 w-full rounded-xl border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      {times.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
                  placeholder={lang === "ar" ? "ملاحظات إضافية (اختياري)" : "Additional notes (optional)"}
                  rows={2}
                  className="w-full rounded-xl border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                />
                {status === "error" && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {lang === "ar" ? "حدث خطأ، يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again."}
                  </div>
                )}
                <Button type="submit" className="w-full" size="lg" variant="luxury" disabled={status === "sending"}>
                  {status === "sending"
                    ? (lang === "ar" ? "جاري الإرسال…" : "Sending…")
                    : (lang === "ar" ? "تأكيد الحجز" : "Confirm Booking")}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function WhatsAppButton({ phone, propertyTitle }: { phone: string; propertyTitle: string }) {
  const { t } = useLang();
  const msg = encodeURIComponent(`مرحباً، أنا مهتم بـ "${propertyTitle}". هل يمكنكم التواصل معي؟`);
  const clean = phone.replace(/[^0-9+]/g, "");
  return (
    <a
      href={`https://wa.me/${clean}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-black text-white shadow-md transition-all hover:bg-[#20bb5a] hover:shadow-lg active:scale-95"
      aria-label={t("whatsapp")}
    >
      <MessageCircle className="h-5 w-5 fill-white stroke-white" />
      {t("whatsapp")}
    </a>
  );
}

function JsonLd({ property }: { property: NormalizedProperty }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description: property.description?.[0] || "",
    offers: {
      "@type": "Offer",
      price: property.price.replace(/[^0-9]/g, ""),
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
    },
    image: property.image,
    brand: { "@type": "Brand", name: "Osoulk" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function PropertyDetail() {
  const property = Route.useLoaderData();
  const { t, lang } = useLang();
  const [views, setViews] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const title = lang === "ar" && property.titleAr ? property.titleAr : property.title;
  const locationLabel = lang === "ar" && property.locationAr ? property.locationAr : property.location;
  const waPhone = property.ownerPhone || "+201025812666";
  const tags = lang === "ar" && property.tagsAr ? property.tagsAr : property.tags;
  const description = lang === "ar" && property.descriptionAr ? property.descriptionAr : property.description;
  const features = lang === "ar" && property.featuresAr ? property.featuresAr : property.features;
  const status = lang === "ar" && property.statusAr ? property.statusAr : property.status;

  useEffect(() => {
    trackPropertyView(property.id).then(({ views: v }) => setViews(v));
    getPropertyViews(property.id).then(v => setViews(v));

    // Track recently viewed in localStorage
    try {
      const KEY = "osoulk_recently_viewed";
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as { id: string; title: string; image: string }[];
      const filtered = raw.filter(r => r.id !== property.id);
      const updated = [{ id: property.id, title: property.title, image: property.image }, ...filtered].slice(0, 10);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [property.id]);

  const stats = [
    { label: t("property.bedrooms"), value: property.bedrooms, icon: BedDouble, show: property.bedrooms > 0 },
    { label: t("property.bathrooms"), value: property.bathrooms, icon: Bath, show: property.bathrooms > 0 },
    { label: t("property.size"), value: property.size, icon: Maximize2, show: !!property.size },
    { label: t("property.status"), value: status, icon: Tag, show: !!property.status },
  ];

  return (
    <main>
      <JsonLd property={property} />
      <ImageGallery images={property.images} title={title} />

      <div className="os-container py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-navy transition-colors flex items-center gap-1"><Home className="h-3.5 w-3.5" />{t("property.home")}</Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-navy transition-colors">{t("property.explore")}</Link>
          <span>/</span>
          <span className="font-semibold text-navy">{locationLabel}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full border border-navy/20 bg-navy/8 px-3 py-1 text-xs font-black uppercase tracking-wider text-navy"
                  >
                    {tag}
                  </span>
                ))}
                {property.isUserListing && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700">
                    {t("property.userListing")}
                  </span>
                )}
              </div>
              {views !== null && (
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {views.toLocaleString()} {t("property.views")}
                </div>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight text-navy sm:text-5xl">{title}</h1>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-aqua" />
              {locationLabel}
            </p>

            {stats.filter(s => s.show).length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-4">
                {stats.filter(s => s.show).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="flex items-center gap-2 text-2xl font-black text-navy">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {description.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-black text-navy">{t("property.about")}</h2>
                <div className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
                  {description.map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-black text-navy">{t("property.features")}</h2>
                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3">
                  {features.map((feature: string) => (
                    <p key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 shrink-0 text-gold" />
                      {feature}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Video section */}
            {property.videoUrl && (() => {
              const yt = property.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
              const embedSrc = yt ? `https://www.youtube.com/embed/${yt[1]}` : property.videoUrl;
              return (
                <div className="mt-10">
                  <h2 className="text-2xl font-black text-navy mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎬</span> فيديو العقار
                  </h2>
                  <div className="relative overflow-hidden rounded-2xl border bg-black" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      src={embedSrc}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title="Property Video"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 360 Tour */}
            {property.tourUrl && (
              <div className="mt-10">
                <h2 className="text-2xl font-black text-navy mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔮</span> جولة افتراضية 360°
                </h2>
                {property.tourUrl.includes("matterport") || property.tourUrl.includes("kuula") || property.tourUrl.includes("roundme") ? (
                  <div className="relative overflow-hidden rounded-2xl border" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      src={property.tourUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="xr-spatial-tracking; gyroscope; accelerometer"
                      title="360 Tour"
                    />
                  </div>
                ) : (
                  <a
                    href={property.tourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-navy/30 p-8 text-navy font-bold hover:border-navy/60 hover:bg-navy/5 transition-all"
                  >
                    <span className="text-3xl">🔮</span>
                    <span>افتح الجولة الافتراضية 360° في نافذة جديدة</span>
                  </a>
                )}
              </div>
            )}

            {/* Location & Map */}
            {(property.address || property.governorate || property.lat) && (
              <div className="mt-10">
                <h2 className="text-2xl font-black text-navy mb-4 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-aqua" /> الموقع والعنوان
                </h2>
                <div className="premium-card p-5 space-y-2">
                  {property.address && (
                    <p className="text-sm text-muted-foreground"><span className="font-black text-navy">العنوان: </span>{property.address}</p>
                  )}
                  {property.governorate && (
                    <p className="text-sm text-muted-foreground"><span className="font-black text-navy">المحافظة: </span>{property.governorate}</p>
                  )}
                  {property.nearbyLandmarks?.length ? (
                    <div>
                      <p className="font-black text-navy text-sm mb-1">معالم قريبة:</p>
                      <div className="flex flex-wrap gap-2">
                        {property.nearbyLandmarks.map((lm: string) => (
                          <span key={lm} className="rounded-full bg-aqua/10 px-3 py-1 text-xs font-bold text-aqua">{lm}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {property.lat && property.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${property.lat},${property.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 rounded-xl bg-navy/5 px-4 py-2 text-sm font-bold text-navy hover:bg-navy/10 transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-aqua" /> عرض على خرائط Google
                    </a>
                  )}
                </div>
              </div>
            )}

            {property.ownerName && (
              <div className="mt-10 rounded-2xl border bg-secondary/50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Listed by</p>
                <p className="mt-1 font-black text-navy">{property.ownerName}</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-6 shadow-float">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("property.askingPrice")}</p>
              <p className="mt-2 text-4xl font-black text-navy">{property.price}</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{t("property.prime")}</p>

              <div className="mt-6 space-y-3">
                <a href={`tel:${(property.ownerPhone || "+201025812666").replace(/[^0-9+]/g, "")}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-black text-white shadow-md transition-all hover:bg-navy/85 hover:shadow-lg active:scale-95">
                  <Phone className="h-4 w-4" /> {t("property.requestCall")}
                </a>
                <ViewingModal propertyId={property.id} propertyTitle={title} phone={waPhone} />
                {property.tourUrl && (
                  <a
                    href={property.tourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-black text-navy transition-colors hover:bg-secondary"
                  >
                    <span>🔮</span> جولة افتراضية 360°
                  </a>
                )}
                <WhatsAppButton phone={waPhone} propertyTitle={title} />
              </div>

              <div className="mt-5 border-t pt-4">
                <div className="flex justify-around">
                  <button
                    onClick={() => setSaved(s => !s)}
                    className={`flex items-center gap-2 text-sm font-bold transition-colors ${saved ? "text-navy" : "text-muted-foreground hover:text-navy"}`}
                  >
                    <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                    {saved ? t("property.saved") : t("property.save")}
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title, url: window.location.href });
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-navy transition-colors"
                  >
                    <Share2 className="h-4 w-4" /> {t("property.share")}
                  </button>
                </div>
                <Link
                  to="/marketing-kit/$id" params={{ id: property.id }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/8 px-4 py-2.5 text-sm font-black text-gold transition-colors hover:bg-gold/15"
                >
                  <QrCode className="h-4 w-4" />
                  {lang === "ar" ? "كيت التسويق — QR + منشور جاهز" : "Marketing Kit — QR + Ready Post"}
                </Link>
                <CompareButton id={property.id} title={property.title} image={property.image} />
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-float">
              <h3 className="text-lg font-black text-navy">{t("property.inquire")}</h3>
              <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("property.yourName")}
                />
                <input
                  className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("property.yourPhone")}
                  type="tel"
                />
                <input
                  className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("property.yourEmail")}
                  type="email"
                />
                <textarea
                  className="w-full rounded-xl border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  rows={3}
                  defaultValue={lang === "ar" ? `مرحباً، أنا مهتم بـ "${title}". يرجى التواصل معي.` : `Hi, I'm interested in "${title}". Please get in touch.`}
                />
                <Button type="submit" className="w-full" size="lg" variant="luxury">
                  {t("property.requestInfo")}
                </Button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
