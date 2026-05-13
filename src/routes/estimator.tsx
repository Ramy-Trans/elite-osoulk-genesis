import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, MapPin, Home, TrendingUp, BarChart3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";

export const Route = createFileRoute("/estimator")({
  head: () => ({
    meta: [
      { title: "تقدير قيمة العقار — أصولك" },
      { name: "description", content: "قدّر قيمة عقارك في مصر بناءً على الموقع والمساحة والنوع باستخدام بيانات السوق الحقيقية." },
    ],
  }),
  component: EstimatorPage,
});

const PRICE_MAP: Record<string, Record<string, number>> = {
  "Heliopolis":           { apartment: 51_562, duplex: 68_750, villa: 93_750, townhouse: 75_000, studio: 41_250 },
  "New Cairo":            { apartment: 55_000, duplex: 72_000, villa: 105_000, townhouse: 80_000, studio: 44_000 },
  "North Extensions":     { apartment: 51_562, duplex: 68_000, villa: 90_000, townhouse: 70_000, studio: 40_000 },
  "6th of October":       { apartment: 37_500, duplex: 52_000, villa: 80_000, townhouse: 60_000, studio: 30_000 },
  "Sheikh Zayed":         { apartment: 48_000, duplex: 65_000, villa: 95_000, townhouse: 72_000, studio: 38_000 },
  "New Administrative Capital": { apartment: 65_000, duplex: 85_000, villa: 120_000, townhouse: 95_000, studio: 52_000 },
  "North Coast":          { apartment: 58_000, duplex: 78_000, villa: 130_000, townhouse: 100_000, studio: 45_000 },
  "Maadi":                { apartment: 55_000, duplex: 72_000, villa: 98_000, townhouse: 78_000, studio: 43_000 },
  "Zamalek":              { apartment: 70_000, duplex: 90_000, villa: 140_000, townhouse: 110_000, studio: 56_000 },
  "Dokki / Agouza":       { apartment: 50_000, duplex: 65_000, villa: 88_000, townhouse: 68_000, studio: 40_000 },
};

const LOCATIONS = Object.keys(PRICE_MAP);
const TYPES = ["apartment", "duplex", "villa", "townhouse", "studio"] as const;
const TYPE_LABELS: Record<string, string> = {
  apartment: "شقة", duplex: "دوبلكس", villa: "فيلا", townhouse: "تاون هاوس", studio: "ستوديو",
};
const TYPE_LABELS_EN: Record<string, string> = {
  apartment: "Apartment", duplex: "Duplex", villa: "Villa", townhouse: "Townhouse", studio: "Studio",
};

const LOC_AR: Record<string, string> = {
  "Heliopolis": "مصر الجديدة",
  "New Cairo": "القاهرة الجديدة",
  "North Extensions": "التوسعات الشمالية",
  "6th of October": "السادس من أكتوبر",
  "Sheikh Zayed": "الشيخ زايد",
  "New Administrative Capital": "العاصمة الإدارية الجديدة",
  "North Coast": "الساحل الشمالي",
  "Maadi": "المعادي",
  "Zamalek": "الزمالك",
  "Dokki / Agouza": "الدقي / العجوزة",
};

function formatEGP(n: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);
}

function EstimatorPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [location, setLocation] = useState("");
  const [type, setType] = useState<string>("apartment");
  const [area, setArea] = useState("");
  const [result, setResult] = useState<null | { low: number; mid: number; high: number; perSqm: number }>(null);
  const [error, setError] = useState("");

  function estimate() {
    setError("");
    setResult(null);
    if (!location || !area) { setError(isAr ? "يرجى اختيار الموقع وإدخال المساحة." : "Please select a location and enter area."); return; }
    const areaNum = parseFloat(area);
    if (isNaN(areaNum) || areaNum < 30 || areaNum > 5000) {
      setError(isAr ? "يرجى إدخال مساحة بين 30 و 5000 متر مربع." : "Please enter an area between 30 and 5000 sqm.");
      return;
    }
    const perSqm = PRICE_MAP[location]?.[type] ?? 50_000;
    const mid = perSqm * areaNum;
    setResult({ low: mid * 0.9, mid, high: mid * 1.12, perSqm });
  }

  const comparisons = location
    ? TYPES.map(t => ({
        type: t,
        label: isAr ? TYPE_LABELS[t] : TYPE_LABELS_EN[t],
        perSqm: PRICE_MAP[location]?.[t] ?? 0,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background pb-24 pt-8">
      <div className="os-container max-w-3xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="section-kicker mb-3 inline-flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {isAr ? "أداة تقدير" : "Smart Estimator"}
          </span>
          <h1 className="text-4xl font-black text-navy">
            {isAr ? "قدّر قيمة عقارك" : "Estimate Your Property"}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {isAr
              ? "أدخل تفاصيل عقارك وستحصل على تقدير فوري لقيمته السوقية بناءً على بيانات حقيقية من السوق المصري."
              : "Enter your property details to get an instant market value estimate based on real Egyptian market data."}
          </p>
        </div>

        {/* Form */}
        <div className="premium-card p-8 mb-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-navy">
                <MapPin className="inline h-4 w-4 me-1" />
                {isAr ? "الموقع" : "Location"}
              </label>
              <select
                value={location}
                onChange={e => { setLocation(e.target.value); setResult(null); }}
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                <option value="">{isAr ? "اختر المنطقة..." : "Select area..."}</option>
                {LOCATIONS.map(l => (
                  <option key={l} value={l}>{isAr ? (LOC_AR[l] ?? l) : l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-navy">
                <Home className="inline h-4 w-4 me-1" />
                {isAr ? "نوع العقار" : "Property Type"}
              </label>
              <select
                value={type}
                onChange={e => { setType(e.target.value); setResult(null); }}
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{isAr ? TYPE_LABELS[t] : TYPE_LABELS_EN[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-navy">
                {isAr ? "المساحة (م²)" : "Area (sqm)"}
              </label>
              <input
                type="number"
                min={30}
                max={5000}
                value={area}
                onChange={e => { setArea(e.target.value); setResult(null); }}
                placeholder={isAr ? "مثال: 150" : "e.g. 150"}
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button onClick={estimate} className="mt-6 w-full" size="lg">
            <Calculator className="h-4 w-4 me-2" />
            {isAr ? "احسب التقدير" : "Calculate Estimate"}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="premium-card overflow-hidden">
              <div className="bg-navy px-8 py-6 text-white">
                <p className="text-sm font-bold opacity-70">{isAr ? "التقدير المتوسط" : "Estimated Market Value"}</p>
                <p className="mt-1 text-4xl font-black">{formatEGP(result.mid)}</p>
                <p className="mt-1 text-sm opacity-70">
                  {isAr ? `${formatEGP(result.perSqm)} / م²` : `${formatEGP(result.perSqm)} / sqm`}
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-x-reverse border-b">
                <div className="px-6 py-4">
                  <p className="text-xs font-bold text-muted-foreground">{isAr ? "الحد الأدنى" : "Low Range"}</p>
                  <p className="mt-1 text-lg font-black text-navy">{formatEGP(result.low)}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-xs font-bold text-muted-foreground">{isAr ? "الحد الأعلى" : "High Range"}</p>
                  <p className="mt-1 text-lg font-black text-navy">{formatEGP(result.high)}</p>
                </div>
              </div>
              <div className="px-6 py-4 flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  {isAr
                    ? "هذا التقدير تقريبي بناءً على متوسطات السوق. يُنصح باستشارة وسيط معتمد للحصول على تقييم دقيق."
                    : "This is an approximate estimate based on market averages. We recommend consulting a certified broker for an accurate valuation."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Market comparison */}
        {location && comparisons.length > 0 && (
          <div className="premium-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-black text-navy">
              <BarChart3 className="h-5 w-5" />
              {isAr ? `مقارنة الأسعار في ${LOC_AR[location] ?? location}` : `Price Comparison in ${location}`}
            </h3>
            <div className="space-y-3">
              {comparisons.sort((a, b) => b.perSqm - a.perSqm).map(c => {
                const maxSqm = Math.max(...comparisons.map(x => x.perSqm));
                const pct = Math.round((c.perSqm / maxSqm) * 100);
                return (
                  <div key={c.type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`font-bold ${c.type === type ? "text-navy" : "text-muted-foreground"}`}>{c.label}</span>
                      <span className="font-black text-navy">{formatEGP(c.perSqm)}<span className="text-xs font-normal text-muted-foreground">/م²</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${c.type === type ? "bg-navy" : "bg-aqua/40"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {isAr ? "الأسعار بالجنيه المصري لكل متر مربع — مصدر: سوق أصولك" : "Prices in EGP per sqm — source: Osoulk market data"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
