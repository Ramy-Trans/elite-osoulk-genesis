import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Phone, Apple, Smartphone } from "lucide-react";
import logo from "@/assets/osoulk-logo.webp";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container-luxe py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <img src={logo} alt="OSOULK" className="h-10 w-auto" />
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Africa's largest prop-tech company. Verified listings, expert insights, and a refined property experience for buyers, sellers, and investors.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href="#" aria-label="Phone" className="h-9 w-9 grid place-items-center rounded-full bg-ink text-ivory hover:bg-ink/85 transition"><Phone className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="h-9 w-9 grid place-items-center rounded-full bg-ink text-ivory hover:bg-ink/85 transition"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="h-9 w-9 grid place-items-center rounded-full bg-ink text-ivory hover:bg-ink/85 transition"><Instagram className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-4">Compounds</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/explore" className="hover:text-foreground">IL Monte Galala</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Ras El Hekma</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Solana East</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">97 Hills</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-4">Areas</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/explore" className="hover:text-foreground">6th of October</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">New Cairo</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">New Capital</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">North Coast</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Madinaty</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-4">Property Types</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/explore" className="hover:text-foreground">Apartments</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Villas</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Offices</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Commercial</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Residential</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-display text-lg mb-4">Download</h4>
          <p className="text-sm text-muted-foreground mb-3">Get the OSOULK app</p>
          <div className="flex flex-col gap-2">
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border bg-card text-xs hover:shadow-card transition"><Apple className="h-4 w-4" /> App Store</a>
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border bg-card text-xs hover:shadow-card transition"><Smartphone className="h-4 w-4" /> Google Play</a>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-luxe py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>©{new Date().getFullYear()} OSOULK — All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
            <Link to="/explore" className="hover:text-foreground">Explore</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/agencies" className="hover:text-foreground">Agencies</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/articles" className="hover:text-foreground">Blog</Link>
            <Link to="/faqs" className="hover:text-foreground">FAQs</Link>
            <Link to="/sell" className="hover:text-foreground">How it Works</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
