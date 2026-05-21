// ─── Express API client ────────────────────────────────────────────────────────
// In dev:  VITE_API_BASE is empty → calls /api/* → proxied by Vite to port 3001
// On Hostinger: set VITE_API_BASE=https://your-repl.replit.app at build time
//   → all calls become https://your-repl.replit.app/api/*
// Admin auth: X-Admin-Key header. User auth: X-User-Id header.
const API_BASE: string =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE) || "";

const ADMIN_SESSION_KEY = "osoulk_admin_session";
const USER_OBJ_KEY      = "osoulk_user_obj";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function adminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = getAdminKey();
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (key) h["X-Admin-Key"] = key;
  return h;
}

function userHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const id = getUserId();
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (id) h["X-User-Id"] = id;
  return h;
}

async function apiFetch<T>(
  method: string, path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method,
    headers: headers ?? { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as Record<string,string>).message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Allow 4xx/5xx — parse body regardless (e.g. health returns 503 in JSON-file mode)
async function apiFetchRaw<T>(method: string, path: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(API_BASE + path, { method, headers });
  return res.json() as Promise<T>;
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────
export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_SESSION_KEY);
}
export function setAdminKey(token: string) {
  localStorage.setItem(ADMIN_SESSION_KEY, token);
}
export function clearAdminKey() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function adminLogin(password: string): Promise<{ token: string }> {
  const data = await apiFetch<{ token: string; ok: boolean }>(
    "POST", "/api/admin/login", { password },
  );
  if (!data.token) throw new Error("Invalid admin password");
  return { token: data.token };
}

// ─── User session ─────────────────────────────────────────────────────────────
export type Role = "individual" | "broker" | "developer" | "admin" | "data-entry";
export type CurrentUser = {
  id: string; fullName: string; email: string; phone: string;
  plan: string; role: Role; company?: string; status: string; createdAt: string;
};

export function getUserId(): string | null {
  const u = getCachedUser();
  return u?.id ?? null;
}
export function setUserSession(user: CurrentUser) {
  localStorage.setItem(USER_OBJ_KEY, JSON.stringify(user));
}
export function clearUserSession() {
  localStorage.removeItem(USER_OBJ_KEY);
}
export function getCachedUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_OBJ_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as CurrentUser; } catch { return null; }
}

