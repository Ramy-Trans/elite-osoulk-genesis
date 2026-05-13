import { useState } from "react";
import { Bookmark, BookmarkCheck, Bell, Zap, Clock, RefreshCw, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedUser, saveSearch } from "@/lib/api";
import { useLang } from "@/lib/language";

const FREQ_OPTIONS = [
  { value: "instant", labelAr: "فوري",   labelEn: "Instant",  icon: Zap,        color: "text-emerald-600" },
  { value: "daily",   labelAr: "يومي",   labelEn: "Daily",    icon: Clock,      color: "text-blue-600" },
  { value: "weekly",  labelAr: "أسبوعي", labelEn: "Weekly",   icon: RefreshCw,  color: "text-navy" },
  { value: "disabled",labelAr: "معطل",   labelEn: "Off",      icon: BellOff,    color: "text-muted-foreground" },
];

type Filters = {
  keyword?: string;
  location?: string;
  status?: string;
  type?: string;
  priceRange?: number;
};

export function SaveSearchButton({ filters }: { filters: Filters }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const user = getCachedUser();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("instant");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const hasFilters = filters.keyword || filters.location || filters.status || filters.type || (filters.priceRange && filters.priceRange > 0);

  function buildDefaultName(): string {
    const parts = [];
    if (filters.location) parts.push(filters.location);
    if (filters.type) parts.push(filters.type);
    if (filters.status) parts.push(filters.status);
    if (filters.keyword) parts.push(filters.keyword);
    return parts.join(" · ") || (isAr ? "جميع العقارات" : "All Properties");
  }

  function openModal() {
    setName(buildDefaultName());
    setError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await saveSearch(name.trim() || buildDefaultName(), {
        keyword: filters.keyword || "",
        location: filters.location || "",
        status: filters.status || "",
        type: filters.type || "",
        priceRange: String(filters.priceRange || 0),
        alertFrequency: freq,
      });
      setSaved(true);
      setOpen(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? "فشل الحفظ" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-black text-navy flex items-center gap-2">
                <Bell className="h-5 w-5 text-aqua" />
                {isAr ? "حفظ البحث وإنشاء تنبيه" : "Save Search & Create Alert"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-navy"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-navy">{isAr ? "اسم البحث" : "Search Name"}</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={isAr ? "اسم مميز لهذا البحث..." : "Give this search a name..."}
                  required
                />
              </div>

              {/* Active filters summary */}
              {hasFilters && (
                <div className="rounded-xl bg-navy/5 px-4 py-3 text-xs text-navy">
                  <p className="font-bold mb-1">{isAr ? "معايير البحث:" : "Search criteria:"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filters.location && <span className="rounded-full bg-white border px-2 py-0.5 font-medium">{filters.location}</span>}
                    {filters.type && <span className="rounded-full bg-white border px-2 py-0.5 font-medium">{filters.type}</span>}
                    {filters.status && <span className="rounded-full bg-white border px-2 py-0.5 font-medium">{filters.status}</span>}
                    {filters.keyword && <span className="rounded-full bg-white border px-2 py-0.5 font-medium">"{filters.keyword}"</span>}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-bold text-navy">{isAr ? "تكرار التنبيه" : "Alert Frequency"}</label>
                <div className="grid grid-cols-2 gap-2">
                  {FREQ_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFreq(opt.value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${freq === opt.value ? "border-navy bg-navy text-white" : "border-navy/20 hover:border-navy/40"}`}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                <BookmarkCheck className="h-4 w-4 me-2" />
                {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ وتفعيل التنبيه" : "Save & Enable Alert")}
              </Button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={saved ? undefined : openModal}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
          saved
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white"
        }`}
        title={isAr ? "حفظ هذا البحث" : "Save this search"}
      >
        {saved
          ? <><BookmarkCheck className="h-4 w-4" />{isAr ? "تم الحفظ!" : "Saved!"}</>
          : <><Bookmark className="h-4 w-4" />{isAr ? "حفظ البحث" : "Save Search"}</>
        }
      </button>
    </>
  );
}
