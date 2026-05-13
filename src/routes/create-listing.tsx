import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer, PageHero, icons } from "@/components/osoulk/site";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/language";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, LogIn } from "lucide-react";
import { getCachedUser, createListing, type CurrentUser } from "@/lib/api";

export const Route = createFileRoute("/create-listing")({
  head: () => ({
    meta: [
      { title: "Create a Listing — Osoulk" },
      { name: "description", content: "Create a premium property listing with step-by-step details, pricing, media and approval-ready publishing." },
      { property: "og:title", content: "Create a Listing — Osoulk" },
    ],
  }),
  component: CreateListing,
});

function CreateListing() {
  const { t, lang } = useLang();
  const { Upload, FileCheck2 } = icons;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Apartment");
  const [status, setStatus] = useState("For Sale");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    setUser(getCachedUser());
  }, []);

  const steps = [
    t("create.propertyTitle"),
    t("create.price"),
    t("create.type"),
    t("create.location"),
    t("create.description"),
    t("create.submit"),
  ] as const;

  const propertyTypes: { value: string; ar: string; en: string }[] = [
    { value: "Apartment",   ar: "شقة",          en: "Apartment" },
    { value: "Villa",       ar: "فيلا",          en: "Villa" },
    { value: "Townhouse",   ar: "تاون هاوس",    en: "Townhouse" },
    { value: "Office",      ar: "مكتب",          en: "Office" },
    { value: "Land",        ar: "أرض",           en: "Land" },
    { value: "Duplex",      ar: "دوبلكس",        en: "Duplex" },
    { value: "Studio",      ar: "استوديو",       en: "Studio" },
    { value: "Residential", ar: "سكني",          en: "Residential" },
  ];
  const propertyStatuses: { value: string; ar: string; en: string }[] = [
    { value: "For Sale", ar: "للبيع",   en: "For Sale" },
    { value: "For Rent", ar: "للإيجار", en: "For Rent" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const priceFormatted = price.startsWith("EGP") ? price : `EGP ${Number(price).toLocaleString()}`;
      await createListing({
        title,
        price: priceFormatted,
        type,
        status,
        location,
        size: size ? `${size} m²` : "",
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        description,
        imageUrl,
        tags: [status],
      } as any);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("create.submissionFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <PageHero
        kicker={t("create.kicker")}
        title={t("create.title")}
        subtitle={t("create.subtitle")}
      />

      <section className="py-16">
        <div className="os-container grid gap-8 lg:grid-cols-[.35fr_.65fr]">
          <aside className="premium-card h-fit p-6">
            <h2 className="font-black text-navy mb-4">{t("create.formTitle")}</h2>
            {steps.map((step, i) => (
              <div key={step} className="mt-3 flex items-center gap-3 font-bold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-navy text-sm">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{step}</span>
              </div>
            ))}

            {!user && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800">{t("create.signInRequired")}</p>
                <Button asChild size="sm" className="mt-3 w-full" variant="outline">
                  <Link to="/dashboard"><LogIn className="h-4 w-4 mr-1" /> {t("create.signIn")}</Link>
                </Button>
              </div>
            )}

            {user && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-700">{t("create.signedInAs")}</p>
                <p className="text-sm font-black text-emerald-900">{user.fullName}</p>
                <p className="text-xs text-emerald-700 capitalize">{user.role}</p>
              </div>
            )}
          </aside>

          {submitted ? (
            <div className="premium-card flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="mt-6 text-3xl font-black text-navy">{t("create.successTitle")}</h2>
              <p className="mt-3 text-muted-foreground">{t("create.successText")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("create.pendingReview")}</p>
              <div className="mt-6 flex gap-3">
                <Button asChild variant="outline"><Link to="/explore">{t("create.browseProperties")}</Link></Button>
                <Button asChild><Link to="/dashboard">{t("create.myDashboard")}</Link></Button>
              </div>
            </div>
          ) : (
            <form className="premium-card grid gap-5 p-6" onSubmit={handleSubmit}>
              <input
                required
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={t("create.propertyTitle")}
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={!user}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className="h-12 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  disabled={!user}
                >
                  {propertyTypes.map(pt => <option key={pt.value} value={pt.value}>{lang === "ar" ? pt.ar : pt.en}</option>)}
                </select>

                <select
                  className="h-12 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  disabled={!user}
                >
                  {propertyStatuses.map(s => <option key={s.value} value={s.value}>{lang === "ar" ? s.ar : s.en}</option>)}
                </select>

                <input
                  required
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("create.price") + " (e.g. 4500000)"}
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  disabled={!user}
                />

                <input
                  required
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("create.location")}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  disabled={!user}
                />

                <input
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("create.size") + " (m²)"}
                  type="number"
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  disabled={!user}
                />

                <input
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("create.bedrooms")}
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={e => setBedrooms(e.target.value)}
                  disabled={!user}
                />

                <input
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("create.bathrooms")}
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={e => setBathrooms(e.target.value)}
                  disabled={!user}
                />

                <input
                  className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={t("create.photoUrlPlaceholder")}
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  disabled={!user}
                />
              </div>

              <textarea
                className="min-h-32 rounded-xl border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={t("create.description")}
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={!user}
              />

              <div className="grid place-items-center rounded-2xl border-2 border-dashed border-navy/20 bg-secondary p-8 text-center">
                <Upload className="h-8 w-8 text-aqua" />
                <p className="mt-2 font-black text-navy">{t("create.photoUpload")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("create.photoUploadHint")}</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <Button type="submit" size="lg" disabled={loading || !user} className="gap-2">
                <FileCheck2 className="h-4 w-4" />
                {!user ? t("create.signInToSubmit") : loading ? t("create.submitting") : t("create.submit")}
              </Button>

              {!user && (
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/dashboard" className="font-bold text-navy underline">{t("create.signInCta")}</Link>{t("create.signInCtaSuffix")}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