function rowToUser(r: Record<string, unknown>): CurrentUser {
  return {
    id:        String(r.id ?? ""),
    fullName:  String(r.fullName ?? ""),
    email:     String(r.email ?? ""),
    phone:     String(r.phone ?? ""),
    plan:      String(r.plan ?? "free"),
    role:      (r.role as Role) ?? "individual",
    company:   String(r.company ?? ""),
    status:    String(r.status ?? "active"),
    createdAt: String(r.createdAt ?? ""),
  };
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
export async function subscribeEmail(email: string, name?: string) {
  return apiFetch<{ message: string }>("POST", "/api/subscribe", { email, name: name ?? "" });
}

export async function getSubscribers() {
  return apiFetch<{ id: string; email: string; name: string; createdAt: string }[]>(
    "GET", "/api/subscribers", undefined, adminHeaders(),
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getStats() {
  return apiFetch<{
    subscribers: number; users: number; listings: number; reels: number;
    agencies: number; pendingApprovals: number; approvedReels: number;
    totalViews: number; newUsers: number; pendingListings: number;
    articles: number; projects: number;
  }>("GET", "/api/stats");
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export async function googleLogin(credential: string) {
  const data = await apiFetch<{ user: Record<string,unknown>; message: string }>(
    "POST", "/api/auth/google", { credential },
  );
  return { message: data.message, user: rowToUser(data.user) };
}

// ─── Users (admin) ────────────────────────────────────────────────────────────
export type AdminUser = {
  id: string; fullName: string; email: string; phone: string;
  plan: string; role: string; status: string; createdAt: string;
  company?: string; freePackage?: boolean; planExpiresAt?: string;
};

function rowToAdminUser(r: Record<string, unknown>): AdminUser {
  return {
    id:            String(r.id ?? ""),
    fullName:      String(r.fullName ?? ""),
    email:         String(r.email ?? ""),
    phone:         String(r.phone ?? ""),
    plan:          String(r.plan ?? "free"),
    role:          String(r.role ?? "individual"),
    status:        String(r.status ?? "active"),
    createdAt:     String(r.createdAt ?? ""),
    company:       r.company as string,
    freePackage:   r.isFree as boolean,
    planExpiresAt: r.planExpiry as string,
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  const data = await apiFetch<Record<string, unknown>[]>(
    "GET", "/api/users", undefined, adminHeaders(),
  );
  return data.map(rowToAdminUser);
}

export async function updateUser(id: string, data: Partial<{
  plan: string; status: string; fullName: string; phone: string;
  role: string; freePackage: boolean; planExpiresAt: string;
}>) {
  const body: Record<string, unknown> = {};
  if (data.plan          !== undefined) body.plan      = data.plan;
  if (data.status        !== undefined) body.status    = data.status;
  if (data.fullName      !== undefined) body.fullName  = data.fullName;
  if (data.phone         !== undefined) body.phone     = data.phone;
  if (data.role          !== undefined) body.role      = data.role;
  if (data.freePackage   !== undefined) body.isFree    = data.freePackage;
  if (data.planExpiresAt !== undefined) body.planExpiry = data.planExpiresAt;
  return apiFetch<Record<string,unknown>>("PATCH", `/api/users/${id}`, body, adminHeaders());
}

export async function deleteUser(id: string) {
  return apiFetch<{ message: string }>("DELETE", `/api/users/${id}`, undefined, adminHeaders());
}

export async function adminCreateUser(data: {
  fullName: string; email: string; phone?: string;
  role?: string; plan?: string; company?: string; password?: string;
}): Promise<{ user: AdminUser; tempPassword: string; message: string }> {
  const res = await apiFetch<{ user: Record<string,unknown>; tempPassword: string; message: string }>(
    "POST", "/api/admin/create-user", data, adminHeaders(),
  );
  return { ...res, user: rowToAdminUser(res.user) };
}

export async function adminResetPassword(id: string, password?: string): Promise<{ newPassword: string }> {
  const res = await apiFetch<{ newPassword: string }>(
    "PATCH", `/api/users/${id}/reset-password`,
    { password }, adminHeaders(),
  );
  return res;
}

// ─── User login/register ──────────────────────────────────────────────────────
export async function registerUser(data: { fullName: string; email: string; phone?: string; password: string }) {
  const res = await apiFetch<{ message: string; user: Record<string,unknown> }>(
    "POST", "/api/register", data,
  );
  return { message: res.message, user: rowToUser(res.user) };
}

export async function userLogin(email: string, password: string) {
  const res = await apiFetch<{ message: string; user: Record<string,unknown>; token: string }>(
    "POST", "/api/login", { email, password },
  );
  return { message: res.message, user: rowToUser(res.user), token: res.token };
}

export async function forgotPassword(email: string): Promise<{ message: string; token: string }> {
  return apiFetch<{ message: string; token: string }>("POST", "/api/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("POST", "/api/reset-password", { token, newPassword });
}

export async function getMe(): Promise<CurrentUser> {
  const res = await apiFetch<Record<string,unknown>>("GET", "/api/me", undefined, userHeaders());
  return rowToUser(res);
}

export async function updateMe(data: Partial<{ fullName: string; phone: string; company: string }>) {
  const res = await apiFetch<Record<string,unknown>>("PATCH", "/api/me", data, userHeaders());
  return rowToUser(res);
}

// ─── Reel Requests ────────────────────────────────────────────────────────────
export type ReelRequest = {
  id: string; name: string; email: string; reason?: string;
  status: "pending" | "approved" | "rejected"; createdAt: string; updatedAt?: string;
};

function rowToReel(r: Record<string, unknown>): ReelRequest {
  return {
    id: String(r.id ?? ""), name: String(r.name ?? ""), email: String(r.email ?? ""),
    reason: r.reason as string ?? "",
    status: (r.status as ReelRequest["status"]) ?? "pending",
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: (r.updatedAt ?? r.updated_at) as string,
  };
}

export async function getReelRequests(): Promise<ReelRequest[]> {
  const data = await apiFetch<Record<string,unknown>[]>(
    "GET", "/api/reel-requests", undefined, adminHeaders(),
  );
  return data.map(rowToReel);
}

export async function updateReelRequest(id: string, status: "approved" | "rejected" | "pending") {
  const data = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/reel-requests/${id}`, { status }, adminHeaders(),
  );
  return rowToReel(data);
}

export async function deleteReelRequest(id: string) {
  return apiFetch<{ message: string }>("DELETE", `/api/reel-requests/${id}`, undefined, adminHeaders());
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
export type SeoPage = { title: string; description: string; keywords: string; updatedAt?: string };
export type SeoData = Record<string, SeoPage>;

export async function getSeoData(): Promise<SeoData> {
  return apiFetch<SeoData>("GET", "/api/seo");
}

export async function updateSeoPage(page: string, data: SeoPage) {
  return apiFetch<SeoPage>("PUT", `/api/seo/${page}`, data, adminHeaders());
}

export async function addSeoPage(page: string): Promise<void> {
  await apiFetch("PUT", `/api/seo/${page}`, { title: "", description: "", keywords: "" }, adminHeaders());
}

export async function deleteSeoPage(page: string): Promise<void> {
  await apiFetch("DELETE", `/api/seo/${page}`, undefined, adminHeaders());
}

// ─── Property Views ───────────────────────────────────────────────────────────
export async function trackPropertyView(id: string) {
  try {
    return await apiFetch<{ views: number }>("POST", `/api/properties/${id}/view`);
  } catch { return { views: 0 }; }
}

export async function getPropertyViews(id: string): Promise<number> {
  try {
    const data = await apiFetch<{ views: number }>("GET", `/api/properties/${id}/views`);
    return data.views ?? 0;
  } catch { return 0; }
}

// ─── Site Settings ────────────────────────────────────────────────────────────
export type SiteLogoSettings = {
  url: string; title: string; titleAr: string;
  altText: string; altTextAr: string;
  caption: string; captionAr: string; description: string;
};
export type HeroSlide = {
  title: string; titleAr: string; subtitle: string; subtitleAr: string;
  ctaText: string; ctaTextAr: string; ctaLink: string;
  image: string; imageMobile: string;
  enabled: boolean; scheduledFrom?: string; scheduledTo?: string;
};
export type SiteSettings = {
  brandName: string; tagline: string; contactPhone: string; contactEmail: string;
  whatsappNumber: string; address: string;
  logo?: SiteLogoSettings;
  heroSlides?: HeroSlide[];
  socials: { facebook: string; instagram: string; youtube: string; linkedin: string; tiktok: string };
  hero: { kicker: string; title: string; subtitle: string; kickerAr?: string; titleAr?: string; subtitleAr?: string };
  promoBar: { enabled: boolean; text: string; textAr?: string };
  features: { googleSignIn: boolean; newsletter: boolean; reels: boolean; brokerSignup: boolean; developerSignup: boolean };
  theme: { accent: string; primaryColor?: string; secondaryColor?: string; ctaColor?: string; navbarBg?: string; navbarText?: string; footerBg?: string; footerText?: string; cardBg?: string; inputBg?: string };
  analytics?: { gaTrackingId: string; enabled: boolean };
  updatedAt?: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Osoulk", tagline: "المنصة العقارية الفاخرة في مصر",
  contactPhone: "+201025812666", contactEmail: "", whatsappNumber: "+201025812666", address: "",
  socials: { facebook: "", instagram: "", youtube: "", linkedin: "", tiktok: "" },
  hero: { kicker: "", title: "", subtitle: "", kickerAr: "البحث الذكي", titleAr: "اعثر على عقار أحلامك في مصر", subtitleAr: "تجربة عقارية فاخرة" },
  promoBar: { enabled: true, text: "", textAr: "عرض محدود — ابدأ الآن وحقق نتائج عقارية أفضل." },
  features: { googleSignIn: true, newsletter: true, reels: true, brokerSignup: true, developerSignup: true },
  theme: { accent: "#C9A84C" },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const data = await apiFetch<SiteSettings>("GET", "/api/site-settings");
    return { ...DEFAULT_SETTINGS, ...data };
  } catch { return DEFAULT_SETTINGS; }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  const current = await getSiteSettings();
  const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
  return apiFetch<SiteSettings>("PUT", "/api/site-settings", merged, adminHeaders());
}

export function applyThemeToDOM(theme: Record<string, string>): void {
  if (typeof window === "undefined" || !theme) return;
  const rootVars: string[] = [];
  const extraRules: string[] = [];
  if (theme.primaryColor)   { rootVars.push(`--navy:${theme.primaryColor}`); rootVars.push(`--primary:${theme.primaryColor}`); }
  if (theme.secondaryColor) rootVars.push(`--aqua:${theme.secondaryColor}`);
  if (theme.ctaColor)       { rootVars.push(`--gold:${theme.ctaColor}`); rootVars.push(`--accent:${theme.ctaColor}`); }
  if (theme.cardBg)         rootVars.push(`--card:${theme.cardBg}`);
  if (theme.inputBg)        rootVars.push(`--input:${theme.inputBg}`);
  if (theme.navbarBg)       extraRules.push(`header{background-color:${theme.navbarBg}!important}`);
  if (theme.navbarText)     extraRules.push(`header .nav-link,header a{color:${theme.navbarText}!important}`);
  if (theme.footerBg)       extraRules.push(`footer{background-color:${theme.footerBg}!important}`);
  if (theme.footerText)     extraRules.push(`footer *{color:${theme.footerText}!important}`);
  const css = [rootVars.length ? `:root{${rootVars.join(";")}}` : "", ...extraRules].filter(Boolean).join("\n");
  if (!css) return;
  let el = document.getElementById("osoulk-theme") as HTMLStyleElement | null;
  if (!el) { el = document.createElement("style"); el.id = "osoulk-theme"; document.head.appendChild(el); }
  el.innerHTML = css;
}

// ─── Content Sections ─────────────────────────────────────────────────────────
export type ContentSection = {
  id: string; label: string; visible: boolean; order: number;
  title?: string; titleAr?: string; subtitle?: string; subtitleAr?: string;
  body?: string; bodyAr?: string; ctaText?: string; ctaTextAr?: string; image?: string;
  seoTitle?: string; seoTitleAr?: string; seoDescription?: string; seoDescriptionAr?: string;
  seoKeywords?: string[]; seoKeywordsAr?: string[]; canonicalUrl?: string; ogImage?: string;
};

function rowToSection(r: Record<string, unknown>): ContentSection {
  return {
    id: String(r.id ?? ""), label: String(r.label ?? ""),
    visible: r.visible as boolean ?? true,
    order: r.order as number ?? r.sort_order as number ?? 0,
    title: r.title as string, titleAr: r.titleAr as string,
    subtitle: r.subtitle as string, subtitleAr: r.subtitleAr as string,
    body: r.body as string, bodyAr: r.bodyAr as string,
    ctaText: r.ctaText as string, ctaTextAr: r.ctaTextAr as string,
    image: r.image as string,
    seoTitle: r.seoTitle as string, seoTitleAr: r.seoTitleAr as string,
    seoDescription: r.seoDescription as string, seoDescriptionAr: r.seoDescriptionAr as string,
    seoKeywords: r.seoKeywords as string[], seoKeywordsAr: r.seoKeywordsAr as string[],
    canonicalUrl: r.canonicalUrl as string, ogImage: r.ogImage as string,
  };
}

export async function getSections(): Promise<ContentSection[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>("GET", "/api/sections");
    return data.map(rowToSection);
  } catch { return []; }
}
export async function getAdminSections(): Promise<ContentSection[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/admin/sections", undefined, adminHeaders(),
    );
    return data.map(rowToSection);
  } catch { return getSections(); }
}

export async function updateSections(sections: ContentSection[]) {
  await apiFetch("PUT", "/api/sections", sections, adminHeaders());
  return sections;
}

export async function updateSectionContent(id: string, data: Partial<ContentSection>): Promise<ContentSection> {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/admin/sections/${id}`, data, adminHeaders(),
  );
  return rowToSection(res);
}

// ─── Inquiries / CRM Leads ────────────────────────────────────────────────────
export type InquiryNote = { id: string; text: string; authorName: string; createdAt: string };
export type Inquiry = {
  id: string; fromUserId: string; fromName: string; fromEmail: string;
  propertyId: string; message: string; toRole: string; status: string;
  crmStatus?: string; followUpDate?: string; source?: string;
  notes?: InquiryNote[];
  createdAt: string; updatedAt?: string;
};
export const CRM_STATUSES = ["new","contacted","interested","viewing","negotiation","closed","sold"] as const;
export type CrmStatus = typeof CRM_STATUSES[number];

function rowToInquiry(r: Record<string, unknown>): Inquiry {
  return {
    id: String(r.id ?? ""),
    fromUserId: String(r.fromUserId ?? ""),
    fromName: String(r.fromName ?? ""),
    fromEmail: String(r.fromEmail ?? ""),
    propertyId: String(r.propertyId ?? ""),
    message: String(r.message ?? ""),
    toRole: String(r.toRole ?? ""),
    status: String(r.status ?? "open"),
    crmStatus: r.crmStatus as string,
    followUpDate: r.followUpDate as string,
    source: r.source as string,
    notes: r.notes as InquiryNote[] ?? [],
    createdAt: String(r.createdAt ?? ""),
    updatedAt: r.updatedAt as string,
  };
}

export async function getMyInquiries(): Promise<Inquiry[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/me/inquiries", undefined, userHeaders(),
    );
    return data.map(rowToInquiry);
  } catch { return []; }
}

export async function postInquiry(data: { propertyId?: string; message: string; toRole?: string }) {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/me/inquiries", data, userHeaders());
  return rowToInquiry(res);
}

export async function updateInquiry(id: string, status: string) {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/me/inquiries/${id}`, { status }, userHeaders(),
  );
  return rowToInquiry(res);
}

export async function updateInquiryFull(id: string, data: {
  status?: string; crmStatus?: string; followUpDate?: string; note?: string; source?: string;
}) {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/me/inquiries/${id}`, data, userHeaders(),
  );
  return rowToInquiry(res);
}

export async function exportLeadsCsv(): Promise<Blob> {
  try {
    const res = await fetch(API_BASE + "/api/me/leads/export", { headers: userHeaders() });
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  } catch {
    const inquiries = await getMyInquiries();
    const header = "id,fromName,fromEmail,propertyId,message,status,crmStatus,source,followUpDate,createdAt";
    const rows = inquiries.map(i =>
      [i.id, i.fromName, i.fromEmail, i.propertyId, `"${i.message}"`, i.status, i.crmStatus ?? "", i.source ?? "", i.followUpDate ?? "", i.createdAt].join(",")
    );
    return new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  }
}

// ─── User Listings ────────────────────────────────────────────────────────────
export type UserListing = {
  id: string; ownerId: string; ownerName: string; ownerRole: string; ownerPhone?: string;
  title: string; titleAr?: string; summary?: string; summaryAr?: string;
  location: string; locationAr?: string; price: string; type: string;
  listingType?: string; description: string; descriptionAr?: string;
  bedrooms?: number; bathrooms?: number; size?: string; floor?: string;
  finishing?: string; furnishing?: string;
  status: string; imageUrl?: string; images?: string[]; tags?: string[];
  whatsappPhone?: string; email?: string;
  governorate?: string; area?: string; address?: string; lat?: number | null; lng?: number | null;
  pricePerMeter?: string; installmentAvailable?: boolean; downPayment?: string; maintenanceFees?: string;
  videoUrl?: string; seoImage?: string; seoImageAr?: string;
  seoTitle?: string; seoTitleAr?: string; seoDescription?: string; seoDescriptionAr?: string;
  seoKeywords?: string; seoKeywordsAr?: string; canonicalUrl?: string; canonicalUrlAr?: string;
  slugAr?: string;
  approvalStatus?: string; featured?: boolean; isPaused?: boolean;
  createdAt: string; updatedAt?: string;
};

function rowToListing(r: Record<string, unknown>): UserListing {
  return {
    id: String(r.id ?? ""),
    ownerId: String(r.ownerId ?? ""),
    ownerName: String(r.ownerName ?? ""),
    ownerRole: String(r.ownerRole ?? ""),
    ownerPhone: r.ownerPhone as string,
    title: String(r.title ?? ""),
    titleAr: r.titleAr as string,
    summary: r.summary as string,
    summaryAr: r.summaryAr as string,
    location: String(r.location ?? ""),
    locationAr: r.locationAr as string,
    price: String(r.price ?? ""),
    type: String(r.type ?? ""),
    listingType: r.listingType as string,
    description: String(r.description ?? ""),
    descriptionAr: r.descriptionAr as string,
    bedrooms: r.bedrooms as number,
    bathrooms: r.bathrooms as number,
    size: r.size as string,
    floor: r.floor as string,
    finishing: r.finishing as string,
    furnishing: r.furnishing as string,
    status: String(r.status ?? "available"),
    imageUrl: r.imageUrl as string,
    images: r.images as string[] ?? [],
    tags: r.tags as string[] ?? [],
    whatsappPhone: r.whatsappPhone as string,
    email: r.email as string,
    governorate: r.governorate as string,
    area: r.area as string,
    address: r.address as string,
    lat: r.lat as number,
    lng: r.lng as number,
    pricePerMeter: r.pricePerMeter as string,
    installmentAvailable: r.installmentAvailable as boolean,
    downPayment: r.downPayment as string,
    maintenanceFees: r.maintenanceFees as string,
    videoUrl: r.videoUrl as string,
    seoImage: r.seoImage as string,
    seoImageAr: r.seoImageAr as string,
    seoTitle: r.seoTitle as string,
    seoTitleAr: r.seoTitleAr as string,
    seoDescription: r.seoDescription as string,
    seoDescriptionAr: r.seoDescriptionAr as string,
    seoKeywords: r.seoKeywords as string,
    seoKeywordsAr: r.seoKeywordsAr as string,
    canonicalUrl: r.canonicalUrl as string,
    canonicalUrlAr: r.canonicalUrlAr as string,
    slugAr: r.slugAr as string,
    approvalStatus: String(r.approvalStatus ?? "pending"),
    featured: r.featured as boolean,
    isPaused: r.isPaused as boolean,
    createdAt: String(r.createdAt ?? ""),
    updatedAt: r.updatedAt as string,
  };
}

export async function getMyListings(): Promise<UserListing[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/me/listings", undefined, userHeaders(),
    );
    return data.map(rowToListing);
  } catch { return []; }
}

