import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { properties as staticProps } from "@/components/osoulk/site";
import { getPublicListing } from "@/lib/api";
import { BedDouble, Bath, Maximize2, Tag, MapPin, X, Plus, GitCompare, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Properties — Osoulk" },
      { name: "description", content: "Side-by-side property comparison on Osoulk." },
    ],
  }),
  component: ComparePage,
});

const PLACEHOLDER = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80";
const MAX = 3;

type CompProp = {
  id: string; title: string; price: string; location: string; type: string;
  status: string; bedrooms: number; bathrooms: number; size: string;
  image: string; features: string[]; tags: string[];
};

function normalizeStatic(p: typeof staticProps[0]): CompProp {
  return {
    id: p.id, title: p.title, price: p.price, location: p.location,
    type: p.type, status: p.status, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
    size: p.size, image: p.images?.[0] || p.image || PLACEHOLDER,
    features: p.features || [], tags: p.tags || [],
  };
}

function Row({ label, values }: { label: string; values: (React.ReactNode)[] }) {
  const count = values.length;
  return (
    <div className={`grid border-b last:border-0 ${count === 1 ? "grid-cols-[160px_1fr]" : count === 2 ? "grid-cols-[160px_1fr_1fr]" : "grid-cols-[160px_1fr_1fr_1fr]"}`}>
      <div className="bg-secondary/60 px-4 py-3 text-xs font-black uppercase tracking-wide text-muted-foreground flex items-center">{label}</div>
      {values.map((v, i) => (
        <div key={i} className={`px-4 py-3 text-sm ${i > 0 ? "border-l" : ""}`}>{v ?? <span className="text-muted-foreground">—</span>}</div>
      ))}
    </div>
  );
}

