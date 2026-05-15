import { supabase } from "./supabase";

// ─── Admin Auth (password-based, stored in localStorage) ─────────────────────
// Admin login uses a hardcoded password check via a Supabase edge/RPC or
// a dedicated admin Supabase Auth account. We keep the same UX (password prompt)
// but validate against Supabase Auth with a fixed admin email.

const ADMIN_EMAIL_KEY = "osoulk_admin_email";
const ADMIN_SESSION_KEY = "osoulk_admin_session";

export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_SESSION_KEY);
}
export function setAdminKey(token: string) {
  localStorage.setItem(ADMIN_SESSION_KEY, token);
}
export function clearAdminKey() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_EMAIL_KEY);
}

export async function adminLogin(password: string): Promise<{ token: string }> {
  // Admin logs in with fixed email + supplied password via Supabase Auth
  const adminEmail = `admin@osoulk.app`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  if (error || !data.session) {
    throw new Error("Invalid admin password");
  }
  const token = data.session.access_token;
  localStorage.setItem(ADMIN_EMAIL_KEY, adminEmail);
  return { token };
}

// ─── User session ─────────────────────────────────────────────────────────────
const USER_OBJ_KEY = "osoulk_user_obj";

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

function rowToUser(row: Record<string, unknown>): CurrentUser {
  return {
    id:        row.id as string,
    fullName:  row.full_name as string ?? "",
    email:     row.email as string ?? "",
    phone:     row.phone as string ?? "",
    plan:      row.plan as string ?? "free",
    role:      (row.role as Role) ?? "individual",
    company:   row.company as string ?? "",
    status:    row.status as string ?? "active",
    createdAt: row.created_at as string ?? "",
  };
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
export async function subscribeEmail(email: string, name?: string) {
  const { error } = await supabase.from("subscribers").insert({ email, name: name ?? "" });
  if (error) {
    if (error.code === "23505") throw new Error("This email is already subscribed.");
    throw new Error(error.message);
  }
  return { message: "Subscribed successfully!" };
}

export async function getSubscribers() {
  const { data, error } = await supabase
    .from("subscribers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; email: string; name: string; createdAt: string }[];
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getStats() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: users },
    { count: subscribers },
    { count: reels },
    { count: pendingApprovals },
    { count: pendingListings },
    { count: newUsers },
    { count: articles },
    { count: projects },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase.from("reel_requests").select("*", { count: "exact", head: true }),
    supabase.from("reel_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("user_listings").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", yesterday),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("public_projects").select("*", { count: "exact", head: true }).eq("publish_status", "published"),
  ]);

  const { data: viewsData } = await supabase.from("property_views").select("view_count");
  const totalViews = (viewsData ?? []).reduce((a, r) => a + (r.view_count ?? 0), 0);
  const STATIC_LISTINGS = 9;
  const { count: approvedUserListings } = await supabase
    .from("user_listings").select("*", { count: "exact", head: true }).eq("approval_status", "approved");

  return {
    subscribers:      subscribers ?? 0,
    users:            users ?? 0,
    listings:         STATIC_LISTINGS + (approvedUserListings ?? 0),
    reels:            reels ?? 0,
    agencies:         4,
    pendingApprovals: pendingApprovals ?? 0,
    approvedReels:    0,
    totalViews,
    newUsers:         newUsers ?? 0,
    pendingListings:  pendingListings ?? 0,
    articles:         articles ?? 0,
    projects:         projects ?? 0,
  };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export async function googleLogin(credential: string) {
  // credential is a Google ID token — exchange via Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Google sign-in failed");
  // Upsert user profile
  const email = data.user.email ?? "";
  const { data: existing } = await supabase.from("users").select("*").eq("email", email).single();
  if (!existing) {
    await supabase.from("users").insert({
      auth_id:   data.user.id,
      full_name: data.user.user_metadata?.full_name ?? email,
      email,
      phone: "",
      provider: "google",
      plan: "free",
      status: "active",
    });
  }
  const { data: profile } = await supabase.from("users").select("*").eq("email", email).single();
  const user = rowToUser(profile as Record<string, unknown>);
  return { message: "Signed in with Google successfully!", user };
}

// ─── Users ────────────────────────────────────────────────────────────────────
export type AdminUser = {
  id: string; fullName: string; email: string; phone: string;
  plan: string; role: string; status: string; createdAt: string;
  company?: string; freePackage?: boolean; planExpiresAt?: string;
};

export async function getUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({
    id: r.id, fullName: r.full_name, email: r.email, phone: r.phone ?? "",
    plan: r.plan, role: r.role, status: r.status, createdAt: r.created_at,
    company: r.company, freePackage: r.free_package, planExpiresAt: r.plan_expires_at,
  }));
}

export async function updateUser(id: string, data: Partial<{
  plan: string; status: string; fullName: string; phone: string;
  role: string; freePackage: boolean; planExpiresAt: string;
}>) {
  const patch: Record<string, unknown> = {};
  if (data.plan          !== undefined) patch.plan           = data.plan;
  if (data.status        !== undefined) patch.status         = data.status;
  if (data.fullName      !== undefined) patch.full_name      = data.fullName;
  if (data.phone         !== undefined) patch.phone          = data.phone;
  if (data.role          !== undefined) patch.role           = data.role;
  if (data.freePackage   !== undefined) patch.free_package   = data.freePackage;
  if (data.planExpiresAt !== undefined) patch.plan_expires_at = data.planExpiresAt;
  const { data: updated, error } = await supabase.from("users").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { message: "Deleted" };
}

export async function adminCreateUser(data: {
  fullName: string; email: string; phone?: string;
  role?: string; plan?: string; company?: string; password?: string;
}): Promise<{ user: AdminUser; tempPassword: string; message: string }> {
  const tempPassword = data.password ?? Math.random().toString(36).slice(-10);
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authErr) throw new Error(authErr.message);
  const { data: profile, error } = await supabase.from("users").insert({
    auth_id:   authData.user.id,
    full_name: data.fullName,
    email:     data.email,
    phone:     data.phone ?? "",
    role:      data.role ?? "individual",
    plan:      data.plan ?? "free",
    company:   data.company ?? "",
    status:    "active",
  }).select().single();
  if (error) throw new Error(error.message);
  const user: AdminUser = {
    id: profile.id, fullName: profile.full_name, email: profile.email,
    phone: profile.phone, plan: profile.plan, role: profile.role,
    status: profile.status, createdAt: profile.created_at,
  };
  return { user, tempPassword, message: "User created" };
}

export async function adminResetPassword(id: string, password?: string): Promise<{ newPassword: string }> {
  const newPassword = password ?? Math.random().toString(36).slice(-10);
  const { data: profile } = await supabase.from("users").select("auth_id").eq("id", id).single();
  if (profile?.auth_id) {
    await supabase.auth.admin.updateUserById(profile.auth_id, { password: newPassword });
  }
  return { newPassword };
}

