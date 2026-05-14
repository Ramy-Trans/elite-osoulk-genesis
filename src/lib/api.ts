const BASE = ((): string => {
  if (typeof window === "undefined") {
    const port =
      typeof process !== "undefined"
        ? ((process as any).env?.PORT || "3001")
        : "3001";
    return `http://localhost:${port}`;
  }
  return (import.meta.env.VITE_API_URL as string) || "";
})();

// --- Admin Auth ---
export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("osoulk_admin_key");
}
export function setAdminKey(key: string) {
  localStorage.setItem("osoulk_admin_key", key);
}
export function clearAdminKey() {
  localStorage.removeItem("osoulk_admin_key");
}

function adminHeaders(): HeadersInit {
  const key = getAdminKey();
  return { "Content-Type": "application/json", ...(key ? { "x-admin-key": key } : {}) };
}

export async function adminLogin(password: string): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Login failed");
  }
  return res.json();
}

// --- Subscribe ---
export async function subscribeEmail(email: string, name?: string) {
  const res = await fetch(`${BASE}/api/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Subscription failed");
  }
  return res.json();
}

export async function getSubscribers() {
  const res = await fetch(`${BASE}/api/subscribers`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch subscribers");
  return res.json() as Promise<{ id: string; email: string; name: string; createdAt: string }[]>;
}

// --- Stats ---
export async function getStats() {
  const res = await fetch(`${BASE}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json() as Promise<{
    subscribers: number; users: number; listings: number;
    reels: number; agencies: number; pendingApprovals: number;
    approvedReels: number; totalViews: number;
    newUsers: number; pendingListings: number;
  }>;
}

// --- Google OAuth ---
export async function googleLogin(credential: string) {
  const res = await fetch(`${BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Google sign-in failed");
  }
  return res.json();
}

// --- Users ---
export async function registerUser(data: { fullName: string; email: string; phone?: string; password: string }) {
  const res = await fetch(`${BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Registration failed");
  }
  return res.json();
}

export type AdminUser = {
  id: string; fullName: string; email: string; phone: string;
  plan: string; status: string; createdAt: string;
};

export async function getUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${BASE}/api/users`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function updateUser(id: string, data: Partial<{ plan: string; status: string; fullName: string; phone: string }>) {
  const res = await fetch(`${BASE}/api/users/${id}`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Update failed");
  }
  return res.json() as Promise<AdminUser>;
}

export async function deleteUser(id: string) {
  const res = await fetch(`${BASE}/api/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// --- Reel Requests ---
export type ReelRequest = {
  id: string; name: string; email: string; reason?: string;
  status: "pending" | "approved" | "rejected"; createdAt: string; updatedAt?: string;
};

export async function getReelRequests(): Promise<ReelRequest[]> {
  const res = await fetch(`${BASE}/api/reel-requests`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch reel requests");
  return res.json();
}

export async function updateReelRequest(id: string, status: "approved" | "rejected" | "pending") {
  const res = await fetch(`${BASE}/api/reel-requests/${id}`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json() as Promise<ReelRequest>;
}

export async function deleteReelRequest(id: string) {
  const res = await fetch(`${BASE}/api/reel-requests/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// --- SEO ---
export type SeoPage = { title: string; description: string; keywords: string; updatedAt?: string };
export type SeoData = Record<string, SeoPage>;

export async function getSeoData(): Promise<SeoData> {
  const res = await fetch(`${BASE}/api/seo`);
  if (!res.ok) throw new Error("Failed to fetch SEO data");
  return res.json();
}

export async function updateSeoPage(page: string, data: SeoPage) {
  const res = await fetch(`${BASE}/api/seo/${page}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("SEO update failed");
  return res.json() as Promise<SeoPage>;
}

// --- Property Views ---
export async function trackPropertyView(id: string) {
  try {
    const res = await fetch(`${BASE}/api/properties/${id}/view`, { method: "POST" });
    const data = await res.json().catch(() => ({ views: 0 }));
    return data as { views: number };
  } catch { return { views: 0 }; }
}

export async function getPropertyViews(id: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/api/properties/${id}/views`);
    const data = await res.json().catch(() => ({ views: 0 }));
    return data.views ?? 0;
  } catch { return 0; }
}

// --- User session (non-admin) ---
const USER_KEY = "osoulk_user_id";
const USER_OBJ_KEY = "osoulk_user_obj";

export type Role = "individual" | "broker" | "developer" | "admin";
export type CurrentUser = {
  id: string; fullName: string; email: string; phone: string;
  plan: string; role: Role; company?: string; status: string; createdAt: string;
};

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}
export function setUserSession(user: CurrentUser) {
  localStorage.setItem(USER_KEY, user.id);
  localStorage.setItem(USER_OBJ_KEY, JSON.stringify(user));
}
export function clearUserSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_OBJ_KEY);
}
export function getCachedUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_OBJ_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as CurrentUser; } catch { return null; }
}
function userHeaders(): HeadersInit {
  const id = getUserId();
  return { "Content-Type": "application/json", ...(id ? { "x-user-id": id } : {}) };
}

export async function userLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Sign in failed");
  return body as { message: string; user: CurrentUser; token: string };
}

export async function forgotPassword(email: string): Promise<{ message: string; token: string }> {
  const res = await fetch(`${BASE}/api/forgot-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Request failed");
  return body;
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/api/reset-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Reset failed");
  return body;
}

export async function getActivityLog(): Promise<{ id: string; type: string; event: string; subject: string; userId: string; userName: string; createdAt: string }[]> {
  const res = await fetch(`${BASE}/api/admin/activity-log`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch activity log");
  return res.json();
}

export async function getMe(): Promise<CurrentUser> {
  const res = await fetch(`${BASE}/api/me`, { headers: userHeaders() });
  if (!res.ok) throw new Error("Not signed in");
  return res.json();
}

export async function updateMe(data: Partial<{ fullName: string; phone: string; company: string }>) {
  const res = await fetch(`${BASE}/api/me`, { method: "PATCH", headers: userHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Update failed");
  return res.json() as Promise<CurrentUser>;
}

// --- Site Settings ---
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

export async function getSiteSettings(): Promise<SiteSettings> {
  const res = await fetch(`${BASE}/api/site-settings`);
  if (!res.ok) throw new Error("Failed to fetch site settings");
  return res.json();
}
export async function updateSiteSettings(data: Partial<SiteSettings>) {
  const res = await fetch(`${BASE}/api/site-settings`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update site settings");
  return res.json() as Promise<SiteSettings>;
}

export function applyThemeToDOM(theme: Record<string, string>): void {
  if (typeof window === "undefined" || !theme) return;

  const rootVars: string[] = [];
  const extraRules: string[] = [];

  if (theme.primaryColor) {
    rootVars.push(`--navy:${theme.primaryColor}`);
    rootVars.push(`--primary:${theme.primaryColor}`);
    rootVars.push(`--navy-soft:${theme.primaryColor}`);
    rootVars.push(`--sidebar-primary:${theme.primaryColor}`);
  }
  if (theme.secondaryColor) {
    rootVars.push(`--aqua:${theme.secondaryColor}`);
  }
  if (theme.ctaColor) {
    rootVars.push(`--gold:${theme.ctaColor}`);
    rootVars.push(`--accent:${theme.ctaColor}`);
  }
  if (theme.cardBg) {
    rootVars.push(`--card:${theme.cardBg}`);
  }
  if (theme.inputBg) {
    rootVars.push(`--input:${theme.inputBg}`);
  }

  if (theme.navbarBg) {
    extraRules.push(`header{background-color:${theme.navbarBg}!important}`);
  }
  if (theme.navbarText) {
    extraRules.push(`header .nav-link,header a,header span.nav-text{color:${theme.navbarText}!important}`);
  }
  if (theme.footerBg) {
    extraRules.push(`footer{background-color:${theme.footerBg}!important}`);
  }
  if (theme.footerText) {
    extraRules.push(`footer h3,footer h4,footer p,footer li,footer span,footer a{color:${theme.footerText}!important}`);
  }

  const css = [
    rootVars.length ? `:root{${rootVars.join(";")}}` : "",
    ...extraRules,
  ].filter(Boolean).join("\n");

  if (!css) return;

  let styleEl = document.getElementById("osoulk-theme") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "osoulk-theme";
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = css;
}

// --- Content Sections ---
export type ContentSection = {
  id: string; label: string; visible: boolean; order: number;
  title?: string; titleAr?: string;
  subtitle?: string; subtitleAr?: string;
  body?: string; bodyAr?: string;
  ctaText?: string; ctaTextAr?: string;
  image?: string;
  seoTitle?: string; seoTitleAr?: string;
  seoDescription?: string; seoDescriptionAr?: string;
  seoKeywords?: string[]; seoKeywordsAr?: string[];
  canonicalUrl?: string; ogImage?: string;
};
export async function getSections(): Promise<ContentSection[]> {
  const res = await fetch(`${BASE}/api/sections`);
  if (!res.ok) throw new Error("Failed to fetch sections");
  return res.json();
}
export async function getAdminSections(): Promise<ContentSection[]> {
  const res = await fetch(`${BASE}/api/admin/sections`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch sections");
  return res.json();
}
export async function updateSections(sections: ContentSection[]) {
  const res = await fetch(`${BASE}/api/sections`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(sections) });
  if (!res.ok) throw new Error("Failed to update sections");
  return res.json() as Promise<ContentSection[]>;
}
export async function updateSectionContent(id: string, data: Partial<ContentSection>): Promise<ContentSection> {
  const res = await fetch(`${BASE}/api/admin/sections/${id}`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update section");
  return res.json();
}

// --- Inquiries / CRM Leads ---
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

export async function getMyInquiries(): Promise<Inquiry[]> {
  const res = await fetch(`${BASE}/api/me/inquiries`, { headers: userHeaders() });
  if (!res.ok) throw new Error("Failed to fetch inquiries");
  return res.json();
}
export async function postInquiry(data: { propertyId?: string; message: string; toRole?: string }) {
  const res = await fetch(`${BASE}/api/me/inquiries`, { method: "POST", headers: userHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to post inquiry");
  return res.json() as Promise<Inquiry>;
}
export async function updateInquiry(id: string, status: string) {
  const res = await fetch(`${BASE}/api/me/inquiries/${id}`, { method: "PATCH", headers: userHeaders(), body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error("Failed to update inquiry");
  return res.json() as Promise<Inquiry>;
}
export async function updateInquiryFull(id: string, data: {
  status?: string; crmStatus?: string; followUpDate?: string; note?: string; source?: string;
}) {
  const res = await fetch(`${BASE}/api/me/inquiries/${id}`, {
    method: "PATCH", headers: userHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update inquiry");
  return res.json() as Promise<Inquiry>;
}
export async function exportLeadsCsv(): Promise<Blob> {
  const res = await fetch(`${BASE}/api/me/leads/export`, { headers: userHeaders() });
  if (!res.ok) throw new Error("Failed to export leads");
  return res.blob();
}

// --- User listings (broker/developer) ---
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
  videoUrl?: string; seoImage?: string;
  seoTitle?: string; seoDescription?: string; seoKeywords?: string; canonicalUrl?: string;
  approvalStatus?: string; featured?: boolean; isPaused?: boolean;
  createdAt: string; updatedAt?: string;
};
export async function getMyListings(): Promise<UserListing[]> {
  const res = await fetch(`${BASE}/api/me/listings`, { headers: userHeaders() });
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}
export async function createListing(data: Partial<UserListing>) {
  const res = await fetch(`${BASE}/api/me/listings`, { method: "POST", headers: userHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Failed to create listing");
  return body as UserListing;
}
export async function updateListing(id: string, data: Partial<UserListing>) {
  const res = await fetch(`${BASE}/api/me/listings/${id}`, { method: "PATCH", headers: userHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update listing");
  return res.json() as Promise<UserListing>;
}
export async function deleteListing(id: string) {
  const res = await fetch(`${BASE}/api/me/listings/${id}`, { method: "DELETE", headers: userHeaders() });
  if (!res.ok) throw new Error("Failed to delete listing");
  return res.json();
}

// --- Admin listing management ---
export async function getAdminListings(): Promise<UserListing[]> {
  const res = await fetch(`${BASE}/api/listings/all`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}
export async function createAdminListing(data: Partial<UserListing>): Promise<UserListing> {
  const res = await fetch(`${BASE}/api/admin/listings`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).message ?? "Failed to create listing");
  return body as UserListing;
}
export async function updateAdminListing(id: string, data: Partial<UserListing>): Promise<UserListing> {
  const res = await fetch(`${BASE}/api/admin/listings/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update listing");
  return res.json() as Promise<UserListing>;
}
export async function updateAdminListingApproval(id: string, status: string): Promise<UserListing> {
  const res = await fetch(`${BASE}/api/listings/${id}/approval`, { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error("Failed to update listing status");
  return res.json() as Promise<UserListing>;
}
export async function deleteAdminListing(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/listings/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete listing");
}

// --- Developer projects ---
export type Project = {
  id: string; developerId: string; developerName: string;
  name: string; location: string; units: number; soldUnits: number;
  status: string; deliveryDate: string; createdAt: string;
};
export async function getMyProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/api/me/projects`, { headers: userHeaders() });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}
export async function createProject(data: Partial<Project>) {
  const res = await fetch(`${BASE}/api/me/projects`, { method: "POST", headers: userHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Failed to create project");
  return body as Project;
}
export async function updateProject(id: string, data: Partial<Project>) {
  const res = await fetch(`${BASE}/api/me/projects/${id}`, { method: "PATCH", headers: userHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json() as Promise<Project>;
}
export async function deleteProject(id: string) {
  const res = await fetch(`${BASE}/api/me/projects/${id}`, { method: "DELETE", headers: userHeaders() });
  if (!res.ok) throw new Error("Failed to delete project");
  return res.json();
}

// --- Public Listings (user-uploaded, approved) ---
export type PublicListing = {
  id: string; ownerId: string; ownerName: string; ownerPhone: string; ownerRole: string;
  title: string; location: string; price: string; type: string; description: string;
  bedrooms: number; bathrooms: number; size: string; status: string;
  imageUrl: string; images: string[]; tags: string[];
  approvalStatus: string; createdAt: string;
};

export async function getPublicListings(): Promise<PublicListing[]> {
  try {
    const res = await fetch(`${BASE}/api/listings`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getPublicListing(id: string): Promise<PublicListing | null> {
  try {
    const res = await fetch(`${BASE}/api/listings/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getAllListingsAdmin(): Promise<PublicListing[]> {
  const res = await fetch(`${BASE}/api/listings/all`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export async function setListingApproval(id: string, status: "approved" | "rejected" | "pending"): Promise<PublicListing> {
  const res = await fetch(`${BASE}/api/listings/${id}/approval`, {
    method: "PATCH",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update listing");
  return res.json();
}

export async function adminDeleteListing(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/listings/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete listing");
}

// --- Analytics ---
export async function getAnalytics() {
  const res = await fetch(`${BASE}/api/analytics`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json() as Promise<{
    userGrowth: { label: string; users: number }[];
    leadsChart: { label: string; leads: number }[];
    topProperties: { id: string; views: number }[];
    planChart: { name: string; value: number }[];
    roleChart: { name: string; value: number }[];
    crmFunnel: { stage: string; count: number }[];
    listingStatus: { pending: number; approved: number; rejected: number };
    savedSearchAnalytics?: {
      total: number; active: number; paused: number; totalAlertsSent: number;
      topSearchCombos: { combo: string; count: number }[];
      alertsChart: { label: string; alerts: number }[];
    };
    totals: { users: number; leads: number; listings: number; totalViews: number };
  }>;
}

// --- Saved Searches ---
export type SavedSearch = {
  id: string; name: string; filters: Record<string, string>;
  alertFrequency: string; paused: boolean; matchCount?: number;
  createdAt: string; updatedAt?: string;
};
export async function getSavedSearches(): Promise<SavedSearch[]> {
  const res = await fetch(`${BASE}/api/me/saved-searches`, { headers: userHeaders() });
  if (!res.ok) return [];
  return res.json();
}
export async function saveSearch(name: string, filters: Record<string, string>): Promise<SavedSearch> {
  const { alertFrequency, ...rest } = filters as Record<string, string>;
  const res = await fetch(`${BASE}/api/me/saved-searches`, {
    method: "POST", headers: userHeaders(),
    body: JSON.stringify({ name, filters: rest, alertFrequency: alertFrequency || "instant" }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? "Failed to save search");
  return body as SavedSearch;
}
export async function updateSavedSearch(id: string, data: Partial<SavedSearch>): Promise<SavedSearch> {
  const res = await fetch(`${BASE}/api/me/saved-searches/${id}`, {
    method: "PATCH", headers: userHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update saved search");
  return res.json() as Promise<SavedSearch>;
}
export async function deleteSavedSearch(id: string): Promise<void> {
  await fetch(`${BASE}/api/me/saved-searches/${id}`, { method: "DELETE", headers: userHeaders() });
}

// --- Server-side Notifications ---
export type ServerNotification = {
  id: string; type: string; title: string; body: string;
  read: boolean; propertyId?: string; searchId?: string;
  createdAt: string; openedAt?: string;
};
export async function getServerNotifications(): Promise<ServerNotification[]> {
  const id = getUserId();
  if (!id) return [];
  try {
    const res = await fetch(`${BASE}/api/me/notifications`, { headers: userHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}
export async function markServerNotificationRead(notifId: string): Promise<void> {
  await fetch(`${BASE}/api/me/notifications/${notifId}/read`, { method: "PATCH", headers: userHeaders() });
}
export async function markAllServerNotificationsRead(): Promise<void> {
  await fetch(`${BASE}/api/me/notifications/read-all`, { method: "PATCH", headers: userHeaders() });
}
export async function deleteServerNotification(notifId: string): Promise<void> {
  await fetch(`${BASE}/api/me/notifications/${notifId}`, { method: "DELETE", headers: userHeaders() });
}

// --- Alert Settings ---
export type AlertSettings = { emailFrequency: string; inApp: boolean };
export async function getAlertSettings(): Promise<AlertSettings> {
  const res = await fetch(`${BASE}/api/me/alert-settings`, { headers: userHeaders() });
  if (!res.ok) return { emailFrequency: "instant", inApp: true };
  return res.json();
}
export async function updateAlertSettings(data: Partial<AlertSettings>): Promise<AlertSettings> {
  const res = await fetch(`${BASE}/api/me/alert-settings`, {
    method: "PUT", headers: userHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update alert settings");
  return res.json() as Promise<AlertSettings>;
}

// --- Admin User Creation ---
export async function adminCreateUser(data: {
  fullName: string; email: string; phone?: string;
  role?: string; plan?: string; company?: string; password?: string;
}): Promise<{ user: AdminUser; tempPassword: string; message: string }> {
  const res = await fetch(`${BASE}/api/admin/create-user`, {
    method: "POST", headers: adminHeaders(), body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Failed to create user");
  return body;
}

export async function adminResetPassword(id: string, password?: string): Promise<{ newPassword: string }> {
  const res = await fetch(`${BASE}/api/users/${id}/reset-password`, {
    method: "PATCH", headers: adminHeaders(),
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Failed to reset password");
  return body;
}

// --- Articles ---
export type Article = {
  id: string; title: string; titleAr: string; slug: string;
  category: string; categoryAr: string;
  summary: string; summaryAr: string;
  content: string; contentAr: string;
  coverImage: string; status: "draft" | "published";
  featured: boolean; tags: string[];
  seoTitle: string; seoDescription: string;
  seoKeywords: string[]; seoImage: string; canonicalUrl: string;
  readingTime: number;
  createdAt: string; updatedAt: string;
};

export async function getArticles(status?: string): Promise<Article[]> {
  const url = status ? `${BASE}/api/articles?status=${status}` : `${BASE}/api/articles`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getArticle(id: string): Promise<Article | null> {
  try {
    const res = await fetch(`${BASE}/api/articles/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  const res = await fetch(`${BASE}/api/articles`, {
    method: "POST", headers: adminHeaders(), body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Failed to create article");
  return body;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  const res = await fetch(`${BASE}/api/articles/${id}`, {
    method: "PUT", headers: adminHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update article");
  return res.json();
}

export async function deleteArticle(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/articles/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete article");
}

// --- FAQs ---
export type FAQ = {
  id: string; question: string; questionAr: string;
  answer: string; answerAr: string;
  category: string; categoryAr: string; order: number;
  seoTitle: string; seoTitleAr?: string;
  seoDescription: string; seoDescriptionAr?: string;
  seoKeywords: string[]; seoKeywordsAr?: string[];
  canonicalUrl?: string; seoImage?: string;
  createdAt: string; updatedAt: string;
};

export async function getFaqs(): Promise<FAQ[]> {
  try {
    const res = await fetch(`${BASE}/api/faqs`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function createFaq(data: Partial<FAQ>): Promise<FAQ> {
  const res = await fetch(`${BASE}/api/faqs`, {
    method: "POST", headers: adminHeaders(), body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Failed to create FAQ");
  return body;
}

export async function updateFaq(id: string, data: Partial<FAQ>): Promise<FAQ> {
  const res = await fetch(`${BASE}/api/faqs/${id}`, {
    method: "PUT", headers: adminHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update FAQ");
  return res.json();
}

export async function deleteFaq(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/faqs/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete FAQ");
}

// --- Text Content ---
export async function getTextContent(): Promise<Record<string, Record<string, string>>> {
  try {
    const res = await fetch(`${BASE}/api/text-content`);
    if (!res.ok) return {};
    return res.json();
  } catch { return {}; }
}

export async function updateTextContent(data: Record<string, Record<string, string>>): Promise<Record<string, Record<string, string>>> {
  const res = await fetch(`${BASE}/api/text-content`, {
    method: "PUT", headers: adminHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update text content");
  return res.json();
}

export type SectionSeoData = {
  title?: string; titleAr?: string;
  subtitle?: string; subtitleAr?: string;
  body?: string; bodyAr?: string;
  ctaText?: string; ctaTextAr?: string;
  image?: string;
  seoTitle?: string; seoTitleAr?: string;
  seoDescription?: string; seoDescriptionAr?: string;
  seoKeywords?: string[]; seoKeywordsAr?: string[];
  canonicalUrl?: string; ogImage?: string;
};

export async function getSectionSeoData(): Promise<Record<string, SectionSeoData>> {
  try {
    const res = await fetch(`${BASE}/api/section-seo`);
    if (!res.ok) return {};
    return res.json();
  } catch { return {}; }
}

export async function updateSectionSeoData(data: Record<string, SectionSeoData>): Promise<Record<string, SectionSeoData>> {
  const res = await fetch(`${BASE}/api/section-seo`, {
    method: "PUT", headers: adminHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update section SEO data");
  return res.json();
}

// --- Public Projects / Compounds ---
export type PublicProject = {
  id: string; slug: string;
  name: string; nameAr: string;
  developerName: string; developerNameAr: string;
  logoUrl: string; developerWebsite: string;
  heroImage: string; gallery: string[];
  description: string; descriptionAr: string;
  location: string; locationAr: string;
  governorate: string; address: string;
  lat: number | null; lng: number | null;
  priceFrom: string; priceTo: string;
  status: string; deliveryDate: string;
  totalUnits: number; availableUnits: number;
  amenities: string[]; amenitiesAr: string[];
  featured: boolean; publishStatus: string; order: number;
  brokerNotes: string; commissionNotes: string;
  seoTitle: string; seoDescription: string; seoKeywords: string; seoImage: string;
  createdAt: string; updatedAt: string;
};

export async function getPublicProjects(): Promise<PublicProject[]> {
  try {
    const res = await fetch(`${BASE}/api/projects`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getPublicProject(id: string): Promise<PublicProject | null> {
  try {
    const res = await fetch(`${BASE}/api/projects/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getAdminProjects(): Promise<PublicProject[]> {
  const res = await fetch(`${BASE}/api/admin/projects`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function createAdminProject(data: Partial<PublicProject>): Promise<PublicProject> {
  const res = await fetch(`${BASE}/api/admin/projects`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? "Failed to create project");
  return body;
}

export async function updateAdminProject(id: string, data: Partial<PublicProject>): Promise<PublicProject> {
  const res = await fetch(`${BASE}/api/admin/projects/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteAdminProject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/projects/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete project");
}

// --- CMS Pages ---
export type CmsPage = {
  id: string; slug: string;
  title: string; titleAr: string;
  heroImage: string; heroTitle: string; heroTitleAr: string;
  content: string; contentAr: string;
  publishStatus: string;
  seoTitle: string; seoDescription: string; seoKeywords: string; ogImage: string;
  headCode?: string; bodyCode?: string;
  showInNav?: boolean; showInMenu?: boolean; showInFooter?: boolean;
  createdAt: string; updatedAt: string;
};

export async function getPublicPages(): Promise<CmsPage[]> {
  try {
    const res = await fetch(`${BASE}/api/pages`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getPublicPage(slug: string): Promise<CmsPage | null> {
  try {
    const res = await fetch(`${BASE}/api/pages/${slug}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getAdminPages(): Promise<CmsPage[]> {
  const res = await fetch(`${BASE}/api/admin/pages`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch pages");
  return res.json();
}

export async function createAdminPage(data: Partial<CmsPage>): Promise<CmsPage> {
  const res = await fetch(`${BASE}/api/admin/pages`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? "Failed to create page");
  return body;
}

export async function updateAdminPage(id: string, data: Partial<CmsPage>): Promise<CmsPage> {
  const res = await fetch(`${BASE}/api/admin/pages/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update page");
  return res.json();
}

export async function deleteAdminPage(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/pages/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete page");
}

// --- Custom HTML Snippets ---
export type HtmlSnippet = {
  id: string; name: string; html: string;
  placement: "head" | "body-start" | "body-end" | "after-nav" | "before-footer";
  enabled: boolean; createdAt: string;
};

export async function getHtmlSnippets(): Promise<HtmlSnippet[]> {
  try {
    const res = await fetch(`${BASE}/api/html-snippets`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getAdminHtmlSnippets(): Promise<HtmlSnippet[]> {
  const res = await fetch(`${BASE}/api/admin/html-snippets`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch snippets");
  return res.json();
}

export async function createHtmlSnippet(data: Partial<HtmlSnippet>): Promise<HtmlSnippet> {
  const res = await fetch(`${BASE}/api/admin/html-snippets`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? "Failed to create snippet");
  return body;
}

export async function updateHtmlSnippet(id: string, data: Partial<HtmlSnippet>): Promise<HtmlSnippet> {
  const res = await fetch(`${BASE}/api/admin/html-snippets/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update snippet");
  return res.json();
}

export async function deleteHtmlSnippet(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/html-snippets/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete snippet");
}

// --- Media Gallery ---
export type MediaItem = {
  id: string; url: string; title: string; altText: string;
  caption: string; description: string; category: string;
  width?: number; height?: number;
  createdAt: string; updatedAt?: string;
  usedIn?: { type: string; label: string; id: string }[];
};

export async function uploadMediaFile(dataUrl: string, filename: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE}/api/admin/upload-media`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ dataUrl, filename }) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).message ?? "Upload failed");
  return body;
}

export async function addSeoPage(page: string): Promise<void> {
  await fetch(`${BASE}/api/seo`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ page }) });
}

export async function deleteSeoPage(page: string): Promise<void> {
  await fetch(`${BASE}/api/seo/${encodeURIComponent(page)}`, { method: "DELETE", headers: adminHeaders() });
}

export async function getAdminMedia(): Promise<MediaItem[]> {
  const res = await fetch(`${BASE}/api/admin/media`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch media");
  return res.json();
}

export async function createMediaItem(data: Partial<MediaItem>): Promise<MediaItem> {
  const res = await fetch(`${BASE}/api/admin/media`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).message ?? "Failed to create media item");
  return body;
}

export async function updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem> {
  const res = await fetch(`${BASE}/api/admin/media/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update media item");
  return res.json();
}

export async function deleteMediaItem(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/media/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to delete media item");
}

// --- Server health ---
export async function getServerHealth() {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function getServerLogs() {
  const res = await fetch(`${BASE}/api/server/logs`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json() as Promise<{ time: string; msg: string; level: string }[]>;
}

export interface DbStatusResult {
  mode: "mysql" | "json-files";
  connected: boolean;
  host: string | null;
  port: string | null;
  database: string | null;
  latencyMs: number | null;
  message?: string;
  error?: string;
  hint?: string;
}

export async function getDbStatus(): Promise<DbStatusResult> {
  const res = await fetch(`${BASE}/api/db-status`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch DB status");
  return res.json();
}