export async function createListing(data: Partial<UserListing>) {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/me/listings", data, userHeaders());
  return rowToListing(res);
}

export async function updateListing(id: string, data: Partial<UserListing>) {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/me/listings/${id}`, data, userHeaders(),
  );
  return rowToListing(res);
}

export async function deleteListing(id: string) {
  return apiFetch<{ message: string }>("DELETE", `/api/me/listings/${id}`, undefined, userHeaders());
}

// ─── Admin listing management ─────────────────────────────────────────────────
export async function getAdminListings(): Promise<UserListing[]> {
  const data = await apiFetch<Record<string,unknown>[]>(
    "GET", "/api/listings/all", undefined, adminHeaders(),
  );
  return data.map(rowToListing);
}

export async function createAdminListing(data: Partial<UserListing>): Promise<UserListing> {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/admin/listings", data, adminHeaders());
  return rowToListing(res);
}

export async function updateAdminListing(id: string, data: Partial<UserListing>): Promise<UserListing> {
  const res = await apiFetch<Record<string,unknown>>(
    "PUT", `/api/admin/listings/${id}`, data, adminHeaders(),
  );
  return rowToListing(res);
}

export async function updateAdminListingApproval(id: string, status: string): Promise<UserListing> {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/listings/${id}/approval`, { status }, adminHeaders(),
  );
  return rowToListing(res);
}

