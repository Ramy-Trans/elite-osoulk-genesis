import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BottomNav } from "@/components/site/BottomNav";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="font-display text-7xl text-foreground">404</p>
        <div className="gold-divider mx-auto my-5" />
        <h2 className="font-display text-2xl">Page not found</h2>
        <p className="mt-3 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex px-6 py-2.5 rounded-sm gradient-ink text-ivory text-sm">Return Home</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OSOULK — Luxury Real Estate in Egypt" },
      { name: "description", content: "OSOULK is Africa's largest prop-tech platform. Discover, list, and invest in premium properties across New Cairo, North Coast, New Capital and Egypt's top compounds." },
      { name: "author", content: "OSOULK" },
      { name: "theme-color", content: "#13193a" },
      { property: "og:title", content: "OSOULK — Luxury Real Estate in Egypt" },
      { property: "og:description", content: "OSOULK is Africa's largest prop-tech platform. Discover, list, and invest in premium properties across New Cairo, North Coast, New Capital and Egypt's top compounds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@OSOULK" },
      { name: "twitter:title", content: "OSOULK — Luxury Real Estate in Egypt" },
      { name: "twitter:description", content: "OSOULK is Africa's largest prop-tech platform. Discover, list, and invest in premium properties across New Cairo, North Coast, New Capital and Egypt's top compounds." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/S7Aomqc9czcLLOaF7vCccLHXeUE3/social-images/social-1777147635537-download.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/S7Aomqc9czcLLOaF7vCccLHXeUE3/social-images/social-1777147635537-download.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[88px] lg:pt-[112px]">
        <Outlet />
      </main>
      <Footer />
      <div className="h-20 lg:hidden" />
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
