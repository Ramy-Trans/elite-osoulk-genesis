import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer, agencies, properties } from "@/components/osoulk/site";
import { MapPin, Phone, Building2, Home, ChevronRight, MessageCircle, Star, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/agencies/$id")({
  head: () => ({ meta: [{ title: "Agency Profile — Osoulk" }] }),
  component: AgencyProfile,
});

function AgencyProfile() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();

  const agency = agencies.find(a => a.id === id);

  if (!agency) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="premium-card max-w-md p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-navy" />
          <h2 className="mt-4 text-xl font-black text-navy">{t("agencies.notFound")}</h2>
          <p className="mt-2 text-muted-foreground">{t("agencies.notFoundDesc")}</p>
          <Button asChild className="mt-4" variant="outline"><Link to="/agencies">{t("agencies.allAgencies")}</Link></Button>
        </div>
      </div>
    );
  }

  const name = lang === "ar" ? agency.nameAr : agency.name;
  const area = lang === "ar" ? agency.areaAr : agency.area;
  const about = lang === "ar" ? agency.aboutAr : agency.about;
  const specialties = lang === "ar" ? agency.specialtiesAr : agency.specialties;
  const waUrl = `https://wa.me/${agency.phone.replace(/\D/g, "")}`;

  const related = properties.filter(p => {
    const agencyAreaLower = agency.area.toLowerCase();
    const propLocLower = (p.location ?? "").toLowerCase();
    return propLocLower.includes(agencyAreaLower.split(",")[0]) ||
      agencyAreaLower.includes(propLocLower.split(",")[0]);
  }).slice(0, 6);

  return (
    <main>
      <section className="relative isolate overflow-hidden py-20 bg-navy">
        <div className="absolute inset-0 -z-10">
          <img src={agency.logo} alt={name} className="h-full w-full object-cover opacity-15" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/70" />
        <div className="os-container">
          <nav className="mb-8 flex items-center gap-1.5 text-sm text-white/60 flex-wrap">
            <Link to="/" className="hover:text-white flex items-center gap-1"><Home className="h-3.5 w-3.5" />{lang === "ar" ? "الرئيسية" : "Home"}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/agencies" className="hover:text-white">{lang === "ar" ? "الوكالات" : "Agencies"}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/90">{name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-6">
            <img
              src={agency.logo} alt={name}
              className="h-24 w-24 rounded-2xl border-2 border-white/25 object-cover shadow-premium"
            />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gold/80">
                {lang === "ar" ? "ملف الوكالة الرسمي" : "Verified Agency Profile"}
              </p>
              <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{name}</h1>
              <p className="mt-3 flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4 text-gold" />{area}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="os-container py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <div className="premium-card p-6">
              <h2 className="text-xl font-black text-navy">{lang === "ar" ? "عن الوكالة" : "About"}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{about}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {specialties.map(s => (
                  <span key={s} className="rounded-full border border-navy/20 bg-navy/8 px-3 py-1 text-xs font-bold text-navy">{s}</span>
                ))}
              </div>
            </div>

            {related.length > 0 && (
              <div>
                <h2 className="mb-5 text-xl font-black text-navy flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-aqua" />
                  {lang === "ar" ? "عقارات في نفس المنطقة" : "Properties in This Area"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map(p => {
                    const propTitle = (lang === "ar" && p.titleAr) ? p.titleAr : p.title;
                    const propLoc = (lang === "ar" && p.locationAr) ? p.locationAr : p.location;
                    return (
                      <Link
                        to="/properties/$id" params={{ id: p.id }} key={p.id}
                        className="property-card block overflow-hidden rounded-2xl border bg-card shadow-float"
                      >
                        <div className="relative h-44 overflow-hidden bg-secondary">
                          <img
                            src={p.image} alt={propTitle} loading="lazy"
                            ref={el => { if (!el) return; if (el.complete) el.classList.add("loaded"); else el.onload = () => el.classList.add("loaded"); }}
                            className="fade-img h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          {p.tags?.[0] && (
                            <span className="absolute left-3 top-3 rounded-full bg-navy px-2.5 py-1 text-xs font-bold text-white">
                              {(lang === "ar" && p.tagsAr?.[0]) ? p.tagsAr[0] : p.tags[0]}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="line-clamp-1 font-black text-navy">{propTitle}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{propLoc}</p>
                          <p className="mt-2 font-black text-aqua">{p.price}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {related.length === 0 && (
                  <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                    {lang === "ar" ? "لا توجد عقارات مدرجة في هذه المنطقة بعد." : "No properties listed in this area yet."}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="premium-card p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-secondary p-4 text-center">
                  <p className="text-3xl font-black text-navy">{agency.listings}</p>
                  <p className="text-xs font-bold text-muted-foreground">{lang === "ar" ? "عقار" : "Listings"}</p>
                </div>
                <div className="rounded-xl bg-secondary p-4 text-center">
                  <div className="flex justify-center gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{lang === "ar" ? "موثق" : "Verified"}</p>
                </div>
              </div>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white" size="lg">
                  <MessageCircle className="h-5 w-5" />
                  {lang === "ar" ? "تواصل واتساب" : "Contact on WhatsApp"}
                </Button>
              </a>
              <a href={`tel:${agency.phone}`} className="block mt-3">
                <Button className="w-full" variant="outline" size="lg">
                  <Phone className="h-5 w-5" />
                  <span dir="ltr">{agency.phone}</span>
                </Button>
              </a>
            </div>

            <div className="premium-card p-5">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2">{lang === "ar" ? "منطقة التغطية" : "Coverage Area"}</p>
              <p className="font-black text-navy flex items-center gap-2"><MapPin className="h-4 w-4 text-aqua" />{area}</p>
            </div>

            <div className="premium-card p-5 bg-navy/5">
              <p className="text-sm font-bold text-navy">
                {lang === "ar"
                  ? "📋 للاستفسار عن عقارات متاحة أو شراكات تسويقية تواصل مع الوكالة مباشرة."
                  : "📋 For available properties or marketing partnerships, contact the agency directly."
                }
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/agencies">
                {lang === "ar" ? "← جميع الوكالات" : "← Back to All Agencies"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