export async function deleteAdminListing(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/listings/${id}`, undefined, adminHeaders());
}

export async function getAllListingsAdmin(): Promise<UserListing[]> { return getAdminListings(); }
export async function setListingApproval(id: string, status: "approved" | "rejected" | "pending") { return updateAdminListingApproval(id, status); }
export async function adminDeleteListing(id: string) { return deleteAdminListing(id); }

// ─── Public Listings ──────────────────────────────────────────────────────────
export type PublicListing = UserListing;

export async function getPublicListings(): Promise<PublicListing[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>("GET", "/api/listings");
    return data.map(rowToListing);
  } catch { return []; }
}

export async function getPublicListing(id: string): Promise<PublicListing | null> {
  try {
    const data = await apiFetch<Record<string,unknown>>("GET", `/api/listings/${id}`);
    return rowToListing(data);
  } catch { return null; }
}

// ─── Developer Projects ───────────────────────────────────────────────────────
export type Project = {
  id: string; developerId: string; developerName: string;
  name: string; location: string; units: number; soldUnits: number;
  status: string; deliveryDate: string; createdAt: string;
};

function rowToProject(r: Record<string, unknown>): Project {
  return {
    id: String(r.id ?? ""),
    developerId: String(r.developerId ?? ""),
    developerName: String(r.developerName ?? ""),
    name: String(r.name ?? ""),
    location: String(r.location ?? ""),
    units: r.units as number ?? 0,
    soldUnits: r.soldUnits as number ?? 0,
    status: String(r.status ?? "active"),
    deliveryDate: String(r.deliveryDate ?? ""),
    createdAt: String(r.createdAt ?? ""),
  };
}

export async function getMyProjects(): Promise<Project[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/me/projects", undefined, userHeaders(),
    );
    return data.map(rowToProject);
  } catch { return []; }
}

export async function createProject(data: Partial<Project>) {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/me/projects", data, userHeaders());
  return rowToProject(res);
}

export async function updateProject(id: string, data: Partial<Project>) {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/me/projects/${id}`, data, userHeaders(),
  );
  return rowToProject(res);
}