function ComparePage() {
  const { t } = useLang();
  const [ids, setIds] = useState<string[]>([]);
  const [props, setProps] = useState<(CompProp | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("osoulk_compare") || "[]");
      setIds(Array.isArray(stored) ? stored.slice(0, MAX) : []);
    } catch { setIds([]); }
  }, []);

  useEffect(() => {
    if (!ids.length) { setProps([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(ids.map(async id => {
      const st = staticProps.find(p => p.id === id);
      if (st) return normalizeStatic(st);
      const ul = await getPublicListing(id);
      if (ul) {
        const img = ul.images?.[0] || ul.imageUrl || PLACEHOLDER;
        return { id: ul.id, title: ul.title, price: ul.price, location: ul.location, type: ul.type, status: ul.status, bedrooms: ul.bedrooms || 0, bathrooms: ul.bathrooms || 0, size: ul.size || "", image: img, features: [], tags: ul.tags || [] };
      }
      return null;
    })).then(results => { setProps(results); setLoading(false); });
  }, [ids]);

  function save(newIds: string[]) {
    setIds(newIds);
    localStorage.setItem("osoulk_compare", JSON.stringify(newIds));
  }

  function remove(id: string) { save(ids.filter(i => i !== id)); }

  async function addById() {
    const id = addInput.trim();
    if (!id) return;
    if (ids.includes(id)) { setAddError(t("compare.alreadyIn")); return; }
    if (ids.length >= MAX) { setAddError(t("compare.maxProps").replace("{n}", String(MAX))); return; }
    setAddError("");
    setAddInput("");
    save([...ids, id]);
  }

  const valid = props.filter((p): p is CompProp => p !== null);

  return (
    <main className="min-h-screen bg-background">
      <div className="os-container py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="flex items-center gap-1 hover:text-navy"><Home className="h-3.5 w-3.5" /> {t("compare.home")}</Link>
          <span>/</span>
          <span className="font-semibold text-navy">{t("compare.title")}</span>
        </nav>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-navy flex items-center gap-3">
              <GitCompare className="h-8 w-8" /> {t("compare.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">{t("compare.subtitle").replace("{n}", String(MAX))}</p>
          </div>
          <Button asChild variant="outline"><Link to="/explore">{t("compare.browse")}</Link></Button>
        </div>

        {/* Add by ID */}
        <div className="mb-6 flex flex-wrap gap-2">
          <input
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addById()}
            placeholder={t("compare.pasteId")}
            className="h-10 w-72 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          <Button size="sm" onClick={addById} disabled={ids.length >= MAX || !addInput.trim()}>
            <Plus className="h-4 w-4" /> {t("compare.add")}
          </Button>
          {ids.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => save([])}>{t("compare.clearAll")}</Button>
          )}
          {addError && <p className="self-center text-xs text-destructive">{addError}</p>}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />)}
          </div>
        ) : valid.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GitCompare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-xl font-black text-navy">{t("compare.noProps")}</p>
            <p className="mt-2 text-muted-foreground">{t("compare.noPropsDesc")}</p>
            <Button asChild className="mt-6"><Link to="/explore">{t("compare.browse")}</Link></Button>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card overflow-hidden shadow-float">
            {/* Property header cards */}
            <div className={`grid border-b ${valid.length === 1 ? "grid-cols-[160px_1fr]" : valid.length === 2 ? "grid-cols-[160px_1fr_1fr]" : "grid-cols-[160px_1fr_1fr_1fr]"}`}>
              <div className="bg-navy/5 px-4 py-4 text-xs font-black uppercase tracking-wide text-muted-foreground flex items-end">{t("compare.property")}</div>
              {valid.map(p => (
                <div key={p.id} className="border-l p-4">
                  <div className="relative">
                    <img src={p.image} alt={p.title} className="h-36 w-full rounded-xl object-cover" />
                    <button
                      onClick={() => remove(p.id)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 font-black text-navy text-sm line-clamp-2">{p.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{p.location}</p>
                  <div className="mt-2 flex gap-2">
                    <Link
                      to="/properties/$id"
                      params={{ id: p.id }}
                      className="text-xs font-bold text-navy underline hover:no-underline"
                    >
                      {t("compare.view")} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            <Row label={t("compare.price")}     values={valid.map(p => <span className="font-black text-navy">{p.price}</span>)} />
            <Row label={t("compare.type")}      values={valid.map(p => <span className="capitalize">{p.type}</span>)} />
            <Row label={t("compare.status")}    values={valid.map(p => <span className="capitalize">{p.status}</span>)} />
            <Row label={t("compare.bedrooms")}  values={valid.map(p => p.bedrooms > 0 ? <span className="flex items-center gap-1"><BedDouble className="h-4 w-4 text-muted-foreground" />{p.bedrooms}</span> : null)} />
            <Row label={t("compare.bathrooms")} values={valid.map(p => p.bathrooms > 0 ? <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-muted-foreground" />{p.bathrooms}</span> : null)} />
            <Row label={t("compare.size")}      values={valid.map(p => p.size || null)} />
            <Row label={t("compare.tags")}      values={valid.map(p => p.tags.length ? (
              <div className="flex flex-wrap gap-1">
                {p.tags.map(tg => <span key={tg} className="rounded-full bg-navy/8 px-2 py-0.5 text-xs font-bold text-navy">{tg}</span>)}
              </div>
            ) : null)} />
            <Row label={t("compare.features")}  values={valid.map(p => p.features.length ? (
              <ul className="space-y-0.5">
                {p.features.map(f => <li key={f} className="text-xs">• {f}</li>)}
              </ul>
            ) : null)} />
          </div>
        )}

        {/* "Recently Viewed" quick add helper */}
        <RecentlyViewedAdder currentIds={ids} onAdd={id => {
          if (!ids.includes(id) && ids.length < MAX) save([...ids, id]);
        }} />
      </div>
    </main>
  );
}

function RecentlyViewedAdder({ currentIds, onAdd }: { currentIds: string[]; onAdd: (id: string) => void }) {
  const { t } = useLang();
  const [recent, setRecent] = useState<{ id: string; title: string; image: string }[]>([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("osoulk_recently_viewed") || "[]");
      setRecent(Array.isArray(raw) ? raw.slice(0, 6) : []);
    } catch { setRecent([]); }
  }, []);

  const available = recent.filter(r => !currentIds.includes(r.id));
  if (!available.length) return null;

  return (
    <div className="mt-8">
      <p className="text-sm font-black uppercase tracking-wide text-muted-foreground mb-3">{t("compare.recentlyViewed")}</p>
      <div className="flex flex-wrap gap-3">
        {available.map(r => (
          <button
            key={r.id}
            onClick={() => onAdd(r.id)}
            className="flex items-center gap-2 rounded-xl border bg-card p-2 pr-3 text-sm font-bold text-navy hover:bg-secondary transition-colors"
          >
            <img src={r.image} alt={r.title} className="h-10 w-14 rounded-lg object-cover" />
            <span className="max-w-[160px] truncate">{r.title}</span>
            <Plus className="h-4 w-4 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
