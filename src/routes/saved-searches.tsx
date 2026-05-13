import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Bell, BellOff, Trash2, Edit2, Save, X, Search, SlidersHorizontal,
  AlertCircle, CheckCircle2, Clock, MapPin, Tag, Zap, RefreshCw,
  ChevronRight, BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedUser, getSavedSearches, deleteSavedSearch, updateSavedSearch, type SavedSearch } from "@/lib/api";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/saved-searches")({
  head: () => ({
    meta: [
      { title: "البحوث المحفوظة — أصولك" },
      { name: "description", content: "إدارة بحوثك المحفوظة وتنبيهات العقارات." },
    ],
  }),
  component: SavedSearchesPage,
});

const FREQ_OPTIONS = [
  { value: "instant", labelAr: "فوري", labelEn: "Instant", icon: Zap, color: "text-emerald-600 bg-emerald-50" },
  { value: "daily",   labelAr: "يومي",  labelEn: "Daily",   icon: Clock, color: "text-blue-600 bg-blue-50" },
  { value: "weekly",  labelAr: "أسبوعي", labelEn: "Weekly", icon: RefreshCw, color: "text-navy bg-navy/10" },
  { value: "disabled",labelAr: "معطل",  labelEn: "Off",     icon: BellOff, color: "text-muted-foreground bg-secondary" },
];

function freqLabel(val: string, lang: string) {
  const opt = FREQ_OPTIONS.find(f => f.value === val);
  if (!opt) return val;
  return lang === "ar" ? opt.labelAr : opt.labelEn;
}

function FilterBadge({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-navy/15 bg-navy/5 px-2.5 py-1 text-xs font-bold text-navy">
      {label}: {value}
    </span>
  );
}

