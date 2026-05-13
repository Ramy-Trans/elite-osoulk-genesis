import { createFileRoute } from "@tanstack/react-router";
import { Footer, PageHero, SectionHeader, PropertyCard, properties } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";
import { SlidersHorizontal, X, MapPin, Tag, Home, Heart, Map, Grid3X3 } from "lucide-react";
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { getPublicListings, type PublicListing } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { toggleSaved, isSaved } from "@/lib/saved";
import { SaveSearchButton } from "@/components/osoulk/save-search-button";
import type { MapMarker } from "@/components/osoulk/map-view";

const MapView = lazy(() => import("@/components/osoulk/map-view").then(m => ({ default: m.MapView })));

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "استكشف العقارات — أصولك" },
      { name: "description", content: "تصفح مئات العقارات المتاحة للبيع والإيجار في مصر. شقق، فيلات، دوبلكس وأكثر." },
      { property: "og:title", content: "استكشف العقارات — أصولك" },
    ],
  }),
  component: Explore,
});

// STATUSES are translated inline using t() in the component

const PRICE_RANGES = [
  { label: "Any Price", labelAr: "أي سعر", min: 0, max: Infinity },
  { label: "Under EGP 3M", labelAr: "أقل من 3 مليون", min: 0, max: 3_000_000 },
  { label: "EGP 3M – 6M", labelAr: "3 – 6 مليون", min: 3_000_000, max: 6_000_000 },
  { label: "EGP 6M – 10M", labelAr: "6 – 10 مليون", min: 6_000_000, max: 10_000_000 },
  { label: "EGP 10M – 20M", labelAr: "10 – 20 مليون", min: 10_000_000, max: 20_000_000 },
  { label: "Above EGP 20M", labelAr: "أكثر من 20 مليون", min: 20_000_000, max: Infinity },
];

// Approximate Egyptian coordinates by location keyword
const EGYPT_COORDS: Record<string, [number, number]> = {
  "New Administrative Capital": [30.0131, 31.7494],
  "New Cairo":    [30.0280, 31.4913],
  "North Coast":  [31.0478, 28.4567],
  "Sheikh Zayed": [30.0563, 30.9729],
  "6th of October": [29.9667, 30.9333],
  "Sahel":        [31.1167, 27.7500],
  "Giza":         [30.0131, 31.2089],
  "Cairo":        [30.0444, 31.2357],
  "Alexandria":   [31.2001, 29.9187],
  "Maadi":        [29.9553, 31.2499],
  "Zamalek":      [30.0636, 31.2192],
  "Garden City":  [30.0383, 31.2283],
  "New Zayed":    [30.0634, 30.9315],
  "Badr City":    [30.1333, 31.7333],
  "Obour":        [30.2167, 31.4667],
  "Nasr City":    [30.0680, 31.3354],
  "Heliopolis":   [30.0917, 31.3400],
  "Shorouk":      [30.1333, 31.6167],
};

function getCoords(location: string): [number, number] | null {
  for (const [key, coords] of Object.entries(EGYPT_COORDS)) {
    if (location.toLowerCase().includes(key.toLowerCase())) return coords;
  }
  return null;
}

function jitter(coord: number): number {
  return coord + (Math.random() - 0.5) * 0.015;
}

function parsePrice(p: string): number {
  return parseInt(p.replace(/[^0-9]/g, ""), 10) || 0;
}

function getUrlParam(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) || "";
}

function fadeImgRef(el: HTMLImageElement | null) {
  if (!el) return;
  if (el.complete) { el.classList.add("loaded"); return; }
  el.onload = () => el.classList.add("loaded");
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-float">
      <div className="skeleton h-56 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-6 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
  );
}

