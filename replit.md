# Osoulk — Egypt Premium Real Estate Platform

## Overview
A production-grade real estate brokerage SaaS platform targeting the Egyptian market. Built with TanStack Start + React 19 + Tailwind CSS 4 + Express backend.

## Architecture
- **Frontend**: TanStack Start (SSR disabled), React 19, Tailwind CSS 4, port 5000
- **Backend**: Express on port 3001 (`server/index.js`) — fully async/await
- **Data (dual-mode)**: When `DB_HOST` env var is set → MySQL (Hostinger). Otherwise → JSON files in `server/data/` (Replit/local dev, zero config needed)
- **Auth**:
  - Admin panel: password-based key auth (`X-Admin-Key` header); default password `osoulk2026` (set via `ADMIN_PASSWORD` env var)
  - User dashboard: `X-User-Id` header set after `/api/login`; users have role `individual | broker | developer | admin | data-entry`

## MySQL Migration (Hostinger)
Key files:
| File | Purpose |
|---|---|
| `server/config/db.js` | MySQL connection pool (mysql2/promise) |
| `server/database/adapter.js` | Dual-mode adapter — MySQL when `DB_HOST` is set, JSON files otherwise |
| `server/database/schema.sql` | Full MySQL schema (run once on Hostinger) |
| `server/database/migrate.js` | One-time JSON → MySQL data import script |
| `.env.example` | Copy to `.env` on Hostinger and fill in DB credentials |

Hostinger deployment steps:
1. Copy `.env.example` → `.env`, set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
2. Run schema: `mysql -u user -p osoulk_db < server/database/schema.sql`
3. Import data: `node server/database/migrate.js`
4. Start app: `node server/index.js`

MySQL schema design: array collections use `(id VARCHAR(36) PK, data JSON, created_at)` per table; key-value/object stores all share a single `kv_store (name VARCHAR(100) PK, data JSON)` table; property views use optimized `property_views (property_id PK, view_count INT)` with atomic increments.

## Workflows
| Workflow | Command | Port |
|---|---|---|
| Start application | `npm run dev` | 5000 |
| API Server | `npm run server` | 3001 |

## Deployment
- **Target**: Autoscale (single Node process serves both frontend and API)
- **Build**: `npm run build` → outputs to `dist/client/` (static assets) and `dist/server/` (TanStack Start fetch handler)
- **Run**: `node server/index.js` — Express listens on `process.env.PORT`, serves `/api/*` routes, then bridges all other requests through the TanStack Start fetch handler from `dist/server/index.js`
- In dev, the API server stays on port 3001 and Vite proxies `/api/*` to it; in prod, everything is on a single port

## Properties
9 real properties (no demo data). All data in `src/components/osoulk/site.tsx → properties[]`.
Images served as static assets from `public/properties/{id}/01.webp` etc.
Contact phone everywhere: **+201025812666**

Property IDs: `ahel-masr-walkway`, `green5-north`, `nakheel-compound`, `lamirada-duplex`, `l010-142`, `l010-b14`, `standalone-villa`, `tayba-garden`, `beit-alwatan-6oct`

