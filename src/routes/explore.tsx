import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Map, X } from "lucide-react";
import { PROPERTIES } from "@/lib/demo-data";
import { PropertyCard } from "@/components/site/PropertyCard";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Properties — OSOULK" },
      { name: "description", content: "Browse verified properties for sale and rent across Egypt. Filter by city, type, price, and more." },
      { property: "og:title", content: "Explore Premium Properties — OSOULK" },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("new");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "map">("grid");

  const cities = ["All", ...Array.from(new Set(PROPERTIES.map((p) => p.city)))];
  const types = ["All", ...Array.from(new Set(PROPERTIES.map((p) => p.type)))];

  const filtered = useMemo(() => {
    let r = PROPERTIES.filter((p) => {
      if (city !== "All" && p.city !== city) return false;
      if (type !== "All" && p.type !== type) return false;
      if (status !== "All" && p.status !== status) return false;
      if (q && !`${p.title} ${p.city} ${p.compound ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === "low") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "high") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [q, city, type, status, sort]);

  return (
    <div className="container-luxe py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Explore</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Discover Egypt's finest properties</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(view === "grid" ? "map" : "grid")} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border text-sm">
            <Map className="h-4 w-4" /> {view === "grid" ? "Map view" : "Grid view"}
          </button>
          <button onClick={() => setShowFilters((v) => !v)} className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border text-sm">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-[300px_1fr] gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block rounded-md border border-border bg-card p-5 h-fit sticky top-32`}>
          <div className="flex items-center justify-between lg:hidden mb-3">
            <h3 className="font-display text-lg">Filters</h3>
            <button onClick={() => setShowFilters(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keyword…" className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Select label="City" value={city} setValue={setCity} options={cities} />
            <Select label="Type" value={type} setValue={setType} options={types} />
            <Select label="Status" value={status} setValue={setStatus} options={["All", "For Sale", "For Rent"]} />
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Radius: 50 km</label>
              <input type="range" min={1} max={100} defaultValue={50} className="w-full accent-[color:var(--gold)]" />
            </div>
            <button onClick={() => { setQ(""); setCity("All"); setType("All"); setStatus("All"); }} className="text-xs text-muted-foreground hover:text-foreground luxe-link">Reset filters</button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <p className="text-sm text-muted-foreground">{filtered.length} results found</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-sm border border-input bg-card px-3 py-2 text-sm">
                <option value="new">Date — New to Old</option>
                <option value="low">Price — Low to High</option>
                <option value="high">Price — High to Low</option>
              </select>
            </div>
          </div>

          {view === "map" && (
            <div className="mb-6 aspect-[16/8] rounded-md border border-border bg-secondary/60 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <Map className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Interactive map — connect Google Maps key in the dashboard</p>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <p>No properties match these filters.</p>
              <Link to="/explore" className="mt-3 inline-flex luxe-link">Reset</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2.5 text-sm">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