export async function deleteProject(id: string) {
  return apiFetch<{ message: string }>("DELETE", `/api/me/projects/${id}`, undefined, userHeaders());
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalytics() {
  return apiFetch<{
    userGrowth: { label: string; users: number }[];
    leadsChart: { label: string; leads: number }[];
    topProperties: { id: string; views: number }[];
    planChart: { name: string; value: number }[];
    roleChart: { name: string; value: number }[];
    crmFunnel: { stage: string; count: number }[];
    listingStatus: { pending: number; approved: number; rejected: number };
    totals: { users: number; leads: number; listings: number; totalViews: number };
    savedSearchAnalytics?: {
      total: number; active: number; paused: number; totalAlertsSent: number;
      topSearchCombos: { combo: string; count: number }[];
      alertsChart: { label: string; alerts: number }[];
    };
  }>("GET", "/api/analytics", undefined, adminHeaders());
}

// ─── Saved Searches ───────────────────────────────────────────────────────────
export type SavedSearch = {
  id: string; name: string; filters: Record<string, string>;
  alertFrequency: string; paused: boolean; matchCount?: number;
  createdAt: string; updatedAt?: string;
};

function rowToSearch(r: Record<string, unknown>): SavedSearch {
  return {
    id: String(r.id ?? ""), name: String(r.name ?? ""),
    filters: r.filters as Record<string, string> ?? {},
    alertFrequency: String(r.alertFrequency ?? "instant"),
    paused: r.paused as boolean ?? false,
    matchCount: r.matchCount as number ?? 0,
    createdAt: String(r.createdAt ?? ""),
    updatedAt: r.updatedAt as string,
  };
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/me/saved-searches", undefined, userHeaders(),
    );
    return data.map(rowToSearch);
  } catch { return []; }
}

export async function saveSearch(name: string, filters: Record<string, string>): Promise<SavedSearch> {
  const { alertFrequency, ...rest } = filters;
  const res = await apiFetch<Record<string,unknown>>(
    "POST", "/api/me/saved-searches",
    { name, filters: rest, alertFrequency: alertFrequency ?? "instant" },
    userHeaders(),
  );
  return rowToSearch(res);
}

export async function updateSavedSearch(id: string, data: Partial<SavedSearch>): Promise<SavedSearch> {
  const res = await apiFetch<Record<string,unknown>>(
    "PATCH", `/api/me/saved-searches/${id}`, data, userHeaders(),
  );
  return rowToSearch(res);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/me/saved-searches/${id}`, undefined, userHeaders());
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type ServerNotification = {
  id: string; type: string; title: string; body: string;
  read: boolean; propertyId?: string; searchId?: string;
  createdAt: string; openedAt?: string;
};

export async function getServerNotifications(): Promise<ServerNotification[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/me/notifications", undefined, userHeaders(),
    );
    return data.map(r => ({
      id: String(r.id ?? ""), type: String(r.type ?? ""), title: String(r.title ?? ""),
      body: String(r.body ?? ""), read: r.read as boolean ?? false,
      propertyId: r.propertyId as string, searchId: r.searchId as string,
      createdAt: String(r.createdAt ?? ""), openedAt: r.openedAt as string,
    }));
  } catch { return []; }
}

export async function markServerNotificationRead(notifId: string): Promise<void> {
  await apiFetch("PATCH", `/api/me/notifications/${notifId}/read`, {}, userHeaders());
}

export async function markAllServerNotificationsRead(): Promise<void> {
  await apiFetch("PATCH", "/api/me/notifications/read-all", {}, userHeaders());
}

export async function deleteServerNotification(notifId: string): Promise<void> {
  await apiFetch("DELETE", `/api/me/notifications/${notifId}`, undefined, userHeaders());
}

export type AlertSettings = { emailFrequency: string; inApp: boolean };
export async function getAlertSettings(): Promise<AlertSettings> {
  try {
    return await apiFetch<AlertSettings>("GET", "/api/me/alert-settings", undefined, userHeaders());
  } catch { return { emailFrequency: "instant", inApp: true }; }
}
export async function updateAlertSettings(data: Partial<AlertSettings>): Promise<AlertSettings> {
  try {
    return await apiFetch<AlertSettings>("PUT", "/api/me/alert-settings", data, userHeaders());
  } catch { return { emailFrequency: "instant", inApp: true, ...data }; }
}

// ─── Articles ─────────────────────────────────────────────────────────────────
export type Article = {
  id: string; title: string; titleAr: string; slug: string;
  category: string; categoryAr: string; summary: string; summaryAr: string;
  content: string; contentAr: string; coverImage: string; status: "draft" | "published";
  featured: boolean; tags: string[]; seoTitle: string; seoDescription: string;
  seoKeywords: string[]; seoImage: string; canonicalUrl: string; readingTime: number;
  createdAt: string; updatedAt: string;
};

function rowToArticle(r: Record<string, unknown>): Article {
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    titleAr: String(r.titleAr ?? ""),
    slug: String(r.slug ?? ""),
    category: String(r.category ?? ""),
    categoryAr: String(r.categoryAr ?? ""),
    summary: String(r.summary ?? ""),
    summaryAr: String(r.summaryAr ?? ""),
    content: String(r.content ?? r.bodyCode ?? ""),
    contentAr: String(r.contentAr ?? ""),
    coverImage: String(r.coverImage ?? ""),
    status: (r.status as "draft" | "published") ?? "draft",
    featured: r.featured as boolean ?? false,
    tags: r.tags as string[] ?? [],
    seoTitle: String(r.seoTitle ?? ""),
    seoDescription: String(r.seoDescription ?? ""),
    seoKeywords: r.seoKeywords as string[] ?? [],
    seoImage: String(r.seoImage ?? ""),
    canonicalUrl: String(r.canonicalUrl ?? ""),
    readingTime: r.readingTime as number ?? 3,
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? r.createdAt ?? ""),
  };
}

export async function getArticles(status?: string): Promise<Article[]> {
  try {
    const url = status ? `/api/articles?status=${status}` : "/api/articles";
    const data = await apiFetch<Record<string,unknown>[]>("GET", url);
    return data.map(rowToArticle);
  } catch { return []; }
}

export async function getArticle(id: string): Promise<Article | null> {
  try {
    const data = await apiFetch<Record<string,unknown>>("GET", `/api/articles/${id}`);
    return rowToArticle(data);
  } catch { return null; }
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/articles", data, adminHeaders());
  return rowToArticle(res);
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  const res = await apiFetch<Record<string,unknown>>("PUT", `/api/articles/${id}`, data, adminHeaders());
  return rowToArticle(res);
}

export async function deleteArticle(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/articles/${id}`, undefined, adminHeaders());
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────
export type FAQ = {
  id: string; question: string; questionAr: string; answer: string; answerAr: string;
  category: string; categoryAr: string; order: number;
  seoTitle: string; seoTitleAr?: string; seoDescription: string; seoDescriptionAr?: string;
  seoKeywords: string[]; seoKeywordsAr?: string[]; canonicalUrl?: string; seoImage?: string;
  createdAt: string; updatedAt: string;
};