function EditModal({
  search, onSave, onClose,
}: {
  search: SavedSearch;
  onSave: (id: string, data: Partial<SavedSearch>) => Promise<void>;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [name, setName] = useState(search.name);
  const [freq, setFreq] = useState(search.alertFrequency || "instant");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(search.id, { name, alertFrequency: freq });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-background shadow-2xl" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-black text-navy">{isAr ? "تعديل البحث المحفوظ" : "Edit Saved Search"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-navy"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-navy">{isAr ? "اسم البحث" : "Search Name"}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-navy">{isAr ? "تكرار التنبيه" : "Alert Frequency"}</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFreq(opt.value)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${freq === opt.value ? "border-navy bg-navy text-white" : "border-navy/20 hover:border-navy/40"}`}
                >
                  <opt.icon className="h-4 w-4" />
                  {isAr ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              <Save className="h-4 w-4 me-2" />
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SavedSearchesPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const user = getCachedUser();

  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<SavedSearch | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSavedSearches();
      setSearches(data);
    } catch {
      setError(isAr ? "فشل تحميل البحوث المحفوظة" : "Failed to load saved searches");
    } finally {
      setLoading(false);
    }
  }, [user, isAr]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Delete this saved search?")) return;
    await deleteSavedSearch(id);
    setSearches(s => s.filter(x => x.id !== id));
    showToast(isAr ? "تم الحذف" : "Deleted");
  }

  async function handleTogglePause(search: SavedSearch) {
    const updated = await updateSavedSearch(search.id, { paused: !search.paused });
    setSearches(s => s.map(x => x.id === updated.id ? updated : x));
    showToast(updated.paused
      ? (isAr ? "تم إيقاف التنبيهات" : "Alerts paused")
      : (isAr ? "تم تفعيل التنبيهات" : "Alerts resumed"));
  }

  async function handleSaveEdit(id: string, data: Partial<SavedSearch>) {
    const updated = await updateSavedSearch(id, data);
    setSearches(s => s.map(x => x.id === updated.id ? updated : x));
    showToast(isAr ? "تم التحديث" : "Updated");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="premium-card max-w-md w-full p-8 text-center">
          <BookmarkCheck className="mx-auto h-12 w-12 text-navy" />
          <h1 className="mt-4 text-2xl font-black text-navy">{isAr ? "تسجيل الدخول مطلوب" : "Sign in Required"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{isAr ? "سجّل دخولك للوصول إلى بحوثك المحفوظة." : "Sign in to manage your saved searches."}</p>
          <Button asChild className="mt-6"><Link to="/dashboard">{isAr ? "تسجيل الدخول" : "Sign In"}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-8" dir={isAr ? "rtl" : "ltr"}>
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white shadow-2xl">
          <CheckCircle2 className="me-2 inline h-4 w-4" />{toast}
        </div>
      )}

      {editTarget && (
        <EditModal
          search={editTarget}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div className="os-container max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="section-kicker mb-2 inline-flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {isAr ? "التنبيهات الذكية" : "Smart Alerts"}
            </span>
            <h1 className="text-3xl font-black text-navy">{isAr ? "البحوث المحفوظة" : "Saved Searches"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr ? "نُخطرك فور إضافة عقار يطابق بحثك." : "We'll notify you instantly when a matching property is listed."}
            </p>
          </div>
          <Button asChild>
            <Link to="/explore">
              <Search className="h-4 w-4 me-2" />
              {isAr ? "بحث جديد" : "New Search"}
            </Link>
          </Button>
        </div>

        {/* Alert frequency legend */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FREQ_OPTIONS.map(opt => (
            <span key={opt.value} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${opt.color}`}>
              <opt.icon className="h-3 w-3" />
              {isAr ? opt.labelAr : opt.labelEn}
            </span>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl bg-destructive/10 px-5 py-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />{error}
          </div>
        ) : searches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/20 py-20 text-center">
            <SlidersHorizontal className="h-12 w-12 text-navy/30" />
            <h3 className="mt-4 text-lg font-black text-navy">{isAr ? "لا توجد بحوث محفوظة" : "No saved searches yet"}</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {isAr ? "ابحث عن عقارات في صفحة الاستكشاف وانقر على \"حفظ البحث\" للحصول على تنبيهات فورية." : "Search for properties and click \"Save Search\" to get instant alerts."}
            </p>
            <Button asChild className="mt-6">
              <Link to="/explore"><Search className="h-4 w-4 me-2" />{isAr ? "استكشاف العقارات" : "Explore Properties"}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map(search => {
              const freq = FREQ_OPTIONS.find(f => f.value === (search.alertFrequency || "instant"));
              const FreqIcon = freq?.icon ?? Zap;
              return (
                <div
                  key={search.id}
                  className={`premium-card p-5 transition-all ${search.paused ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
                      <Search className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-navy">{search.name}</h3>
                        {search.paused && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            {isAr ? "موقوف" : "Paused"}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${freq?.color ?? ""}`}>
                          <FreqIcon className="h-3 w-3" />
                          {freqLabel(search.alertFrequency || "instant", lang)}
                        </span>
                      </div>

                      {/* Filter badges */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <FilterBadge label={isAr ? "الموقع" : "Location"} value={search.filters?.location || ""} />
                        <FilterBadge label={isAr ? "النوع" : "Type"} value={search.filters?.type || ""} />
                        <FilterBadge label={isAr ? "الحالة" : "Status"} value={search.filters?.status || ""} />
                        <FilterBadge label={isAr ? "الكلمة" : "Keyword"} value={search.filters?.keyword || ""} />
                        {!search.filters?.location && !search.filters?.type && !search.filters?.status && !search.filters?.keyword && (
                          <span className="text-xs text-muted-foreground">{isAr ? "جميع العقارات" : "All properties"}</span>
                        )}
                      </div>

                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {isAr ? "أُنشئ" : "Created"} {new Date(search.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditTarget(search)}
                        className="h-8 w-8 p-0"
                        title={isAr ? "تعديل" : "Edit"}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePause(search)}
                        className="h-8 w-8 p-0"
                        title={search.paused ? (isAr ? "تفعيل" : "Resume") : (isAr ? "إيقاف" : "Pause")}
                      >
                        {search.paused ? <Bell className="h-3.5 w-3.5 text-emerald-600" /> : <BellOff className="h-3.5 w-3.5 text-amber-600" />}
                      </Button>
                      <button
                        onClick={() => handleDelete(search.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title={isAr ? "حذف" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Explore with this search */}
                  <div className="mt-4 border-t pt-3">
                    <Link
                      to="/explore"
                      search={{
                        q: search.filters?.keyword || "",
                        location: search.filters?.location || "",
                        status: search.filters?.status || "",
                        type: search.filters?.type || "",
                      } as Record<string, string>}
                      className="flex items-center gap-1.5 text-xs font-bold text-aqua hover:text-navy transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      {isAr ? "عرض نتائج هذا البحث" : "View matching properties"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        {searches.length > 0 && (
          <div className="mt-6 rounded-xl bg-navy/5 border border-navy/10 px-5 py-4 text-sm text-navy">
            <p className="font-bold">{isAr ? "كيف تعمل التنبيهات؟" : "How alerts work"}</p>
            <p className="mt-1 text-muted-foreground">
              {isAr
                ? "عند إضافة عقار جديد يطابق بحثك، ستصلك إشعار فوري في التطبيق. يمكنك ضبط التكرار أو إيقاف التنبيهات مؤقتاً في أي وقت."
                : "When a new property matching your search criteria is published, you'll get an instant in-app notification. You can adjust frequency or pause alerts anytime."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