// ─── User login/register ──────────────────────────────────────────────────────
export async function registerUser(data: { fullName: string; email: string; phone?: string; password: string }) {
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (authErr) throw new Error(authErr.message);
  const { data: profile, error } = await supabase.from("users").insert({
    auth_id:   authData.user?.id,
    full_name: data.fullName,
    email:     data.email,
    phone:     data.phone ?? "",
    plan:      "free",
    role:      "individual",
    status:    "active",
  }).select().single();
  if (error) throw new Error(error.message);
  const user = rowToUser(profile as Record<string, unknown>);
  return { message: "Account created!", user };
}

export async function userLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const { data: profile, error: pErr } = await supabase.from("users").select("*").eq("email", email).single();
  if (pErr || !profile) throw new Error("User profile not found");
  const user = rowToUser(profile as Record<string, unknown>);
  return { message: "Signed in!", user, token: data.session?.access_token ?? "" };
}

export async function forgotPassword(email: string): Promise<{ message: string; token: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
  return { message: "Reset link sent to your email.", token: "" };
}

export async function resetPassword(_token: string, newPassword: string): Promise<{ message: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { message: "Password updated." };
}

export async function getMe(): Promise<CurrentUser> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile, error } = await supabase.from("users").select("*").eq("auth_id", user.id).single();
  if (error || !profile) throw new Error("Profile not found");
  return rowToUser(profile as Record<string, unknown>);
}

export async function updateMe(data: Partial<{ fullName: string; phone: string; company: string }>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const patch: Record<string, unknown> = {};
  if (data.fullName !== undefined) patch.full_name = data.fullName;
  if (data.phone    !== undefined) patch.phone     = data.phone;
  if (data.company  !== undefined) patch.company   = data.company;
  const { data: updated, error } = await supabase.from("users").update(patch).eq("auth_id", user.id).select().single();
  if (error) throw new Error(error.message);
  return rowToUser(updated as Record<string, unknown>);
}

// ─── Reel Requests ────────────────────────────────────────────────────────────
export type ReelRequest = {
  id: string; name: string; email: string; reason?: string;
  status: "pending" | "approved" | "rejected"; createdAt: string; updatedAt?: string;
};

function rowToReel(r: Record<string, unknown>): ReelRequest {
  return {
    id: r.id as string, name: r.name as string ?? "", email: r.email as string ?? "",
    reason: r.reason as string ?? "",
    status: (r.status as ReelRequest["status"]) ?? "pending",
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string,
  };
}

export async function getReelRequests(): Promise<ReelRequest[]> {
  const { data, error } = await supabase.from("reel_requests").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToReel);
}

export async function updateReelRequest(id: string, status: "approved" | "rejected" | "pending") {
  const { data, error } = await supabase.from("reel_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToReel(data as Record<string, unknown>);
}

export async function deleteReelRequest(id: string) {
  const { error } = await supabase.from("reel_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { message: "Deleted" };
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
export type SeoPage = { title: string; description: string; keywords: string; updatedAt?: string };
export type SeoData = Record<string, SeoPage>;

export async function getSeoData(): Promise<SeoData> {
  const { data, error } = await supabase.from("seo").select("*");
  if (error) throw new Error(error.message);
  const result: SeoData = {};
  for (const row of data ?? []) {
    result[row.page] = { title: row.title, description: row.description, keywords: row.keywords, updatedAt: row.updated_at };
  }
  return result;
}

export async function updateSeoPage(page: string, data: SeoPage) {
  const { data: updated, error } = await supabase.from("seo").upsert({
    page, title: data.title, description: data.description, keywords: data.keywords,
    updated_at: new Date().toISOString(),
  }).select().single();
  if (error) throw new Error(error.message);
  return updated;
}

export async function addSeoPage(page: string): Promise<void> {
  await supabase.from("seo").upsert({ page, title: "", description: "", keywords: "" });
}

export async function deleteSeoPage(page: string): Promise<void> {
  await supabase.from("seo").delete().eq("page", page);
}

// ─── Property Views ───────────────────────────────────────────────────────────
export async function trackPropertyView(id: string) {
  try {
    const { data: existing } = await supabase.from("property_views").select("view_count").eq("property_id", id).single();
    const newCount = (existing?.view_count ?? 0) + 1;
    await supabase.from("property_views").upsert({ property_id: id, view_count: newCount, updated_at: new Date().toISOString() });
    return { views: newCount };
  } catch { return { views: 0 }; }
}

export async function getPropertyViews(id: string): Promise<number> {
  try {
    const { data } = await supabase.from("property_views").select("view_count").eq("property_id", id).single();
    return data?.view_count ?? 0;
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
    const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).single();
    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(data.data as SiteSettings) };
  } catch { return DEFAULT_SETTINGS; }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  const current = await getSiteSettings();
  const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
  const { data, error } = await supabase.from("site_settings")
    .upsert({ id: 1, data: merged, updated_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);
  return merged;
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
    id: r.id as string, label: r.label as string ?? "", visible: r.visible as boolean ?? true,
    order: r.sort_order as number ?? 0, title: r.title as string, titleAr: r.title_ar as string,
    subtitle: r.subtitle as string, subtitleAr: r.subtitle_ar as string,
    body: r.body as string, bodyAr: r.body_ar as string,
    ctaText: r.cta_text as string, ctaTextAr: r.cta_text_ar as string, image: r.image as string,
    seoTitle: r.seo_title as string, seoTitleAr: r.seo_title_ar as string,
    seoDescription: r.seo_description as string, seoDescriptionAr: r.seo_description_ar as string,
    seoKeywords: r.seo_keywords as string[], seoKeywordsAr: r.seo_keywords_ar as string[],
    canonicalUrl: r.canonical_url as string, ogImage: r.og_image as string,
  };
}

export async function getSections(): Promise<ContentSection[]> {
  const { data, error } = await supabase.from("sections").select("*").order("sort_order");
  if (error) return [];
  return (data ?? []).map(rowToSection);
}
export async function getAdminSections(): Promise<ContentSection[]> { return getSections(); }

export async function updateSections(sections: ContentSection[]) {
  for (const s of sections) {
    await supabase.from("sections").upsert({
      id: s.id, label: s.label, visible: s.visible, sort_order: s.order,
      updated_at: new Date().toISOString(),
    });
  }
  return sections;
}

export async function updateSectionContent(id: string, data: Partial<ContentSection>): Promise<ContentSection> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.visible    !== undefined) patch.visible          = data.visible;
  if (data.order      !== undefined) patch.sort_order       = data.order;
  if (data.title      !== undefined) patch.title            = data.title;
  if (data.titleAr    !== undefined) patch.title_ar         = data.titleAr;
  if (data.subtitle   !== undefined) patch.subtitle         = data.subtitle;
  if (data.subtitleAr !== undefined) patch.subtitle_ar      = data.subtitleAr;
  if (data.body       !== undefined) patch.body             = data.body;
  if (data.bodyAr     !== undefined) patch.body_ar          = data.bodyAr;
  if (data.ctaText    !== undefined) patch.cta_text         = data.ctaText;
  if (data.ctaTextAr  !== undefined) patch.cta_text_ar      = data.ctaTextAr;
  if (data.image      !== undefined) patch.image            = data.image;
  if (data.seoTitle       !== undefined) patch.seo_title        = data.seoTitle;
  if (data.seoTitleAr     !== undefined) patch.seo_title_ar     = data.seoTitleAr;
  if (data.seoDescription !== undefined) patch.seo_description  = data.seoDescription;
  if (data.seoDescriptionAr !== undefined) patch.seo_description_ar = data.seoDescriptionAr;
  if (data.seoKeywords    !== undefined) patch.seo_keywords     = data.seoKeywords;
  if (data.seoKeywordsAr  !== undefined) patch.seo_keywords_ar  = data.seoKeywordsAr;
  if (data.canonicalUrl   !== undefined) patch.canonical_url    = data.canonicalUrl;
  if (data.ogImage        !== undefined) patch.og_image         = data.ogImage;
  const { data: updated, error } = await supabase.from("sections").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToSection(updated as Record<string, unknown>);
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
    id: r.id as string, fromUserId: r.from_user_id as string ?? "",
    fromName: r.from_name as string ?? "", fromEmail: r.from_email as string ?? "",
    propertyId: r.property_id as string ?? "", message: r.message as string ?? "",
    toRole: r.to_role as string ?? "", status: r.status as string ?? "open",
    crmStatus: r.crm_status as string, followUpDate: r.follow_up_date as string,
    source: r.source as string, notes: r.notes as InquiryNote[] ?? [],
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string,
  };
}

