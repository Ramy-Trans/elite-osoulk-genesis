import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Building2, Home, ChevronRight, ChevronLeft, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { getPublicProject, type PublicProject } from "@/lib/api";
import { Footer } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/projects/$id")({
  loader: async ({ params }) => {
    const project = await getPublicProject(params.id);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const p = loaderData as PublicProject;
    return {
      meta: [
        { title: `${p.nameAr || p.name} — أصولك` },
        { name: "description", content: p.descriptionAr || p.description || "" },
        { property: "og:title", content: `${p.nameAr || p.name} — أصولك` },
        { property: "og:image", content: p.heroImage || "" },
      ],
    };
  },
  component: ProjectDetailPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <Building2 className="h-16 w-16 text-muted-foreground/40" />
      <h1 className="text-3xl font-black text-navy">المشروع غير موجود</h1>
      <Link to="/projects"><Button>العودة للمشاريع</Button></Link>
    </div>
  ),
});

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  "under-construction": { ar: "قيد الإنشاء", en: "Under Construction", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  "ready": { ar: "جاهز للتسليم", en: "Ready", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "off-plan": { ar: "على الخريطة", en: "Off Plan", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  "completed": { ar: "مكتمل", en: "Completed", color: "bg-navy/10 text-navy border border-navy/20" },
};

function GallerySlider({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  return (
    <div className="relative h-64 overflow-hidden rounded-2xl bg-secondary sm:h-80">
      <img src={images[idx]} alt={`${name} — ${idx + 1}`} className="h-full w-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectDetailPage() {
  const { lang } = useLang();
  const project = Route.useLoaderData() as PublicProject;
  const ar = lang === "ar";

  const name = ar ? (project.nameAr || project.name) : project.name;
  const dev = ar ? (project.developerNameAr || project.developerName) : project.developerName;
  const loc = ar ? (project.locationAr || project.location) : project.location;
  const desc = ar ? (project.descriptionAr || project.description) : project.description;
  const amenities = ar ? (project.amenitiesAr?.length ? project.amenitiesAr : project.amenities) : project.amenities;
  const status = STATUS_LABELS[project.status] ?? { ar: project.status, en: project.status, color: "bg-secondary text-muted-foreground" };

  const allImages = [project.heroImage, ...(project.gallery || [])].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden bg-secondary sm:h-96">
        {project.heroImage ? (
          <img src={project.heroImage} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-24 w-24 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="os-container">
            <div className="flex items-end gap-4">
              {project.logoUrl && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg">
                  <img src={project.logoUrl} alt={dev} className="h-full w-full object-contain p-1.5" />
                </div>
              )}
              <div>
                <span className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${status.color}`}>
                  {ar ? status.ar : status.en}
                </span>
                <h1 className="text-2xl font-black sm:text-4xl">{name}</h1>
                {dev && <p className="mt-1 text-sm font-bold text-gold">{dev}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="os-container py-10">
        <Link to="/projects" className="mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-navy transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {ar ? "جميع المشاريع" : "All Projects"}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Gallery */}
            {allImages.length > 1 && <GallerySlider images={allImages} name={name} />}

            {/* Description */}
            {desc && (
              <div className="premium-card p-6">
                <h2 className="mb-4 text-xl font-black text-navy">{ar ? "عن المشروع" : "About the Project"}</h2>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{desc}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities?.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="mb-4 text-xl font-black text-navy">{ar ? "المميزات والخدمات" : "Amenities & Features"}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-aqua/20 text-aqua text-xs">✓</span>
                      <span className="font-bold text-navy">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {(loc || project.address || project.governorate) && (
              <div className="premium-card p-6">
                <h2 className="mb-4 text-xl font-black text-navy">{ar ? "الموقع" : "Location"}</h2>
                <div className="space-y-2 text-sm">
                  {loc && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-aqua" /><span className="font-bold">{loc}</span></p>}
                  {project.governorate && <p className="text-muted-foreground">{ar ? "المحافظة:" : "Governorate:"} {project.governorate}</p>}
                  {project.address && <p className="text-muted-foreground">{project.address}</p>}
                  {project.lat && project.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${project.lat},${project.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-navy/5 px-4 py-2 text-sm font-bold text-navy hover:bg-navy/10 transition-colors"
                    >
                      <MapPin className="h-4 w-4" /> {ar ? "عرض على الخريطة" : "View on Map"}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="premium-card p-6 space-y-4">
              <h3 className="text-lg font-black text-navy">{ar ? "تفاصيل المشروع" : "Project Details"}</h3>
              {(project.priceFrom || project.priceTo) && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{ar ? "الأسعار" : "Prices"}</p>
                  <p className="mt-1 text-xl font-black text-navy">{project.priceFrom}</p>
                  {project.priceTo && <p className="text-sm text-muted-foreground">{ar ? "حتى" : "up to"} {project.priceTo}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {project.totalUnits > 0 && (
                  <div className="rounded-xl bg-secondary p-3 text-center">
                    <p className="text-2xl font-black text-navy">{project.totalUnits}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "إجمالي الوحدات" : "Total Units"}</p>
                  </div>
                )}
                {project.availableUnits > 0 && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-2xl font-black text-emerald-700">{project.availableUnits}</p>
                    <p className="text-xs text-emerald-600">{ar ? "وحدات متاحة" : "Available"}</p>
                  </div>
                )}
              </div>
              {project.deliveryDate && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{ar ? "موعد التسليم" : "Delivery Date"}</p>
                  <p className="mt-1 font-bold text-navy">{project.deliveryDate}</p>
                </div>
              )}
              <a href="https://wa.me/201025812666" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-black text-white hover:opacity-90 transition-opacity">
                <MessageCircle className="h-4 w-4" /> {ar ? "تواصل عبر واتساب" : "WhatsApp Us"}
              </a>
              <a href="tel:+201025812666" className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/20 py-3 text-sm font-black text-navy hover:bg-secondary transition-colors">
                <Phone className="h-4 w-4" /> +201025812666
              </a>
            </div>

            {project.featured && (
              <div className="rounded-2xl bg-gold/10 border border-gold/20 p-4 text-center">
                <p className="text-sm font-black text-gold">{ar ? "مشروع مميز" : "Featured Project"}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
