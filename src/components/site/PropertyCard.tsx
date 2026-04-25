import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize2, MapPin, Heart } from "lucide-react";
import type { Property } from "@/lib/demo-data";
import { formatPrice } from "@/lib/demo-data";

export function PropertyCard({ p, index = 0 }: { p: Property; index?: number }) {
  return (
    <Link
      to="/explore"
      className="group block rounded-md overflow-hidden bg-card border border-border shadow-card hover:shadow-elegant transition-all duration-500 animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={p.cover}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest rounded-sm bg-ink/85 text-ivory backdrop-blur">{p.status}</span>
          {p.newLaunch && <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest rounded-sm gradient-gold text-[color:var(--gold-foreground)]">New Launch</span>}
        </div>
        <button aria-label="Save" className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full glass">
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p className="text-ivory font-display text-2xl drop-shadow">{formatPrice(p.price, p.currency)}</p>
          <span className="text-ivory/85 text-[11px] uppercase tracking-widest">{p.type}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg leading-snug text-foreground group-hover:text-foreground/90 line-clamp-1">{p.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {p.compound ? `${p.compound}, ` : ""}{p.city}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          {p.beds !== undefined && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.beds}</span>}
          {p.baths !== undefined && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.baths}</span>}
          <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{p.area} m²</span>
        </div>
      </div>
    </Link>
  );
}