function rowToFaq(r: Record<string, unknown>): FAQ {
  return {
    id: String(r.id ?? ""),
    question: String(r.question ?? ""), questionAr: String(r.questionAr ?? ""),
    answer: String(r.answer ?? ""), answerAr: String(r.answerAr ?? ""),
    category: String(r.category ?? ""), categoryAr: String(r.categoryAr ?? ""),
    order: r.order as number ?? r.sort_order as number ?? 0,
    seoTitle: String(r.seoTitle ?? ""), seoTitleAr: r.seoTitleAr as string,
    seoDescription: String(r.seoDescription ?? ""), seoDescriptionAr: r.seoDescriptionAr as string,
    seoKeywords: r.seoKeywords as string[] ?? [], seoKeywordsAr: r.seoKeywordsAr as string[],
    canonicalUrl: r.canonicalUrl as string, seoImage: r.seoImage as string,
    createdAt: String(r.createdAt ?? ""), updatedAt: String(r.updatedAt ?? ""),
  };
}

export async function getFaqs(): Promise<FAQ[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>("GET", "/api/faqs");
    return data.map(rowToFaq);
  } catch { return []; }
}

export async function createFaq(data: Partial<FAQ>): Promise<FAQ> {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/faqs", data, adminHeaders());
  return rowToFaq(res);
}

export async function updateFaq(id: string, data: Partial<FAQ>): Promise<FAQ> {
  const res = await apiFetch<Record<string,unknown>>("PUT", `/api/faqs/${id}`, data, adminHeaders());
  return rowToFaq(res);
}

export async function deleteFaq(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/faqs/${id}`, undefined, adminHeaders());
}

// ─── Text Content ─────────────────────────────────────────────────────────────
export async function getTextContent(): Promise<Record<string, Record<string, string>>> {
  try {
    return await apiFetch<Record<string, Record<string, string>>>("GET", "/api/text-content");
  } catch { return {}; }
}

export async function updateTextContent(data: Record<string, Record<string, string>>) {
  return apiFetch<Record<string, Record<string, string>>>(
    "PUT", "/api/text-content", data, adminHeaders(),
  );
}

// ─── Section SEO ──────────────────────────────────────────────────────────────
export type SectionSeoData = {
  title?: string; titleAr?: string; subtitle?: string; subtitleAr?: string;
  body?: string; bodyAr?: string; ctaText?: string; ctaTextAr?: string; image?: string;
  seoTitle?: string; seoTitleAr?: string; seoDescription?: string; seoDescriptionAr?: string;
  seoKeywords?: string[]; seoKeywordsAr?: string[]; canonicalUrl?: string; ogImage?: string;
};

export async function getSectionSeoData(): Promise<Record<string, SectionSeoData>> {
  try {
    return await apiFetch<Record<string, SectionSeoData>>("GET", "/api/section-seo");
  } catch { return {}; }
}

export async function updateSectionSeoData(data: Record<string, SectionSeoData>) {
  return apiFetch<Record<string, SectionSeoData>>(
    "PUT", "/api/section-seo", data, adminHeaders(),
  );
}

// ─── Public Projects / Compounds ─────────────────────────────────────────────
export type PublicProject = {
  id: string; slug: string; name: string; nameAr: string;
  developerName: string; developerNameAr: string;
  logoUrl: string; developerWebsite: string; heroImage: string; gallery: string[];
  description: string; descriptionAr: string; location: string; locationAr: string;
  governorate: string; address: string; lat: number | null; lng: number | null;
  priceFrom: string; priceTo: string; status: string; deliveryDate: string;
  totalUnits: number; availableUnits: number; amenities: string[]; amenitiesAr: string[];
  featured: boolean; publishStatus: string; order: number;
  brokerNotes: string; commissionNotes: string;
  seoTitle: string; seoDescription: string; seoKeywords: string; seoImage: string;
  createdAt: string; updatedAt: string;
};

function rowToPublicProject(r: Record<string, unknown>): PublicProject {
  return {
    id: String(r.id ?? ""),
    slug: String(r.slug ?? ""),
    name: String(r.name ?? ""), nameAr: String(r.nameAr ?? ""),
    developerName: String(r.developerName ?? ""),
    developerNameAr: String(r.developerNameAr ?? ""),
    logoUrl: String(r.logoUrl ?? ""),
    developerWebsite: String(r.developerWebsite ?? ""),
    heroImage: String(r.heroImage ?? ""),
    gallery: r.gallery as string[] ?? [],
    description: String(r.description ?? ""),
    descriptionAr: String(r.descriptionAr ?? ""),
    location: String(r.location ?? ""),
    locationAr: String(r.locationAr ?? ""),
    governorate: String(r.governorate ?? ""),
    address: String(r.address ?? ""),
    lat: r.lat as number | null,
    lng: r.lng as number | null,
    priceFrom: String(r.priceFrom ?? ""),
    priceTo: String(r.priceTo ?? ""),
    status: String(r.status ?? "available"),
    deliveryDate: String(r.deliveryDate ?? ""),
    totalUnits: r.totalUnits as number ?? 0,
    availableUnits: r.availableUnits as number ?? 0,
    amenities: r.amenities as string[] ?? [],
    amenitiesAr: r.amenitiesAr as string[] ?? [],
    featured: r.featured as boolean ?? false,
    publishStatus: String(r.publishStatus ?? r.visibility ?? "draft"),
    order: r.order as number ?? 0,
    brokerNotes: String(r.brokerNotes ?? ""),
    commissionNotes: String(r.commissionNotes ?? ""),
    seoTitle: String(r.seoTitle ?? ""),
    seoDescription: String(r.seoDescription ?? ""),
    seoKeywords: String(r.seoKeywords ?? ""),
    seoImage: String(r.seoImage ?? ""),
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  };
}

export async function getPublicProjects(): Promise<PublicProject[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>("GET", "/api/projects");
    return data.map(rowToPublicProject);
  } catch { return []; }
}

export async function getPublicProject(id: string): Promise<PublicProject | null> {
  try {
    const data = await apiFetch<Record<string,unknown>>("GET", `/api/projects/${id}`);
    return rowToPublicProject(data);
  } catch { return null; }
}

export async function getAdminProjects(): Promise<PublicProject[]> {
  const data = await apiFetch<Record<string,unknown>[]>(
    "GET", "/api/admin/projects", undefined, adminHeaders(),
  );
  return data.map(rowToPublicProject);
}

export async function createAdminProject(data: Partial<PublicProject>): Promise<PublicProject> {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/admin/projects", data, adminHeaders());
  return rowToPublicProject(res);
}

export async function updateAdminProject(id: string, data: Partial<PublicProject>): Promise<PublicProject> {
  const res = await apiFetch<Record<string,unknown>>(
    "PUT", `/api/admin/projects/${id}`, data, adminHeaders(),
  );
  return rowToPublicProject(res);
}

export async function deleteAdminProject(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/admin/projects/${id}`, undefined, adminHeaders());
}

