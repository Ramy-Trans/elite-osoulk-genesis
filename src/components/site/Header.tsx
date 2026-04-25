import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Phone, UserCircle2 } from "lucide-react";
import logo from "@/assets/osoulk-logo.webp";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/reels", label: "Reels" },
  { to: "/sell", label: "Sell" },
  { to: "/agencies", label: "Agencies" },
  { to: "/about", label: "About" },
  { to: "/articles", label: "Articles" },
  { to: "/packages", label: "Packages" },
  { to: "/ar", label: "AR" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { location } = useRouterState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass shadow-card" : "bg-transparent"
      }`}
    >
      {/* Marketing strip */}
      <div className="hidden md:block bg-ink text-ivory text-xs">
        <div className="container-luxe flex items-center justify-between py-2">
          <span className="opacity-80">Limited time offer — Start now and unlock the best results for your property.</span>
          <Link to="/packages" className="text-[color:var(--gold)] font-medium tracking-wide uppercase">
            Subscribe Now →
          </Link>
        </div>
      </div>

      <div className="container-luxe flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="OSOULK" className="h-9 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV.slice(0, 8).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="luxe-link text-sm font-medium tracking-wide text-foreground/85 hover:text-foreground"
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href="tel:+201031064445" className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground">
            <span className="h-9 w-9 rounded-full grid place-items-center border border-border">
              <Phone className="h-4 w-4" />
            </span>
            <span className="font-medium">+20 10 (310) 64445</span>
          </a>
          <Link to="/auth" aria-label="Account" className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-secondary transition">
            <UserCircle2 className="h-5 w-5" />
          </Link>
          <Link
            to="/create-listing"
            className="px-5 py-2.5 rounded-sm gradient-ink text-ivory text-sm font-medium tracking-wide hover:opacity-90 transition shadow-card"
          >
            Create a Listing
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="lg:hidden h-10 w-10 grid place-items-center rounded-full glass"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-[fade-in_0.25s_ease-out]">
          <div className="container-luxe py-6 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-2 py-3 rounded-sm text-base font-medium hover:bg-secondary"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/auth" className="py-3 rounded-sm border border-border text-center text-sm">Sign in</Link>
              <Link to="/create-listing" className="py-3 rounded-sm gradient-ink text-ivory text-center text-sm">List a Property</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