export async function getMyInquiries(): Promise<Inquiry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) return [];
  const { data, error } = await supabase.from("inquiries").select("*").eq("from_user_id", profile.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToInquiry);
}

export async function postInquiry(data: { propertyId?: string; message: string; toRole?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("users").select("*").eq("auth_id", user.id).single() : { data: null };
  const { data: inserted, error } = await supabase.from("inquiries").insert({
    from_user_id: profile?.id ?? null,
    from_name:    profile?.full_name ?? "",
    from_email:   profile?.email ?? "",
    property_id:  data.propertyId ?? "",
    message:      data.message,
    to_role:      data.toRole ?? "",
    status:       "open",
    crm_status:   "new",
    source:       "website",
    notes:        [],
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToInquiry(inserted as Record<string, unknown>);
}

export async function updateInquiry(id: string, status: string) {
  const { data, error } = await supabase.from("inquiries").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToInquiry(data as Record<string, unknown>);
}

export async function updateInquiryFull(id: string, data: {
  status?: string; crmStatus?: string; followUpDate?: string; note?: string; source?: string;
}) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.status      !== undefined) patch.status         = data.status;
  if (data.crmStatus   !== undefined) patch.crm_status     = data.crmStatus;
  if (data.followUpDate !== undefined) patch.follow_up_date = data.followUpDate;
  if (data.source      !== undefined) patch.source         = data.source;
  if (data.note) {
    const { data: existing } = await supabase.from("inquiries").select("notes").eq("id", id).single();
    const notes: InquiryNote[] = (existing?.notes as InquiryNote[]) ?? [];
    notes.push({ id: crypto.randomUUID(), text: data.note, authorName: "Admin", createdAt: new Date().toISOString() });
    patch.notes = notes;
  }
  const { data: updated, error } = await supabase.from("inquiries").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToInquiry(updated as Record<string, unknown>);
}

export async function exportLeadsCsv(): Promise<Blob> {
  const inquiries = await getMyInquiries();
  const header = "id,fromName,fromEmail,propertyId,message,status,crmStatus,source,followUpDate,createdAt";
  const rows = inquiries.map(i =>
    [i.id, i.fromName, i.fromEmail, i.propertyId, `"${i.message}"`, i.status, i.crmStatus ?? "", i.source ?? "", i.followUpDate ?? "", i.createdAt].join(",")
  );
  return new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
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
  videoUrl?: string; seoImage?: string;
  seoTitle?: string; seoDescription?: string; seoKeywords?: string; canonicalUrl?: string;
  approvalStatus?: string; featured?: boolean; isPaused?: boolean;
  createdAt: string; updatedAt?: string;
};

function rowToListing(r: Record<string, unknown>): UserListing {
  return {
    id: r.id as string, ownerId: r.owner_id as string ?? "", ownerName: r.owner_name as string ?? "",
    ownerRole: r.owner_role as string ?? "", ownerPhone: r.owner_phone as string,
    title: r.title as string ?? "", titleAr: r.title_ar as string,
    summary: r.summary as string, summaryAr: r.summary_ar as string,
    location: r.location as string ?? "", locationAr: r.location_ar as string,
    price: r.price as string ?? "", type: r.type as string ?? "",
    listingType: r.listing_type as string, description: r.description as string ?? "",
    descriptionAr: r.description_ar as string,
    bedrooms: r.bedrooms as number, bathrooms: r.bathrooms as number,
    size: r.size as string, floor: r.floor as string,
    finishing: r.finishing as string, furnishing: r.furnishing as string,
    status: r.status as string ?? "available",
    imageUrl: r.image_url as string, images: r.images as string[] ?? [],
    tags: r.tags as string[] ?? [],
    whatsappPhone: r.whatsapp_phone as string, email: r.email as string,
    governorate: r.governorate as string, area: r.area as string, address: r.address as string,
    lat: r.lat as number, lng: r.lng as number,
    pricePerMeter: r.price_per_meter as string,
    installmentAvailable: r.installment_available as boolean,
    downPayment: r.down_payment as string, maintenanceFees: r.maintenance_fees as string,
    videoUrl: r.video_url as string, seoImage: r.seo_image as string,
    seoTitle: r.seo_title as string, seoDescription: r.seo_description as string,
    seoKeywords: r.seo_keywords as string, canonicalUrl: r.canonical_url as string,
    approvalStatus: r.approval_status as string ?? "pending",
    featured: r.featured as boolean, isPaused: r.is_paused as boolean,
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string,
  };
}

function listingToPatch(data: Partial<UserListing>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (data.title       !== undefined) p.title           = data.title;
  if (data.titleAr     !== undefined) p.title_ar        = data.titleAr;
  if (data.summary     !== undefined) p.summary         = data.summary;
  if (data.summaryAr   !== undefined) p.summary_ar      = data.summaryAr;
  if (data.location    !== undefined) p.location        = data.location;
  if (data.locationAr  !== undefined) p.location_ar     = data.locationAr;
  if (data.price       !== undefined) p.price           = data.price;
  if (data.type        !== undefined) p.type            = data.type;
  if (data.listingType !== undefined) p.listing_type    = data.listingType;
  if (data.description !== undefined) p.description     = data.description;
  if (data.descriptionAr !== undefined) p.description_ar = data.descriptionAr;
  if (data.bedrooms    !== undefined) p.bedrooms        = data.bedrooms;
  if (data.bathrooms   !== undefined) p.bathrooms       = data.bathrooms;
  if (data.size        !== undefined) p.size            = data.size;
  if (data.floor       !== undefined) p.floor           = data.floor;
  if (data.finishing   !== undefined) p.finishing       = data.finishing;
  if (data.furnishing  !== undefined) p.furnishing      = data.furnishing;
  if (data.status      !== undefined) p.status          = data.status;
  if (data.imageUrl    !== undefined) p.image_url       = data.imageUrl;
  if (data.images      !== undefined) p.images          = data.images;
  if (data.tags        !== undefined) p.tags            = data.tags;
  if (data.whatsappPhone !== undefined) p.whatsapp_phone = data.whatsappPhone;
  if (data.email       !== undefined) p.email           = data.email;
  if (data.governorate !== undefined) p.governorate     = data.governorate;
  if (data.area        !== undefined) p.area            = data.area;
  if (data.address     !== undefined) p.address         = data.address;
  if (data.lat         !== undefined) p.lat             = data.lat;
  if (data.lng         !== undefined) p.lng             = data.lng;
  if (data.pricePerMeter !== undefined) p.price_per_meter = data.pricePerMeter;
  if (data.installmentAvailable !== undefined) p.installment_available = data.installmentAvailable;
  if (data.downPayment !== undefined) p.down_payment    = data.downPayment;
  if (data.maintenanceFees !== undefined) p.maintenance_fees = data.maintenanceFees;
  if (data.videoUrl    !== undefined) p.video_url       = data.videoUrl;
  if (data.seoImage    !== undefined) p.seo_image       = data.seoImage;
  if (data.seoTitle    !== undefined) p.seo_title       = data.seoTitle;
  if (data.seoDescription !== undefined) p.seo_description = data.seoDescription;
  if (data.seoKeywords !== undefined) p.seo_keywords    = data.seoKeywords;
  if (data.canonicalUrl !== undefined) p.canonical_url  = data.canonicalUrl;
  if (data.approvalStatus !== undefined) p.approval_status = data.approvalStatus;
  if (data.featured    !== undefined) p.featured        = data.featured;
  if (data.isPaused    !== undefined) p.is_paused       = data.isPaused;
  if (data.ownerName   !== undefined) p.owner_name      = data.ownerName;
  if (data.ownerRole   !== undefined) p.owner_role      = data.ownerRole;
  if (data.ownerPhone  !== undefined) p.owner_phone     = data.ownerPhone;
  return p;
}

export async function getMyListings(): Promise<UserListing[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) return [];
  const { data, error } = await supabase.from("user_listings").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToListing);
}

