import { Link } from "@tanstack/react-router";
import { Home, Search, Heart, PlusSquare, Film } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Search", icon: Search },
  { to: "/create-listing", label: "Add", icon: PlusSquare },
  { to: "/reels", label: "Reels", icon: Film },
  { to: "/auth", label: "Saved", icon: Heart },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
      <div className="mx-3 mb-3 rounded-2xl glass shadow-elegant">
        <ul className="grid grid-cols-5">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "text-[color:var(--gold)]" }}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-foreground/75 hover:text-foreground transition"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
