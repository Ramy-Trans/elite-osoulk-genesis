import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { Globe, Home, Search, Heart, PlusSquare, Menu, X, Phone, LayoutDashboard, ChevronDown, Building, Video, Scale, Bell, Newspaper, MapPin, Star, TrendingUp, FileText } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getCachedUser, getSiteSettings, applyThemeToDOM, type CurrentUser } from "@/lib/api";
import { NotificationBell } from "@/components/osoulk/notification-bell";

import "../styles.css";
const osoulkLogo = "/osoulk-logo.webp";
import { Button } from "@/components/ui/button";
import { SubscribeModal } from "@/components/osoulk/subscribe-modal";
import { SignUpModal } from "@/components/osoulk/signup-modal";
import { LangProvider, useLang } from "@/lib/language";

function NotFoundComponent() {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="premium-card max-w-md p-8 text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("404.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("404.text")}</p>
        <div className="mt-6">
          <Button asChild><Link to="/">{t("404.home")}</Link></Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponentWrapper,
});

function NotFoundComponentWrapper() {
  return (
    <LangProvider>
      <NotFoundComponent />
    </LangProvider>
  );
}

// ─── Language Dropdown ────────────────────────────────────────────────────────
function LanguageDropdown({ variant = "desktop" }: { variant?: "desktop" | "mobile" | "bottom" }) {
  const { lang, toggle, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(newLang: "ar" | "en") {
    if (newLang !== lang) toggle();
    setOpen(false);
  }

  if (variant === "bottom") {
    return (
      <div ref={ref} className="relative flex flex-col items-center">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-black text-navy transition-colors hover:bg-secondary"
          aria-label={t("lang.select")}
        >
          <Globe className="h-5 w-5" />
          <span className="leading-none">{lang === "ar" ? "عربي" : "EN"}</span>
        </button>
        {open && (
          <div className="absolute bottom-full mb-1 z-50 min-w-[120px] rounded-xl border bg-background shadow-float overflow-hidden">
            <button
              onClick={() => select("ar")}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-secondary ${lang === "ar" ? "text-navy" : "text-muted-foreground"}`}
            >
              {t("lang.arabic")} {lang === "ar" && <span className="text-navy">✓</span>}
            </button>
            <button
              onClick={() => select("en")}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-secondary ${lang === "en" ? "text-navy" : "text-muted-foreground"}`}
            >
              {t("lang.english")} {lang === "en" && <span className="text-navy">✓</span>}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div ref={ref} className="relative col-span-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/20 py-2.5 text-sm font-black text-navy hover:bg-secondary transition-colors"
          aria-label={t("lang.select")}
        >
          <Globe className="h-4 w-4" />
          {lang === "ar" ? t("lang.arabic") : t("lang.english")}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute bottom-full mb-1 left-0 right-0 z-50 rounded-xl border bg-background shadow-float overflow-hidden">
            <button
              onClick={() => select("ar")}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary ${lang === "ar" ? "text-navy bg-secondary/50" : "text-muted-foreground"}`}
            >
              {t("lang.arabic")} {lang === "ar" && <span className="text-navy font-black">✓</span>}
            </button>
            <button
              onClick={() => select("en")}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary ${lang === "en" ? "text-navy bg-secondary/50" : "text-muted-foreground"}`}
            >
              {t("lang.english")} {lang === "en" && <span className="text-navy font-black">✓</span>}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-navy/20 px-3 py-1.5 text-xs font-black tracking-wide transition-colors hover:bg-navy hover:text-primary-foreground"
        aria-label={t("lang.select")}
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === "ar" ? t("lang.arabic") : t("lang.english")}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 end-0 z-50 min-w-[140px] rounded-xl border bg-background shadow-float overflow-hidden">
          <button
            onClick={() => select("ar")}
            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-secondary ${lang === "ar" ? "text-navy bg-secondary/40" : "text-muted-foreground"}`}
          >
            {t("lang.arabic")} {lang === "ar" && <span className="text-navy">✓</span>}
          </button>
          <button
            onClick={() => select("en")}
            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-secondary ${lang === "en" ? "text-navy bg-secondary/40" : "text-muted-foreground"}`}
          >
            {t("lang.english")} {lang === "en" && <span className="text-navy">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Explore Dropdown ─────────────────────────────────────────────────────────
function ExploreDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [navPages, setNavPages] = useState<{ slug: string; title: string; titleAr: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    import("@/lib/api").then(({ getPublicPages }) => {
      getPublicPages()
        .then((pages) => { setNavPages(pages.filter(p => p.showInNav).map(p => ({ slug: p.slug, title: p.title, titleAr: p.titleAr ?? "" }))); })
        .catch((err) => { console.error("[pages nav] failed:", err); });
    });
  }, []);

  const exploreItems = [
    {
      group: lang === "ar" ? "العقارات" : "Properties",
      items: [
        { to: "/explore", label: lang === "ar" ? "استكشف العقارات" : "Explore Properties", icon: Search },
        { to: "/compare", label: lang === "ar" ? "مقارنة العقارات" : "Compare Properties", icon: Scale },
        { to: "/estimator", label: lang === "ar" ? "تقدير العقار" : "Property Estimator", icon: TrendingUp },
      ],
    },
    {
      group: lang === "ar" ? "الوكالات والمطورون" : "Agencies & Developers",
      items: [
        { to: "/agencies", label: lang === "ar" ? "الوكالات" : "Agencies", icon: Building },
        { to: "/reels", label: lang === "ar" ? "فيديوهات" : "Property Videos", icon: Video },
      ],
    },
    {
      group: lang === "ar" ? "الاكتشاف" : "Discover",
      items: [
        { to: "/articles", label: lang === "ar" ? "المقالات والمدونة" : "Articles & Blog", icon: Newspaper },
        { to: "/saved-searches", label: lang === "ar" ? "تنبيهاتي" : "My Alerts", icon: Bell },
        { to: "/sell", label: lang === "ar" ? "بيع عقارك" : "Sell Property", icon: MapPin },
      ],
    },
  ];

  return (
    <div ref={ref} className="relative hidden xl:block">
      <button
        onClick={() => setOpen(!open)}
        className="nav-link flex items-center gap-1.5 whitespace-nowrap"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {lang === "ar" ? "اكتشف" : "Explore"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 start-0 z-50 w-[480px] rounded-2xl border bg-background shadow-premium overflow-hidden">
          <div className="grid grid-cols-3 gap-0 divide-x rtl:divide-x-reverse">
            {exploreItems.map(group => (
              <div key={group.group} className="p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{group.group}</p>
                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => { setOpen(false); onNavigate?.(); }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-secondary hover:text-navy"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-aqua" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {navPages.length > 0 && (
            <div className="border-t px-5 py-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {lang === "ar" ? "صفحات" : "Pages"}
              </p>
              <div className="flex flex-wrap gap-2">
                {navPages.map(p => (
                  <Link
                    key={p.slug}
                    to="/pages/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => { setOpen(false); onNavigate?.(); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-navy transition-colors hover:bg-secondary"
                  >
                    <FileText className="h-3.5 w-3.5 text-aqua" />
                    {lang === "ar" && p.titleAr ? p.titleAr : p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="border-t bg-secondary/50 px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-bold">
              {lang === "ar" ? "منصة عقارية فاخرة في مصر" : "Premium real estate platform in Egypt"}
            </p>
            <Link
              to="/explore"
              onClick={() => { setOpen(false); onNavigate?.(); }}
              className="text-xs font-black text-navy hover:text-aqua transition-colors"
            >
              {lang === "ar" ? "عرض الكل ←" : "View All →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { t, lang } = useLang();
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    setUser(getCachedUser());
    function onStorage() { setUser(getCachedUser()); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mainNavItems = [
    { key: "nav.home",     to: "/" },
    { key: "nav.about",    to: "/about" },
    { key: "nav.contact",  to: "/contact" },
    { key: "nav.packages", to: "/packages" },
  ];

  const mobileExploreItems = [
    { label: lang === "ar" ? "استكشف العقارات" : "Explore Properties", to: "/explore", icon: Search },
    { label: lang === "ar" ? "الوكالات" : "Agencies", to: "/agencies", icon: Building },
    { label: lang === "ar" ? "المشاريع والمجمعات" : "Projects & Compounds", to: "/projects", icon: Star },
    { label: lang === "ar" ? "مقارنة العقارات" : "Compare Properties", to: "/compare", icon: Scale },
    { label: lang === "ar" ? "تقدير العقار" : "Property Estimator", to: "/estimator", icon: TrendingUp },
    { label: lang === "ar" ? "فيديوهات" : "Property Videos", to: "/reels", icon: Video },
    { label: lang === "ar" ? "المقالات والمدونة" : "Articles & Blog", to: "/articles", icon: Newspaper },
    { label: lang === "ar" ? "تنبيهاتي" : "My Alerts", to: "/saved-searches", icon: Bell },
    { label: lang === "ar" ? "بيع عقارك" : "Sell Property", to: "/sell", icon: MapPin },
  ];

  return (
    <>
      <div className="sticky top-0 z-50">
        {/* Promo bar */}
        <div className="bg-navy py-3 text-center text-sm font-semibold text-primary-foreground">
          <span className="hidden sm:inline">{t("header.limitedOffer")}</span>
          <Link
            to="/packages"
            className="mx-3 rounded-full bg-background px-4 py-1 text-sm font-bold text-navy transition-opacity hover:opacity-80"
          >
            {t("header.subscribeNow")}
          </Link>
        </div>

        {/* Main nav */}
        <header className="border-b bg-background/97 backdrop-blur-xl shadow-sm">
          <div className="os-container flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Osoulk home">
              <img src={osoulkLogo} alt="Osoulk logo" className="h-9 w-auto max-w-[130px] object-contain" />
            </Link>

            {/* Desktop nav — simplified main links + Explore dropdown */}
            <nav className="hidden items-center gap-1 text-sm font-bold xl:flex" aria-label={t("nav.home")}>
              {mainNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-link whitespace-nowrap px-3 py-2 rounded-lg"
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {t(item.key)}
                </Link>
              ))}
              <ExploreDropdown />
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Language dropdown — desktop */}
              <LanguageDropdown variant="desktop" />

              {/* Phone — always LTR */}
              <a href="tel:+201025812666" dir="ltr" className="hidden text-sm font-bold text-navy hover:text-aqua transition-colors lg:block">{t("header.phone")}</a>

              {/* Notification bell */}
              <NotificationBell />

              {/* Dashboard / Sign up */}
              {user ? (
                <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                  <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSignUpOpen(true)}
                  className="hidden md:inline-flex"
                >
                  {t("header.signUp")}
                </Button>
              )}

              {/* Create listing */}
              <Button asChild size="sm" className="hidden md:inline-flex bg-[#061E46] hover:bg-[#0a2d6b] !text-white [&]:text-white">
                <Link to="/create-listing">{t("header.createListing")}</Link>
              </Button>

              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy/20 text-navy xl:hidden"
                aria-label={mobileMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile bottom sheet */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="mobile-sheet absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1.5 w-12 rounded-full bg-border" />
            </div>

            <nav className="px-4 py-2" aria-label="Mobile navigation">
              {/* Primary links */}
              <div className="space-y-0.5">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-navy transition-colors hover:bg-secondary"
                    activeOptions={{ exact: item.to === "/" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(item.key)}
                  </Link>
                ))}
              </div>

              {/* Explore accordion */}
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={() => setExploreOpen(!exploreOpen)}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-bold text-navy transition-colors hover:bg-secondary active:bg-secondary/80"
                  aria-expanded={exploreOpen}
                >
                  <span className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-aqua" />
                    {lang === "ar" ? "اكتشف" : "Explore"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${exploreOpen ? "rotate-180" : ""}`} />
                </button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: exploreOpen ? `${mobileExploreItems.length * 56}px` : "0px", opacity: exploreOpen ? 1 : 0 }}
                >
                  <div className="space-y-0.5 pb-2 pt-1">
                    {mobileExploreItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-secondary active:bg-secondary/80"
                          onClick={() => { setMobileMenuOpen(false); setExploreOpen(false); }}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-aqua" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            <div className="mx-4 mt-2 grid grid-cols-2 gap-2 border-t pt-4">
              {user ? (
                <Button asChild variant="outline" size="sm" className="col-span-1" onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="col-span-1"
                  onClick={() => { setSignUpOpen(true); setMobileMenuOpen(false); }}
                >
                  {t("header.signUp")}
                </Button>
              )}
              <Button asChild size="sm" className="col-span-1" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/create-listing">{t("header.createListing")}</Link>
              </Button>

              {/* Language dropdown — mobile sheet */}
              <LanguageDropdown variant="mobile" />

              <a href="tel:+201025812666" className="col-span-2 flex items-center justify-center gap-2 py-2 text-sm font-bold text-navy hover:text-aqua transition-colors">
                <Phone className="h-4 w-4 text-aqua" />
                <span dir="ltr">{t("header.phone")}</span>
              </a>
            </div>

            {/* Safe area for bottom nav */}
            <div className="h-20" />
          </div>
        </div>
      )}

      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
      <SignUpModal open={signUpOpen} onClose={() => setSignUpOpen(false)} />
    </>
  );
}

function BottomNav() {
  const { t } = useLang();
  const items = [
    { key: "nav.home", to: "/", icon: Home },
    { key: "nav.search", to: "/explore", icon: Search },
    { key: "nav.saved", to: "/saved", icon: Heart },
    { key: "nav.add", to: "/create-listing", icon: PlusSquare },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/97 px-2 py-2 backdrop-blur-xl md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-5 gap-0.5">
        {items.map(({ key, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold text-navy transition-colors hover:bg-secondary [&.active]:text-aqua"
            activeOptions={{ exact: to === "/" }}
            aria-label={t(key)}
          >
            <Icon className="h-5 w-5" />
            <span className="leading-none">{t(key)}</span>
          </Link>
        ))}
        {/* Language button — bottom nav */}
        <LanguageDropdown variant="bottom" />
      </div>
    </nav>
  );
}

const WA_NUMBER = "201025812666";

function WhatsAppFAB() {
  return (
    <a
      href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("مرحباً، أود الاستفسار عن إحدى العقارات في منصة أصولك.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-20 end-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 md:bottom-6"
      style={{ background: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C8.28 2 2 8.28 2 16c0 2.47.67 4.79 1.84 6.78L2 30l7.45-1.81A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.27 19.27c-.3.84-1.76 1.6-2.44 1.7-.64.09-1.44.13-2.33-.15-.54-.17-1.22-.39-2.1-.77-3.7-1.59-6.1-5.32-6.29-5.57-.18-.24-1.5-2-.1-4.1 .27-.42.62-.63.87-.65.22-.02.44 0 .63 0 .2 0 .48-.07.74.57.28.67.93 2.28 1.01 2.45.08.17.13.37.03.6-.1.22-.15.36-.3.55-.15.2-.32.44-.45.59-.15.17-.3.36-.13.7.17.34.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.4 1.45.33.15.53.12.72-.07.2-.2.85-.99 1.07-1.33.22-.34.44-.28.74-.17.3.11 1.9.9 2.23 1.06.33.16.55.24.63.38.08.14.08.8-.22 1.63z"/>
      </svg>
    </a>
  );
}

function GA4Injector() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    getSiteSettings().then(settings => {
      const analytics = (settings as any)?.analytics;
      const theme = (settings as any)?.theme;

      if (analytics?.enabled && analytics?.gaTrackingId) {
        const id = analytics.gaTrackingId.trim();
        if (id && !document.getElementById("ga4-script")) {
          const script1 = document.createElement("script");
          script1.id = "ga4-script";
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
          document.head.appendChild(script1);

          const script2 = document.createElement("script");
          script2.id = "ga4-init";
          script2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`;
          document.head.appendChild(script2);
        }
      }

      if (theme) {
        applyThemeToDOM(theme);
      }
    }).catch((err) => { console.error("[site-settings/GA4] API request failed:", err); });
    injected.current = true;
  }, []);
  return null;
}

function RootComponent() {
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => { console.error("[sw] Registration failed:", err); });
    }

  }, []);

  return (
    <LangProvider>
      <GA4Injector />
      <Header />
      <Outlet />
      <WhatsAppFAB />
      <BottomNav />
      {resetModalOpen && (
        <SignUpModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          initialMode="reset"
        />
      )}
    </LangProvider>
  );
}