## Key Files
| File | Purpose |
|---|---|
| `src/routes/__root.tsx` | Root layout — sticky navbar, mobile bottom sheet (slides from bottom), bottom nav, phone in LTR span |
| `src/routes/admin.tsx` | Full Admin Panel: login gate, sidebar layout, Dashboard, **Site Settings**, **Content Sections**, CRM (with role filter + role editor), Reel Approvals, SEO, Server Status |
| `src/routes/dashboard.tsx` | Role-aware user dashboard (login + Individual / Broker / Developer panels with CRUD on saved properties, inquiries, listings, projects) |
| `src/routes/properties.$id.tsx` | Property detail: multi-image gallery + lightbox, view counter, WhatsApp button, **Marketing Kit button** |
| `src/routes/marketing-kit.$id.tsx` | **Marketing Kit page** — QR code (qrserver.com API), copy link, Arabic/English social post caption copy, WhatsApp/Facebook/Instagram share buttons |
| `src/routes/agencies.tsx` | Agency directory — links to individual agency profile pages |
| `src/routes/agencies.$id.tsx` | **Agency profile page** — hero with logo, about, specialties, related properties, WhatsApp/phone contact |
| `src/routes/packages.tsx` | **Role-based pricing** — tab switcher (Owner/Broker/Developer) with spec pricing: 350 EGP, 1,500/mo, 10,000/mo |
| `src/routes/index.tsx` | Homepage — includes Marketing Kit feature section, "Add Property" CTA with pricing, realistic TrustSection stats |
| `src/components/osoulk/site.tsx` | Properties data, agency data (with id/slug/phone/about/specialties fields), components |
| `src/lib/api.ts` | Frontend API client — admin auth, user CRUD, reel requests, SEO, property views, server health |
| `src/lib/language.tsx` | Language provider (AR/EN toggle with RTL support) |
| `src/lib/i18n.ts` | Translation dictionaries (AR + EN) |
| `server/index.js` | Express API — admin auth middleware, user management, reel approvals, SEO, view tracking, health/logs |

## Agency Slugs (for `/agencies/$id` profile URLs)
| Slug | Name |
|---|---|
| `ras-el-hekma` | Ras El Hekma Coastal Resort |
| `97-hills` | 97 Hills Developments |
| `blanca-gardens` | Blanca Gardens Collection |
| `solana-east` | Solana East Living |

## Route Pattern Note
`agencies.$id.tsx` is a TanStack Router child of `agencies.tsx`. The parent detects the child route via `useRouterState().location.pathname` and renders `<Outlet />` instead of its own content when on `/agencies/:id`.

## CRM Lead Pipeline (Broker/Developer Dashboard)
- **7-stage pipeline**: new → contacted → interested → viewing → negotiation → closed → sold
- **Lead notes**: add timestamped notes per lead, inline within the lead card
- **Follow-up scheduling**: set a date per lead; overdue leads are highlighted in red
- **Lead source tracking**: website, WhatsApp, Facebook, Google, referral, ad, phone
- **CSV export**: brokers/developers can download all leads as a spreadsheet
- **Pipeline filter bar**: filter leads by CRM status with live counts

## Property Comparison (`/compare`)
- Compare up to 3 properties side-by-side (price, type, status, beds, baths, size, features, tags)
- Add via "Compare Property" toggle button on every property detail page — turns navy when active
- Arrow button on the sidebar instantly navigates to the compare page once at least 1 property is in the list
- "Recently Viewed — Add to Comparison" section shows a quick-add strip at the bottom of the compare page

## Recently Viewed Properties
- Every property detail page visit automatically saves to `localStorage` (`osoulk_recently_viewed`)
- Individual dashboard shows "Recently Viewed" widget with thumbnail grid + direct link to `/compare`

## Rate Limiting (API)
- In-memory rate limiter on all `/api/*` endpoints: 300 req / 15 min per IP
- Tighter limit on auth endpoints (register, login, admin/login): 15 req / 15 min
- Returns `429 Too many requests` with a clear message

## Subscription Plan Enforcement
- Listing creation now checks the user's plan before allowing a new listing
- Limits: free=1, basic=3, standard=5, broker=10, elite=20; developer/admin=unlimited
- Returns `403 limitReached` with a clear upgrade message shown in the UI