// ─── CMS Pages ────────────────────────────────────────────────────────────────
export type CmsPage = {
  id: string; slug: string; title: string; titleAr?: string;
  heroImage?: string; heroTitle?: string; heroTitleAr?: string;
  content?: string; contentAr?: string;
  bodyCode: string;
  visibility: string;
  publishStatus: string;
  seoTitle?: string; seoDescription?: string; seoKeywords?: string; ogImage?: string;
  headCode?: string;
  showInNav?: boolean; showInMenu?: boolean; showInFooter?: boolean;
  createdBy?: string;
  createdAt: string; updatedAt?: string;
};

function rowToPage(r: Record<string, unknown>): CmsPage {
  const ps = String(r.publishStatus ?? r.visibility ?? "draft");
  const content = String(r.content ?? r.bodyCode ?? r.body_code ?? "");
  return {
    id:            String(r.id ?? ""),
    slug:          String(r.slug ?? ""),
    title:         String(r.title ?? ""),
    titleAr:       r.titleAr as string ?? "",
    heroImage:     r.heroImage as string ?? "",
    heroTitle:     r.heroTitle as string ?? String(r.title ?? ""),
    heroTitleAr:   r.heroTitleAr as string ?? "",
    content,
    contentAr:     r.contentAr as string ?? "",
    bodyCode:      content,
    visibility:    ps,
    publishStatus: ps,
    seoTitle:      r.seoTitle as string ?? "",
    seoDescription: r.seoDescription as string ?? "",
    seoKeywords:   r.seoKeywords as string ?? "",
    ogImage:       r.ogImage as string ?? "",
    headCode:      r.headCode as string ?? "",
    showInNav:     r.showInNav as boolean ?? false,
    showInMenu:    r.showInMenu as boolean ?? false,
    showInFooter:  r.showInFooter as boolean ?? false,
    createdBy:     r.createdBy as string ?? "",
    createdAt:     String(r.createdAt ?? ""),
    updatedAt:     String(r.updatedAt ?? r.createdAt ?? ""),
  };
}

export async function getPublicPages(): Promise<CmsPage[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>("GET", "/api/pages");
    return data.filter(p => (p.publishStatus ?? p.visibility) === "published").map(rowToPage);
  } catch { return []; }
}

export async function getPublicPage(slug: string): Promise<CmsPage | null> {
  try {
    const data = await apiFetch<Record<string,unknown>>("GET", `/api/pages/${encodeURIComponent(slug)}`);
    if (!data) return null;
    const page = rowToPage(data);
    if (page.publishStatus !== "published") return null;
    return page;
  } catch { return null; }
}

export async function getAdminPages(): Promise<CmsPage[]> {
  const data = await apiFetch<Record<string,unknown>[]>(
    "GET", "/api/admin/pages", undefined, adminHeaders(),
  );
  return data.map(rowToPage);
}

export async function createAdminPage(data: Partial<CmsPage>): Promise<CmsPage> {
  const body = {
    slug:          data.slug ?? "",
    title:         data.title ?? "",
    titleAr:       data.titleAr ?? "",
    heroImage:     data.heroImage ?? "",
    heroTitle:     data.heroTitle ?? "",
    heroTitleAr:   data.heroTitleAr ?? "",
    content:       data.content ?? data.bodyCode ?? "",
    contentAr:     data.contentAr ?? "",
    bodyCode:      data.bodyCode ?? data.content ?? "",
    publishStatus: data.publishStatus ?? data.visibility ?? "draft",
    seoTitle:      data.seoTitle ?? "",
    seoDescription: data.seoDescription ?? "",
    seoKeywords:   data.seoKeywords ?? "",
    ogImage:       data.ogImage ?? "",
    headCode:      data.headCode ?? "",
    showInNav:     data.showInNav ?? false,
    showInMenu:    data.showInMenu ?? false,
    showInFooter:  data.showInFooter ?? false,
  };
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/admin/pages", body, adminHeaders());
  return rowToPage(res);
}

export async function updateAdminPage(id: string, data: Partial<CmsPage>): Promise<CmsPage> {
  const body: Record<string, unknown> = {};
  if (data.slug        !== undefined) body.slug          = data.slug;
  if (data.title       !== undefined) body.title         = data.title;
  if (data.titleAr     !== undefined) body.titleAr       = data.titleAr;
  if (data.heroImage   !== undefined) body.heroImage     = data.heroImage;
  if (data.heroTitle   !== undefined) body.heroTitle     = data.heroTitle;
  if (data.heroTitleAr !== undefined) body.heroTitleAr   = data.heroTitleAr;
  if (data.content     !== undefined || data.bodyCode !== undefined)
    body.content = data.content ?? data.bodyCode;
  if (data.contentAr   !== undefined) body.contentAr    = data.contentAr;
  if (data.bodyCode    !== undefined || data.content !== undefined)
    body.bodyCode = data.bodyCode ?? data.content;
  if (data.publishStatus !== undefined || data.visibility !== undefined)
    body.publishStatus = data.publishStatus ?? data.visibility;
  if (data.seoTitle      !== undefined) body.seoTitle      = data.seoTitle;
  if (data.seoDescription !== undefined) body.seoDescription = data.seoDescription;
  if (data.seoKeywords   !== undefined) body.seoKeywords   = data.seoKeywords;
  if (data.ogImage       !== undefined) body.ogImage       = data.ogImage;
  if (data.headCode      !== undefined) body.headCode      = data.headCode;
  if (data.showInNav     !== undefined) body.showInNav     = data.showInNav;
  if (data.showInMenu    !== undefined) body.showInMenu    = data.showInMenu;
  if (data.showInFooter  !== undefined) body.showInFooter  = data.showInFooter;
  const res = await apiFetch<Record<string,unknown>>(
    "PUT", `/api/admin/pages/${id}`, body, adminHeaders(),
  );
  return rowToPage(res);
}