export async function createListing(data: Partial<UserListing>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile } = await supabase.from("users").select("*").eq("auth_id", user.id).single();
  if (!profile) throw new Error("Profile not found");
  const patch = listingToPatch(data);
  patch.owner_id    = profile.id;
  patch.owner_name  = profile.full_name;
  patch.owner_role  = profile.role;
  patch.approval_status = "pending";
  const { data: inserted, error } = await supabase.from("user_listings").insert(patch).select().single();
  if (error) throw new Error(error.message);
  return rowToListing(inserted as Record<string, unknown>);
}

export async function updateListing(id: string, data: Partial<UserListing>) {
  const patch = { ...listingToPatch(data), updated_at: new Date().toISOString() };
  const { data: updated, error } = await supabase.from("user_listings").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToListing(updated as Record<string, unknown>);
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from("user_listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { message: "Deleted" };
}

// ─── Admin listing management ─────────────────────────────────────────────────
export async function getAdminListings(): Promise<UserListing[]> {
  const { data, error } = await supabase.from("user_listings").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToListing);
}

export async function createAdminListing(data: Partial<UserListing>): Promise<UserListing> {
  const { data: inserted, error } = await supabase.from("user_listings").insert(listingToPatch(data)).select().single();
  if (error) throw new Error(error.message);
  return rowToListing(inserted as Record<string, unknown>);
}