function UserListingCard({ listing, highlighted }: { listing: PublicListing; highlighted?: boolean }) {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(isSaved(listing.id)); }, [listing.id]);

  function handleSave(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setSaved(toggleSaved(listing.id));
    window.dispatchEvent(new Event("osoulk-saved-change"));
  }

  const img = listing.images?.[0] || listing.imageUrl || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80";

  return (
    <Link to="/properties/$id" params={{ id: listing.id }} className="block">
      <article className={`property-card overflow-hidden rounded-2xl border bg-card shadow-float transition-all ${highlighted ? "ring-2 ring-navy" : ""}`}>
        <div className="relative h-56 overflow-hidden bg-secondary">
          <img ref={fadeImgRef} src={img} alt={listing.title} loading="lazy" decoding="async" className="fade-img h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {(listing.tags || [listing.status]).map(tag => (
              <span key={tag} className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-primary-foreground">{tag}</span>
            ))}
          </div>
          <button onClick={handleSave} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all ${saved ? "bg-navy text-primary-foreground" : "bg-background/90 text-muted-foreground hover:text-navy"}`}>
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-navy line-clamp-2">{listing.title}</h3>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-aqua" />{listing.location}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xl font-black text-navy">{listing.price}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {listing.bedrooms > 0 && <span>{listing.bedrooms} {t("property.beds")}</span>}
              {listing.bathrooms > 0 && <span>{listing.bathrooms} {t("property.baths")}</span>}
              {listing.size && <span>{listing.size}</span>}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span className="capitalize">{listing.type}</span>
            <span className="mx-1">·</span>
            <Home className="h-3 w-3" />
            <span>{listing.status}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function Explore() {
  const { t, lang } = useLang();

  const [keyword, setKeyword] = useState(() => getUrlParam("q"));
  const [location, setLocation] = useState(() => getUrlParam("location"));
  const [status, setStatus] = useState(() => getUrlParam("status"));
  const [type, setType] = useState(() => getUrlParam("type"));
  const [priceRange, setPriceRange] = useState(0);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [userListings, setUserListings] = useState<PublicListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const LOCATIONS = useMemo(() => Array.from(new Set(properties.map(p => p.location))).sort(), []);
  const TYPES = useMemo(() => Array.from(new Set(properties.map(p => p.type))).sort(), []);

  useEffect(() => {
    getPublicListings().then(setUserListings).catch(() => {}).finally(() => setLoadingListings(false));
  }, []);

  const staticFiltered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const range = PRICE_RANGES[priceRange];
    return properties.filter(p => {
      if (q) {
        const haystack = [p.title, p.titleAr, p.location, p.locationAr, p.type, p.typeAr, ...p.description, ...p.descriptionAr].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (location && p.location !== location) return false;
      if (status && p.status !== status) return false;
      if (type && p.type.toLowerCase() !== type.toLowerCase()) return false;
      const price = parsePrice(p.price);
      if (price < range.min || price > range.max) return false;
      return true;
    });
  }, [keyword, location, status, type, priceRange]);

  const userFiltered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const range = PRICE_RANGES[priceRange];
    return userListings.filter(p => {
      if (q) {
        const haystack = [p.title, p.location, p.type, p.description].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (location && !p.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (status && p.status !== status) return false;
      if (type && p.type.toLowerCase() !== type.toLowerCase()) return false;
      const price = parsePrice(p.price);
      if (price < range.min || price > range.max) return false;
      return true;
    });
  }, [keyword, location, status, type, priceRange, userListings]);

  const allFiltered = useMemo(() => {
    const combined = [
      ...staticFiltered.map(p => ({ ...p, _isUser: false })),
      ...userFiltered.map(p => ({ ...p, _isUser: true })),
    ];
    return combined.sort((a, b) => {
      if (sort === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
      if (sort === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
      return 0;
    });
  }, [staticFiltered, userFiltered, sort]);

  // Build map markers — use explicit lat/lng from property data, or fallback to location approximation
  const mapMarkers = useMemo((): MapMarker[] => {
    const seen = new Set<string>();
    const result: MapMarker[] = [];
    allFiltered.forEach((item: any) => {
      const lat = (item as any).lat || (item as any).latitude;
      const lng = (item as any).lng || (item as any).longitude;
      let coords: [number, number] | null = null;
      if (lat && lng) {
        coords = [parseFloat(lat), parseFloat(lng)];
      } else {
        const base = getCoords(item.location || "");
        if (base) coords = [jitter(base[0]), jitter(base[1])];
      }
      if (!coords) return;
      const key = `${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({
        id: item.id,
        lat: coords[0],
        lng: coords[1],
        title: item.title,
        price: item.price,
        location: item.location,
        type: item.type,
        image: (item as any).image || item.images?.[0] || item.imageUrl,
      });
    });
    return result;
  }, [allFiltered]);

  const hasFilters = keyword || location || status || type || priceRange > 0;

  function clearAll() {
    setKeyword(""); setLocation(""); setStatus(""); setType(""); setPriceRange(0);
    if (typeof window !== "undefined") window.history.replaceState({}, "", "/explore");
  }

  return (
    <main>
      <PageHero
        kicker={t("explore.kicker")}
        title={t("explore.title")}
        subtitle={t("explore.subtitle")}
      />
      <section className="py-12">
        <div className="os-container grid gap-6 lg:grid-cols-[.38fr_.62fr]">
          {/* Filters sidebar */}
          <aside className="premium-card h-fit p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-navy" />
                <h2 className="text-2xl font-black text-navy">{t("explore.filters")}</h2>
              </div>
              {hasFilters && (
                <button onClick={clearAll} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-navy">
                  <X className="h-3.5 w-3.5" /> {t("explore.clear")}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("explore.keyword")}</label>
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("explore.keyword")}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("explore.location")}</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="">{t("explore.allCities")}</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("explore.status")}</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="">{t("explore.allStatuses")}</option>
                  <option value="For Sale">{t("explore.forSale")}</option>
                  <option value="For Rent">{t("explore.forRent")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("explore.type")}</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="">{t("explore.allTypes")}</option>
                  {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("explore.budget")}</label>
                <select
                  value={priceRange}
                  onChange={e => setPriceRange(Number(e.target.value))}
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  {PRICE_RANGES.map((r, i) => (
                    <option key={i} value={i}>{lang === "ar" ? r.labelAr : r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 rounded-xl bg-navy/5 border border-navy/10 px-4 py-2 text-sm font-bold text-navy">
                {allFiltered.length} {t("explore.results2")}
              </div>
            )}

            <Button className="mt-5 w-full" size="lg" onClick={clearAll} variant={hasFilters ? "outline" : "default"}>
              {hasFilters ? t("explore.clearFilters") : t("explore.applyFilters")}
            </Button>

            <div className="mt-3">
              <SaveSearchButton filters={{ keyword, location, status, type, priceRange }} />
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <SectionHeader
                kicker={t("explore.resultsKicker")}
                title={`${allFiltered.length} ${t("explore.resultsTitle")}`}
              />
              <div className="flex items-center gap-3">
                {/* View mode toggle */}
                <div className="flex rounded-xl border bg-card overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors ${viewMode === "grid" ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"}`}
                  >
                    <Grid3X3 className="h-4 w-4" /> {t("explore.list")}
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-colors ${viewMode === "map" ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"}`}
                  >
                    <Map className="h-4 w-4" /> {t("explore.map")}
                  </button>
                </div>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as typeof sort)}
                  className="h-11 rounded-xl border bg-background px-4 text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="newest">{t("explore.sortNew")}</option>
                  <option value="price-asc">{t("explore.sortLowHigh")}</option>
                  <option value="price-desc">{t("explore.sortHighLow")}</option>
                </select>
              </div>
            </div>

            {/* Map view */}
            {viewMode === "map" && (
              <div className="mb-6">
                <div className="rounded-2xl overflow-hidden border shadow-float" style={{ height: 480 }}>
                  {loadingListings && mapMarkers.length === 0 ? (
                    <div className="h-full animate-pulse bg-secondary flex items-center justify-center text-muted-foreground">
                      {t("explore.loadingMap")}
                    </div>
                  ) : (
                    <Suspense fallback={<div className="h-full animate-pulse bg-secondary" />}>
                      <MapView
                        markers={mapMarkers}
                        onSelect={setSelectedMarkerId}
                        selectedId={selectedMarkerId}
                      />
                    </Suspense>
                  )}
                </div>
                {mapMarkers.length < allFiltered.length && (
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    {t("explore.mapPartial").replace("{shown}", String(mapMarkers.length)).replace("{total}", String(allFiltered.length))}
                  </p>
                )}
              </div>
            )}

            {/* Grid view */}
            <div className="grid gap-5 sm:grid-cols-2">
              {loadingListings && userListings.length === 0
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : allFiltered.map(item =>
                    (item as any)._isUser
                      ? <UserListingCard key={item.id} listing={item as unknown as PublicListing} highlighted={selectedMarkerId === item.id} />
                      : <PropertyCard key={item.id} property={item as typeof properties[0]} />
                  )
              }
              {!loadingListings && allFiltered.length === 0 && (
                <div className="col-span-2 py-16 text-center text-muted-foreground">
                  <p className="text-lg font-bold">لا توجد عقارات</p>
                  <p className="mt-1 text-sm">جرب تعديل الفلاتر</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