export async function deleteAdminPage(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/admin/pages/${id}`, undefined, adminHeaders());
}

// ─── HTML Snippets ────────────────────────────────────────────────────────────
export type HtmlSnippet = {
  id: string; name: string; html: string;
  placement: "head" | "body-start" | "body-end" | "after-nav" | "before-footer";
  enabled: boolean; createdAt: string;
};

function rowToSnippet(r: Record<string, unknown>): HtmlSnippet {
  return {
    id: String(r.id ?? ""), name: String(r.name ?? ""),
    html: String(r.html ?? ""),
    placement: (r.placement as HtmlSnippet["placement"]) ?? "body-end",
    enabled: r.enabled as boolean ?? true,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
  };
}

export async function getHtmlSnippets(): Promise<HtmlSnippet[]> {
  try {
    const data = await apiFetch<Record<string,unknown>[]>("GET", "/api/html-snippets");
    return data.map(rowToSnippet);
  } catch { return []; }
}

export async function getAdminHtmlSnippets(): Promise<HtmlSnippet[]> {
  const data = await apiFetch<Record<string,unknown>[]>(
    "GET", "/api/admin/html-snippets", undefined, adminHeaders(),
  );
  return data.map(rowToSnippet);
}

export async function createHtmlSnippet(data: Partial<HtmlSnippet>): Promise<HtmlSnippet> {
  const res = await apiFetch<Record<string,unknown>>(
    "POST", "/api/admin/html-snippets",
    { name: data.name ?? "", html: data.html ?? "", placement: data.placement ?? "body-end", enabled: data.enabled ?? true },
    adminHeaders(),
  );
  return rowToSnippet(res);
}

export async function updateHtmlSnippet(id: string, data: Partial<HtmlSnippet>): Promise<HtmlSnippet> {
  const res = await apiFetch<Record<string,unknown>>(
    "PUT", `/api/admin/html-snippets/${id}`,
    { name: data.name, html: data.html, placement: data.placement, enabled: data.enabled },
    adminHeaders(),
  );
  return rowToSnippet(res);
}

export async function deleteHtmlSnippet(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/admin/html-snippets/${id}`, undefined, adminHeaders());
}

// ─── Media Gallery ────────────────────────────────────────────────────────────
export type MediaItem = {
  id: string; url: string; title: string; altText: string;
  caption: string; description: string; category: string;
  width?: number; height?: number; createdAt: string; updatedAt?: string;
  usedIn?: { type: string; label: string; id: string }[];
};

export async function uploadMediaFile(dataUrl: string, filename: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(
    "POST", "/api/admin/upload-media", { dataUrl, filename }, adminHeaders(),
  );
}

export async function getAdminMedia(): Promise<MediaItem[]> {
  const data = await apiFetch<Record<string,unknown>[]>(
    "GET", "/api/admin/media", undefined, adminHeaders(),
  );
  return data.map(r => ({
    id: String(r.id ?? ""), url: String(r.url ?? ""),
    title: String(r.title ?? ""), altText: String(r.altText ?? ""),
    caption: String(r.caption ?? ""), description: String(r.description ?? ""),
    category: String(r.category ?? ""),
    width: r.width as number, height: r.height as number,
    usedIn: r.usedIn as MediaItem["usedIn"],
    createdAt: String(r.createdAt ?? ""), updatedAt: r.updatedAt as string,
  }));
}

export async function createMediaItem(data: Partial<MediaItem>): Promise<MediaItem> {
  const res = await apiFetch<Record<string,unknown>>("POST", "/api/admin/media", data, adminHeaders());
  return res as unknown as MediaItem;
}

export async function updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem> {
  const res = await apiFetch<Record<string,unknown>>(
    "PUT", `/api/admin/media/${id}`, data, adminHeaders(),
  );
  return res as unknown as MediaItem;
}

export async function deleteMediaItem(id: string): Promise<void> {
  await apiFetch("DELETE", `/api/admin/media/${id}`, undefined, adminHeaders());
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export async function getActivityLog() {
  try {
    const data = await apiFetch<Record<string,unknown>[]>(
      "GET", "/api/admin/activity-log", undefined, adminHeaders(),
    );
    return data.map(r => ({
      id: String(r.id ?? ""), type: String(r.type ?? ""),
      event: String(r.event ?? ""), subject: String(r.subject ?? ""),
      userId: String(r.userId ?? ""), userName: String(r.userName ?? ""),
      createdAt: String(r.createdAt ?? ""),
    }));
  } catch { return []; }
}

// ─── Server Health ────────────────────────────────────────────────────────────
export async function getServerHealth() {
  try {
    return await apiFetchRaw<Record<string,unknown>>("GET", "/api/health");
  } catch {
    return { status: "error", db: "unknown", timestamp: new Date().toISOString() };
  }
}

export async function getServerLogs() {
  try {
    return await apiFetch<{ level: string; message: string; timestamp: string }[]>(
      "GET", "/api/server/logs", undefined, adminHeaders(),
    );
  } catch { return []; }
}

export interface DbStatusResult {
  mode: "supabase" | "mysql" | "json-files";
  connected: boolean; host: string | null; port: string | null;
  database: string | null; latencyMs: number | null; message?: string; error?: string; hint?: string;
}

export async function getDbStatus(): Promise<DbStatusResult> {
  try {
    return await apiFetch<DbStatusResult>(
      "GET", "/api/db-status", undefined, adminHeaders(),
    );
  } catch {
    return { mode: "json-files", connected: true, host: null, port: null, database: null, latencyMs: null };
  }
}

// ─── Pages helper (for nav) ───────────────────────────────────────────────────
export async function getPages() {
  return getPublicPages();
}