export async function updateAdminListing(id: string, data: Partial<UserListing>): Promise<UserListing> {
  const { data: updated, error } = await supabase.from("user_listings").update({ ...listingToPatch(data), updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToListing(updated as Record<string, unknown>);
}

export async function updateAdminListingApproval(id: string, status: string): Promise<UserListing> {
  const { data, error } = await supabase.from("user_listings").update({ approval_status: status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToListing(data as Record<string, unknown>);
}

export async function deleteAdminListing(id: string): Promise<void> {
  const { error } = await supabase.from("user_listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAllListingsAdmin(): Promise<UserListing[]> { return getAdminListings(); }
export async function setListingApproval(id: string, status: "approved" | "rejected" | "pending") { return updateAdminListingApproval(id, status); }
export async function adminDeleteListing(id: string) { return deleteAdminListing(id); }

// ─── Public Listings ──────────────────────────────────────────────────────────
export type PublicListing = UserListing;

export async function getPublicListings(): Promise<PublicListing[]> {
  try {
    const { data, error } = await supabase.from("user_listings").select("*").eq("approval_status", "approved").order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(rowToListing);
  } catch { return []; }
}

export async function getPublicListing(id: string): Promise<PublicListing | null> {
  try {
    const { data, error } = await supabase.from("user_listings").select("*").eq("id", id).single();
    if (error) return null;
    return rowToListing(data as Record<string, unknown>);
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
    id: r.id as string, developerId: r.developer_id as string ?? "",
    developerName: r.developer_name as string ?? "", name: r.name as string ?? "",
    location: r.location as string ?? "", units: r.units as number ?? 0,
    soldUnits: r.sold_units as number ?? 0, status: r.status as string ?? "active",
    deliveryDate: r.delivery_date as string ?? "", createdAt: r.created_at as string ?? "",
  };
}

export async function getMyProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) return [];
  const { data, error } = await supabase.from("dev_projects").select("*").eq("developer_id", profile.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToProject);
}

export async function createProject(data: Partial<Project>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile } = await supabase.from("users").select("id, full_name").eq("auth_id", user.id).single();
  const { data: inserted, error } = await supabase.from("dev_projects").insert({
    developer_id:   profile?.id,
    developer_name: profile?.full_name ?? "",
    name:           data.name ?? "",
    location:       data.location ?? "",
    units:          data.units ?? 0,
    sold_units:     data.soldUnits ?? 0,
    status:         data.status ?? "active",
    delivery_date:  data.deliveryDate ?? "",
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToProject(inserted as Record<string, unknown>);
}

export async function updateProject(id: string, data: Partial<Project>) {
  const patch: Record<string, unknown> = {};
  if (data.name         !== undefined) patch.name          = data.name;
  if (data.location     !== undefined) patch.location      = data.location;
  if (data.units        !== undefined) patch.units         = data.units;
  if (data.soldUnits    !== undefined) patch.sold_units    = data.soldUnits;
  if (data.status       !== undefined) patch.status        = data.status;
  if (data.deliveryDate !== undefined) patch.delivery_date = data.deliveryDate;
  const { data: updated, error } = await supabase.from("dev_projects").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToProject(updated as Record<string, unknown>);
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("dev_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { message: "Deleted" };
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const [users, inquiries, listings, views] = await Promise.all([
    supabase.from("users").select("created_at, plan, role"),
    supabase.from("inquiries").select("crm_status, created_at"),
    supabase.from("user_listings").select("approval_status"),
    supabase.from("property_views").select("property_id, view_count"),
  ]);

  const allUsers  = users.data ?? [];
  const allLeads  = inquiries.data ?? [];
  const allList   = listings.data ?? [];
  const allViews  = views.data ?? [];

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString("default", { month: "short", year: "2-digit" });
  });
  const userGrowth = months.map(label => ({
    label, users: allUsers.filter(u => {
      const d = new Date(u.created_at);
      return d.toLocaleString("default", { month: "short", year: "2-digit" }) === label;
    }).length,
  }));
  const leadsChart = months.map(label => ({
    label, leads: allLeads.filter(l => {
      const d = new Date(l.created_at);
      return d.toLocaleString("default", { month: "short", year: "2-digit" }) === label;
    }).length,
  }));

  const planCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};
  for (const u of allUsers) {
    planCounts[u.plan] = (planCounts[u.plan] ?? 0) + 1;
    roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
  }
  const planChart = Object.entries(planCounts).map(([name, value]) => ({ name, value }));
  const roleChart = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

  const crmCounts: Record<string, number> = {};
  for (const l of allLeads) {
    const s = l.crm_status ?? "new";
    crmCounts[s] = (crmCounts[s] ?? 0) + 1;
  }
  const crmFunnel = ["new","contacted","interested","viewing","negotiation","closed","sold"].map(stage => ({
    stage, count: crmCounts[stage] ?? 0,
  }));

  const topProperties = allViews.sort((a, b) => b.view_count - a.view_count).slice(0, 5).map(v => ({ id: v.property_id, views: v.view_count }));
  const totalViews = allViews.reduce((a, v) => a + v.view_count, 0);

  return {
    userGrowth, leadsChart, topProperties, planChart, roleChart, crmFunnel,
    listingStatus: {
      pending:  allList.filter(l => l.approval_status === "pending").length,
      approved: allList.filter(l => l.approval_status === "approved").length,
      rejected: allList.filter(l => l.approval_status === "rejected").length,
    },
    totals: { users: allUsers.length, leads: allLeads.length, listings: allList.length, totalViews },
    savedSearchAnalytics: undefined as undefined | {
      total: number; active: number; paused: number; totalAlertsSent: number;
      topSearchCombos: { combo: string; count: number }[];
      alertsChart: { label: string; alerts: number }[];
    },
  };
}

// ─── Saved Searches ───────────────────────────────────────────────────────────
export type SavedSearch = {
  id: string; name: string; filters: Record<string, string>;
  alertFrequency: string; paused: boolean; matchCount?: number;
  createdAt: string; updatedAt?: string;
};

function rowToSearch(r: Record<string, unknown>): SavedSearch {
  return {
    id: r.id as string, name: r.name as string ?? "",
    filters: r.filters as Record<string, string> ?? {},
    alertFrequency: r.alert_frequency as string ?? "instant",
    paused: r.paused as boolean ?? false,
    matchCount: r.match_count as number ?? 0,
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string,
  };
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) return [];
  const { data } = await supabase.from("saved_searches").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
  return (data ?? []).map(rowToSearch);
}

export async function saveSearch(name: string, filters: Record<string, string>): Promise<SavedSearch> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  const { alertFrequency, ...rest } = filters;
  const { data, error } = await supabase.from("saved_searches").insert({
    user_id: profile?.id, name, filters: rest,
    alert_frequency: alertFrequency ?? "instant",
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToSearch(data as Record<string, unknown>);
}

export async function updateSavedSearch(id: string, data: Partial<SavedSearch>): Promise<SavedSearch> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name           !== undefined) patch.name            = data.name;
  if (data.filters        !== undefined) patch.filters         = data.filters;
  if (data.alertFrequency !== undefined) patch.alert_frequency = data.alertFrequency;
  if (data.paused         !== undefined) patch.paused          = data.paused;
  const { data: updated, error } = await supabase.from("saved_searches").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToSearch(updated as Record<string, unknown>);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await supabase.from("saved_searches").delete().eq("id", id);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type ServerNotification = {
  id: string; type: string; title: string; body: string;
  read: boolean; propertyId?: string; searchId?: string;
  createdAt: string; openedAt?: string;
};

export async function getServerNotifications(): Promise<ServerNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) return [];
  const { data } = await supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
  return (data ?? []).map(r => ({
    id: r.id, type: r.type, title: r.title, body: r.body,
    read: r.read, propertyId: r.property_id, searchId: r.search_id,
    createdAt: r.created_at, openedAt: r.opened_at,
  }));
}

export async function markServerNotificationRead(notifId: string): Promise<void> {
  await supabase.from("notifications").update({ read: true, opened_at: new Date().toISOString() }).eq("id", notifId);
}

export async function markAllServerNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!profile) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id);
}

export async function deleteServerNotification(notifId: string): Promise<void> {
  await supabase.from("notifications").delete().eq("id", notifId);
}

export type AlertSettings = { emailFrequency: string; inApp: boolean };
export async function getAlertSettings(): Promise<AlertSettings> { return { emailFrequency: "instant", inApp: true }; }
export async function updateAlertSettings(data: Partial<AlertSettings>): Promise<AlertSettings> { return { emailFrequency: "instant", inApp: true, ...data }; }

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
    id: r.id as string, title: r.title as string ?? "", titleAr: r.title_ar as string ?? "",
    slug: r.slug as string ?? "", category: r.category as string ?? "",
    categoryAr: r.category_ar as string ?? "", summary: r.summary as string ?? "",
    summaryAr: r.summary_ar as string ?? "", content: r.content as string ?? "",
    contentAr: r.content_ar as string ?? "", coverImage: r.cover_image as string ?? "",
    status: (r.status as Article["status"]) ?? "draft",
    featured: r.featured as boolean ?? false, tags: r.tags as string[] ?? [],
    seoTitle: r.seo_title as string ?? "", seoDescription: r.seo_description as string ?? "",
    seoKeywords: r.seo_keywords as string[] ?? [], seoImage: r.seo_image as string ?? "",
    canonicalUrl: r.canonical_url as string ?? "", readingTime: r.reading_time as number ?? 0,
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string ?? "",
  };
}