## Admin Panel Features
- **Login gate** — password protected (`osoulk2026` default)
- **Sidebar layout** with active nav indicators and pending badge
- **Dashboard** — 8-stat overview grid
- **CRM** — Users table with search, plan/role filter, pagination; upgrade/downgrade plan + plan expiry date + free package flag; data-entry role support; activate/deactivate, delete
- **Projects (Compounds)** — Full CRUD for public projects/compounds: name (AR+EN), developer, hero image, gallery, description, location, price range, delivery date, units, amenities, publish/draft status, featured flag
- **Pages (CMS)** — Full CRUD for custom static pages: bilingual content (AR+EN), hero, SEO fields, publish/draft; renders at `/pages/:slug`
- **Theme Management** — Live color pickers for primary, secondary, CTA, navbar, footer, card colors + Google Analytics 4 integration (tracking ID + enable toggle)
- **Custom HTML Snippets** — Inject arbitrary HTML/JS at head, body-start, body-end, after-nav, or before-footer; per-snippet enable/disable toggle
- **Reel Approvals** — approve/reject/delete reel requests with status filter
- **SEO Management** — per-page meta title, description, keywords editor (stored in DB)
- **Server Status** — health metrics, memory, uptime, system info, application logs viewer
- **Subscribers** — newsletter subscriber management

## Backend API Endpoints
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/health` | GET | public | Server health metrics |
| `/api/admin/login` | POST | public | Admin auth |
| `/api/stats` | GET | public | Platform statistics |
| `/api/subscribe` | POST | public | Newsletter subscribe |
| `/api/subscribers` | GET | admin | List subscribers |
| `/api/register` | POST | public | User registration |
| `/api/login` | POST | public | User login |
| `/api/users` | GET | admin | List all users |
| `/api/users/:id` | PATCH | admin | Update user plan/status |
| `/api/users/:id` | DELETE | admin | Delete user |
| `/api/reel-request` | POST | public | Submit reel request |
| `/api/reel-requests` | GET | admin | List reel requests |
| `/api/reel-requests/:id` | PATCH | admin | Approve/reject reel |
| `/api/reel-requests/:id` | DELETE | admin | Delete reel request |
| `/api/seo` | GET | public | All SEO data |
| `/api/seo/:page` | PUT | admin | Update page SEO |
| `/api/properties/:id/view` | POST | public | Increment view counter |
| `/api/properties/:id/views` | GET | public | Get view count |
| `/api/server/logs` | GET | admin | Application logs |
| `/api/listings` | GET | public | All approved user-uploaded listings |
| `/api/listings/all` | GET | admin | All user listings (any status) |
| `/api/listings/:id` | GET | public | Single user-uploaded listing |
| `/api/user/listings` | GET | user | Current user's own listings |
| `/api/user/listings` | POST | user | Create new listing (pending review) |
| `/api/user/listings/:id` | DELETE | user | Delete own listing |
| `/api/user/listings/:id/approve` | PATCH | admin | Approve listing |

## Property Listings
- **Static listings**: 10 real properties defined in `src/components/osoulk/site.tsx → properties[]`. Images at `public/properties/{id}/01.webp` etc.
- **User-uploaded listings**: Stored in `server/data/user-listings.json` with `approvalStatus` field. Only `approved` ones show publicly. Admins can approve/reject from the dashboard.
- Both listing types are merged and displayed in the `/explore` page and have dedicated `/properties/:id` detail pages.
- Detail pages include: multi-image gallery with lightbox + keyboard navigation, view counter, WhatsApp CTA, inquiry form, og:image + JSON-LD SEO.

## Search & Filtering
- Homepage hero SearchPanel: keyword, location, type inputs + buy/rent/invest mode tabs → navigates to `/explore?q=...&status=...&type=...&location=...`
- Explore page reads URL params on load, pre-applies filters. Merges static + user listings sorted by price.

## Design Tokens
Navy, Aqua, Gold, Porcelain. CSS classes: `os-container`, `premium-card`, `section-kicker`, `property-card`, `nav-link`, `glass-panel`, `hero-field`, `shadow-float`, `shadow-premium`.

## API Proxy
The Vite dev server proxies all `/api` requests to `http://localhost:3001`. The `src/lib/api.ts` `BASE` is `""` (empty string), so all API calls use relative paths that are proxied automatically. This avoids browser CORS issues in the Replit environment.

## GitHub Remote
`https://github.com/Ramy-Trans/elite-osoulk-genesis`
