import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, Building2, Home, ArrowLeft, Search, Filter } from "lucide-react";
import { Footer, PageHero } from "@/components/osoulk/site";
import { getPublicProjects, type PublicProject } from "@/lib/api";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "المشاريع والكمباوندات — أصولك | Projects & Compounds" },
      { name: "description", content: "اكتشف أفضل المشاريع والكمباوندات السكنية في مصر مع أصولك." },
      { property: "og:title", content: "المشاريع والكمباوندات — أصولك" },
    ],
  }),
  component: ProjectsPage,
});

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  "under-construction": { ar: "قيد الإنشاء", en: "Under Construction", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  "ready": { ar: "جاهز للتسليم", en: "Ready", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "off-plan": { ar: "على الخريطة", en: "Off Plan", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  "completed": { ar: "مكتمل", en: "Completed", color: "bg-navy/10 text-navy border border-navy/20" },
};

function ProjectCard({ project }: { project: PublicProject }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const name = ar ? (project.nameAr || project.name) : project.name;
  const dev = ar ? (project.developerNameAr || project.developerName) : project.developerName;
  const loc = ar ? (project.locationAr || project.location) : project.location;
  const status = STATUS_LABELS[project.status] ?? { ar: project.status, en: project.status, color: "bg-secondary text-muted-foreground" };

  return (
    <Link
      to="/projects/$id"
      params={{ id: project.slug || project.id }}
      className="group premium-card overflow-hidden hover:shadow-premium transition-all duration-300 hover:-translate-y-1 block"
    >
      <div className="relative h-52 overflow-hidden bg-secondary">
        {project.heroImage ? (
          <img
            src={project.heroImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {project.featured && (
          <span className="absolute top-3 right-3 rounded-full bg-gold px-3 py-1 text-xs font-black text-navy">
            {ar ? "مميز" : "Featured"}
          </span>
        )}
        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold ${status.color}`}>
          {ar ? status.ar : status.en}
        </span>
        {project.logoUrl && (
          <div className="absolute bottom-3 right-3 h-10 w-10 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
            <img src={project.logoUrl} alt={dev} className="h-full w-full object-contain p-1" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-black text-navy leading-snug">{name}</h3>
        {dev && <p className="mt-1 text-sm font-bold text-gold">{dev}</p>}
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-aqua" />
          <span className="truncate">{loc}</span>
        </div>
        {(project.priceFrom || project.priceTo) && (
          <p className="mt-3 text-base font-black text-navy">
            {ar ? "يبدأ من" : "From"} {project.priceFrom}
            {project.priceTo && ` — ${project.priceTo}`}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" /> {project.totalUnits} {ar ? "وحدة" : "units"}</span>
          {project.availableUnits > 0 && (
            <span className="font-bold text-emerald-600">{project.availableUnits} {ar ? "متاح" : "available"}</span>
          )}
          {project.deliveryDate && <span>{ar ? "تسليم" : "Delivery"} {project.deliveryDate}</span>}
        </div>
      </div>
    </Link>
  );
}

function ProjectsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getPublicProjects().then(data => { setProjects(data); setLoading(false); });
  }, []);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || [p.name, p.nameAr, p.location, p.locationAr, p.developerName, p.developerNameAr].some(f => (f||"").toLowerCase().includes(q));
    const matchS = statusFilter === "all" || p.status === statusFilter;
    return matchQ && matchS;
  });

  const featured = filtered.filter(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        kicker={ar ? "مشاريع وكمباوندات" : "Projects & Compounds"}
        title={ar ? "أفضل المشاريع العقارية في مصر" : "Egypt's Premier Real Estate Projects"}
        subtitle={ar
          ? "اكتشف الكمباوندات السكنية والمشاريع الفاخرة من كبرى شركات التطوير"
          : "Discover top residential compounds and luxury developments from Egypt's leading developers"}
      />

      <div className="os-container py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border bg-card pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder={ar ? "ابحث عن مشروع أو مطور…" : "Search project or developer…"}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border bg-card px-4 text-sm font-bold focus:outline-none"
          >
            <option value="all">{ar ? "كل الحالات" : "All Statuses"}</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{ar ? l.ar : l.en}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="premium-card p-16 text-center">
            <Building2 className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-5 text-xl font-black text-navy">
              {ar ? "لا توجد مشاريع حالياً" : "No projects found"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {ar ? "سيتم إضافة المشاريع قريباً" : "Projects will be added soon"}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {featured.length > 0 && (
              <div>
                <h2 className="mb-5 text-xl font-black text-navy flex items-center gap-2">
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-sm font-black text-gold">{ar ? "مميز" : "Featured"}</span>
                  {ar ? "المشاريع المميزة" : "Featured Projects"}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <h2 className="mb-5 text-xl font-black text-navy">{ar ? "جميع المشاريع" : "All Projects"}</h2>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