export async function getArticles(status?: string): Promise<Article[]> {
  try {
    let q = supabase.from("articles").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []).map(rowToArticle);
  } catch { return []; }
}

export async function getArticle(id: string): Promise<Article | null> {
  try {
    const { data } = await supabase.from("articles").select("*").or(`id.eq.${id},slug.eq.${id}`).single();
    if (!data) return null;
    return rowToArticle(data as Record<string, unknown>);
  } catch { return null; }
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  const { data: inserted, error } = await supabase.from("articles").insert({
    title: data.title ?? "", title_ar: data.titleAr ?? "", slug: data.slug ?? "",
    category: data.category ?? "", category_ar: data.categoryAr ?? "",
    summary: data.summary ?? "", summary_ar: data.summaryAr ?? "",
    content: data.content ?? "", content_ar: data.contentAr ?? "",
    cover_image: data.coverImage ?? "", status: data.status ?? "draft",
    featured: data.featured ?? false, tags: data.tags ?? [],
    seo_title: data.seoTitle ?? "", seo_description: data.seoDescription ?? "",
    seo_keywords: data.seoKeywords ?? [], seo_image: data.seoImage ?? "",
    canonical_url: data.canonicalUrl ?? "", reading_time: data.readingTime ?? 0,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToArticle(inserted as Record<string, unknown>);
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  const { data: updated, error } = await supabase.from("articles").update({
    title: data.title, title_ar: data.titleAr, slug: data.slug,
    category: data.category, category_ar: data.categoryAr,
    summary: data.summary, summary_ar: data.summaryAr,
    content: data.content, content_ar: data.contentAr,
    cover_image: data.coverImage, status: data.status,
    featured: data.featured, tags: data.tags,
    seo_title: data.seoTitle, seo_description: data.seoDescription,
    seo_keywords: data.seoKeywords, seo_image: data.seoImage,
    canonical_url: data.canonicalUrl, reading_time: data.readingTime,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToArticle(updated as Record<string, unknown>);
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
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
    id: r.id as string, question: r.question as string ?? "", questionAr: r.question_ar as string ?? "",
    answer: r.answer as string ?? "", answerAr: r.answer_ar as string ?? "",
    category: r.category as string ?? "", categoryAr: r.category_ar as string ?? "",
    order: r.sort_order as number ?? 0,
    seoTitle: r.seo_title as string ?? "", seoTitleAr: r.seo_title_ar as string,
    seoDescription: r.seo_description as string ?? "", seoDescriptionAr: r.seo_description_ar as string,
    seoKeywords: r.seo_keywords as string[] ?? [], seoKeywordsAr: r.seo_keywords_ar as string[],
    canonicalUrl: r.canonical_url as string, seoImage: r.seo_image as string,
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string ?? "",
  };
}

export async function getFaqs(): Promise<FAQ[]> {
  try {
    const { data } = await supabase.from("faqs").select("*").order("sort_order");
    return (data ?? []).map(rowToFaq);
  } catch { return []; }
}

export async function createFaq(data: Partial<FAQ>): Promise<FAQ> {
  const { data: inserted, error } = await supabase.from("faqs").insert({
    question: data.question ?? "", question_ar: data.questionAr ?? "",
    answer: data.answer ?? "", answer_ar: data.answerAr ?? "",
    category: data.category ?? "", category_ar: data.categoryAr ?? "",
    sort_order: data.order ?? 0,
    seo_title: data.seoTitle ?? "", seo_title_ar: data.seoTitleAr,
    seo_description: data.seoDescription ?? "", seo_description_ar: data.seoDescriptionAr,
    seo_keywords: data.seoKeywords ?? [], seo_keywords_ar: data.seoKeywordsAr,
    canonical_url: data.canonicalUrl, seo_image: data.seoImage,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToFaq(inserted as Record<string, unknown>);
}

export async function updateFaq(id: string, data: Partial<FAQ>): Promise<FAQ> {
  const { data: updated, error } = await supabase.from("faqs").update({
    question: data.question, question_ar: data.questionAr,
    answer: data.answer, answer_ar: data.answerAr,
    category: data.category, category_ar: data.categoryAr, sort_order: data.order,
    seo_title: data.seoTitle, seo_title_ar: data.seoTitleAr,
    seo_description: data.seoDescription, seo_description_ar: data.seoDescriptionAr,
    seo_keywords: data.seoKeywords, seo_keywords_ar: data.seoKeywordsAr,
    canonical_url: data.canonicalUrl, seo_image: data.seoImage,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToFaq(updated as Record<string, unknown>);
}

export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Text Content ─────────────────────────────────────────────────────────────
export async function getTextContent(): Promise<Record<string, Record<string, string>>> {
  try {
    const { data } = await supabase.from("text_content").select("data").eq("id", 1).single();
    return (data?.data as Record<string, Record<string, string>>) ?? {};
  } catch { return {}; }
}

export async function updateTextContent(data: Record<string, Record<string, string>>) {
  const { error } = await supabase.from("text_content").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return data;
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
    const { data } = await supabase.from("section_seo").select("data").eq("id", 1).single();
    return (data?.data as Record<string, SectionSeoData>) ?? {};
  } catch { return {}; }
}

export async function updateSectionSeoData(data: Record<string, SectionSeoData>) {
  const { error } = await supabase.from("section_seo").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return data;
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
    id: r.id as string, slug: r.slug as string ?? "",
    name: r.name as string ?? "", nameAr: r.name_ar as string ?? "",
    developerName: r.developer_name as string ?? "", developerNameAr: r.developer_name_ar as string ?? "",
    logoUrl: r.logo_url as string ?? "", developerWebsite: r.developer_website as string ?? "",
    heroImage: r.hero_image as string ?? "", gallery: r.gallery as string[] ?? [],
    description: r.description as string ?? "", descriptionAr: r.description_ar as string ?? "",
    location: r.location as string ?? "", locationAr: r.location_ar as string ?? "",
    governorate: r.governorate as string ?? "", address: r.address as string ?? "",
    lat: r.lat as number | null, lng: r.lng as number | null,
    priceFrom: r.price_from as string ?? "", priceTo: r.price_to as string ?? "",
    status: r.status as string ?? "available", deliveryDate: r.delivery_date as string ?? "",
    totalUnits: r.total_units as number ?? 0, availableUnits: r.available_units as number ?? 0,
    amenities: r.amenities as string[] ?? [], amenitiesAr: r.amenities_ar as string[] ?? [],
    featured: r.featured as boolean ?? false, publishStatus: r.publish_status as string ?? "draft",
    order: r.sort_order as number ?? 0,
    brokerNotes: r.broker_notes as string ?? "", commissionNotes: r.commission_notes as string ?? "",
    seoTitle: r.seo_title as string ?? "", seoDescription: r.seo_description as string ?? "",
    seoKeywords: r.seo_keywords as string ?? "", seoImage: r.seo_image as string ?? "",
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string ?? "",
  };
}

export async function getPublicProjects(): Promise<PublicProject[]> {
  try {
    const { data } = await supabase.from("public_projects").select("*").eq("publish_status", "published").order("sort_order");
    return (data ?? []).map(rowToPublicProject);
  } catch { return []; }
}

export async function getPublicProject(id: string): Promise<PublicProject | null> {
  try {
    const { data } = await supabase.from("public_projects").select("*").or(`id.eq.${id},slug.eq.${id}`).single();
    return data ? rowToPublicProject(data as Record<string, unknown>) : null;
  } catch { return null; }
}

export async function getAdminProjects(): Promise<PublicProject[]> {
  const { data, error } = await supabase.from("public_projects").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToPublicProject);
}

export async function createAdminProject(data: Partial<PublicProject>): Promise<PublicProject> {
  const { data: inserted, error } = await supabase.from("public_projects").insert({
    slug: data.slug ?? "", name: data.name ?? "", name_ar: data.nameAr ?? "",
    developer_name: data.developerName ?? "", developer_name_ar: data.developerNameAr ?? "",
    logo_url: data.logoUrl ?? "", developer_website: data.developerWebsite ?? "",
    hero_image: data.heroImage ?? "", gallery: data.gallery ?? [],
    description: data.description ?? "", description_ar: data.descriptionAr ?? "",
    location: data.location ?? "", location_ar: data.locationAr ?? "",
    governorate: data.governorate ?? "", address: data.address ?? "",
    lat: data.lat ?? null, lng: data.lng ?? null,
    price_from: data.priceFrom ?? "", price_to: data.priceTo ?? "",
    status: data.status ?? "available", delivery_date: data.deliveryDate ?? "",
    total_units: data.totalUnits ?? 0, available_units: data.availableUnits ?? 0,
    amenities: data.amenities ?? [], amenities_ar: data.amenitiesAr ?? [],
    featured: data.featured ?? false, publish_status: data.publishStatus ?? "draft",
    sort_order: data.order ?? 0, broker_notes: data.brokerNotes ?? "",
    commission_notes: data.commissionNotes ?? "", seo_title: data.seoTitle ?? "",
    seo_description: data.seoDescription ?? "", seo_keywords: data.seoKeywords ?? "",
    seo_image: data.seoImage ?? "",
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToPublicProject(inserted as Record<string, unknown>);
}

export async function updateAdminProject(id: string, data: Partial<PublicProject>): Promise<PublicProject> {
  const { data: updated, error } = await supabase.from("public_projects").update({
    slug: data.slug, name: data.name, name_ar: data.nameAr,
    developer_name: data.developerName, developer_name_ar: data.developerNameAr,
    logo_url: data.logoUrl, developer_website: data.developerWebsite,
    hero_image: data.heroImage, gallery: data.gallery,
    description: data.description, description_ar: data.descriptionAr,
    location: data.location, location_ar: data.locationAr,
    governorate: data.governorate, address: data.address, lat: data.lat, lng: data.lng,
    price_from: data.priceFrom, price_to: data.priceTo,
    status: data.status, delivery_date: data.deliveryDate,
    total_units: data.totalUnits, available_units: data.availableUnits,
    amenities: data.amenities, amenities_ar: data.amenitiesAr,
    featured: data.featured, publish_status: data.publishStatus, sort_order: data.order,
    broker_notes: data.brokerNotes, commission_notes: data.commissionNotes,
    seo_title: data.seoTitle, seo_description: data.seoDescription,
    seo_keywords: data.seoKeywords, seo_image: data.seoImage,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToPublicProject(updated as Record<string, unknown>);
}

export async function deleteAdminProject(id: string): Promise<void> {
  const { error } = await supabase.from("public_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── CMS Pages ────────────────────────────────────────────────────────────────
export type CmsPage = {
  id: string; slug: string; title: string; titleAr: string;
  heroImage: string; heroTitle: string; heroTitleAr: string;
  content: string; contentAr: string; publishStatus: string;
  seoTitle: string; seoDescription: string; seoKeywords: string; ogImage: string;
  headCode?: string; bodyCode?: string;
  showInNav?: boolean; showInMenu?: boolean; showInFooter?: boolean;
  createdAt: string; updatedAt: string;
};

function rowToPage(r: Record<string, unknown>): CmsPage {
  return {
    id: r.id as string, slug: r.slug as string ?? "",
    title: r.title as string ?? "", titleAr: r.title_ar as string ?? "",
    heroImage: r.hero_image as string ?? "", heroTitle: r.hero_title as string ?? "",
    heroTitleAr: r.hero_title_ar as string ?? "",
    content: r.content as string ?? "", contentAr: r.content_ar as string ?? "",
    publishStatus: r.publish_status as string ?? "draft",
    seoTitle: r.seo_title as string ?? "", seoDescription: r.seo_description as string ?? "",
    seoKeywords: r.seo_keywords as string ?? "", ogImage: r.og_image as string ?? "",
    headCode: r.head_code as string ?? "", bodyCode: r.body_code as string ?? "",
    showInNav: r.show_in_nav as boolean ?? false,
    showInMenu: r.show_in_menu as boolean ?? false,
    showInFooter: r.show_in_footer as boolean ?? false,
    createdAt: r.created_at as string ?? "", updatedAt: r.updated_at as string ?? "",
  };
}

export async function getPublicPages(): Promise<CmsPage[]> {
  try {
    const { data } = await supabase.from("pages").select("*").eq("publish_status", "published").order("created_at");
    return (data ?? []).map(rowToPage);
  } catch { return []; }
}

export async function getPublicPage(slug: string): Promise<CmsPage | null> {
  try {
    const { data } = await supabase.from("pages").select("*").eq("slug", slug).eq("publish_status", "published").single();
    return data ? rowToPage(data as Record<string, unknown>) : null;
  } catch { return null; }
}

export async function getAdminPages(): Promise<CmsPage[]> {
  const { data, error } = await supabase.from("pages").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToPage);
}

export async function createAdminPage(data: Partial<CmsPage>): Promise<CmsPage> {
  const { data: inserted, error } = await supabase.from("pages").insert({
    slug: data.slug ?? "", title: data.title ?? "", title_ar: data.titleAr ?? "",
    hero_image: data.heroImage ?? "", hero_title: data.heroTitle ?? "",
    hero_title_ar: data.heroTitleAr ?? "", content: data.content ?? "",
    content_ar: data.contentAr ?? "", publish_status: data.publishStatus ?? "draft",
    seo_title: data.seoTitle ?? "", seo_description: data.seoDescription ?? "",
    seo_keywords: data.seoKeywords ?? "", og_image: data.ogImage ?? "",
    head_code: data.headCode ?? "", body_code: data.bodyCode ?? "",
    show_in_nav: data.showInNav ?? false, show_in_menu: data.showInMenu ?? false,
    show_in_footer: data.showInFooter ?? false,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToPage(inserted as Record<string, unknown>);
}

export async function updateAdminPage(id: string, data: Partial<CmsPage>): Promise<CmsPage> {
  const { data: updated, error } = await supabase.from("pages").update({
    slug: data.slug, title: data.title, title_ar: data.titleAr,
    hero_image: data.heroImage, hero_title: data.heroTitle, hero_title_ar: data.heroTitleAr,
    content: data.content, content_ar: data.contentAr, publish_status: data.publishStatus,
    seo_title: data.seoTitle, seo_description: data.seoDescription,
    seo_keywords: data.seoKeywords, og_image: data.ogImage,
    head_code: data.headCode, body_code: data.bodyCode,
    show_in_nav: data.showInNav, show_in_menu: data.showInMenu, show_in_footer: data.showInFooter,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToPage(updated as Record<string, unknown>);
}

export async function deleteAdminPage(id: string): Promise<void> {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── HTML Snippets ────────────────────────────────────────────────────────────
export type HtmlSnippet = {
  id: string; name: string; html: string;
  placement: "head" | "body-start" | "body-end" | "after-nav" | "before-footer";
  enabled: boolean; createdAt: string;
};

export async function getHtmlSnippets(): Promise<HtmlSnippet[]> {
  try {
    const { data } = await supabase.from("html_snippets").select("*").eq("enabled", true);
    return (data ?? []).map(r => ({ id: r.id, name: r.name, html: r.html, placement: r.placement, enabled: r.enabled, createdAt: r.created_at }));
  } catch { return []; }
}

export async function getAdminHtmlSnippets(): Promise<HtmlSnippet[]> {
  const { data, error } = await supabase.from("html_snippets").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({ id: r.id, name: r.name, html: r.html, placement: r.placement, enabled: r.enabled, createdAt: r.created_at }));
}

export async function createHtmlSnippet(data: Partial<HtmlSnippet>): Promise<HtmlSnippet> {
  const { data: inserted, error } = await supabase.from("html_snippets").insert({
    name: data.name ?? "", html: data.html ?? "", placement: data.placement ?? "body-end", enabled: data.enabled ?? true,
  }).select().single();
  if (error) throw new Error(error.message);
  return { id: inserted.id, name: inserted.name, html: inserted.html, placement: inserted.placement, enabled: inserted.enabled, createdAt: inserted.created_at };
}

export async function updateHtmlSnippet(id: string, data: Partial<HtmlSnippet>): Promise<HtmlSnippet> {
  const { data: updated, error } = await supabase.from("html_snippets").update({
    name: data.name, html: data.html, placement: data.placement, enabled: data.enabled,
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return { id: updated.id, name: updated.name, html: updated.html, placement: updated.placement, enabled: updated.enabled, createdAt: updated.created_at };
}

export async function deleteHtmlSnippet(id: string): Promise<void> {
  const { error } = await supabase.from("html_snippets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Media Gallery ────────────────────────────────────────────────────────────
export type MediaItem = {
  id: string; url: string; title: string; altText: string;
  caption: string; description: string; category: string;
  width?: number; height?: number; createdAt: string; updatedAt?: string;
  usedIn?: { type: string; label: string; id: string }[];
};

export async function uploadMediaFile(_dataUrl: string, _filename: string): Promise<{ url: string }> {
  // Upload to Supabase Storage
  const bytes = _dataUrl.split(",")[1];
  const binary = atob(bytes);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  const blob = new Blob([arr]);
  const path = `media/${Date.now()}-${_filename}`;
  const { data, error } = await supabase.storage.from("osoulk-media").upload(path, blob);
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from("osoulk-media").getPublicUrl(path);
  return { url: publicUrl };
}

export async function getAdminMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({
    id: r.id, url: r.url, title: r.title, altText: r.alt_text,
    caption: r.caption, description: r.description, category: r.category,
    width: r.width, height: r.height, usedIn: r.used_in,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }));
}

export async function createMediaItem(data: Partial<MediaItem>): Promise<MediaItem> {
  const { data: inserted, error } = await supabase.from("media").insert({
    url: data.url ?? "", title: data.title ?? "", alt_text: data.altText ?? "",
    caption: data.caption ?? "", description: data.description ?? "",
    category: data.category ?? "", width: data.width, height: data.height, used_in: data.usedIn ?? [],
  }).select().single();
  if (error) throw new Error(error.message);
  return { id: inserted.id, url: inserted.url, title: inserted.title, altText: inserted.alt_text, caption: inserted.caption, description: inserted.description, category: inserted.category, width: inserted.width, height: inserted.height, usedIn: inserted.used_in, createdAt: inserted.created_at, updatedAt: inserted.updated_at };
}

export async function updateMediaItem(id: string, data: Partial<MediaItem>): Promise<MediaItem> {
  const { data: updated, error } = await supabase.from("media").update({
    url: data.url, title: data.title, alt_text: data.altText,
    caption: data.caption, description: data.description, category: data.category,
    width: data.width, height: data.height, used_in: data.usedIn,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return { id: updated.id, url: updated.url, title: updated.title, altText: updated.alt_text, caption: updated.caption, description: updated.description, category: updated.category, width: updated.width, height: updated.height, usedIn: updated.used_in, createdAt: updated.created_at, updatedAt: updated.updated_at };
}

export async function deleteMediaItem(id: string): Promise<void> {
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export async function getActivityLog() {
  const { data, error } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({
    id: r.id, type: r.type, event: r.event, subject: r.subject,
    userId: r.user_id ?? "", userName: r.user_name ?? "", createdAt: r.created_at,
  }));
}

// ─── Server health (stub — no Express server needed) ─────────────────────────
export async function getServerHealth() {
  const { data } = await supabase.from("site_settings").select("updated_at").eq("id", 1).single();
  return {
    status: "ok", db: "supabase",
    timestamp: new Date().toISOString(),
    note: "Running on Supabase — no Express server required.",
    lastSettingsUpdate: data?.updated_at,
  };
}

export async function getServerLogs() { return []; }

export interface DbStatusResult {
  mode: "supabase" | "mysql" | "json-files";
  connected: boolean; host: string | null; port: string | null;
  database: string | null; latencyMs: number | null; message?: string; error?: string; hint?: string;
}

export async function getDbStatus(): Promise<DbStatusResult> {
  const start = Date.now();
  const { error } = await supabase.from("site_settings").select("id").eq("id", 1).single();
  return {
    mode: "supabase", connected: !error,
    host: import.meta.env.VITE_SUPABASE_URL ?? null,
    port: "443", database: "supabase",
    latencyMs: Date.now() - start,
    ...(error && { error: error.message }),
  };
}

// ─── Pages helper (for nav) ───────────────────────────────────────────────────
export async function getPages() {
  return getPublicPages();
}
