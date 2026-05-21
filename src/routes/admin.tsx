import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { useLang } from "@/lib/language";
import {
  ShieldCheck, FileCheck2, Video, Users, BarChart3, Mail,
  CheckCircle2, XCircle, Clock, RefreshCw, Layers3, Globe2,
  LogOut, Activity, Server, Search, ChevronDown, ChevronUp,
  Trash2, UserCheck, UserX, Edit2, Save, X, Eye, TrendingUp,
  AlertCircle, Cpu, Database, Wifi, LayoutDashboard, Settings,
  MessageSquare, Menu, Sliders, Layout, ArrowUp, ArrowDown, PieChart,
  BookOpen, HelpCircle, FileText, Plus, KeyRound, Tag, UserPlus,
  Globe, Newspaper, Building2, Palette, Code2, FileStack, ExternalLink,
  CalendarClock, BadgeCheck, Image, Upload, Filter, Copy, Link,
  MapPin, Phone, Star, DollarSign, Home, List,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  adminLogin, setAdminKey, clearAdminKey, getAdminKey,
  getSubscribers, getStats, getUsers, updateUser, deleteUser,
  getReelRequests, updateReelRequest, deleteReelRequest,
  getSeoData, updateSeoPage, getServerHealth, getServerLogs, getDbStatus, type DbStatusResult,
  getSiteSettings, updateSiteSettings, applyThemeToDOM, getSections, getAdminSections, updateSections, updateSectionContent,
  getAnalytics, adminCreateUser, adminResetPassword,
  getArticles, createArticle, updateArticle, deleteArticle,
  getFaqs, createFaq, updateFaq, deleteFaq,
  getTextContent, updateTextContent,
  getSectionSeoData, updateSectionSeoData, type SectionSeoData,
  getAdminProjects, createAdminProject, updateAdminProject, deleteAdminProject,
  getAdminPages, createAdminPage, updateAdminPage, deleteAdminPage,
  getAdminHtmlSnippets, createHtmlSnippet, updateHtmlSnippet, deleteHtmlSnippet,
  getActivityLog,
  getAdminMedia, createMediaItem, updateMediaItem, deleteMediaItem,
  uploadMediaFile, addSeoPage, deleteSeoPage,
  getAdminListings, createAdminListing, updateAdminListing, updateAdminListingApproval, deleteAdminListing,
  type AdminUser, type ReelRequest, type SeoData,
  type SiteSettings, type ContentSection, type Article, type FAQ,
  type PublicProject, type CmsPage, type HtmlSnippet, type MediaItem,
} from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Osoulk" },
      { name: "description", content: "Osoulk admin panel — secure management of users, reels, SEO, and server." },
    ],
  }),
  component: AdminRoot,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = {
  subscribers: number; users: number; listings: number; reels: number;
  agencies: number; pendingApprovals: number; approvedReels: number; totalViews: number;
  growth?: number | null; articles?: number; projects?: number;
  newUsers?: number; pendingListings?: number;
};

type SidebarItem = {
  id: string; label: string; icon: React.ElementType;
};

type SidebarGroup = {
  id: string; label: string; icon: React.ElementType; items: SidebarItem[];
};

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
      { id: "analytics", label: "Analytics",  icon: PieChart },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: BookOpen,
    items: [
      { id: "sections",    label: "Content Sections", icon: Layout },
      { id: "textcontent", label: "Text Content",     icon: FileText },
      { id: "articles",    label: "Articles & Blog",  icon: Newspaper },
      { id: "faqs",        label: "FAQs",             icon: HelpCircle },
      { id: "pages",       label: "Pages",            icon: FileStack },
    ],
  },
  {
    id: "properties",
    label: "Properties",
    icon: Building2,
    items: [
      { id: "listings",     label: "Listings Manager",     icon: List },
      { id: "projects",     label: "Projects & Compounds", icon: Building2 },
      { id: "media",        label: "Media Gallery",        icon: Image },
      { id: "htmlsnippets", label: "Custom HTML",          icon: Code2 },
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    items: [
      { id: "crm",         label: "Users & CRM",   icon: Users },
      { id: "reels",       label: "Reel Requests", icon: Video },
      { id: "subscribers", label: "Subscribers",   icon: Mail },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Sliders,
    items: [
      { id: "settings",    label: "Site Settings", icon: Sliders },
      { id: "theme",       label: "Theme & Colors",icon: Palette },
      { id: "seo",         label: "SEO",           icon: Globe2 },
      { id: "server",      label: "Server Status", icon: Server },
      { id: "activitylog", label: "Activity Log",  icon: Activity },
    ],
  },
];

const SIDEBAR: SidebarItem[] = SIDEBAR_GROUPS.flatMap(g => g.items);

const PLANS = ["free", "starter", "elite", "investor"] as const;
type Plan = typeof PLANS[number];

const USER_ROLES = ["individual", "broker", "developer", "admin", "data-entry"] as const;
type UserRole = typeof USER_ROLES[number];

const ROLE_BADGE: Record<string, string> = {
  individual:   "bg-aqua/10 text-aqua",
  broker:       "bg-gold/10 text-gold",
  developer:    "bg-navy/10 text-navy",
  admin:        "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "data-entry": "bg-purple-50 text-purple-700 border border-purple-200",
};

// ─── Login Screen ─────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await adminLogin(password);
      setAdminKey(token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="premium-card p-8">
          <div className="mb-8 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-navy" />
            <h1 className="mt-4 text-3xl font-black text-navy">{t("admin.login.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("admin.login.subtitle")}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-navy" htmlFor="admin-password">
                {t("admin.login.label")}
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                placeholder={t("admin.login.placeholder")}
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t("admin.login.verifying") : t("admin.login.btn")}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("admin.login.defaultPwd")} <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">osoulk2026</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: React.ReactNode; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="premium-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
          <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${color.replace("text-", "bg-").replace("navy", "navy/10").replace("aqua", "aqua/10").replace("gold", "gold/10")}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-secondary text-muted-foreground",
    starter: "bg-blue-50 text-blue-700",
    elite: "bg-gold/10 text-gold-foreground border border-gold/30",
    investor: "bg-navy/10 text-navy",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${colors[plan] ?? colors.free}`}>
      {plan}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  if (status === "active") {
    return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.active")}</span>;
  }
  return <span className="flex items-center gap-1 text-xs font-bold text-destructive"><XCircle className="h-3.5 w-3.5" /> {t("admin.inactive")}</span>;
}

// ─── Reel Status Badge ────────────────────────────────────────────────────────
function ReelStatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  if (status === "approved") return <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> {t("admin.approved")}</span>;
  if (status === "rejected") return <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive"><XCircle className="h-3 w-3" /> {t("admin.rejected")}</span>;
  return <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Clock className="h-3 w-3" /> {t("admin.pending")}</span>;
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const { t } = useLang();
  const statCards = [
    { label: t("admin.stat.users"),        value: stats?.users ?? "—",            icon: Users,        color: "text-navy",        sub: t("admin.stat.members") },
    { label: t("admin.stat.subscribers"),  value: stats?.subscribers ?? "—",      icon: Mail,         color: "text-aqua",        sub: t("admin.stat.newsletter") },
    { label: t("admin.stat.listings"),     value: stats?.listings ?? "—",         icon: Layers3,      color: "text-navy",        sub: t("admin.stat.activeProps") },
    { label: t("admin.stat.views"),        value: stats?.totalViews ?? "—",       icon: Eye,          color: "text-gold",        sub: t("admin.stat.totalViews") },
    { label: t("admin.stat.reels"),        value: stats?.pendingApprovals ?? "—", icon: Video,        color: "text-gold",        sub: t("admin.stat.pendingReview") },
    { label: t("admin.stat.approvedReels"),value: stats?.approvedReels ?? "—",    icon: CheckCircle2, color: "text-aqua",        sub: t("admin.stat.publishedVideos") },
    { label: t("admin.stat.agencies"),     value: stats?.agencies ?? "—",         icon: Globe2,       color: "text-navy",        sub: t("admin.stat.activePartners") },
    { label: t("admin.stat.growth"),       value: stats == null ? "—" : stats.growth == null ? "N/A" : (stats.growth >= 0 ? `+${stats.growth}%` : `${stats.growth}%`), icon: TrendingUp, color: stats?.growth != null && stats.growth >= 0 ? "text-emerald-600" : "text-red-500", sub: t("admin.stat.vsLastMonth") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-5 text-2xl font-black text-navy">{t("admin.dash.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(card => (
            <StatCard
              key={card.label}
              {...card}
              value={loading ? <span className="animate-pulse text-muted-foreground">…</span> : card.value}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { icon: ShieldCheck, titleKey: "admin.dash.reelApprovals",    descKey: "admin.dash.reelApprovalsDesc",    color: "text-aqua" },
          { icon: FileCheck2,  titleKey: "admin.dash.listingApprovals", descKey: "admin.dash.listingApprovalsDesc", color: "text-gold" },
          { icon: BarChart3,   titleKey: "admin.dash.seoHealth",        descKey: "admin.dash.seoHealthDesc",        color: "text-navy" },
        ].map(({ icon: Icon, titleKey, descKey, color }) => (
          <div key={titleKey} className="premium-card p-6">
            <Icon className={`h-7 w-7 ${color}`} />
            <h3 className="mt-3 text-lg font-black text-navy">{t(titleKey)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t(descKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CRM Tab ──────────────────────────────────────────────────────────────────
function CRMTab({ adminKey }: { adminKey: string }) {
  const { t } = useLang();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<Plan>("free");
  const [editPlanExpiry, setEditPlanExpiry] = useState<string>("");
  const [editIsFree, setEditIsFree] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Create User Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "", role: "individual", plan: "free", company: "", password: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<{ tempPassword?: string; message?: string } | null>(null);
  const [createError, setCreateError] = useState("");

  // Reset Password
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ id: string; pwd: string } | null>(null);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true); setCreateError(""); setCreateResult(null);
    try {
      const res = await adminCreateUser(createForm);
      setCreateResult({ tempPassword: res.tempPassword, message: res.message });
      setUsers(prev => [res.user, ...prev]);
      setCreateForm({ fullName: "", email: "", phone: "", role: "individual", plan: "free", company: "", password: "" });
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResetPassword(id: string) {
    try {
      const res = await adminResetPassword(id);
      setResetResult({ id, pwd: res.newPassword });
    } catch {
      setError("Failed to reset password");
    } finally {
      setResetPasswordId(null);
    }
  }

  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await getUsers());
    } catch {
      setError("Failed to load users. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").includes(q);
    const matchesPlan = planFilter === "all" || u.plan === planFilter;
    const matchesRole = roleFilter === "all" || ((u as any).role || "individual") === roleFilter;
    return matchesSearch && matchesPlan && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleUpdatePlan(id: string, plan: Plan) {
    setSaving(true);
    try {
      const payload: any = { plan };
      if (editPlanExpiry) payload.planExpiry = editPlanExpiry;
      payload.isFree = editIsFree;
      const updated = await updateUser(id, payload);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      setEditingId(null);
    } catch {
      setError("Failed to update plan");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(id: string, current: string) {
    try {
      const updated = await updateUser(id, { status: current === "active" ? "inactive" : "active" });
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch {
      setError("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setConfirmDelete(null);
    } catch {
      setError("Failed to delete user");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.crm.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} {t("admin.crm.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setCreateResult(null); setCreateError(""); }} className="flex items-center gap-2 rounded-xl bg-navy text-white px-4 py-2 text-sm font-bold hover:bg-navy/80 transition-colors">
            <UserPlus className="h-4 w-4" /> {t("admin.crm.createUser")}
          </button>
          <button onClick={load} className="flex items-center gap-2 text-sm font-bold text-navy border rounded-xl px-4 py-2 hover:bg-secondary transition-colors">
            <RefreshCw className="h-4 w-4" /> {t("admin.refresh")}
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-premium p-7 relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-black text-navy mb-5 flex items-center gap-2"><UserPlus className="h-5 w-5" /> {t("admin.crm.createTitle")}</h3>
            {createResult ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                  <p className="font-black text-emerald-800">{t("admin.crm.accountCreated")}</p>
                  {createResult.tempPassword && (
                    <div className="mt-3">
                      <p className="text-sm text-emerald-700">{t("admin.crm.tempPwd")}</p>
                      <p className="mt-1 font-mono font-black text-lg bg-white rounded-lg px-4 py-2 border">{createResult.tempPassword}</p>
                      <p className="text-xs text-emerald-600 mt-1">{t("admin.crm.shareSecurely")}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowCreate(false); setCreateResult(null); }} className="w-full rounded-xl bg-navy text-white py-2.5 font-bold">{t("admin.close")}</button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-3">
                {createError && <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-2 text-sm text-destructive">{createError}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.fullName")}</label>
                    <input required value={createForm.fullName} onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.email")}</label>
                    <input required type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.phone")}</label>
                    <input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.company")}</label>
                    <input value={createForm.company} onChange={e => setCreateForm(f => ({ ...f, company: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.role")}</label>
                    <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none">
                      {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.plan")}</label>
                    <select value={createForm.plan} onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none">
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-black text-muted-foreground">{t("admin.crm.password")}</label>
                    <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder={t("admin.crm.pwdPlaceholder")} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  </div>
                </div>
                <button type="submit" disabled={createLoading} className="w-full rounded-xl bg-navy text-white py-2.5 font-bold disabled:opacity-60">
                  {createLoading ? t("admin.crm.creating") : t("admin.crm.createAccount")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Result Toast */}
      {resetResult && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-amber-800">{t("admin.crm.pwdReset")}</p>
              <p className="text-sm text-amber-700 mt-1">{t("admin.crm.newPwd")} <span className="font-mono font-black bg-white px-2 py-0.5 rounded border">{resetResult.pwd}</span></p>
            </div>
            <button onClick={() => setResetResult(null)} className="text-amber-600 hover:text-amber-900"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Reset Password Confirm */}
      {resetPasswordId && (
        <div className="rounded-xl border border-navy/20 bg-navy/5 p-4 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-navy">{t("admin.crm.confirmReset")}</p>
          <div className="flex gap-2">
            <button onClick={() => handleResetPassword(resetPasswordId)} className="rounded-lg bg-navy text-white px-4 py-1.5 text-sm font-bold">{t("admin.confirm")}</button>
            <button onClick={() => setResetPasswordId(null)} className="rounded-lg bg-secondary text-navy px-4 py-1.5 text-sm font-bold">{t("admin.cancel")}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={t("admin.crm.searchPlaceholder")}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border bg-background px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="all">{t("admin.crm.allPlans")}</option>
          {PLANS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border bg-background px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="all">{t("admin.crm.allRoles")}</option>
          {USER_ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : paged.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-black text-navy">{search || planFilter !== "all" ? t("admin.crm.noMatch") : t("admin.crm.noUsers")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.crm.usersAppear")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-float">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b bg-secondary">
                <tr>
                  {[t("admin.crm.table.user"), t("admin.crm.table.email"), t("admin.crm.table.role"), t("admin.crm.table.plan"), t("admin.crm.table.status"), t("admin.crm.table.joined"), t("admin.crm.table.actions")].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.map(user => {
                  const role = (user as any).role || "individual";
                  return (
                  <tr key={user.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-navy">{user.fullName}</p>
                      {(user as any).company && <p className="text-xs text-muted-foreground">{(user as any).company}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <p>{user.email}</p>
                      {user.phone && <p className="text-xs">{user.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={role}
                        onChange={async e => {
                          const newRole = e.target.value as UserRole;
                          try {
                            const updated = await updateUser(user.id, { role: newRole } as any);
                            setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
                          } catch { setError("Failed to change role"); }
                        }}
                        className={`h-8 rounded-full px-3 text-xs font-black uppercase tracking-wide ${ROLE_BADGE[role] || ROLE_BADGE.individual}`}
                      >
                        {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      {editingId === user.id ? (
                        <div className="space-y-2 min-w-[200px]">
                          <select
                            value={editPlan}
                            onChange={e => setEditPlan(e.target.value as Plan)}
                            className="h-8 w-full rounded-lg border bg-background px-2 text-xs font-bold"
                          >
                            {PLANS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                          </select>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editPlanExpiry}
                              onChange={e => setEditPlanExpiry(e.target.value)}
                              className="h-7 flex-1 rounded-lg border bg-background px-2 text-xs"
                              placeholder="Plan expiry date"
                            />
                            <label className="flex items-center gap-1 text-xs font-bold text-navy whitespace-nowrap cursor-pointer">
                              <input type="checkbox" checked={editIsFree} onChange={e => setEditIsFree(e.target.checked)} className="h-3.5 w-3.5" />
                              {t("admin.free")}
                            </label>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdatePlan(user.id, editPlan)} disabled={saving} className="flex-1 rounded-lg bg-navy text-white py-1 text-xs font-bold disabled:opacity-50">
                              <Save className="h-3 w-3 inline mr-1" />{t("admin.save")}
                            </button>
                            <button onClick={() => setEditingId(null)} className="rounded-lg border px-2 text-xs text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <PlanBadge plan={user.plan || "free"} />
                          {(user as any).isFree && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">Free</span>}
                          {(user as any).planExpiry && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><CalendarClock className="h-3 w-3" />{new Date((user as any).planExpiry).toLocaleDateString("ar-EG")}</span>}
                          <button
                            onClick={() => {
                              setEditingId(user.id);
                              setEditPlan((user.plan || "free") as Plan);
                              setEditPlanExpiry((user as any).planExpiry?.slice(0,10) || "");
                              setEditIsFree(!!(user as any).isFree);
                            }}
                            className="text-muted-foreground hover:text-navy transition-colors"
                            title="Change plan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status || "active"} />
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status || "active")}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${user.status === "inactive" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                          title={user.status === "active" ? "Deactivate user" : "Activate user"}
                        >
                          {user.status === "inactive" ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                          {user.status === "inactive" ? t("admin.activate") : t("admin.deactivate")}
                        </button>
                        <button
                          onClick={() => setResetPasswordId(user.id)}
                          className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                          title={t("admin.crm.pwdReset")}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(user.id)} className="rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20">{t("admin.confirm")}</button>
                            <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary">{t("admin.cancel")}</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="flex items-center gap-1 rounded-lg bg-destructive/5 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> {t("admin.delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("admin.showing").replace("{from}", String((page - 1) * PAGE_SIZE + 1)).replace("{to}", String(Math.min(page * PAGE_SIZE, filtered.length))).replace("{total}", String(filtered.length))}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm font-bold disabled:opacity-40 hover:bg-secondary transition-colors"
                >
                  {t("admin.prev")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${n === page ? "bg-navy text-primary-foreground" : "border hover:bg-secondary"}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border px-3 py-1.5 text-sm font-bold disabled:opacity-40 hover:bg-secondary transition-colors"
                >
                  {t("admin.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Reels Tab ────────────────────────────────────────────────────────────────
function ReelsTab({ adminKey }: { adminKey: string }) {
  const { t } = useLang();
  const [requests, setRequests] = useState<ReelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await getReelRequests());
    } catch {
      setError("Failed to load reel requests.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter === "all" ? requests : requests.filter(r => r.status === statusFilter);

  const counts = {
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  async function handleAction(id: string, status: "approved" | "rejected") {
    setProcessing(id);
    try {
      const updated = await updateReelRequest(id, status);
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
    } catch {
      setError("Action failed");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReelRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      setConfirmDelete(null);
    } catch {
      setError("Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.reels.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.reels.subtitle")}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm font-bold text-navy hover:underline">
          <RefreshCw className="h-4 w-4" /> {t("admin.refresh")}
        </button>
      </div>

      {/* Count pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: t("admin.reels.all"),      val: "all",      count: requests.length },
          { label: t("admin.reels.pending"),   val: "pending",  count: counts.pending,  color: "text-amber-700" },
          { label: t("admin.reels.approved"),  val: "approved", count: counts.approved, color: "text-emerald-700" },
          { label: t("admin.reels.rejected"),  val: "rejected", count: counts.rejected, color: "text-destructive" },
        ].map(({ label, val, count, color }) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${statusFilter === val ? "bg-navy text-primary-foreground border-navy" : "hover:bg-secondary"}`}
          >
            {label}
            <span className={`rounded-full bg-current/10 px-2 py-0.5 text-xs ${statusFilter === val ? "" : (color ?? "text-muted-foreground")}`}>{count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Video className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-black text-navy">{statusFilter === "all" ? t("admin.reels.noRequests") : t("admin.reels.noStatus")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.reels.requestsAppear")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="overflow-hidden rounded-2xl border bg-card shadow-float">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-black text-navy">{req.name}</p>
                    <ReelStatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{req.email}</p>
                  {req.reason && (
                    <p className="mt-2 max-w-md rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
                      <MessageSquare className="mr-1.5 inline h-3.5 w-3.5" />"{req.reason}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Submitted {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {req.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(req.id, "approved")}
                      disabled={processing === req.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {t("admin.reels.approve")}
                    </Button>
                  )}
                  {req.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(req.id, "rejected")}
                      disabled={processing === req.id}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" /> {t("admin.reels.reject")}
                    </Button>
                  )}
                  {confirmDelete === req.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(req.id)} className="border-destructive text-destructive">
                        {t("admin.reels.confirmDelete")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>{t("admin.cancel")}</Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(req.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SEO Tab ──────────────────────────────────────────────────────────────────
function SEOTab() {
  const { t } = useLang();
  const [seo, setSeo] = useState<SeoData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "", keywords: "", keywordsAr: "", canonicalUrl: "", canonicalUrlAr: "", ogImage: "" });
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordInputAr, setKeywordInputAr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [newPageKey, setNewPageKey] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [seoLang, setSeoLang] = useState<"ar" | "en">("ar");
  const [langDropOpen, setLangDropOpen] = useState(false);
  const langDropRef = useRef<HTMLDivElement>(null);
  const DEFAULT_PAGES = ["home","explore","contact","about","packages","agencies","articles","properties","projects"];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) setLangDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getSeoData()
      .then(data => { setSeo(data); setLoading(false); })
      .catch(() => { setError("Failed to load SEO data."); setLoading(false); });
  }, []);

  function startEdit(page: string) {
    setEditing(page);
    setKeywordInput("");
    setKeywordInputAr("");
    const p = seo[page] as any;
    setEditForm({
      titleAr: p?.titleAr ?? p?.title ?? "",
      titleEn: p?.titleEn ?? "",
      descriptionAr: p?.descriptionAr ?? p?.description ?? "",
      descriptionEn: p?.descriptionEn ?? "",
      keywords: p?.keywords ?? "",
      keywordsAr: p?.keywordsAr ?? "",
      canonicalUrl: p?.canonicalUrl ?? "",
      canonicalUrlAr: p?.canonicalUrlAr ?? "",
      ogImage: p?.ogImage ?? "",
    });
  }

  function addKeyword(val: string, field: "keywords" | "keywordsAr" = "keywords") {
    const kw = val.trim();
    if (!kw) return;
    const current = editForm[field].split(",").map(k => k.trim()).filter(Boolean);
    if (!current.includes(kw)) {
      setEditForm(f => ({ ...f, [field]: [...current, kw].join(", ") }));
    }
    if (field === "keywords") setKeywordInput("");
    else setKeywordInputAr("");
  }

  function removeKeyword(kw: string, field: "keywords" | "keywordsAr" = "keywords") {
    const updated = editForm[field].split(",").map(k => k.trim()).filter(k => k && k !== kw);
    setEditForm(f => ({ ...f, [field]: updated.join(", ") }));
  }

  async function saveEdit(page: string) {
    setSaving(true);
    try {
      const updated = await updateSeoPage(page, editForm as any);
      setSeo(prev => ({ ...prev, [page]: updated }));
      setEditing(null);
      setSaved(page);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("Failed to save SEO data.");
    } finally {
      setSaving(false);
    }
  }

  const pages = Object.keys(seo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.seo.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.seo.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Global language switcher — same pattern as the referenced product form */}
          <div ref={langDropRef} className="relative">
            <button
              onClick={() => setLangDropOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg border border-navy/20 bg-background px-3 py-2 text-sm font-bold text-navy shadow-sm hover:bg-secondary transition-colors"
            >
              <Globe2 className="h-4 w-4 text-navy" />
              {seoLang === "ar" ? "العربية" : "English"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langDropOpen ? "rotate-180" : ""}`} />
            </button>
            {langDropOpen && (
              <div className="absolute end-0 top-full z-50 mt-1 min-w-[130px] overflow-hidden rounded-xl border bg-background shadow-premium">
                <button
                  onClick={() => { setSeoLang("ar"); setLangDropOpen(false); }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-secondary ${seoLang === "ar" ? "text-navy bg-secondary/50" : "text-muted-foreground"}`}
                >
                  العربية {seoLang === "ar" && <span className="text-navy">✓</span>}
                </button>
                <button
                  onClick={() => { setSeoLang("en"); setLangDropOpen(false); }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-secondary ${seoLang === "en" ? "text-navy bg-secondary/50" : "text-muted-foreground"}`}
                >
                  English {seoLang === "en" && <span className="text-navy">✓</span>}
                </button>
              </div>
            )}
          </div>

          {addingPage ? (
            <div className="flex items-center gap-2">
              <input
                value={newPageKey}
                onChange={e => setNewPageKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-9 w-36 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="page-key"
                onKeyDown={async e => {
                  if (e.key === "Enter" && newPageKey) {
                    await addSeoPage(newPageKey);
                    const fresh = await import("@/lib/api").then(m => m.getSeoData());
                    setSeo(fresh);
                    setNewPageKey(""); setAddingPage(false);
                  }
                  if (e.key === "Escape") setAddingPage(false);
                }}
                autoFocus
              />
              <Button size="sm" onClick={async () => {
                if (!newPageKey) return;
                await addSeoPage(newPageKey);
                const fresh = await import("@/lib/api").then(m => m.getSeoData());
                setSeo(fresh); setNewPageKey(""); setAddingPage(false);
              }}><Plus className="h-4 w-4" />Add</Button>
              <Button size="sm" variant="outline" onClick={() => setAddingPage(false)}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setAddingPage(true)}><Plus className="h-4 w-4" /> Add Page</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); getSeoData().then(d => { setSeo(d); setLoading(false); }); }}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map(page => {
            const p = seo[page] as any;
            const isEditing = editing === page;
            const isAr = seoLang === "ar";

            return (
              <div key={page} className="overflow-hidden rounded-2xl border bg-card shadow-float flex flex-col">
                {/* Card header */}
                <div className="flex items-center justify-between border-b bg-secondary px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-navy" />
                    <span className="font-black capitalize text-navy">{page}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isAr ? "bg-navy/10 text-navy" : "bg-aqua/20 text-aqua"}`}>
                      {isAr ? "AR" : "EN"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {saved === page && <span className="text-xs font-bold text-emerald-600">✓</span>}
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(page)} disabled={saving}>
                          <Save className="h-3.5 w-3.5" /> {saving ? "…" : t("admin.save")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(page)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!DEFAULT_PAGES.includes(page) && (
                      confirmRemove === page ? (
                        <>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={async () => {
                            await deleteSeoPage(page);
                            setSeo(prev => { const n = { ...prev }; delete n[page]; return n; });
                            setConfirmRemove(null);
                          }}>Del</Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmRemove(null)}><X className="h-3.5 w-3.5" /></Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmRemove(page)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Card body — driven by global seoLang, no per-card tabs */}
                <div className="flex-1 p-4 space-y-3">
                  {isEditing ? (
                    <div className="space-y-3" dir={isAr ? "rtl" : "ltr"}>
                      {/* Meta Title */}
                      <div>
                        <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                          {isAr ? "عنوان الصفحة — Meta Title" : "Meta Title"}
                        </label>
                        <input
                          dir={isAr ? "rtl" : "ltr"}
                          value={isAr ? editForm.titleAr : editForm.titleEn}
                          onChange={e => setEditForm(f => isAr ? { ...f, titleAr: e.target.value } : { ...f, titleEn: e.target.value })}
                          className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          maxLength={60}
                          placeholder={isAr ? "عنوان الصفحة بالعربية" : "Page title in English"}
                        />
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{(isAr ? editForm.titleAr : editForm.titleEn).length}/60</p>
                      </div>
                      {/* Meta Description */}
                      <div>
                        <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                          {isAr ? "وصف الصفحة — Meta Description" : "Meta Description"}
                        </label>
                        <textarea
                          dir={isAr ? "rtl" : "ltr"}
                          value={isAr ? editForm.descriptionAr : editForm.descriptionEn}
                          onChange={e => setEditForm(f => isAr ? { ...f, descriptionAr: e.target.value } : { ...f, descriptionEn: e.target.value })}
                          className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                          rows={3}
                          maxLength={160}
                          placeholder={isAr ? "وصف الصفحة بالعربية" : "Page description in English"}
                        />
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{(isAr ? editForm.descriptionAr : editForm.descriptionEn).length}/160</p>
                      </div>
                      {/* Keywords */}
                      <div>
                        <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                          {isAr ? "الكلمات المفتاحية" : "Keywords"}
                        </label>
                        <div className="mb-1.5 flex flex-wrap gap-1">
                          {(isAr ? editForm.keywordsAr : editForm.keywords).split(",").map(k => k.trim()).filter(Boolean).map(kw => (
                            <span key={kw} dir={isAr ? "rtl" : "ltr"} className="flex items-center gap-0.5 rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
                              {kw}
                              <button type="button" onClick={() => removeKeyword(kw, isAr ? "keywordsAr" : "keywords")} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            dir={isAr ? "rtl" : "ltr"}
                            value={isAr ? keywordInputAr : keywordInput}
                            onChange={e => isAr ? setKeywordInputAr(e.target.value) : setKeywordInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                isAr ? addKeyword(keywordInputAr, "keywordsAr") : addKeyword(keywordInput, "keywords");
                              }
                            }}
                            className="h-8 flex-1 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                            placeholder={isAr ? "كلمة + Enter…" : "keyword + Enter…"}
                          />
                          <button
                            type="button"
                            onClick={() => isAr ? addKeyword(keywordInputAr, "keywordsAr") : addKeyword(keywordInput, "keywords")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 font-black text-navy hover:bg-navy/20"
                          >+</button>
                        </div>
                      </div>
                      {/* Canonical URL */}
                      <div>
                        <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                          {isAr ? "الرابط المعياري" : "Canonical URL"}
                        </label>
                        <input
                          dir="ltr"
                          value={isAr ? editForm.canonicalUrlAr : editForm.canonicalUrl}
                          onChange={e => setEditForm(f => isAr ? { ...f, canonicalUrlAr: e.target.value } : { ...f, canonicalUrl: e.target.value })}
                          className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          placeholder={isAr ? "https://osoulk.com/ar/page" : "https://osoulk.com/page"}
                        />
                      </div>
                      {/* OG Image (shared) */}
                      <div>
                        <label className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">OG Image URL</label>
                        <input dir="ltr" value={editForm.ogImage} onChange={e => setEditForm(f => ({ ...f, ogImage: e.target.value }))} className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://…/og.jpg" />
                        {editForm.ogImage && <img src={editForm.ogImage} alt="OG" className="mt-1.5 h-14 w-full object-cover rounded-lg border" onError={e => (e.currentTarget.style.display = "none")} />}
                      </div>
                    </div>
                  ) : (
                    /* View mode — shows only the active language */
                    <div className="space-y-2.5" dir={isAr ? "rtl" : "ltr"}>
                      <div>
                        <p className="mb-0.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{isAr ? "عنوان الصفحة" : "Page Title"}</p>
                        <p className="text-sm font-bold text-navy leading-snug">{isAr ? (p?.titleAr || p?.title || "—") : (p?.titleEn || "—")}</p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{isAr ? "وصف الصفحة" : "Description"}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{isAr ? (p?.descriptionAr || p?.description || "—") : (p?.descriptionEn || "—")}</p>
                      </div>
                      {(isAr ? p?.keywordsAr : p?.keywords) && (
                        <div>
                          <p className="mb-0.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{isAr ? "الكلمات المفتاحية" : "Keywords"}</p>
                          <div className="flex flex-wrap gap-1">
                            {(isAr ? p.keywordsAr : p.keywords).split(",").map((k: string) => k.trim()).filter(Boolean).map((kw: string) => (
                              <span key={kw} className="rounded-full bg-navy/8 px-2 py-0.5 text-[11px] font-bold text-navy">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(isAr ? p?.canonicalUrlAr : p?.canonicalUrl) && (
                        <div>
                          <p className="mb-0.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{isAr ? "الرابط المعياري" : "Canonical URL"}</p>
                          <p dir="ltr" className="text-[11px] text-muted-foreground truncate">{isAr ? p.canonicalUrlAr : p.canonicalUrl}</p>
                        </div>
                      )}
                      {p?.ogImage && <img src={p.ogImage} alt="OG" className="h-12 w-full object-cover rounded-lg border" onError={e => (e.currentTarget.style.display = "none")} />}
                      {seo[page]?.updatedAt && <p className="text-[11px] text-muted-foreground/60">Updated: {new Date(seo[page].updatedAt!).toLocaleDateString()}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Server Tab ───────────────────────────────────────────────────────────────
function ServerTab() {
  const { t } = useLang();
  const [health, setHealth] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusResult | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [logs, setLogs] = useState<{ time: string; msg: string; level: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogs, setShowLogs] = useState(false);

  async function loadHealth() {
    setLoading(true);
    setError("");
    try {
      setHealth(await getServerHealth());
    } catch {
      setError("API server is offline or unreachable.");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadDbStatus() {
    setDbLoading(true);
    try {
      setDbStatus(await getDbStatus());
    } catch {
      setDbStatus(null);
    } finally {
      setDbLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      setLogs(await getServerLogs());
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
    loadDbStatus();
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.server.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.server.subtitle")}</p>
        </div>
        <button onClick={() => { loadHealth(); loadDbStatus(); loadLogs(); }} className="flex items-center gap-2 text-sm font-bold text-navy hover:underline">
          <RefreshCw className="h-4 w-4" /> {t("admin.refresh")}
        </button>
      </div>

      {/* API Status */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${!loading && health ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
            <span className="font-black text-navy">{t("admin.server.apiServer")}</span>
          </div>
          {!loading && health && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{t("admin.server.online")}</span>
          )}
          {!loading && !health && (
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">{t("admin.server.offline")}</span>
          )}
        </div>
        {health && (
          <div className="mt-4 text-xs text-muted-foreground">
            Last checked: {new Date(health.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Database Status */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className={`h-4 w-4 ${dbLoading ? "text-muted-foreground" : dbStatus?.connected ? "text-emerald-500" : "text-destructive"}`} />
            <span className="font-black text-navy">Database</span>
          </div>
          {dbLoading && <span className="text-xs text-muted-foreground">Checking…</span>}
          {!dbLoading && dbStatus?.connected && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Connected</span>
          )}
          {!dbLoading && dbStatus && !dbStatus.connected && (
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">Unreachable</span>
          )}
          {!dbLoading && !dbStatus && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Unknown</span>
          )}
        </div>

        {!dbLoading && dbStatus && (
          <div className="mt-4 space-y-3">
            {/* Mode badge */}
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${dbStatus.mode === "mysql" ? "bg-navy/10 text-navy" : "bg-secondary text-muted-foreground"}`}>
                {dbStatus.mode === "mysql" ? "MySQL" : "JSON files"}
              </span>
              {dbStatus.latencyMs !== null && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                  <Clock className="h-3 w-3" />{dbStatus.latencyMs}ms
                </span>
              )}
            </div>

            {/* Connection details */}
            {dbStatus.host && (
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                {[
                  ["Host", dbStatus.host],
                  ["Port", dbStatus.port],
                  ["Database", dbStatus.database],
                ].map(([label, val]) => (
                  <div key={String(label)} className="rounded-lg bg-secondary px-3 py-2">
                    <p className="font-black uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-mono font-bold text-navy truncate">{String(val ?? "—")}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Error / hint */}
            {dbStatus.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive space-y-1">
                <p className="font-bold flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 shrink-0" />{dbStatus.error}</p>
                {dbStatus.hint && <p className="text-muted-foreground leading-relaxed">{dbStatus.hint}</p>}
              </div>
            )}

            {dbStatus.message && dbStatus.connected && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />{dbStatus.message}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {health && (
        <>
          {/* Metrics grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Activity, label: "Uptime",       value: health.uptime,              color: "text-emerald-600" },
              { icon: Cpu,      label: "Heap Used",    value: health.memory?.heapUsed,    color: "text-aqua" },
              { icon: Database, label: "Heap Total",   value: health.memory?.heapTotal,   color: "text-navy" },
              { icon: Wifi,     label: "Node.js",      value: health.system?.nodeVersion, color: "text-gold" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="premium-card p-5">
                <Icon className={`h-5 w-5 ${color}`} />
                <p className={`mt-3 text-2xl font-black ${color}`}>{value || "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* System info */}
          <div className="premium-card p-5">
            <h3 className="font-black text-navy mb-4">{t("admin.server.systemInfo")}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {[
                [t("admin.server.platform"),     health.system?.platform],
                [t("admin.server.arch"),          health.system?.arch],
                [t("admin.server.cpuCores"),      health.system?.cpus],
                [t("admin.server.totalMem"),      health.system?.totalMemory],
                [t("admin.server.freeMem"),       health.system?.freeMemory],
                [t("admin.server.rssMem"),        health.memory?.rss],
              ].map(([label, val]) => (
                <div key={String(label)} className="rounded-lg bg-secondary px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 font-bold text-navy">{String(val ?? "—")}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Logs */}
      <div className="premium-card overflow-hidden">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-navy" />
            <span className="font-black text-navy">{t("admin.server.appLogs")}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground">{logs.length} {t("admin.server.entries")}</span>
          </div>
          {showLogs ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>
        {showLogs && (
          <div className="border-t bg-[#0d1117] max-h-80 overflow-y-auto">
            {logsLoading ? (
              <p className="p-4 text-xs text-green-400 font-mono">Loading logs…</p>
            ) : logs.length === 0 ? (
              <p className="p-4 text-xs text-gray-500 font-mono">No logs available.</p>
            ) : (
              <div className="p-4 space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 text-gray-500">{new Date(log.time).toLocaleTimeString()}</span>
                    <span className="text-green-400 break-all">{log.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Log Tab ─────────────────────────────────────────────────────────
type ActivityEntry = { id: string; type: string; event: string; subject: string; userId: string; userName: string; createdAt: string };

const EVENT_BADGE: Record<string, string> = {
  Login:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  ForgotPassword:"bg-amber-50 text-amber-700 border-amber-200",
  PasswordReset: "bg-blue-50 text-blue-700 border-blue-200",
};
const DEFAULT_BADGE = "bg-navy/5 text-navy border-navy/10";

function ActivityLogTab() {
  const { t } = useLang();
  const [log, setLog]     = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 20;

  async function load() {
    setLoading(true); setError("");
    try { setLog(await getActivityLog()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = log.filter(e =>
    !search ||
    e.event.toLowerCase().includes(search.toLowerCase()) ||
    e.type.toLowerCase().includes(search.toLowerCase()) ||
    e.userName.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.activity.title")}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} {t("admin.activity.events")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="mr-1">{t("admin.refresh")}</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-xl border bg-background py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          placeholder={t("admin.activity.search")}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
        ))}</div>
      ) : filtered.length === 0 ? (
        <div className="premium-card p-16 text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
          <p className="mt-4 text-muted-foreground">{search ? t("admin.noMatch") : t("admin.activity.noActivity")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-float">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-right text-xs font-black uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">{t("admin.activity.type")}</th>
                  <th className="px-4 py-3">{t("admin.activity.event")}</th>
                  <th className="px-4 py-3">{t("admin.activity.user")}</th>
                  <th className="px-4 py-3">{t("admin.activity.subject")}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t("admin.activity.datetime")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.map(entry => (
                  <tr key={entry.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-navy">{entry.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${EVENT_BADGE[entry.event] ?? DEFAULT_BADGE}`}>
                        {entry.event}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.userName || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{entry.subject || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("admin.page")} {page} {t("admin.of")} {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t("admin.prev")}</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t("admin.next")}</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Subscribers Tab ──────────────────────────────────────────────────────────
function SubscribersTab({ adminKey }: { adminKey: string }) {
  const { t } = useLang();
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; name: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSubscribers(await getSubscribers());
    } catch {
      setError("Failed to load subscribers.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = subscribers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.email.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.sub.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subscribers.length} {t("admin.sub.count")}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm font-bold text-navy hover:underline">
          <RefreshCw className="h-4 w-4" /> {t("admin.refresh")}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          placeholder={t("admin.sub.search")}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-black text-navy">{search ? t("admin.noMatch") : t("admin.sub.none")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.sub.appear")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-float">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary">
              <tr>
                {["Name", "Email", "Subscribed"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-black uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-navy">{s.name || "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{s.email}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Site Settings Tab ───────────────────────────────────────────────────────
function SiteSettingsTab() {
  const { t } = useLang();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [textLang, setTextLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    setLoading(true);
    getSiteSettings().then(s => { setSettings(s); setLoading(false); }).catch(() => { setError("Failed to load settings"); setLoading(false); });
  }, []);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
  }
  function updateNested<K extends keyof SiteSettings>(group: K, key: string, value: any) {
    setSettings(prev => prev ? ({ ...prev, [group]: { ...(prev[group] as any), [key]: value } }) : prev);
  }

  async function save() {
    if (!settings) return;
    setSaving(true); setError("");
    try {
      const updated = await updateSiteSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (loading || !settings) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.settings.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.settings.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-bold text-emerald-600">{t("admin.saved")}</span>}
          <Button onClick={save} disabled={saving} size="lg"><Save className="h-4 w-4" />{saving ? t("admin.saving") : t("admin.settings.saveChanges")}</Button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Brand */}
        <div className="premium-card p-5">
          <h3 className="font-black text-navy mb-3 flex items-center gap-2"><Sliders className="h-4 w-4" /> {t("admin.settings.brand")}</h3>
          <div className="space-y-3">
            <Field label={t("admin.settings.siteName")} value={settings.brandName} onChange={v => update("brandName", v)} />
            <Field label={t("admin.settings.tagline")} value={settings.tagline} onChange={v => update("tagline", v)} />
          </div>
        </div>

        {/* Logo & Brand Identity */}
        <div className="premium-card p-5 lg:col-span-2">
          <h3 className="font-black text-navy mb-4 flex items-center gap-2"><Image className="h-4 w-4" /> Logo & Brand Identity</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <MediaPickerField
                label="Site Logo (used in navbar, footer, and social sharing)"
                value={(settings as any).logo?.url || ""}
                onChange={url => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, url } } : prev)}
                previewClass="h-16 w-auto max-w-[240px] object-contain border rounded-xl bg-white p-2"
              />
            </div>
            <Field label="Logo Alt Text (EN)" value={(settings as any).logo?.altText || ""} onChange={v => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, altText: v } } : prev)} placeholder="Osoulk real estate logo" />
            <Field label="Logo Alt Text (AR)" value={(settings as any).logo?.altTextAr || ""} onChange={v => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, altTextAr: v } } : prev)} placeholder="شعار أصولك للعقارات" />
            <Field label="Logo Title (EN)" value={(settings as any).logo?.title || ""} onChange={v => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, title: v } } : prev)} placeholder="Osoulk" />
            <Field label="Logo Title (AR)" value={(settings as any).logo?.titleAr || ""} onChange={v => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, titleAr: v } } : prev)} placeholder="أصولك" />
            <Field label="Caption (EN)" value={(settings as any).logo?.caption || ""} onChange={v => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, caption: v } } : prev)} />
            <Field label="Caption (AR)" value={(settings as any).logo?.captionAr || ""} onChange={v => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, captionAr: v } } : prev)} />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Internal Description</label>
              <textarea value={(settings as any).logo?.description || ""} onChange={e => setSettings(prev => prev ? { ...prev, logo: { ...(prev as any).logo, description: e.target.value } } : prev)} rows={2} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="e.g. Dark version of the logo, 2024 redesign" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="premium-card p-5">
          <h3 className="font-black text-navy mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {t("admin.settings.contact")}</h3>
          <div className="space-y-3">
            <Field label={t("admin.settings.phone")} value={settings.contactPhone} onChange={v => update("contactPhone", v)} />
            <Field label={t("admin.settings.email")} value={settings.contactEmail} onChange={v => update("contactEmail", v)} />
            <Field label={t("admin.settings.whatsapp")} value={settings.whatsappNumber} onChange={v => update("whatsappNumber", v)} />
            <Field label={t("admin.settings.address")} value={settings.address} onChange={v => update("address", v)} />
          </div>
        </div>

        {/* Hero — language toggle */}
        <div className="premium-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-navy flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> {t("admin.settings.hero")}</h3>
            <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
              <button type="button" onClick={() => setTextLang("ar")} className={`px-4 py-2 transition-colors ${textLang === "ar" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
              <button type="button" onClick={() => setTextLang("en")} className={`px-4 py-2 transition-colors ${textLang === "en" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
            </div>
          </div>
          <div className="space-y-3" dir={textLang === "ar" ? "rtl" : "ltr"}>
            {textLang === "ar" ? (
              <>
                <Field label={t("admin.settings.kicker")} value={(settings.hero as any).kickerAr || ""} onChange={v => updateNested("hero", "kickerAr", v)} />
                <Field label={t("admin.settings.heroTitle")} value={(settings.hero as any).titleAr || ""} onChange={v => updateNested("hero", "titleAr", v)} />
                <Field label={t("admin.settings.heroSubtitle")} value={(settings.hero as any).subtitleAr || ""} onChange={v => updateNested("hero", "subtitleAr", v)} multiline />
              </>
            ) : (
              <>
                <Field label={t("admin.settings.kicker")} value={settings.hero.kicker} onChange={v => updateNested("hero", "kicker", v)} />
                <Field label={t("admin.settings.heroTitle")} value={settings.hero.title} onChange={v => updateNested("hero", "title", v)} />
                <Field label={t("admin.settings.heroSubtitle")} value={settings.hero.subtitle} onChange={v => updateNested("hero", "subtitle", v)} multiline />
              </>
            )}
          </div>
        </div>

        {/* Promo bar — language toggle */}
        <div className="premium-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-navy flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {t("admin.settings.promoBar")}</h3>
            <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
              <button type="button" onClick={() => setTextLang("ar")} className={`px-4 py-2 transition-colors ${textLang === "ar" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
              <button type="button" onClick={() => setTextLang("en")} className={`px-4 py-2 transition-colors ${textLang === "en" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
            </div>
          </div>
          <div className="space-y-3" dir={textLang === "ar" ? "rtl" : "ltr"}>
            <Toggle label={t("admin.settings.showPromoBar")} checked={settings.promoBar.enabled} onChange={v => updateNested("promoBar", "enabled", v)} />
            {textLang === "ar" ? (
              <Field label={t("admin.settings.barText")} value={(settings.promoBar as any).textAr || ""} onChange={v => updateNested("promoBar", "textAr", v)} />
            ) : (
              <Field label={t("admin.settings.barText")} value={settings.promoBar.text} onChange={v => updateNested("promoBar", "text", v)} />
            )}
          </div>
        </div>

        {/* Socials */}
        <div className="premium-card p-5">
          <h3 className="font-black text-navy mb-3 flex items-center gap-2"><Globe2 className="h-4 w-4" /> {t("admin.settings.socials")}</h3>
          <div className="space-y-3">
            {(["facebook", "instagram", "youtube", "linkedin", "tiktok"] as const).map(k => (
              <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={(settings.socials as any)[k]} onChange={v => updateNested("socials", k, v)} placeholder="https://…" />
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="premium-card p-5">
          <h3 className="font-black text-navy mb-3 flex items-center gap-2"><Settings className="h-4 w-4" /> {t("admin.settings.features")}</h3>
          <div className="space-y-2">
            <Toggle label={t("admin.settings.googleSignIn")} checked={settings.features.googleSignIn} onChange={v => updateNested("features", "googleSignIn", v)} />
            <Toggle label={t("admin.settings.newsletter")} checked={settings.features.newsletter} onChange={v => updateNested("features", "newsletter", v)} />
            <Toggle label={t("admin.settings.reelsModule")} checked={settings.features.reels} onChange={v => updateNested("features", "reels", v)} />
            <Toggle label={t("admin.settings.brokerSignup")} checked={settings.features.brokerSignup} onChange={v => updateNested("features", "brokerSignup", v)} />
            <Toggle label={t("admin.settings.developerSignup")} checked={settings.features.developerSignup} onChange={v => updateNested("features", "developerSignup", v)} />
          </div>
        </div>

        {/* Hero Slides / Slider Management */}
        <div className="premium-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-navy flex items-center gap-2"><Layout className="h-4 w-4" /> Hero Slides / Slider Management</h3>
            <button type="button" onClick={() => {
              const slides = (settings as any).heroSlides || [];
              setSettings(prev => prev ? { ...prev, heroSlides: [...slides, { title: "", titleAr: "", subtitle: "", subtitleAr: "", ctaText: "", ctaTextAr: "", ctaLink: "", image: "", imageMobile: "", enabled: true }] } : prev);
            }} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Slide
            </button>
          </div>
          {(!((settings as any).heroSlides) || (settings as any).heroSlides.length === 0) ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No slides configured. Click "Add Slide" to create a rotating hero banner.</p>
          ) : (
            <div className="space-y-5">
              {((settings as any).heroSlides as any[]).map((slide: any, idx: number) => {
                const updateSlide = (key: string, val: any) => {
                  const s = [...(settings as any).heroSlides];
                  s[idx] = { ...s[idx], [key]: val };
                  setSettings(p => p ? { ...p, heroSlides: s } : p);
                };
                return (
                  <div key={idx} className="rounded-xl border bg-secondary/30 p-4 space-y-4">
                    {/* Slide header with reorder + enable + delete */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-navy">Slide {idx + 1}</span>
                        <div className="flex gap-1">
                          <button type="button" disabled={idx === 0} onClick={() => {
                            const s = [...(settings as any).heroSlides];
                            [s[idx - 1], s[idx]] = [s[idx], s[idx - 1]];
                            setSettings(p => p ? { ...p, heroSlides: s } : p);
                          }} className="rounded border p-1 text-muted-foreground hover:text-navy disabled:opacity-30 transition-colors">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button type="button" disabled={idx === ((settings as any).heroSlides?.length ?? 1) - 1} onClick={() => {
                            const s = [...(settings as any).heroSlides];
                            [s[idx + 1], s[idx]] = [s[idx], s[idx + 1]];
                            setSettings(p => p ? { ...p, heroSlides: s } : p);
                          }} className="rounded border p-1 text-muted-foreground hover:text-navy disabled:opacity-30 transition-colors">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateSlide("enabled", !slide.enabled)} className={`relative h-6 w-11 rounded-full transition-colors ${slide.enabled ? "bg-emerald-500" : "bg-secondary border"}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${slide.enabled ? "left-5" : "left-0.5"}`} />
                        </button>
                        <span className="text-xs font-bold text-muted-foreground">{slide.enabled ? "Enabled" : "Disabled"}</span>
                        <button type="button" onClick={() => {
                          const s = ((settings as any).heroSlides as any[]).filter((_: any, i: number) => i !== idx);
                          setSettings(p => p ? { ...p, heroSlides: s } : p);
                        }} className="rounded-lg border border-destructive/20 p-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Text content */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Title (AR)</label>
                        <input value={slide.titleAr || ""} onChange={e => updateSlide("titleAr", e.target.value)} dir="rtl" className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Title (EN)</label>
                        <input value={slide.title || ""} onChange={e => updateSlide("title", e.target.value)} dir="ltr" className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Subtitle (AR)</label>
                        <input value={slide.subtitleAr || ""} onChange={e => updateSlide("subtitleAr", e.target.value)} dir="rtl" className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Subtitle (EN)</label>
                        <input value={slide.subtitle || ""} onChange={e => updateSlide("subtitle", e.target.value)} dir="ltr" className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">CTA Button (AR)</label>
                        <input value={slide.ctaTextAr || ""} onChange={e => updateSlide("ctaTextAr", e.target.value)} dir="rtl" className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">CTA Button (EN)</label>
                        <input value={slide.ctaText || ""} onChange={e => updateSlide("ctaText", e.target.value)} dir="ltr" className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">CTA Link</label>
                        <input value={slide.ctaLink || ""} onChange={e => updateSlide("ctaLink", e.target.value)} dir="ltr" className="h-9 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="/explore" />
                      </div>
                    </div>
                    {/* Desktop Media */}
                    <div className="space-y-2">
                      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Desktop Image / GIF</label>
                      <MediaPickerField
                        value={slide.image || ""}
                        onChange={url => updateSlide("image", url)}
                        placeholder="https://… (jpg, png, gif, webp)"
                        previewClass="mt-2 h-28 w-full rounded-xl object-cover border"
                      />
                    </div>
                    {/* Mobile Media */}
                    <div className="space-y-2">
                      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Mobile Image / GIF (optional)</label>
                      <MediaPickerField
                        value={slide.imageMobile || ""}
                        onChange={url => updateSlide("imageMobile", url)}
                        placeholder="https://… (portrait version)"
                        previewClass="mt-2 h-28 w-full rounded-xl object-cover border"
                      />
                    </div>
                    {/* Media Metadata — bilingual */}
                    <div className="rounded-lg border bg-background p-3 space-y-3">
                      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3" /> Media Metadata (SEO)</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Alt Text (AR)</label>
                          <input value={slide.altAr || ""} onChange={e => updateSlide("altAr", e.target.value)} dir="rtl" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs focus:outline-none" placeholder="وصف الصورة" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Alt Text (EN)</label>
                          <input value={slide.alt || ""} onChange={e => updateSlide("alt", e.target.value)} dir="ltr" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs focus:outline-none" placeholder="Image description" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Image Title (AR)</label>
                          <input value={slide.imageTitleAr || ""} onChange={e => updateSlide("imageTitleAr", e.target.value)} dir="rtl" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs focus:outline-none" placeholder="عنوان الصورة" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Image Title (EN)</label>
                          <input value={slide.imageTitle || ""} onChange={e => updateSlide("imageTitle", e.target.value)} dir="ltr" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs focus:outline-none" placeholder="Image title / tooltip" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Caption (AR)</label>
                          <input value={slide.captionAr || ""} onChange={e => updateSlide("captionAr", e.target.value)} dir="rtl" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs focus:outline-none" placeholder="تعليق الصورة" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Caption (EN)</label>
                          <input value={slide.caption || ""} onChange={e => updateSlide("caption", e.target.value)} dir="ltr" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs focus:outline-none" placeholder="Image caption" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-muted-foreground">Link / URL</label>
                          <input value={slide.imageLink || ""} onChange={e => updateSlide("imageLink", e.target.value)} dir="ltr" className="h-8 w-full rounded-lg border bg-secondary/50 px-2.5 text-xs font-mono focus:outline-none" placeholder="https://…" />
                        </div>
                      </div>
                    </div>
                    {/* Scheduling */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Schedule From (optional)</label>
                        <input type="datetime-local" value={slide.scheduledFrom || ""} onChange={e => updateSlide("scheduledFrom", e.target.value)} className="h-9 w-full rounded-lg border bg-background px-3 text-xs focus:outline-none" dir="ltr" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Schedule Until (optional)</label>
                        <input type="datetime-local" value={slide.scheduledTo || ""} onChange={e => updateSlide("scheduledTo", e.target.value)} className="h-9 w-full rounded-lg border bg-background px-3 text-xs focus:outline-none" dir="ltr" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={placeholder} />
      ) : (
        <input value={value || ""} onChange={e => onChange(e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={placeholder} />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm hover:bg-secondary transition-colors">
      <span className="font-bold text-navy">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-secondary border"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

// ─── Sections Tab (homepage section toggle/order) ────────────────────────────
// ─── Section Content + SEO Editor ─────────────────────────────────────────────
function SectionContentEditor({
  section,
  onSaved,
}: {
  section: ContentSection;
  onSaved: (updated: ContentSection) => void;
}) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [data, setData] = useState<ContentSection>({ ...section });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const isAr = lang === "ar";

  useEffect(() => { setData({ ...section }); setSaved(false); setError(""); }, [section.id]);

  function set(k: keyof ContentSection, v: any) { setData(prev => ({ ...prev, [k]: v })); }

  async function save() {
    setSaving(true); setError("");
    try {
      const updated = await updateSectionContent(data.id, data);
      onSaved({ ...data, ...updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xl font-black text-navy">{section.label}</h3>
          <p className="text-xs text-muted-foreground">id: {section.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm font-bold text-emerald-600">Saved!</span>}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-black text-white disabled:opacity-50 hover:bg-navy/80 transition-colors">
            <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Section"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* CONTENT */}
      <div className="premium-card p-6 space-y-5">
        {/* Language switcher */}
        <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold w-fit">
          <button type="button" onClick={() => setLang("ar")} className={`px-4 py-2 transition-colors ${isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
          <button type="button" onClick={() => setLang("en")} className={`px-4 py-2 transition-colors ${!isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
        </div>
        <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "العنوان" : "Title"}</label>
              <input value={isAr ? (data.titleAr || "") : (data.title || "")} onChange={e => set(isAr ? "titleAr" : "title", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={isAr ? "عنوان القسم…" : "Section title…"} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "العنوان الفرعي" : "Subtitle"}</label>
              <input value={isAr ? (data.subtitleAr || "") : (data.subtitle || "")} onChange={e => set(isAr ? "subtitleAr" : "subtitle", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={isAr ? "العنوان الفرعي…" : "Subtitle…"} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "نص الجسم" : "Body Text"}</label>
            <textarea value={isAr ? (data.bodyAr || "") : (data.body || "")} onChange={e => set(isAr ? "bodyAr" : "body", e.target.value)}
              rows={4} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder={isAr ? "المحتوى النصي للقسم…" : "Section body text…"} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "نص الزر (CTA)" : "CTA Button Text"}</label>
            <input value={isAr ? (data.ctaTextAr || "") : (data.ctaText || "")} onChange={e => set(isAr ? "ctaTextAr" : "ctaText", e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder={isAr ? "اكتشف العقارات…" : "Explore Properties…"} />
          </div>
        </div>
        <div dir="ltr">
          <MediaPickerField
            label="Section Image"
            value={data.image || ""}
            onChange={url => set("image", url)}
            previewClass="mt-1 h-24 w-full rounded-xl object-cover border"
          />
        </div>
      </div>
    </div>
  );
}

function SectionsTab() {
  const { t } = useLang();
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAdminSections().then(s => {
      setSections(s);
      if (s.length) setSelectedId(s[0].id);
      setLoading(false);
    }).catch(() => { setError("Failed to load sections"); setLoading(false); });
  }, []);

  function move(idx: number, dir: -1 | 1) {
    const copy = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= copy.length) return;
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    copy.forEach((s, i) => (s.order = i + 1));
    setSections(copy);
  }
  function toggle(id: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  }

  async function saveOrder() {
    setSaving(true); setError("");
    try {
      const updated = await updateSections(sections);
      setSections(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  const selected = sections.find(s => s.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.sections.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage homepage sections — reorder, toggle visibility, and edit content + SEO per section.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-bold text-emerald-600">{t("admin.saved")}</span>}
          <Button onClick={saveOrder} disabled={saving} size="lg">
            <Save className="h-4 w-4" />{saving ? t("admin.saving") : "Save Order & Visibility"}
          </Button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />)}</div>
          <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[260px_1fr] items-start">
          {/* Left: Section list */}
          <div className="space-y-1.5">
            {sections.map((s, i) => (
              <div key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${selectedId === s.id ? "border-navy/40 bg-navy/5 shadow-sm" : "bg-card hover:bg-secondary/60"} ${!s.visible ? "opacity-60" : ""}`}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-navy">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-navy truncate">{s.label}</p>
                  <p className="text-xs text-muted-foreground truncate">id: {s.id}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 disabled:opacity-30 hover:bg-secondary"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="rounded p-1 disabled:opacity-30 hover:bg-secondary"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => toggle(s.id)}
                    className={`relative ml-1 h-5 w-9 rounded-full transition-colors ${s.visible ? "bg-navy" : "bg-secondary border"}`}
                    title={s.visible ? "Visible" : "Hidden"}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${s.visible ? "left-4" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Right: Section editor */}
          {selected ? (
            <SectionContentEditor
              key={selected.id}
              section={selected}
              onSaved={updated => setSections(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))}
            />
          ) : (
            <div className="premium-card p-16 text-center text-muted-foreground">
              <Layout className="mx-auto h-12 w-12 opacity-20" />
              <p className="mt-3">Select a section to edit its content and SEO</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
const PIE_COLORS = ["#0a1628", "#00b4d8", "#c9a84c", "#10b981", "#6366f1", "#f59e0b"];

function AnalyticsTab() {
  const { t } = useLang();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load analytics data."); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-24 text-muted-foreground">Loading analytics…</div>;
  if (error) return <div className="rounded-xl bg-destructive/10 px-6 py-4 text-sm text-destructive">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-navy">{t("admin.analytics.title")}</h2>

      {/* KPI totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("admin.analytics.totalUsers"),  value: data.totals.users,      color: "text-navy" },
          { label: t("admin.analytics.totalLeads"),  value: data.totals.leads,      color: "text-aqua" },
          { label: t("admin.analytics.listings"),    value: data.totals.listings,   color: "text-gold" },
          { label: t("admin.analytics.propViews"),   value: data.totals.totalViews, color: "text-emerald-600" },
        ].map(kpi => (
          <div key={kpi.label} className="premium-card p-5">
            <p className="text-xs font-bold text-muted-foreground">{kpi.label}</p>
            <p className={`mt-2 text-3xl font-black ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* User growth chart */}
      <div className="premium-card p-6">
        <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.userGrowth")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.userGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#0a1628" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leads chart */}
      <div className="premium-card p-6">
        <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.leadsChart")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.leadsChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="leads" stroke="#00b4d8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan distribution */}
        <div className="premium-card p-6">
          <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.byPlan")}</h3>
          {data.planChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie data={data.planChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.planChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Role distribution */}
        <div className="premium-card p-6">
          <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.byRole")}</h3>
          {data.roleChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.roleChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {data.roleChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CRM Funnel */}
      <div className="premium-card p-6">
        <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.crmFunnel")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.crmFunnel}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0a1628" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top properties by views */}
      {data.topProperties.length > 0 && (
        <div className="premium-card p-6">
          <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.topProps")}</h3>
          <div className="space-y-3">
            {data.topProperties.map((p, i) => {
              const max = data.topProperties[0]?.views ?? 1;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-navy truncate max-w-[70%]">{i + 1}. {p.id}</span>
                    <span className="font-black text-navy">{p.views.toLocaleString()} {t("admin.analytics.views")}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-2 rounded-full bg-aqua" style={{ width: `${(p.views / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listing approval status */}
      <div className="premium-card p-6">
        <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.listingStatus")}</h3>
        <div className="flex gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-3xl font-black text-amber-600">{data.listingStatus.pending}</p>
            <p className="text-xs font-bold text-muted-foreground">{t("admin.analytics.pendingReview")}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-600">{data.listingStatus.approved}</p>
            <p className="text-xs font-bold text-muted-foreground">{t("admin.approved")}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-destructive">{data.listingStatus.rejected}</p>
            <p className="text-xs font-bold text-muted-foreground">{t("admin.rejected")}</p>
          </div>
        </div>
      </div>

      {/* Saved Search Analytics */}
      {data.savedSearchAnalytics && (
        <>
          <h2 className="text-xl font-black text-navy border-t pt-6">{t("admin.analytics.savedSearchTitle")}</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("admin.analytics.totalSearches"), value: data.savedSearchAnalytics.total,           color: "text-navy" },
              { label: t("admin.analytics.activeSearches"), value: data.savedSearchAnalytics.active,          color: "text-emerald-600" },
              { label: t("admin.analytics.pausedSearches"), value: data.savedSearchAnalytics.paused,          color: "text-amber-600" },
              { label: t("admin.analytics.alertsSent"),     value: data.savedSearchAnalytics.totalAlertsSent, color: "text-aqua" },
            ].map(kpi => (
              <div key={kpi.label} className="premium-card p-5">
                <p className="text-xs font-bold text-muted-foreground">{kpi.label}</p>
                <p className={`mt-2 text-3xl font-black ${kpi.color}`}>{(kpi.value ?? 0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Alerts sent chart */}
          <div className="premium-card p-6">
            <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.alertsChart")}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.savedSearchAnalytics.alertsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="alerts" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top search combos */}
          {data.savedSearchAnalytics.topSearchCombos.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="mb-4 text-base font-black text-navy">{t("admin.analytics.topCombos")}</h3>
              <div className="space-y-2.5">
                {data.savedSearchAnalytics.topSearchCombos.map((combo, i) => {
                  const max = data.savedSearchAnalytics!.topSearchCombos[0]?.count ?? 1;
                  return (
                    <div key={combo.combo}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold text-navy">{i + 1}. {combo.combo}</span>
                        <span className="font-black text-navy">{combo.count}x</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-2 rounded-full bg-gold" style={{ width: `${(combo.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Articles Tab ─────────────────────────────────────────────────────────────
function ArticlesTab() {
  const { t } = useLang();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [articleFormTab, setArticleFormTab] = useState<"ar"|"en"|"media"|"seo">("ar");

  const emptyForm = (): Partial<Article> => ({
    title: "", titleAr: "", slug: "", category: "", categoryAr: "",
    summary: "", summaryAr: "", content: "", contentAr: "",
    coverImage: "", coverImageAlt: "", coverImageTitle: "", coverImageDescription: "",
    coverImageLink: "", coverImageComment: "",
    status: "draft", featured: false, tags: [],
    seoTitle: "", seoTitleAr: "", seoDescription: "", seoDescriptionAr: "",
    seoKeywords: [], seoKeywordsAr: [], seoImage: "", canonicalUrl: "",
    readingTime: 3,
  } as any);
  const [form, setForm] = useState<Partial<Article>>(emptyForm());
  const [seoKeyInputEn, setSeoKeyInputEn] = useState("");
  const [seoKeyInputAr, setSeoKeyInputAr] = useState("");
  const [articleSeoLang, setArticleSeoLang] = useState<"ar" | "en">("ar");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setArticles(await getArticles()); } catch { setError("Failed to load articles"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(emptyForm()); setEditTarget(null); setShowForm(true); setTagInput(""); setArticleFormTab("ar"); setSeoKeyInputEn(""); setSeoKeyInputAr(""); }
  function openEdit(a: Article) { setForm({ ...a }); setEditTarget(a); setShowForm(true); setTagInput(""); setArticleFormTab("ar"); setSeoKeyInputEn(""); setSeoKeyInputAr(""); }

  function addTag(val: string) {
    const t = val.trim();
    if (!t) return;
    setForm(f => ({ ...f, tags: [...(f.tags || []), t] }));
    setTagInput("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form };
      if (!payload.title && payload.titleAr) payload.title = payload.titleAr as any;
      if (!payload.category && (payload as any).categoryAr) payload.category = (payload as any).categoryAr;
      if (editTarget) {
        const updated = await updateArticle(editTarget.id, payload);
        setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await createArticle(payload);
        setArticles(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err: any) { setError(err.message || "Save failed"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteArticle(id); setArticles(prev => prev.filter(a => a.id !== id)); setConfirmDelete(null); }
    catch { setError("Delete failed"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.articles.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{articles.length} {t("admin.articles.count")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-navy text-white px-4 py-2 text-sm font-bold hover:bg-navy/80">
            <Plus className="h-4 w-4" /> {t("admin.articles.new")}
          </button>
          <button onClick={load} className="flex items-center gap-2 border rounded-xl px-4 py-2 text-sm font-bold text-navy hover:bg-secondary">
            <RefreshCw className="h-4 w-4" /> {t("admin.refresh")}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Article Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl bg-card shadow-premium my-8 relative overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-7 py-5">
              <h3 className="text-xl font-black text-navy">{editTarget ? t("admin.articles.editArticle") : t("admin.articles.new")}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-5 w-5" /></button>
            </div>
            {/* Tab bar */}
            <div className="flex border-b bg-secondary/30 px-7">
              {([
                { id: "ar",    label: "Arabic" },
                { id: "en",    label: "English" },
                { id: "media", label: "Media" },
                { id: "seo",   label: "SEO" },
              ] as const).map(tb => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setArticleFormTab(tb.id)}
                  className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${articleFormTab === tb.id ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSave}>
              <div className="p-7 space-y-4">
                {/* Arabic tab — 2-column wide layout */}
                {articleFormTab === "ar" && (
                  <div className="space-y-4" dir="rtl">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">العنوان *</label>
                        <input required value={form.titleAr || ""} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="عنوان المقال بالعربية" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">التصنيف</label>
                        <input value={form.categoryAr || ""} onChange={e => setForm(f => ({ ...f, categoryAr: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="استثمار، شراء، إيجار…" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">الملخص</label>
                      <textarea value={form.summaryAr || ""} onChange={e => setForm(f => ({ ...f, summaryAr: e.target.value }))} rows={2} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="ملخص قصير يظهر على بطاقة المقال" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">{t("admin.articles.contentAr")}</label>
                      <textarea value={form.contentAr || ""} onChange={e => setForm(f => ({ ...f, contentAr: e.target.value }))} rows={10} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="اكتب محتوى المقال هنا…" />
                    </div>
                  </div>
                )}
                {/* English tab — 2-column wide layout */}
                {articleFormTab === "en" && (
                  <div className="space-y-4" dir="ltr">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Title (English)</label>
                        <input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Article title in English" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Category (English)</label>
                        <input value={form.category || ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="investment, buying, renting…" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Summary (English)</label>
                      <textarea value={form.summary || ""} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={2} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Short summary shown on article cards" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">{t("admin.articles.contentEn")}</label>
                      <textarea value={form.content || ""} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Write article content here…" />
                    </div>
                  </div>
                )}
                {/* Media tab — image upload + metadata + settings */}
                {articleFormTab === "media" && (
                  <div className="space-y-5">
                    {/* Cover image — media picker */}
                    <div className="rounded-xl border bg-background p-5 space-y-4">
                      <h4 className="font-black text-navy flex items-center gap-2"><Image className="h-4 w-4" /> Cover Image</h4>
                      <MediaPickerField
                        label="Featured / Cover Image"
                        value={form.coverImage || ""}
                        onChange={url => setForm(f => ({ ...f, coverImage: url, coverImageTitle: (f as any).coverImageTitle || url.split("/").pop()?.replace(/\.[^.]+$/, "") || "" }))}
                        previewClass="h-40 w-full rounded-xl object-cover border"
                      />
                      {/* Image metadata fields */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Alt Text</label>
                          <input value={(form as any).coverImageAlt || ""} onChange={e => setForm(f => ({ ...f, coverImageAlt: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Describe the image for accessibility" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Title</label>
                          <input value={(form as any).coverImageTitle || ""} onChange={e => setForm(f => ({ ...f, coverImageTitle: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Image title / tooltip" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Description</label>
                          <input value={(form as any).coverImageDescription || ""} onChange={e => setForm(f => ({ ...f, coverImageDescription: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Short description of the image" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Link (optional)</label>
                          <input value={(form as any).coverImageLink || ""} onChange={e => setForm(f => ({ ...f, coverImageLink: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://…" dir="ltr" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Comment / Note</label>
                          <input value={(form as any).coverImageComment || ""} onChange={e => setForm(f => ({ ...f, coverImageComment: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Internal note about this image" />
                        </div>
                      </div>
                    </div>
                    {/* Settings row */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Status</label>
                        <select value={form.status || "draft"} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">{t("admin.articles.readTime")} (min)</label>
                        <input type="number" min={1} value={form.readingTime || 3} onChange={e => setForm(f => ({ ...f, readingTime: Number(e.target.value) }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">URL Slug</label>
                        <input value={form.slug || ""} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="article-url-slug" dir="ltr" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3">
                        <input type="checkbox" id="featured" checked={!!form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="h-4 w-4" />
                        <label htmlFor="featured" className="text-sm font-bold text-navy cursor-pointer">Featured (shown at top)</label>
                      </div>
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Tags</label>
                        <div className="mt-1 flex flex-wrap gap-1.5 mb-1">
                          {(form.tags || []).map(tag => (
                            <span key={tag} className="flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">
                              {tag}
                              <button type="button" onClick={() => setForm(f => ({ ...f, tags: (f.tags || []).filter(tg => tg !== tag) }))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }} placeholder="Type tag + Enter…" className="h-9 flex-1 rounded-xl border bg-background px-3 text-sm focus:outline-none" />
                          <button type="button" onClick={() => addTag(tagInput)} className="rounded-xl bg-navy/10 px-3 text-sm font-bold text-navy hover:bg-navy/20"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* SEO tab — global language switcher controls all fields */}
                {articleFormTab === "seo" && (
                  <div className="space-y-5">
                    {/* Language switcher — same pattern as global SEO page */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">SEO fields for article visibility. Switch language to fill each version.</p>
                      <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
                        <button type="button" onClick={() => setArticleSeoLang("ar")} className={`px-4 py-2 transition-colors ${articleSeoLang === "ar" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
                        <button type="button" onClick={() => setArticleSeoLang("en")} className={`px-4 py-2 transition-colors ${articleSeoLang === "en" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
                      </div>
                    </div>
                    {/* Language-driven fields */}
                    <div className="space-y-4" dir={articleSeoLang === "ar" ? "rtl" : "ltr"}>
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                          {articleSeoLang === "ar" ? "عنوان الصفحة — Meta Title" : "Meta Title"}
                        </label>
                        <input
                          dir={articleSeoLang === "ar" ? "rtl" : "ltr"}
                          value={articleSeoLang === "ar" ? ((form as any).seoTitleAr || "") : (form.seoTitle || "")}
                          onChange={e => setForm(f => articleSeoLang === "ar" ? { ...f, seoTitleAr: e.target.value } : { ...f, seoTitle: e.target.value })}
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          placeholder={articleSeoLang === "ar" ? "عنوان الصفحة بالعربية" : "Page title in English"}
                          maxLength={60}
                        />
                        <p className="mt-0.5 text-xs text-muted-foreground">{(articleSeoLang === "ar" ? ((form as any).seoTitleAr || "") : (form.seoTitle || "")).length}/60</p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                          {articleSeoLang === "ar" ? "وصف الصفحة — Meta Description" : "Meta Description"}
                        </label>
                        <textarea
                          dir={articleSeoLang === "ar" ? "rtl" : "ltr"}
                          value={articleSeoLang === "ar" ? ((form as any).seoDescriptionAr || "") : (form.seoDescription || "")}
                          onChange={e => setForm(f => articleSeoLang === "ar" ? { ...f, seoDescriptionAr: e.target.value } : { ...f, seoDescription: e.target.value })}
                          rows={3}
                          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          placeholder={articleSeoLang === "ar" ? "وصف الصفحة بالعربية" : "Page description in English"}
                          maxLength={160}
                        />
                        <p className="mt-0.5 text-xs text-muted-foreground">{(articleSeoLang === "ar" ? ((form as any).seoDescriptionAr || "") : (form.seoDescription || "")).length}/160</p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                          {articleSeoLang === "ar" ? "الكلمات المفتاحية" : "Keywords"}
                        </label>
                        <div className="min-h-[38px] flex flex-wrap gap-1.5 rounded-xl border bg-background px-3 py-2 mb-2">
                          {(articleSeoLang === "ar" ? ((form as any).seoKeywordsAr || []) : (form.seoKeywords || [])).map((kw: string) => (
                            <span key={kw} className="flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">
                              {kw}
                              <button type="button" onClick={() => {
                                if (articleSeoLang === "ar") setForm(f => ({ ...f, seoKeywordsAr: ((f as any).seoKeywordsAr || []).filter((k: string) => k !== kw) }));
                                else setForm(f => ({ ...f, seoKeywords: (f.seoKeywords || []).filter((k: string) => k !== kw) }));
                              }} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            dir={articleSeoLang === "ar" ? "rtl" : "ltr"}
                            value={articleSeoLang === "ar" ? seoKeyInputAr : seoKeyInputEn}
                            onChange={e => articleSeoLang === "ar" ? setSeoKeyInputAr(e.target.value) : setSeoKeyInputEn(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (articleSeoLang === "ar") { const v = seoKeyInputAr.trim(); if (v) { setForm(f => ({ ...f, seoKeywordsAr: [...((f as any).seoKeywordsAr || []), v] })); setSeoKeyInputAr(""); } }
                                else { const v = seoKeyInputEn.trim(); if (v) { setForm(f => ({ ...f, seoKeywords: [...(f.seoKeywords || []), v] })); setSeoKeyInputEn(""); } }
                              }
                            }}
                            placeholder={articleSeoLang === "ar" ? "اكتب الكلمة + Enter…" : "Type keyword + Enter…"}
                            className="h-9 flex-1 rounded-xl border bg-background px-3 text-sm focus:outline-none"
                          />
                          <button type="button" onClick={() => {
                            if (articleSeoLang === "ar") { const v = seoKeyInputAr.trim(); if (v) { setForm(f => ({ ...f, seoKeywordsAr: [...((f as any).seoKeywordsAr || []), v] })); setSeoKeyInputAr(""); } }
                            else { const v = seoKeyInputEn.trim(); if (v) { setForm(f => ({ ...f, seoKeywords: [...(f.seoKeywords || []), v] })); setSeoKeyInputEn(""); } }
                          }} className="rounded-xl bg-navy/10 px-3 font-bold text-navy hover:bg-navy/20"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                    {/* Shared fields — canonical & OG image */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Canonical URL</label>
                        <input value={form.canonicalUrl || ""} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://osoulk.com/articles/…" dir="ltr" />
                      </div>
                      <div>
                        <MediaPickerField label="OG / Social Image" value={form.seoImage || ""} onChange={url => setForm(f => ({ ...f, seoImage: url }))} previewClass="mt-2 h-16 w-full rounded-xl object-cover border" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 border-t px-7 py-4">
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-navy text-white py-2.5 font-bold disabled:opacity-60 hover:bg-navy/80 transition-colors">{saving ? "Saving…" : "Save Article"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-6 py-2.5 font-bold text-navy hover:bg-secondary transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : articles.length === 0 ? (
        <div className="premium-card p-12 text-center"><Newspaper className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 font-black text-navy">No articles yet</p><p className="mt-2 text-sm text-muted-foreground">Start by creating your first article</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-float">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-secondary">
              <tr>{["Article", "Category", "Status", "Featured", "Date", "Actions"].map(h => <th key={h} className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {articles.map(a => (
                <tr key={a.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-navy">{a.titleAr || a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.summaryAr?.slice(0, 60) || a.summary?.slice(0, 60)}</p>
                  </td>
                  <td className="px-5 py-3.5"><span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-bold text-navy">{a.categoryAr || a.category}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${a.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {a.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">{a.featured ? "⭐" : "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap text-xs">{new Date(a.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="flex items-center gap-1 rounded-lg bg-navy/5 px-2.5 py-1.5 text-xs font-bold text-navy hover:bg-navy/10"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                      {confirmDelete === a.id ? (
                        <>
                          <button onClick={() => handleDelete(a.id)} className="rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20">Confirm</button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(a.id)} className="flex items-center gap-1 rounded-lg bg-destructive/5 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── FAQs Tab ─────────────────────────────────────────────────────────────────
function FAQsTab() {
  const { t } = useLang();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [faqFormTab, setFaqFormTab] = useState<"ar" | "en" | "seo">("ar");
  const [faqSeoLang, setFaqSeoLang] = useState<"ar" | "en">("ar");
  const [faqSeoKeyInputAr, setFaqSeoKeyInputAr] = useState("");
  const [faqSeoKeyInputEn, setFaqSeoKeyInputEn] = useState("");

  const emptyForm = (): Partial<FAQ> => ({
    question: "", questionAr: "", answer: "", answerAr: "",
    category: "", categoryAr: "", order: faqs.length + 1,
    seoTitle: "", seoTitleAr: "", seoDescription: "", seoDescriptionAr: "",
    seoKeywords: [], seoKeywordsAr: [], canonicalUrl: "", seoImage: "",
  });
  const [form, setForm] = useState<Partial<FAQ>>(emptyForm());

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setFaqs(await getFaqs()); } catch { setError("Failed to load FAQs"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(emptyForm()); setEditTarget(null); setFaqFormTab("ar"); setFaqSeoLang("ar"); setFaqSeoKeyInputAr(""); setFaqSeoKeyInputEn(""); setShowForm(true); }
  function openEdit(f: FAQ) { setForm({ ...f }); setEditTarget(f); setFaqFormTab("ar"); setFaqSeoLang("ar"); setFaqSeoKeyInputAr(""); setFaqSeoKeyInputEn(""); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editTarget) {
        const updated = await updateFaq(editTarget.id, form);
        setFaqs(prev => prev.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await createFaq(form);
        setFaqs(prev => [...prev, created]);
      }
      setShowForm(false);
    } catch (err: any) { setError(err.message || "Save failed"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteFaq(id); setFaqs(prev => prev.filter(f => f.id !== id)); setConfirmDelete(null); }
    catch { setError("Delete failed"); }
  }

  const grouped = faqs.reduce<Record<string, FAQ[]>>((acc, f) => {
    const cat = f.categoryAr || f.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.faqs.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{faqs.length} {t("admin.faqs.count")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-navy text-white px-4 py-2 text-sm font-bold hover:bg-navy/80">
            <Plus className="h-4 w-4" /> {t("admin.faqs.new")}
          </button>
          <button onClick={load} className="flex items-center gap-2 border rounded-xl px-4 py-2 text-sm font-bold text-navy hover:bg-secondary">
            <RefreshCw className="h-4 w-4" /> {t("admin.refresh")}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* FAQ Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-card shadow-premium my-8 relative overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-7 py-5">
              <h3 className="text-xl font-black text-navy">{editTarget ? t("admin.faqs.editQuestion") : t("admin.faqs.new")}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-5 w-5" /></button>
            </div>
            {/* Tab bar */}
            <div className="flex border-b bg-secondary/30 px-7">
              {([
                { id: "ar",  label: "Arabic" },
                { id: "en",  label: "English" },
                { id: "seo", label: "SEO" },
              ] as const).map(tb => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setFaqFormTab(tb.id)}
                  className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${faqFormTab === tb.id ? "border-navy text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSave}>
              <div className="p-7 space-y-4">
                {/* Arabic tab */}
                {faqFormTab === "ar" && (
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">السؤال *</label>
                      <input required value={form.questionAr || ""} onChange={e => setForm(f => ({ ...f, questionAr: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="السؤال بالعربية" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">الجواب *</label>
                      <textarea required value={form.answerAr || ""} onChange={e => setForm(f => ({ ...f, answerAr: e.target.value }))} rows={6} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="الجواب بالعربية" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">التصنيف (AR)</label>
                        <input value={form.categoryAr || ""} onChange={e => setForm(f => ({ ...f, categoryAr: e.target.value }))} placeholder="شراء، إيجار، عام…" className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                      </div>
                      <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">الترتيب</label>
                        <input type="number" min={1} value={form.order || 1} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}
                {/* English tab */}
                {faqFormTab === "en" && (
                  <div className="space-y-4" dir="ltr">
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Question (EN)</label>
                      <input value={form.question || ""} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Question in English" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Answer (EN)</label>
                      <textarea value={form.answer || ""} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={6} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Answer in English" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wide">Category (EN)</label>
                      <input value={form.category || ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="buying, renting, general…" className="mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                    </div>
                  </div>
                )}
                {/* SEO tab — matches Articles SEO panel exactly */}
                {faqFormTab === "seo" && (
                  <div className="space-y-5">
                    {/* Language switcher */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">SEO fields for FAQ visibility. Switch language to fill each version.</p>
                      <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
                        <button type="button" onClick={() => setFaqSeoLang("ar")} className={`px-4 py-2 transition-colors ${faqSeoLang === "ar" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
                        <button type="button" onClick={() => setFaqSeoLang("en")} className={`px-4 py-2 transition-colors ${faqSeoLang === "en" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
                      </div>
                    </div>
                    {/* Language-driven fields */}
                    <div className="space-y-4" dir={faqSeoLang === "ar" ? "rtl" : "ltr"}>
                      {/* Meta Title */}
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                          {faqSeoLang === "ar" ? "عنوان الصفحة — Meta Title" : "Meta Title"}
                        </label>
                        <input
                          dir={faqSeoLang === "ar" ? "rtl" : "ltr"}
                          value={faqSeoLang === "ar" ? (form.seoTitleAr || "") : (form.seoTitle || "")}
                          onChange={e => setForm(f => faqSeoLang === "ar" ? { ...f, seoTitleAr: e.target.value } : { ...f, seoTitle: e.target.value })}
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          placeholder={faqSeoLang === "ar" ? "عنوان الصفحة بالعربية" : "Page title in English"}
                          maxLength={60}
                        />
                        <p className="mt-0.5 text-xs text-muted-foreground">{(faqSeoLang === "ar" ? (form.seoTitleAr || "") : (form.seoTitle || "")).length}/60</p>
                      </div>
                      {/* Meta Description */}
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                          {faqSeoLang === "ar" ? "وصف الصفحة — Meta Description" : "Meta Description"}
                        </label>
                        <textarea
                          dir={faqSeoLang === "ar" ? "rtl" : "ltr"}
                          value={faqSeoLang === "ar" ? (form.seoDescriptionAr || "") : (form.seoDescription || "")}
                          onChange={e => setForm(f => faqSeoLang === "ar" ? { ...f, seoDescriptionAr: e.target.value } : { ...f, seoDescription: e.target.value })}
                          rows={3}
                          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                          placeholder={faqSeoLang === "ar" ? "وصف الصفحة بالعربية" : "Page description in English"}
                          maxLength={160}
                        />
                        <p className="mt-0.5 text-xs text-muted-foreground">{(faqSeoLang === "ar" ? (form.seoDescriptionAr || "") : (form.seoDescription || "")).length}/160</p>
                      </div>
                      {/* Keywords */}
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                          {faqSeoLang === "ar" ? "الكلمات المفتاحية" : "Keywords"}
                        </label>
                        <div className="min-h-[38px] flex flex-wrap gap-1.5 rounded-xl border bg-background px-3 py-2 mb-2">
                          {(faqSeoLang === "ar" ? (form.seoKeywordsAr || []) : (form.seoKeywords || [])).map((kw: string) => (
                            <span key={kw} className="flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">
                              {kw}
                              <button type="button" onClick={() => {
                                if (faqSeoLang === "ar") setForm(f => ({ ...f, seoKeywordsAr: (f.seoKeywordsAr || []).filter(k => k !== kw) }));
                                else setForm(f => ({ ...f, seoKeywords: (f.seoKeywords || []).filter(k => k !== kw) }));
                              }} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            dir={faqSeoLang === "ar" ? "rtl" : "ltr"}
                            value={faqSeoLang === "ar" ? faqSeoKeyInputAr : faqSeoKeyInputEn}
                            onChange={e => faqSeoLang === "ar" ? setFaqSeoKeyInputAr(e.target.value) : setFaqSeoKeyInputEn(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (faqSeoLang === "ar") { const v = faqSeoKeyInputAr.trim(); if (v) { setForm(f => ({ ...f, seoKeywordsAr: [...(f.seoKeywordsAr || []), v] })); setFaqSeoKeyInputAr(""); } }
                                else { const v = faqSeoKeyInputEn.trim(); if (v) { setForm(f => ({ ...f, seoKeywords: [...(f.seoKeywords || []), v] })); setFaqSeoKeyInputEn(""); } }
                              }
                            }}
                            placeholder={faqSeoLang === "ar" ? "اكتب الكلمة + Enter…" : "Type keyword + Enter…"}
                            className="h-9 flex-1 rounded-xl border bg-background px-3 text-sm focus:outline-none"
                          />
                          <button type="button" onClick={() => {
                            if (faqSeoLang === "ar") { const v = faqSeoKeyInputAr.trim(); if (v) { setForm(f => ({ ...f, seoKeywordsAr: [...(f.seoKeywordsAr || []), v] })); setFaqSeoKeyInputAr(""); } }
                            else { const v = faqSeoKeyInputEn.trim(); if (v) { setForm(f => ({ ...f, seoKeywords: [...(f.seoKeywords || []), v] })); setFaqSeoKeyInputEn(""); } }
                          }} className="rounded-xl bg-navy/10 px-3 font-bold text-navy hover:bg-navy/20"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                    {/* Shared fields — canonical & OG image */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Canonical URL</label>
                        <input value={form.canonicalUrl || ""} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://osoulk.com/faqs/…" dir="ltr" />
                      </div>
                      <div>
                        <MediaPickerField label="OG / Social Image" value={form.seoImage || ""} onChange={url => setForm(f => ({ ...f, seoImage: url }))} previewClass="mt-2 h-16 w-full rounded-xl object-cover border" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 border-t px-7 py-4">
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-navy text-white py-2.5 font-bold disabled:opacity-60 hover:bg-navy/80 transition-colors">{saving ? "Saving…" : "Save Question"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-6 py-2.5 font-bold text-navy hover:bg-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : faqs.length === 0 ? (
        <div className="premium-card p-12 text-center"><HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 font-black text-navy">{t("admin.faqs.noFaqs")}</p><p className="mt-2 text-sm text-muted-foreground">{t("admin.faqs.startAdding")}</p></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-base font-black text-navy flex items-center gap-2"><Tag className="h-4 w-4 text-aqua" />{cat}</h3>
              <div className="overflow-x-auto rounded-2xl border bg-card shadow-float">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b bg-secondary">
                    <tr>{["Question", "Answer", "Order", "Actions"].map(h => <th key={h} className="px-5 py-3 text-right text-xs font-black uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(faq => (
                      <tr key={faq.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-5 py-3.5 max-w-xs"><p className="font-bold text-navy line-clamp-2">{faq.questionAr || faq.question}</p></td>
                        <td className="px-5 py-3.5 text-muted-foreground max-w-xs"><p className="line-clamp-2">{faq.answerAr || faq.answer}</p></td>
                        <td className="px-5 py-3.5 text-center font-bold text-navy">{faq.order}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(faq)} className="flex items-center gap-1 rounded-lg bg-navy/5 px-2.5 py-1.5 text-xs font-bold text-navy hover:bg-navy/10"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                            {confirmDelete === faq.id ? (
                              <>
                                <button onClick={() => handleDelete(faq.id)} className="rounded-lg bg-destructive/10 px-2 py-1.5 text-xs font-bold text-destructive">Confirm</button>
                                <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary">Cancel</button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmDelete(faq.id)} className="rounded-lg bg-destructive/5 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Text Content Tab ──────────────────────────────────────────────────────────
const SITE_SECTIONS_LIST = [
  { id: "hero",   labelAr: "القسم الرئيسي", labelEn: "Hero" },
  { id: "navbar", labelAr: "شريط التصفح",   labelEn: "Navbar" },
  { id: "trust",  labelAr: "قسم الثقة",     labelEn: "Trust" },
  { id: "footer", labelAr: "التذييل",       labelEn: "Footer" },
  { id: "cta",    labelAr: "الدعوة للعمل",  labelEn: "CTA" },
] as const;

function SectionTextSeoEditor({
  data,
  onChange,
}: {
  data: SectionSeoData;
  onChange: (k: string, v: any) => void;
}) {
  const [tab, setTab] = useState<"content" | "seo">("content");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [seoLang, setSeoLang] = useState<"ar" | "en">("ar");
  const [kwInput, setKwInput] = useState("");
  const isAr = lang === "ar";
  const isSeoAr = seoLang === "ar";

  function addKw() {
    const arr = kwInput.split(",").map(s => s.trim()).filter(Boolean);
    if (!arr.length) return;
    if (isSeoAr) onChange("seoKeywordsAr", [...(data.seoKeywordsAr || []), ...arr]);
    else onChange("seoKeywords", [...(data.seoKeywords || []), ...arr]);
    setKwInput("");
  }
  function removeKw(kw: string, isArKw: boolean) {
    if (isArKw) onChange("seoKeywordsAr", (data.seoKeywordsAr || []).filter(k => k !== kw));
    else onChange("seoKeywords", (data.seoKeywords || []).filter(k => k !== kw));
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-0 rounded-xl border bg-secondary/50 p-1 w-fit overflow-hidden">
        {([{ id: "content", label: "Content" }, { id: "seo", label: "SEO" }] as const).map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition-colors whitespace-nowrap ${tab === tb.id ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT TAB */}
      {tab === "content" && (
        <div className="premium-card p-6 space-y-5">
          <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold w-fit">
            <button type="button" onClick={() => setLang("ar")} className={`px-4 py-2 transition-colors ${isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
            <button type="button" onClick={() => setLang("en")} className={`px-4 py-2 transition-colors ${!isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
          </div>
          <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "العنوان" : "Title"}</label>
                <input value={isAr ? (data.titleAr || "") : (data.title || "")} onChange={e => onChange(isAr ? "titleAr" : "title", e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={isAr ? "عنوان القسم…" : "Section title…"} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "العنوان الفرعي" : "Subtitle"}</label>
                <input value={isAr ? (data.subtitleAr || "") : (data.subtitle || "")} onChange={e => onChange(isAr ? "subtitleAr" : "subtitle", e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={isAr ? "العنوان الفرعي…" : "Subtitle…"} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "نص الجسم" : "Body Text"}</label>
              <textarea value={isAr ? (data.bodyAr || "") : (data.body || "")} onChange={e => onChange(isAr ? "bodyAr" : "body", e.target.value)}
                rows={4} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={isAr ? "المحتوى النصي للقسم…" : "Section body text…"} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "نص الزر (CTA)" : "CTA Button Text"}</label>
              <input value={isAr ? (data.ctaTextAr || "") : (data.ctaText || "")} onChange={e => onChange(isAr ? "ctaTextAr" : "ctaText", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={isAr ? "اكتشف العقارات…" : "Explore Properties…"} />
            </div>
          </div>
          <div dir="ltr">
            <MediaPickerField
              label="Section Image"
              value={data.image || ""}
              onChange={url => onChange("image", url)}
              previewClass="mt-1 h-24 w-full rounded-xl object-cover border"
            />
          </div>
        </div>
      )}

      {/* SEO TAB */}
      {tab === "seo" && (
        <div className="premium-card p-6 space-y-5">
          <p className="text-xs text-muted-foreground">بيانات SEO لهذا القسم. اختر اللغة لتعبئة كل نسخة.</p>
          <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold w-fit">
            <button type="button" onClick={() => setSeoLang("ar")} className={`px-4 py-2 transition-colors ${isSeoAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
            <button type="button" onClick={() => setSeoLang("en")} className={`px-4 py-2 transition-colors ${!isSeoAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
          </div>
          <div className="space-y-4" dir={isSeoAr ? "rtl" : "ltr"}>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                {isSeoAr ? "عنوان الصفحة — Meta Title" : "Meta Title"}
              </label>
              <input dir={isSeoAr ? "rtl" : "ltr"}
                value={isSeoAr ? (data.seoTitleAr || "") : (data.seoTitle || "")}
                onChange={e => onChange(isSeoAr ? "seoTitleAr" : "seoTitle", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={isSeoAr ? "عنوان الصفحة بالعربية" : "Page title in English"} maxLength={60} />
              <p className="mt-0.5 text-xs text-muted-foreground">{(isSeoAr ? (data.seoTitleAr || "") : (data.seoTitle || "")).length}/60</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                {isSeoAr ? "وصف الصفحة — Meta Description" : "Meta Description"}
              </label>
              <textarea dir={isSeoAr ? "rtl" : "ltr"}
                value={isSeoAr ? (data.seoDescriptionAr || "") : (data.seoDescription || "")}
                onChange={e => onChange(isSeoAr ? "seoDescriptionAr" : "seoDescription", e.target.value)}
                rows={3} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder={isSeoAr ? "وصف الصفحة بالعربية" : "Page description in English"} maxLength={160} />
              <p className="mt-0.5 text-xs text-muted-foreground">{(isSeoAr ? (data.seoDescriptionAr || "") : (data.seoDescription || "")).length}/160</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                {isSeoAr ? "الكلمات المفتاحية" : "Keywords"}
              </label>
              <div className="min-h-[38px] flex flex-wrap gap-1.5 rounded-lg border bg-background px-3 py-2 mb-2">
                {(isSeoAr ? (data.seoKeywordsAr || []) : (data.seoKeywords || [])).map(kw => (
                  <span key={kw} className="flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">
                    {kw}
                    <button type="button" onClick={() => removeKw(kw, isSeoAr)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2" dir="ltr">
                <input dir={isSeoAr ? "rtl" : "ltr"}
                  value={kwInput} onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKw(); } }}
                  placeholder={isSeoAr ? "اكتب الكلمة + Enter أو افصل بفاصلة…" : "Type keyword + Enter or separate by comma…"}
                  className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm focus:outline-none" />
                <button type="button" onClick={addKw} className="rounded-lg bg-navy/10 px-3 font-bold text-navy hover:bg-navy/20"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2" dir="ltr">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Canonical URL</label>
              <input value={data.canonicalUrl || ""} onChange={e => onChange("canonicalUrl", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="https://osoulk.com/…" dir="ltr" />
            </div>
            <MediaPickerField
              label="OG / Social Image"
              value={data.ogImage || ""}
              onChange={url => onChange("ogImage", url)}
              previewClass="mt-1 h-16 w-full rounded-lg object-cover border"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TextContentTab() {
  const [seoData, setSeoData] = useState<Record<string, SectionSeoData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    setLoading(true);
    getSectionSeoData()
      .then(d => { setSeoData(d); setLoading(false); })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      await updateSectionSeoData(seoData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { setError("Save failed"); } finally { setSaving(false); }
  }

  function setField(sectionId: string, k: string, v: any) {
    setSeoData(prev => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [k]: v } }));
  }

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />)}</div>;

  const activeMeta = SITE_SECTIONS_LIST.find(s => s.id === activeSection);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">محتوى النصوص و SEO</h2>
          <p className="text-sm text-muted-foreground mt-1">تحرير محتوى ونصوص الأقسام الرئيسية مع بيانات SEO بالعربية والإنجليزية</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-bold text-emerald-600">تم الحفظ!</span>}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />{saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[220px_1fr] items-start">
        {/* Left nav */}
        <div className="space-y-1.5">
          {SITE_SECTIONS_LIST.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-right transition-colors ${activeSection === sec.id ? "bg-navy text-white shadow-sm" : "text-navy hover:bg-secondary"}`}
            >
              <Layout className="h-4 w-4 shrink-0" />
              <div className="flex-1 text-right min-w-0">
                <div className="truncate">{sec.labelAr}</div>
                <div className={`text-xs truncate ${activeSection === sec.id ? "text-white/70" : "text-muted-foreground"}`}>{sec.labelEn}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: editor */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-black text-navy">{activeMeta?.labelAr}</h3>
            <p className="text-xs text-muted-foreground">id: {activeSection}</p>
          </div>
          <SectionTextSeoEditor
            key={activeSection}
            data={seoData[activeSection] || {}}
            onChange={(k, v) => setField(activeSection, k, v)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Project SEO Panel (bilingual, language-switched) ────────────────────────
function ProjectSeoPanel({ editing, setEditing }: { editing: any; setEditing: (fn: (prev: any) => any) => void }) {
  const [seoLang, setSeoLang] = useState<"ar" | "en">("ar");
  const isAr = seoLang === "ar";
  const up = (k: string, v: any) => setEditing((prev: any) => ({ ...prev, [k]: v }));

  return (
    <div className="premium-card p-5 space-y-4">
      {/* Header with language switcher */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-navy">SEO Settings</h3>
        <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
          <button type="button" onClick={() => setSeoLang("ar")} className={`px-4 py-2 transition-colors ${isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
          <button type="button" onClick={() => setSeoLang("en")} className={`px-4 py-2 transition-colors ${!isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
        </div>
      </div>
      {/* Language-driven fields */}
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "عنوان الصفحة — Meta Title" : "Meta Title"}</label>
          <input
            dir={isAr ? "rtl" : "ltr"}
            value={String(isAr ? (editing?.seoTitleAr ?? "") : (editing?.seoTitle ?? ""))}
            onChange={e => up(isAr ? "seoTitleAr" : "seoTitle", e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={isAr ? "عنوان المشروع بالعربية" : "Project title in search engines"}
            maxLength={60}
          />
          <p className="mt-0.5 text-xs text-muted-foreground">{String(isAr ? (editing?.seoTitleAr ?? "") : (editing?.seoTitle ?? "")).length}/60</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "وصف الصفحة — Meta Description" : "Meta Description"}</label>
          <textarea
            dir={isAr ? "rtl" : "ltr"}
            value={String(isAr ? (editing?.seoDescriptionAr ?? "") : (editing?.seoDescription ?? ""))}
            onChange={e => up(isAr ? "seoDescriptionAr" : "seoDescription", e.target.value)}
            rows={2}
            className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={isAr ? "وصف المشروع في نتائج البحث" : "Project description shown in search results"}
            maxLength={160}
          />
          <p className="mt-0.5 text-xs text-muted-foreground">{String(isAr ? (editing?.seoDescriptionAr ?? "") : (editing?.seoDescription ?? "")).length}/160</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{isAr ? "الكلمات المفتاحية" : "Keywords (comma-separated)"}</label>
          <input
            dir={isAr ? "rtl" : "ltr"}
            value={String(isAr ? (editing?.seoKeywordsAr ?? "") : (editing?.seoKeywords ?? ""))}
            onChange={e => up(isAr ? "seoKeywordsAr" : "seoKeywords", e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={isAr ? "كمبوند، القاهرة الجديدة، شقق للبيع…" : "compound, new cairo, apartments for sale…"}
          />
        </div>
      </div>
      {/* Shared: OG Image */}
      <MediaPickerField
        label="OG / SEO Image"
        value={String(editing?.seoImage ?? "")}
        onChange={url => up("seoImage", url)}
        previewClass="mt-1 h-20 w-full object-cover rounded-xl border"
      />
    </div>
  );
}

// ─── Projects (Compounds) Admin Tab ──────────────────────────────────────────
function ProjectsAdminTab() {
  const { t } = useLang();
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<PublicProject> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [projectFormTab, setProjectFormTab] = useState<"general"|"location"|"media"|"content"|"broker"|"seo">("general");

  const EMPTY: Partial<PublicProject> = {
    name: "", nameAr: "", slug: "", developerName: "", developerNameAr: "",
    logoUrl: "", developerWebsite: "", heroImage: "", gallery: [],
    description: "", descriptionAr: "",
    location: "", locationAr: "", governorate: "", address: "", lat: null, lng: null,
    priceFrom: "", priceTo: "", status: "under-construction", deliveryDate: "",
    totalUnits: 0, availableUnits: 0, amenities: [], amenitiesAr: [],
    featured: false, publishStatus: "published", order: 0,
    brokerNotes: "", commissionNotes: "",
    seoTitle: "", seoDescription: "", seoKeywords: "", seoImage: "",
  };

  async function load() {
    setLoading(true); setError("");
    try { setProjects(await getAdminProjects()); } catch { setError("Failed to load projects."); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true); setError("");
    try {
      if (editing.id) {
        const updated = await updateAdminProject(editing.id, editing);
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await createAdminProject(editing);
        setProjects(prev => [created, ...prev]);
      }
      setEditing(null); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await deleteAdminProject(id); setProjects(prev => prev.filter(p => p.id !== id)); setConfirmDelete(null); }
    catch { setError("Delete failed"); }
  }

  function F({ k, label, multiline, placeholder }: { k: keyof PublicProject; label: string; multiline?: boolean; placeholder?: string }) {
    return (
      <div>
        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</label>
        {multiline
          ? <textarea value={String((editing as any)?.[k] ?? "")} onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))} rows={3} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={placeholder} />
          : <input value={String((editing as any)?.[k] ?? "")} onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={placeholder} />
        }
      </div>
    );
  }

  const STATUS_OPTIONS = [
    { value: "under-construction", labelAr: "قيد الإنشاء",  labelEn: "Under Construction" },
    { value: "ready",              labelAr: "جاهز للسكن",   labelEn: "Ready to Move" },
    { value: "off-plan",           labelAr: "على الخارطة",  labelEn: "Off-Plan" },
    { value: "completed",          labelAr: "مكتمل",        labelEn: "Completed" },
  ];

  if (editing !== null) {
    const PROJECT_TABS = [
      { id: "general",  label: "General" },
      { id: "location", label: "Location & Pricing" },
      { id: "media",    label: "Media & Developer" },
      { id: "content",  label: "Description & Amenities" },
      { id: "broker",   label: "Broker Notes" },
      { id: "seo",      label: "SEO" },
    ] as const;
    return (
      <div className="space-y-0">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <button onClick={() => setEditing(null)} className="hover:text-navy transition-colors">Projects</button>
              <span>/</span>
              <span className="text-navy font-bold">{editing.id ? "Edit" : "New"}</span>
            </div>
            <h2 className="text-2xl font-black text-navy">{editing.id ? t("admin.projects.editProject") : t("admin.projects.newProject")}</h2>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-sm font-bold text-emerald-600">{t("admin.saved")}</span>}
            <Button onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? t("admin.saving") : t("admin.save")}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {/* Tab bar */}
        <div className="mb-5 flex flex-wrap gap-1 rounded-xl border bg-secondary/50 p-1 w-fit">
          {PROJECT_TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setProjectFormTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${projectFormTab === t.id ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* General tab */}
        {projectFormTab === "general" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy">{t("admin.projects.generalInfo")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <F k="nameAr" label="Project Name (AR)" />
              <F k="name"   label="Project Name (EN)" />
              <div className="sm:col-span-2"><F k="slug" label="URL Slug" placeholder="project-name-in-english" /></div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Status</label>
              <select value={editing.status ?? "under-construction"} onChange={e => setEditing(prev => ({ ...prev, status: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.labelAr} — {s.labelEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.publishStatus")}</label>
              <select value={editing.publishStatus ?? "published"} onChange={e => setEditing(prev => ({ ...prev, publishStatus: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                <option value="published">{t("admin.published")}</option>
                <option value="draft">{t("admin.draft")}</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
              <span className="text-sm font-bold text-navy">{t("admin.projects.featured")}</span>
              <button type="button" onClick={() => setEditing(prev => ({ ...prev, featured: !prev?.featured }))} className={`relative h-6 w-11 rounded-full transition-colors ${editing.featured ? "bg-emerald-500" : "bg-secondary border"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${editing.featured ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        )}

        {/* Location & Pricing tab */}
        {projectFormTab === "location" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy">{t("admin.projects.locationPricing")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <F k="locationAr"  label="Location (AR)" />
              <F k="location"    label="Location (EN)" />
              <F k="governorate" label="Governorate" />
              <F k="address"     label="Detailed Address" />
              <F k="priceFrom"   label="Price From" />
              <F k="priceTo"     label="Price To" />
              <F k="deliveryDate" label="Delivery Date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.totalUnits")}</label>
                <input type="number" value={editing.totalUnits ?? 0} onChange={e => setEditing(prev => ({ ...prev, totalUnits: Number(e.target.value) }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.availableUnits")}</label>
                <input type="number" value={editing.availableUnits ?? 0} onChange={e => setEditing(prev => ({ ...prev, availableUnits: Number(e.target.value) }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* Media & Developer tab */}
        {projectFormTab === "media" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy">{t("admin.projects.mediaDev")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <F k="developerNameAr" label="Developer Name (AR)" />
              <F k="developerName"   label="Developer Name (EN)" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.devLogo")}</label>
                <input value={String((editing as any)?.logoUrl ?? "")} onChange={e => setEditing(prev => ({ ...prev, logoUrl: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://…/logo.png" />
                {(editing as any)?.logoUrl && <img src={(editing as any).logoUrl} alt="Logo" className="mt-2 h-12 w-auto object-contain border rounded-lg bg-white p-1" onError={e => (e.currentTarget.style.display = "none")} />}
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.devWebsite")}</label>
                <input value={String((editing as any)?.developerWebsite ?? "")} onChange={e => setEditing(prev => ({ ...prev, developerWebsite: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://developer-website.com" dir="ltr" />
                <p className="mt-0.5 text-xs text-muted-foreground">Developer website — different from the logo</p>
              </div>
            </div>
            <MediaPickerField
              label="Project Hero Image"
              value={(editing as any)?.heroImage || ""}
              onChange={url => setEditing(prev => ({ ...prev, heroImage: url }))}
              previewClass="h-36 w-full object-cover rounded-xl border"
            />
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.gallery")}</label>
              <div className="space-y-2">
                {(editing.gallery ?? []).map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    {url && <img src={url} alt="" className="h-10 w-16 rounded object-cover border shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                    <input
                      value={url}
                      onChange={e => setEditing(prev => ({ ...prev, gallery: (prev?.gallery ?? []).map((g, i) => i === idx ? e.target.value : g) }))}
                      className="flex-1 h-9 rounded-lg border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                      placeholder="https://…/image.jpg"
                      dir="ltr"
                    />
                    <button type="button" onClick={() => setEditing(prev => ({ ...prev, gallery: (prev?.gallery ?? []).filter((_, i) => i !== idx) }))} className="shrink-0 rounded-lg border p-2 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditing(prev => ({ ...prev, gallery: [...(prev?.gallery ?? []), ""] }))} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add URL
                  </button>
                  <GalleryImageAdder onAdd={url => setEditing(prev => ({ ...prev, gallery: [...(prev?.gallery ?? []), url] }))} />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Add gallery images from the Media Library or by URL.</p>
            </div>
          </div>
        )}

        {/* Description & Amenities tab */}
        {projectFormTab === "content" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy">{t("admin.projects.descContent")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Description (AR)</label>
                <textarea value={String((editing as any)?.descriptionAr ?? "")} onChange={e => setEditing(prev => ({ ...prev, descriptionAr: e.target.value }))} rows={4} dir="rtl" className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="وصف المشروع بالعربية…" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Description (EN)</label>
                <textarea value={String((editing as any)?.description ?? "")} onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))} rows={4} dir="ltr" className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Project description in English…" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Amenities (AR) — one per line</label>
                <textarea value={(editing.amenitiesAr ?? []).join("\n")} onChange={e => setEditing(prev => ({ ...prev, amenitiesAr: e.target.value.split("\n").filter(Boolean) }))} rows={6} dir="rtl" className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none" placeholder={"مسبح\nنادي رياضي\nحراسة 24 ساعة"} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Amenities (EN) — one per line</label>
                <textarea value={(editing.amenities ?? []).join("\n")} onChange={e => setEditing(prev => ({ ...prev, amenities: e.target.value.split("\n").filter(Boolean) }))} rows={6} dir="ltr" className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none" placeholder={"Swimming Pool\nGym\n24/7 Security"} />
              </div>
            </div>
          </div>
        )}

        {/* Broker Notes tab */}
        {projectFormTab === "broker" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy">Broker & Commission Notes</h3>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              This data is internal — visible to brokers and admins only, not shown to regular visitors.
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Broker Notes</label>
              <textarea
                value={String((editing as any)?.brokerNotes ?? "")}
                onChange={e => setEditing(prev => ({ ...prev, brokerNotes: e.target.value }))}
                rows={5}
                className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Internal notes about the project, contacts, procedures…"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Commission Notes</label>
              <textarea
                value={String((editing as any)?.commissionNotes ?? "")}
                onChange={e => setEditing(prev => ({ ...prev, commissionNotes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="e.g. 3% commission on unit value, paid upon signing…"
              />
            </div>
          </div>
        )}

        {/* SEO tab */}
        {projectFormTab === "seo" && (
          <ProjectSeoPanel editing={editing} setEditing={setEditing} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-black text-navy">{t("admin.projects.title")}</h2><p className="mt-1 text-sm text-muted-foreground">{projects.length} {t("admin.projects.count")}</p></div>
        <div className="flex gap-3">
          <Button onClick={() => { setEditing(EMPTY); setProjectFormTab("general"); }}><Plus className="h-4 w-4" /> {t("admin.projects.newProject")}</Button>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />)}</div>
      ) : projects.length === 0 ? (
        <div className="premium-card p-16 text-center"><Building2 className="mx-auto h-14 w-14 text-muted-foreground/30" /><p className="mt-4 text-lg font-black text-navy">No projects yet</p><p className="mt-2 text-sm text-muted-foreground">Add your first project or compound</p></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <div key={p.id} className="premium-card overflow-hidden">
              <div className="relative h-32 bg-secondary overflow-hidden">
                {p.heroImage ? <img src={p.heroImage} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 className="h-10 w-10 text-muted-foreground/20" /></div>}
                <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold ${p.publishStatus === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{p.publishStatus === "published" ? "Published" : "Draft"}</span>
              </div>
              <div className="p-4">
                <p className="font-black text-navy truncate">{p.nameAr || p.name}</p>
                <p className="text-xs text-gold">{p.developerNameAr || p.developerName}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{p.location}</p>
                {p.priceFrom && <p className="mt-2 text-sm font-bold text-navy">{p.priceFrom}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(p); setProjectFormTab("general"); }}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                  {confirmDelete === p.id ? (
                    <>
                      <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => remove(p.id)}>Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page SEO Tab Panel (proper component to avoid hooks-in-callback) ─────────
function PageSeoTabPanel({
  editing,
  set,
}: {
  editing: Partial<CmsPage>;
  set: (k: keyof CmsPage | string, v: any) => void;
}) {
  const [kwEnInput, setKwEnInput] = useState("");
  const [kwArInput, setKwArInput] = useState("");
  const [seoLang, setSeoLang] = useState<"ar" | "en">("ar");
  const kwEn: string[] = Array.isArray((editing as any).seoKeywords) ? (editing as any).seoKeywords : [];
  const kwAr: string[] = Array.isArray((editing as any).seoKeywordsAr) ? (editing as any).seoKeywordsAr : [];
  const isAr = seoLang === "ar";

  return (
    <div className="premium-card p-6 space-y-5">
      {/* Header with language switcher */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-navy">SEO Settings</h3>
        <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
          <button type="button" onClick={() => setSeoLang("ar")} className={`px-4 py-2 transition-colors ${isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
          <button type="button" onClick={() => setSeoLang("en")} className={`px-4 py-2 transition-colors ${!isAr ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
        </div>
      </div>
      {/* Language-driven fields */}
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
            {isAr ? "عنوان الصفحة — Meta Title" : "Meta Title"}
          </label>
          <input
            dir={isAr ? "rtl" : "ltr"}
            value={isAr ? ((editing as any).seoTitleAr || "") : ((editing as any).seoTitle || "")}
            onChange={e => set(isAr ? "seoTitleAr" : "seoTitle", e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={isAr ? "عنوان الصفحة بالعربية" : "Page title in English"}
            maxLength={60}
          />
          <p className="mt-0.5 text-xs text-muted-foreground">{(isAr ? ((editing as any).seoTitleAr || "") : ((editing as any).seoTitle || "")).length}/60</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
            {isAr ? "وصف الصفحة — Meta Description" : "Meta Description"}
          </label>
          <textarea
            dir={isAr ? "rtl" : "ltr"}
            value={isAr ? ((editing as any).seoDescriptionAr || "") : ((editing as any).seoDescription || "")}
            onChange={e => set(isAr ? "seoDescriptionAr" : "seoDescription", e.target.value)}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={isAr ? "وصف الصفحة بالعربية" : "Page description in English"}
            maxLength={160}
          />
          <p className="mt-0.5 text-xs text-muted-foreground">{(isAr ? ((editing as any).seoDescriptionAr || "") : ((editing as any).seoDescription || "")).length}/160</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">
            {isAr ? "الكلمات المفتاحية" : "Keywords"}
          </label>
          <div className="min-h-[38px] flex flex-wrap gap-1.5 rounded-lg border bg-background px-3 py-2 mb-2">
            {(isAr ? kwAr : kwEn).map(kw => (
              <span key={kw} className="flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">
                {kw}
                <button type="button" onClick={() => isAr ? set("seoKeywordsAr", kwAr.filter(k => k !== kw)) : set("seoKeywords", kwEn.filter(k => k !== kw))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              dir={isAr ? "rtl" : "ltr"}
              value={isAr ? kwArInput : kwEnInput}
              onChange={e => isAr ? setKwArInput(e.target.value) : setKwEnInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (isAr) { const v = kwArInput.trim(); if (v) { set("seoKeywordsAr", [...kwAr, v]); setKwArInput(""); } }
                  else { const v = kwEnInput.trim(); if (v) { set("seoKeywords", [...kwEn, v]); setKwEnInput(""); } }
                }
              }}
              placeholder={isAr ? "اكتب الكلمة + Enter…" : "Type keyword + Enter…"}
              className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm focus:outline-none"
            />
            <button type="button" onClick={() => {
              if (isAr) { const v = kwArInput.trim(); if (v) { set("seoKeywordsAr", [...kwAr, v]); setKwArInput(""); } }
              else { const v = kwEnInput.trim(); if (v) { set("seoKeywords", [...kwEn, v]); setKwEnInput(""); } }
            }} className="rounded-lg bg-navy/10 px-3 font-bold text-navy hover:bg-navy/20"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      {/* Shared: Canonical + OG Image */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Canonical URL</label>
          <input value={(editing as any).canonicalUrl || ""} onChange={e => set("canonicalUrl", e.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="https://osoulk.com/page" dir="ltr" />
        </div>
        <MediaPickerField
          label="OG / Social Preview Image"
          value={(editing as any).ogImage || ""}
          onChange={url => set("ogImage", url)}
          previewClass="mt-1 h-16 w-full rounded-lg object-cover border"
        />
      </div>
    </div>
  );
}

// ─── Pages (CMS) Admin Tab ────────────────────────────────────────────────────
// ─── Page Edit View (tabbed) ──────────────────────────────────────────────────
function PageEditView({
  editing, setEditing, onSave, saving, saved, error,
}: {
  editing: Partial<CmsPage>;
  setEditing: React.Dispatch<React.SetStateAction<Partial<CmsPage> | null>>;
  onSave: () => void;
  saving: boolean; saved: boolean; error: string;
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<"ar" | "en" | "settings" | "seo" | "code">("ar");

  function set(k: string, v: any) { setEditing(prev => prev ? { ...prev, [k]: v } : prev); }

  const TABS = [
    { id: "ar",       label: "العربية" },
    { id: "en",       label: "English" },
    { id: "settings", label: "Settings" },
    { id: "seo",      label: "SEO" },
    { id: "code",     label: "Code" },
  ] as const;

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <button onClick={() => setEditing(null)} className="hover:text-navy transition-colors">Pages</button>
            <span>/</span>
            <span className="text-navy font-bold">{editing.id ? "Edit" : "New"}</span>
          </div>
          <h2 className="text-2xl font-black text-navy">{editing.id ? "Edit Page" : "New Page"}</h2>
        </div>
        <div className="flex items-center gap-2">
          {editing.id && editing.slug && (
            <a href={`/pages/${editing.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold text-muted-foreground hover:text-navy transition-colors">
              <ExternalLink className="h-4 w-4" /> View
            </a>
          )}
          {saved && <span className="text-sm font-bold text-emerald-600">Saved!</span>}
          <button onClick={onSave} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-black text-white disabled:opacity-50 hover:bg-navy/80 transition-colors">
            <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={() => setEditing(null)} className="rounded-xl border px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Tab bar */}
      <div className="mb-5 flex items-center gap-0 rounded-xl border bg-secondary/50 p-1 w-fit overflow-hidden">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${tab === tb.id ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Arabic tab */}
      {tab === "ar" && (
        <div className="premium-card p-6 space-y-5" dir="rtl">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">عنوان الصفحة *</label>
              <input value={editing.titleAr || ""} onChange={e => set("titleAr", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="مثال: الشروط والأحكام" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">عنوان البطل (اختياري)</label>
              <input value={editing.heroTitleAr || ""} onChange={e => set("heroTitleAr", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="عنوان يظهر في قسم البطل" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">المحتوى</label>
            <p className="mb-1.5 text-xs text-muted-foreground">يدعم HTML الأساسي — يظهر على /pages/{editing.slug || "…"}</p>
            <textarea value={editing.contentAr || ""} onChange={e => set("contentAr", e.target.value)}
              rows={14} className="w-full rounded-lg border bg-background p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder="اكتب محتوى الصفحة هنا… (HTML مدعوم)" />
          </div>
        </div>
      )}

      {/* English tab */}
      {tab === "en" && (
        <div className="premium-card p-6 space-y-5" dir="ltr">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Page Title *</label>
              <input value={editing.title || ""} onChange={e => set("title", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="e.g. Terms of Service" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Hero Title (optional)</label>
              <input value={editing.heroTitle || ""} onChange={e => set("heroTitle", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Title shown in hero header" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Content</label>
            <p className="mb-1.5 text-xs text-muted-foreground">Basic HTML is supported — displayed on /pages/{editing.slug || "…"}</p>
            <textarea value={editing.content || ""} onChange={e => set("content", e.target.value)}
              rows={14} className="w-full rounded-lg border bg-background p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder="Write page content here… (HTML supported)" />
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="premium-card p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">URL Slug</label>
              <input value={editing.slug || ""} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="terms-of-service" dir="ltr" />
              <p className="mt-1 text-xs text-muted-foreground" dir="ltr">/pages/<span className="font-mono font-bold text-navy">{editing.slug || "…"}</span></p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.projects.publishStatus")}</label>
              <select value={editing.publishStatus ?? "draft"} onChange={e => set("publishStatus", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                <option value="draft">{t("admin.draft")}</option>
                <option value="published">{t("admin.published")}</option>
              </select>
            </div>
          </div>
          <MediaPickerField
            label={t("admin.projects.heroImage")}
            value={editing.heroImage || ""}
            onChange={url => set("heroImage", url)}
            previewClass="h-28 w-full rounded-xl object-cover border"
          />
          <div className="flex flex-wrap gap-6 border-t pt-4">
            {([
              { key: "showInNav",    label: "Show in top nav" },
              { key: "showInMenu",   label: "Show in main menu" },
              { key: "showInFooter", label: "Show in footer" },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-navy">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={!!(editing as any)[key]}
                    onChange={e => set(key, e.target.checked)} />
                  <div className={`h-5 w-9 rounded-full transition-colors ${(editing as any)[key] ? "bg-navy" : "bg-secondary border"}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${(editing as any)[key] ? "left-4" : "left-0.5"}`} />
                  </div>
                </div>
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SEO tab */}
      {tab === "seo" && <PageSeoTabPanel editing={editing} set={set} />}

      {/* Code tab */}
      {tab === "code" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <strong>Warning:</strong> This section is not recommended for users without sufficient technical knowledge. Incorrect edits may break the site's layout or disable features.
          </div>
          <div className="premium-card p-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-black text-navy">Inject code at the end of &lt;head&gt;</label>
              <textarea value={editing.headCode || ""} onChange={e => set("headCode", e.target.value)}
                rows={8} className="w-full rounded-lg border bg-[#0d1117] p-3 font-mono text-sm text-green-400 focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="<!-- CSS, Meta tags, Analytics… -->" dir="ltr" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-navy">Inject code at the end of &lt;body&gt;</label>
              <textarea value={editing.bodyCode || ""} onChange={e => set("bodyCode", e.target.value)}
                rows={8} className="w-full rounded-lg border bg-[#0d1117] p-3 font-mono text-sm text-green-400 focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="<!-- JavaScript, Chat widgets, Pixel codes… -->" dir="ltr" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagesTab() {
  const { t } = useLang();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<CmsPage> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const EMPTY: Partial<CmsPage> = {
    slug: "", title: "", titleAr: "", heroImage: "", heroTitle: "", heroTitleAr: "",
    content: "", contentAr: "", publishStatus: "draft",
    seoTitle: "", seoDescription: "", seoKeywords: "", ogImage: "",
    headCode: "", bodyCode: "", showInNav: false, showInMenu: false, showInFooter: false,
  };

  async function load() {
    setLoading(true); setError("");
    try { setPages(await getAdminPages()); } catch { setError("Failed to load pages."); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function savePage() {
    if (!editing) return;
    setSaving(true); setError("");
    try {
      if (editing.id) {
        const updated = await updateAdminPage(editing.id, editing);
        setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await createAdminPage(editing);
        setPages(prev => [created, ...prev]);
      }
      setEditing(null); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await deleteAdminPage(id); setPages(prev => prev.filter(p => p.id !== id)); setConfirmDelete(null); }
    catch { setError("Delete failed"); }
  }

  function F({ k, label, multiline }: { k: keyof CmsPage; label: string; multiline?: boolean }) {
    return (
      <div>
        <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</label>
        {multiline
          ? <textarea value={String((editing as any)?.[k] ?? "")} onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))} rows={6} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
          : <input value={String((editing as any)?.[k] ?? "")} onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
        }
      </div>
    );
  }

  if (editing !== null) {
    return <PageEditView editing={editing} setEditing={setEditing} onSave={savePage} saving={saving} saved={saved} error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-black text-navy">{t("admin.pages.title")}</h2><p className="mt-1 text-sm text-muted-foreground">{pages.length} {t("admin.pages.count")}</p></div>
        <div className="flex gap-3">
          <Button onClick={() => setEditing(EMPTY)}><Plus className="h-4 w-4" /> {t("admin.pages.new")}</Button>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : pages.length === 0 ? (
        <div className="premium-card p-16 text-center"><FileStack className="mx-auto h-14 w-14 text-muted-foreground/30" /><p className="mt-4 text-lg font-black text-navy">No pages yet</p><p className="mt-2 text-sm text-muted-foreground">Create a custom page like About, Terms, or Privacy</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-float">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary">
              <tr>{["Title","URL","Status","Last Updated",""].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {pages.map(p => (
                <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-navy">{p.titleAr || p.title || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/pages/{p.slug}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.publishStatus === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.publishStatus === "published" ? "Published" : "Draft"}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <a href={`/pages/${p.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border p-1.5 text-muted-foreground hover:text-navy transition-colors"><ExternalLink className="h-4 w-4" /></a>
                      <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      {confirmDelete === p.id ? (
                        <>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => remove(p.id)}>Confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Color utilities ──────────────────────────────────────────────────────────
function rgbToHex(color: string): string {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color.length >= 6 ? color.slice(0, 7) : "#000000";
  const m = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!m) return "#000000";
  return "#" + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
}
// ─── Color shade generator ────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function generateShades(hex: string) {
  const c = hexToRgb(hex);
  if (!c) return [];
  const mix = (t: number, w = false) => {
    const base = w ? 255 : 0;
    const f = w ? 1 - t : t;
    return { r: Math.round(c.r * f + base * (1-f)), g: Math.round(c.g * f + base * (1-f)), b: Math.round(c.b * f + base * (1-f)) };
  };
  const shades = [
    { w: 50, ...mix(0.08, true) }, { w: 100, ...mix(0.2, true) }, { w: 200, ...mix(0.38, true) },
    { w: 300, ...mix(0.55, true) }, { w: 400, ...mix(0.75, true) }, { w: 500, ...c },
    { w: 600, ...mix(0.85) }, { w: 700, ...mix(0.7) }, { w: 800, ...mix(0.5) }, { w: 950, ...mix(0.3) },
  ];
  return shades.map(s => ({ weight: s.w, rgb: `rgb(${s.r},${s.g},${s.b})` }));
}

// ─── Theme Management Tab ─────────────────────────────────────────────────────
const DEFAULT_THEME_COLORS = {
  primaryColor: "#061E46",
  secondaryColor: "#22c4b7",
  ctaColor: "#c9a227",
  navbarBg: "#ffffff",
  navbarText: "#061E46",
  footerBg: "#061E46",
  footerText: "#ffffff",
  cardBg: "#ffffff",
  inputBg: "#f4f5f6",
};

function ThemeTab() {
  const { t } = useLang();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSiteSettings().then(s => { setSettings(s); setLoading(false); }).catch(() => { setError("Failed to load settings"); setLoading(false); });
  }, []);

  function setColor(key: string, value: string) {
    setSettings(prev => prev ? ({ ...prev, theme: { ...(prev.theme as any), [key]: value } }) : prev);
  }
  function setAnalytics(key: string, value: any) {
    setSettings(prev => prev ? ({ ...prev, analytics: { ...(prev as any).analytics, [key]: value } }) : prev);
  }

  async function save() {
    if (!settings) return;
    setSaving(true); setError("");
    try {
      const updated = await updateSiteSettings(settings);
      setSettings(updated);
      applyThemeToDOM((updated as any)?.theme ?? {});
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setSaving(false); }
  }

  async function resetColors() {
    setResetConfirm(false);
    if (!settings) return;
    const resetSettings = { ...settings, theme: { ...DEFAULT_THEME_COLORS, accent: "gold" } };
    setSettings(resetSettings as any);
    applyThemeToDOM(DEFAULT_THEME_COLORS as any);
    setSaving(true); setError("");
    try {
      const updated = await updateSiteSettings(resetSettings as any);
      setSettings(updated);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Reset failed"); } finally { setSaving(false); }
  }

  const COLOR_GROUPS: { label: string; colors: { key: string; label: string; desc: string }[] }[] = [
    {
      label: "Brand Identity",
      colors: [
        { key: "primaryColor",   label: "Primary Color (Navy)",   desc: "Used in headings, main buttons and base elements" },
        { key: "secondaryColor", label: "Accent Color (Aqua)",    desc: "Used in highlights, icons and links" },
        { key: "ctaColor",       label: "CTA Color (Gold)",       desc: "Used in call-to-action buttons and promotional elements" },
      ],
    },
    {
      label: "Top Navigation Bar",
      colors: [
        { key: "navbarBg",   label: "Navbar Background", desc: "Background colour of the top navigation bar" },
        { key: "navbarText", label: "Navbar Text Color",  desc: "Colour of link text in the top nav" },
      ],
    },
    {
      label: "Footer",
      colors: [
        { key: "footerBg",   label: "Footer Background", desc: "Background colour at the bottom of the page" },
        { key: "footerText", label: "Footer Text Color",  desc: "Colour of text and links inside the footer" },
      ],
    },
    {
      label: "Cards & UI",
      colors: [
        { key: "cardBg",  label: "Card Background",  desc: "Background colour for property and article cards" },
        { key: "inputBg", label: "Input Background",  desc: "Background colour for text boxes and selects" },
      ],
    },
  ];

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />)}</div>;

  const theme = (settings as any)?.theme ?? {};
  const analytics = (settings as any)?.analytics ?? {};

  return (
    <div className="space-y-6">
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card shadow-premium p-6 space-y-4">
            <h3 className="text-lg font-black text-navy">Reset to Default Colors?</h3>
            <p className="text-sm text-muted-foreground">This will restore all original Osoulk brand colors. Your current color customizations will be lost.</p>
            <div className="flex gap-3">
              <button onClick={resetColors} className="flex-1 rounded-xl bg-destructive text-white py-2.5 font-bold hover:bg-destructive/90 transition-colors">Reset Colors</button>
              <button onClick={() => setResetConfirm(false)} className="flex-1 rounded-xl border py-2.5 font-bold text-navy hover:bg-secondary transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.theme.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.theme.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {saved && <span className="text-sm font-bold text-emerald-600">{t("admin.saved")}</span>}
          <button type="button" onClick={() => setResetConfirm(true)} className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Reset to Defaults
          </button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? t("admin.saving") : t("admin.settings.saveChanges")}</Button>
        </div>
      </div>
      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="space-y-5">
        {/* Grouped color pickers */}
        <div className="space-y-4">
          {COLOR_GROUPS.map(group => (
            <div key={group.label} className="premium-card p-5">
              <h3 className="mb-5 font-black text-navy flex items-center gap-2"><Palette className="h-4 w-4" /> {group.label}</h3>
              <div className="space-y-7">
                {group.colors.map(entry => {
                  const rawColor = theme[entry.key] || "#0a1628";
                  const hex = rgbToHex(rawColor);
                  const shades = generateShades(hex);
                  return (
                    <div key={entry.key}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full border shadow-sm" style={{ backgroundColor: hex }} />
                          <div>
                            <p className="text-sm font-black text-navy">{entry.label}</p>
                            <p className="text-xs text-muted-foreground">{entry.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="color" value={hex} onChange={e => setColor(entry.key, e.target.value)} className="h-9 w-10 cursor-pointer rounded-lg border-0 p-0.5" />
                          <input type="text" value={theme[entry.key] || hex} onChange={e => setColor(entry.key, e.target.value)} className="h-9 w-28 rounded-lg border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="#000000" />
                        </div>
                      </div>
                      {shades.length > 0 && (
                        <div className="grid grid-cols-10 overflow-hidden rounded-xl border">
                          {shades.map(s => (
                            <div key={s.weight} className="group flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: s.rgb }} onClick={() => setColor(entry.key, s.rgb)} title={`${entry.label} ${s.weight}`}>
                              <div className="h-8 w-full" />
                              <span className="w-full bg-black/10 py-0.5 text-center text-[9px] font-bold" style={{ color: s.weight < 400 ? "#374151" : "#fff" }}>
                                {s.weight === 500 ? "Default" : s.weight}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Google Analytics */}
        <div className="premium-card p-5">
          <h3 className="mb-4 font-black text-navy flex items-center gap-2"><BarChart3 className="h-4 w-4" /> {t("admin.theme.ga4")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.theme.ga4Id")}</label>
              <input
                value={analytics.gaTrackingId || ""}
                onChange={e => setAnalytics("gaTrackingId", e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="G-XXXXXXXXXX"
              />
              <p className="mt-1 text-xs text-muted-foreground">Enter the ID in the format G-XXXXXXXXXX</p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setAnalytics("enabled", !analytics.enabled)}
                className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2.5"
              >
                <div>
                  <span className="text-sm font-bold text-navy">{t("admin.theme.ga4Enable")}</span>
                  <p className="text-xs text-muted-foreground">{analytics.enabled ? t("admin.theme.ga4Active") : t("admin.theme.ga4Disabled")}</p>
                </div>
                <span className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${analytics.enabled ? "bg-emerald-500" : "bg-secondary border"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${analytics.enabled ? "left-5" : "left-0.5"}`} />
                </span>
              </button>
            </div>
          </div>
          {analytics.gaTrackingId && analytics.enabled && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-bold flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> GA4 code will be automatically injected on all site pages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Listing form helpers (defined OUTSIDE the tab to keep stable references) ─
const ListingEditCtx = createContext<{ editing: any; setEditing: React.Dispatch<React.SetStateAction<any>> }>({ editing: null, setEditing: () => {} });

function LF({ k, label, multiline, type: inputType, placeholder, dir: d }: { k: string; label: string; multiline?: boolean; type?: string; placeholder?: string; dir?: string }) {
  const { editing, setEditing } = useContext(ListingEditCtx);
  return (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</label>
      {multiline
        ? <textarea value={String(editing?.[k] ?? "")} onChange={e => setEditing((prev: any) => ({ ...prev, [k]: e.target.value }))} rows={3} dir={d} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={placeholder} />
        : <input type={inputType || "text"} value={String(editing?.[k] ?? "")} onChange={e => setEditing((prev: any) => ({ ...prev, [k]: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder={placeholder} dir={d} />
      }
    </div>
  );
}

function ToggleField({ k, label }: { k: string; label: string }) {
  const { editing, setEditing } = useContext(ListingEditCtx);
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-navy">
      <button type="button" onClick={() => setEditing((prev: any) => ({ ...prev, [k]: !prev?.[k] }))} className={`relative h-6 w-11 rounded-full transition-colors ${editing?.[k] ? "bg-emerald-500" : "bg-secondary border"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${editing?.[k] ? "left-5" : "left-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

// ─── Listings Admin Tab ───────────────────────────────────────────────────────
function ListingsAdminTab() {
  const { t } = useLang();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [formTab, setFormTab] = useState<"basic"|"contact"|"location"|"details"|"pricing"|"media"|"seo">("basic");
  const [seoListingLang, setSeoListingLang] = useState<"ar"|"en">("ar");

  const EMPTY: any = {
    title: "", titleAr: "", summary: "", summaryAr: "",
    description: "", descriptionAr: "", type: "apartment",
    listingType: "sale", status: "For Sale",
    location: "", locationAr: "", ownerPhone: "", ownerName: "",
    whatsappPhone: "", email: "",
    governorate: "", area: "", address: "", lat: "", lng: "",
    bedrooms: 0, bathrooms: 0, size: "", floor: "", finishing: "", furnishing: "",
    price: "", pricePerMeter: "", installmentAvailable: false,
    downPayment: "", maintenanceFees: "",
    imageUrl: "", images: [], videoUrl: "", seoImage: "", seoImageAr: "",
    seoTitle: "", seoTitleAr: "", seoDescription: "", seoDescriptionAr: "",
    seoKeywords: "", seoKeywordsAr: "", canonicalUrl: "", canonicalUrlAr: "",
    slugAr: "",
    approvalStatus: "approved", featured: false, isPaused: false, tags: [],
  };

  async function load() {
    setLoading(true); setError("");
    try { setListings(await getAdminListings()); }
    catch { setError("Failed to load listings."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true); setError("");
    try {
      let result: any;
      if (editing.id) {
        result = await updateAdminListing(editing.id, editing);
        setListings(prev => prev.map(l => l.id === result.id ? result : l));
      } else {
        result = await createAdminListing(editing);
        setListings(prev => [result, ...prev]);
      }
      setEditing(null); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function quickApprove(id: string, status: string) {
    try {
      await updateAdminListingApproval(id, status);
      setListings(prev => prev.map(l => l.id === id ? { ...l, approvalStatus: status } : l));
    } catch { setError("Failed to update status"); }
  }

  async function remove(id: string) {
    try {
      await deleteAdminListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      setConfirmDelete(null);
    } catch { setError("Delete failed"); }
  }

  const filtered = listings.filter(l => {
    const matchStatus = statusFilter === "all" || l.approvalStatus === statusFilter || (statusFilter === "featured" && l.featured);
    const q = search.toLowerCase();
    const matchSearch = !q || (l.title || "").toLowerCase().includes(q) || (l.titleAr || "").includes(q) || (l.location || "").toLowerCase().includes(q) || (l.ownerName || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: listings.length,
    pending: listings.filter(l => l.approvalStatus === "pending").length,
    approved: listings.filter(l => l.approvalStatus === "approved").length,
    rejected: listings.filter(l => l.approvalStatus === "rejected").length,
    featured: listings.filter(l => l.featured).length,
  };

  if (editing !== null) {
    const FORM_TABS = [
      { id: "basic",    label: "Basic Info" },
      { id: "contact",  label: "Contact" },
      { id: "location", label: "Location" },
      { id: "details",  label: "Property" },
      { id: "pricing",  label: "Pricing" },
      { id: "media",    label: "Media" },
      { id: "seo",      label: "SEO" },
    ] as const;

    return (
      <ListingEditCtx.Provider value={{ editing, setEditing }}>
      <div className="space-y-0">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <button onClick={() => setEditing(null)} className="hover:text-navy font-bold">Listings</button>
              <span>/</span>
              <span className="text-navy font-bold">{editing.id ? "Edit Listing" : "New Listing"}</span>
            </div>
            <h2 className="text-2xl font-black text-navy">{editing.id ? "Edit Listing" : "Add New Listing"}</h2>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-sm font-bold text-emerald-600">Saved!</span>}
            <Button onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {error && <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="mb-5 flex flex-wrap gap-1 rounded-xl border bg-secondary/50 p-1 w-fit overflow-x-auto">
          {FORM_TABS.map(ft => (
            <button key={ft.id} type="button" onClick={() => setFormTab(ft.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${formTab === ft.id ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}>
              {ft.label}
            </button>
          ))}
        </div>

        {formTab === "basic" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <LF k="titleAr" label="Title (AR)" dir="rtl" placeholder="عنوان العقار" />
              <LF k="title" label="Title (EN)" dir="ltr" placeholder="Property title" />
              <LF k="summaryAr" label="Summary (AR)" dir="rtl" multiline placeholder="وصف قصير" />
              <LF k="summary" label="Summary (EN)" dir="ltr" multiline placeholder="Short description" />
              <LF k="descriptionAr" label="Full Description (AR)" dir="rtl" multiline placeholder="وصف تفصيلي" />
              <LF k="description" label="Full Description (EN)" dir="ltr" multiline placeholder="Detailed description" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Property Type</label>
                <select value={editing.type || "apartment"} onChange={e => setEditing((p: any) => ({ ...p, type: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                  {["apartment","villa","townhouse","duplex","penthouse","chalet","office","retail","land","warehouse"].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Listing Type</label>
                <select value={editing.listingType || "sale"} onChange={e => setEditing((p: any) => ({ ...p, listingType: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                  <option value="invest">Investment</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Approval Status</label>
                <select value={editing.approvalStatus || "pending"} onChange={e => setEditing((p: any) => ({ ...p, approvalStatus: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <LF k="ownerName" label="Owner Name" placeholder="Listing owner name" />
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Tags (comma-separated)</label>
                <input value={(editing.tags || []).join(", ")} onChange={e => setEditing((p: any) => ({ ...p, tags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none" placeholder="For Sale, Garden View" dir="ltr" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 border-t pt-4">
              <ToggleField k="featured" label="Featured" />
              <ToggleField k="isPaused" label="Pause/Hide" />
              <ToggleField k="installmentAvailable" label="Installment Available" />
            </div>
          </div>
        )}

        {formTab === "contact" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <LF k="ownerPhone" label="Phone Number" type="tel" dir="ltr" placeholder="+201XXXXXXXXX" />
              <LF k="whatsappPhone" label="WhatsApp Number" type="tel" dir="ltr" placeholder="+201XXXXXXXXX" />
              <LF k="email" label="Email Address" type="email" dir="ltr" placeholder="owner@email.com" />
            </div>
          </div>
        )}

        {formTab === "location" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <LF k="locationAr" label="Location (AR)" dir="rtl" placeholder="القاهرة الجديدة" />
              <LF k="location" label="Location (EN)" dir="ltr" placeholder="New Cairo" />
              <LF k="governorate" label="Governorate" placeholder="Cairo" />
              <LF k="area" label="Area / Region" placeholder="5th Settlement" />
              <div className="sm:col-span-2"><LF k="address" label="Full Address" multiline placeholder="Full street address…" /></div>
              <LF k="lat" label="Latitude" type="number" dir="ltr" placeholder="30.0444" />
              <LF k="lng" label="Longitude" type="number" dir="ltr" placeholder="31.2357" />
            </div>
            {editing.lat && editing.lng && (
              <a href={`https://www.google.com/maps?q=${editing.lat},${editing.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> View on Google Maps
              </a>
            )}
          </div>
        )}

        {formTab === "details" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy flex items-center gap-2"><Home className="h-4 w-4" /> Property Details</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Bedrooms</label>
                <input type="number" min="0" value={editing.bedrooms ?? 0} onChange={e => setEditing((p: any) => ({ ...p, bedrooms: Number(e.target.value) }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Bathrooms</label>
                <input type="number" min="0" value={editing.bathrooms ?? 0} onChange={e => setEditing((p: any) => ({ ...p, bathrooms: Number(e.target.value) }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none" />
              </div>
              <LF k="size" label="Unit Size (m²)" dir="ltr" placeholder="120" />
              <LF k="floor" label="Floor Number" dir="ltr" placeholder="3" />
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Finishing Type</label>
                <select value={editing.finishing || ""} onChange={e => setEditing((p: any) => ({ ...p, finishing: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                  <option value="">Select…</option>
                  {["core-shell","semi-finished","fully-finished","ultra-lux"].map(v => <option key={v} value={v}>{v.replace(/-/g," ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Furnishing</label>
                <select value={editing.furnishing || ""} onChange={e => setEditing((p: any) => ({ ...p, furnishing: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
                  <option value="">Select…</option>
                  {["unfurnished","semi-furnished","fully-furnished"].map(v => <option key={v} value={v}>{v.replace(/-/g," ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {formTab === "pricing" && (
          <div className="premium-card p-5 space-y-4">
            <h3 className="font-black text-navy flex items-center gap-2"><DollarSign className="h-4 w-4" /> Pricing</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <LF k="price" label="Total Price (EGP)" dir="ltr" placeholder="2500000" />
              <LF k="pricePerMeter" label="Price per m² (EGP)" dir="ltr" placeholder="25000" />
              <LF k="downPayment" label="Down Payment" dir="ltr" placeholder="500000 or 20%" />
              <LF k="maintenanceFees" label="Maintenance Fees" dir="ltr" placeholder="8 EGP/m²/year" />
            </div>
            <div className="border-t pt-4"><ToggleField k="installmentAvailable" label="Installment Available" /></div>
          </div>
        )}

        {formTab === "media" && (
          <div className="space-y-5">
            <div className="premium-card p-5 space-y-4">
              <h3 className="font-black text-navy flex items-center gap-2"><Image className="h-4 w-4" /> Primary Image</h3>
              <MediaPickerField
                label="Featured / Main Image"
                value={editing.imageUrl || ""}
                onChange={(url: string) => setEditing((p: any) => ({ ...p, imageUrl: url }))}
                previewClass="h-40 w-full rounded-xl object-cover border"
              />
            </div>
            <div className="premium-card p-5 space-y-4">
              <h3 className="font-black text-navy">Image Gallery</h3>
              {(editing.images || []).map((url: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  {url && <img src={url} alt="" className="h-10 w-16 rounded object-cover border shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                  <input value={url} onChange={e => setEditing((p: any) => ({ ...p, images: (p?.images || []).map((g: string, i: number) => i === idx ? e.target.value : g) }))}
                    className="flex-1 h-9 rounded-lg border bg-background px-3 text-xs font-mono focus:outline-none" placeholder="https://…/image.jpg" dir="ltr" />
                  <button type="button" onClick={() => setEditing((p: any) => ({ ...p, images: (p?.images || []).filter((_: string, i: number) => i !== idx) }))} className="shrink-0 rounded-lg border p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditing((p: any) => ({ ...p, images: [...(p?.images || []), ""] }))} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add URL
                </button>
                <GalleryImageAdder onAdd={(url: string) => setEditing((p: any) => ({ ...p, images: [...(p?.images || []), url] }))} />
              </div>
            </div>
            <div className="premium-card p-5 space-y-4">
              <h3 className="font-black text-navy">Additional Media</h3>
              <LF k="videoUrl" label="Video URL (YouTube / Vimeo / direct link)" dir="ltr" placeholder="https://youtube.com/watch?v=…" />
              <MediaPickerField
                label="SEO / OG Image"
                value={editing.seoImage || ""}
                onChange={(url: string) => setEditing((p: any) => ({ ...p, seoImage: url }))}
                previewClass="h-28 w-full rounded-xl object-cover border"
              />
            </div>
          </div>
        )}

        {formTab === "seo" && (
          <div className="premium-card p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-black text-navy flex items-center gap-2"><Globe2 className="h-4 w-4" /> Bilingual SEO</h3>
              <div className="flex overflow-hidden rounded-lg border border-navy/20 text-sm font-bold">
                <button type="button" onClick={() => setSeoListingLang("ar")} className={`px-4 py-2 transition-colors ${seoListingLang === "ar" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>العربية</button>
                <button type="button" onClick={() => setSeoListingLang("en")} className={`px-4 py-2 transition-colors ${seoListingLang === "en" ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}>English</button>
              </div>
            </div>
            <div className="space-y-4" dir={seoListingLang === "ar" ? "rtl" : "ltr"}>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {seoListingLang === "ar" ? "عنوان الصفحة — Meta Title" : "Meta Title"}
                </label>
                <input
                  dir={seoListingLang === "ar" ? "rtl" : "ltr"}
                  value={seoListingLang === "ar" ? (editing?.seoTitleAr || "") : (editing?.seoTitle || "")}
                  onChange={e => setEditing((p: any) => seoListingLang === "ar" ? { ...p, seoTitleAr: e.target.value } : { ...p, seoTitle: e.target.value })}
                  maxLength={60}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={seoListingLang === "ar" ? "عنوان العقار لمحركات البحث (60 حرف)" : "Property title for search engines (60 chars)"}
                />
                <p className="mt-0.5 text-xs text-muted-foreground">{(seoListingLang === "ar" ? (editing?.seoTitleAr || "") : (editing?.seoTitle || "")).length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {seoListingLang === "ar" ? "وصف الصفحة — Meta Description" : "Meta Description"}
                </label>
                <textarea
                  dir={seoListingLang === "ar" ? "rtl" : "ltr"}
                  value={seoListingLang === "ar" ? (editing?.seoDescriptionAr || "") : (editing?.seoDescription || "")}
                  onChange={e => setEditing((p: any) => seoListingLang === "ar" ? { ...p, seoDescriptionAr: e.target.value } : { ...p, seoDescription: e.target.value })}
                  rows={3} maxLength={160}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={seoListingLang === "ar" ? "وصف موجز لمحركات البحث (160 حرف)" : "Brief description for search engines (160 chars)"}
                />
                <p className="mt-0.5 text-xs text-muted-foreground">{(seoListingLang === "ar" ? (editing?.seoDescriptionAr || "") : (editing?.seoDescription || "")).length}/160</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {seoListingLang === "ar" ? "الكلمات المفتاحية (مفصولة بفاصلة)" : "Keywords (comma-separated)"}
                </label>
                <input
                  dir={seoListingLang === "ar" ? "rtl" : "ltr"}
                  value={seoListingLang === "ar" ? (editing?.seoKeywordsAr || "") : (editing?.seoKeywords || "")}
                  onChange={e => setEditing((p: any) => seoListingLang === "ar" ? { ...p, seoKeywordsAr: e.target.value } : { ...p, seoKeywords: e.target.value })}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={seoListingLang === "ar" ? "عقارات، شقق، القاهرة" : "real estate, apartment, Cairo"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {seoListingLang === "ar" ? "الرابط المعياري" : "Canonical URL"}
                </label>
                <input
                  dir="ltr"
                  value={seoListingLang === "ar" ? (editing?.canonicalUrlAr || "") : (editing?.canonicalUrl || "")}
                  onChange={e => setEditing((p: any) => seoListingLang === "ar" ? { ...p, canonicalUrlAr: e.target.value } : { ...p, canonicalUrl: e.target.value })}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder={seoListingLang === "ar" ? "https://osoulk.com/ar/property/…" : "https://osoulk.com/en/property/…"}
                />
              </div>
              <div>
                <MediaPickerField
                  label={seoListingLang === "ar" ? "صورة OG / وسائل التواصل الاجتماعي" : "OG / Social Media Image"}
                  value={seoListingLang === "ar" ? (editing?.seoImageAr || "") : (editing?.seoImage || "")}
                  onChange={(url: string) => setEditing((p: any) => seoListingLang === "ar" ? { ...p, seoImageAr: url } : { ...p, seoImage: url })}
                  previewClass="h-24 w-full rounded-xl object-cover border mt-2"
                />
              </div>
              {seoListingLang === "ar" && (
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">URL Slug (Arabic)</label>
                  <input
                    dir="ltr"
                    value={editing?.slugAr || ""}
                    onChange={e => setEditing((p: any) => ({ ...p, slugAr: e.target.value }))}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="property-slug-ar"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">Used for: osoulk.com/ar/property/[slug-ar]</p>
                </div>
              )}
            </div>
            {/* SEO Preview */}
            <div className="rounded-xl border bg-secondary/30 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-3">Search Preview ({seoListingLang === "ar" ? "Arabic" : "English"})</p>
              <div className="space-y-0.5">
                <p className="text-base font-bold text-blue-700 truncate">{(seoListingLang === "ar" ? editing?.seoTitleAr : editing?.seoTitle) || (seoListingLang === "ar" ? editing?.titleAr : editing?.title) || "Property Title"}</p>
                <p className="text-xs text-emerald-700 truncate">{seoListingLang === "ar" ? editing?.canonicalUrlAr : editing?.canonicalUrl || "https://osoulk.com/properties/…"}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{(seoListingLang === "ar" ? editing?.seoDescriptionAr : editing?.seoDescription) || "Property description will appear here in search results."}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </ListingEditCtx.Provider>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">Listings Manager</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage all property ads and listings — approve, edit, feature, or remove.</p>
        </div>
        <Button onClick={() => { setEditing({ ...EMPTY }); setFormTab("basic"); }}><Plus className="h-4 w-4" /> Add Listing</Button>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {saved && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-bold">Changes saved successfully!</div>}

      <div className="flex flex-wrap gap-2">
        {(["all","pending","approved","rejected","featured"] as const).map(s => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${statusFilter === s ? "bg-navy text-white" : "bg-secondary text-navy hover:bg-navy/10"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} <span className="text-xs opacity-70">({counts[s]})</span>
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings…" className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-sm focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 premium-card text-center">
          <List className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 font-black text-navy">No listings found</p>
          <p className="text-sm text-muted-foreground">Try a different filter or add the first listing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(listing => (
            <div key={listing.id} className="premium-card p-4">
              <div className="flex flex-wrap items-start gap-3">
                {listing.imageUrl && <img src={listing.imageUrl} alt="" className="h-20 w-28 rounded-xl object-cover shrink-0 border" onError={e => (e.currentTarget.style.display = "none")} />}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-black text-navy truncate">{listing.titleAr || listing.title || "Untitled"}</p>
                    {listing.featured && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-bold text-gold border border-gold/30 flex items-center gap-1"><Star className="h-3 w-3" /> Featured</span>}
                    {listing.isPaused && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground">Paused</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${listing.approvalStatus === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : listing.approvalStatus === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {listing.approvalStatus || "pending"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{listing.locationAr || listing.location} {listing.price ? `· ${Number(listing.price).toLocaleString()} EGP` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">By: {listing.ownerName || "Unknown"} · {listing.type} · {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString("ar-EG") : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {listing.approvalStatus !== "approved" && (
                    <button type="button" onClick={() => quickApprove(listing.id, "approved")} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {listing.approvalStatus !== "rejected" && (
                    <button type="button" onClick={() => quickApprove(listing.id, "rejected")} className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  <button type="button" onClick={() => { setEditing({ ...EMPTY, ...listing }); setFormTab("basic"); }} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-navy hover:bg-secondary transition-colors">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(listing.id)} className="rounded-lg border border-destructive/20 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-premium">
            <h3 className="text-lg font-black text-navy">Delete Listing?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => remove(confirmDelete)} className="flex-1 bg-destructive hover:bg-destructive/90">Delete</Button>
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Media Gallery Tab ───────────────────────────────────────────────────────
const MEDIA_CATEGORIES = ["general", "logo", "slider", "property", "project", "agency", "blog", "hero", "background", "listing", "seo"];

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

// ─── Media Picker Modal ───────────────────────────────────────────────────────
function MediaPickerModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<MediaItem | null>(null);

  useEffect(() => {
    getAdminMedia().then(setItems).catch((err) => { console.error("[admin media] API request failed:", err); }).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchQ = !q || item.url.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || (item.altText || "").toLowerCase().includes(q);
    const matchCat = catFilter === "all" || item.category === catFilter;
    return matchQ && matchCat;
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async ev => {
        const dataUrl = ev.target?.result as string;
        const dims = await getImageDimensions(dataUrl);
        const { url } = await uploadMediaFile(dataUrl, file.name.replace(/\.[^.]+$/, ""));
        const created = await createMediaItem({ url, title: file.name.replace(/\.[^.]+$/, ""), category: "general", altText: "", caption: "", description: "", ...(dims.width ? dims : {}) });
        setItems(prev => [created, ...prev]);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploading(false); }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-card shadow-premium flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <div>
            <h3 className="text-lg font-black text-navy">Choose from Media Gallery</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} image{filtered.length !== 1 ? "s" : ""} — click any image to select it</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-wrap gap-3 border-b px-6 py-3 bg-secondary/30 shrink-0">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search images…" className="h-9 w-full rounded-lg border bg-background ps-9 pe-3 text-sm focus:outline-none" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none">
            <option value="all">All Categories</option>
            {MEDIA_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-3 h-9 text-xs font-bold text-white hover:bg-navy/80 transition-colors whitespace-nowrap ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            <Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload New"}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; await handleUpload(file); e.target.value = ""; }} />
          </label>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-video animate-pulse rounded-xl bg-secondary" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Image className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 font-black text-navy">{items.length === 0 ? "Media library is empty" : "No matching images"}</p>
              <p className="text-sm text-muted-foreground mt-1">Upload an image using the button above.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map(item => (
                <div key={item.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(item.url)}
                    className="w-full overflow-hidden rounded-xl border-2 border-transparent hover:border-navy transition-all text-start"
                  >
                    <div className="aspect-video bg-secondary overflow-hidden">
                      <img src={item.url} alt={item.altText || item.title || ""} className="h-full w-full object-cover group-hover:scale-105 transition-transform" onError={e => (e.currentTarget.style.display = "none")} />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-bold text-navy">{item.title || "Untitled"}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{item.category}{item.usedIn?.length ? ` · ${item.usedIn.length} use${item.usedIn.length !== 1 ? "s" : ""}` : ""}</p>
                    </div>
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 bg-navy/20 transition-opacity">
                      <div className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-white shadow">Select</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setPreview(item); }}
                    className="absolute top-1.5 end-1.5 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                    title="Preview"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/85 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.altText || preview.title || ""} className="max-h-[65vh] w-full object-contain rounded-2xl" />
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-black text-white">{preview.title || "Untitled"}</p>
                {preview.altText && <p className="text-sm text-white/70">{preview.altText}</p>}
                {preview.usedIn?.length ? <p className="text-xs text-white/50 mt-1">Used in {preview.usedIn.length} place{preview.usedIn.length !== 1 ? "s" : ""}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { onSelect(preview.url); setPreview(null); onClose(); }}>Select This Image</Button>
                <Button variant="outline" onClick={() => setPreview(null)} className="bg-white/10 text-white border-white/20 hover:bg-white/20">Close Preview</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gallery Image Adder (inline "add from gallery" for array fields) ─────────
function GalleryImageAdder({ onAdd }: { onAdd: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors">
        <Image className="h-3.5 w-3.5" /> Add from Gallery
      </button>
      {open && (
        <MediaPickerModal
          onSelect={url => { onAdd(url); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ─── Reusable Media Picker Field ──────────────────────────────────────────────
function MediaPickerField({
  value, onChange, label, placeholder, previewClass,
}: {
  value: string; onChange: (url: string) => void;
  label?: string; placeholder?: string; previewClass?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async ev => {
        const dataUrl = ev.target?.result as string;
        const dims = await getImageDimensions(dataUrl);
        const { url } = await uploadMediaFile(dataUrl, file.name.replace(/\.[^.]+$/, ""));
        onChange(url);
        createMediaItem({ url, title: file.name.replace(/\.[^.]+$/, ""), category: "general", altText: "", caption: "", description: "", ...(dims.width ? dims : {}) }).catch((err) => { console.error("[admin media] createMediaItem failed:", err); });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploading(false); }
  }

  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</label>}
      <div className="space-y-2">
        {value && (
          <div className="relative">
            <img src={value} alt="" className={previewClass ?? "h-32 w-full rounded-xl object-cover border"} onError={e => (e.currentTarget.style.display = "none")} />
            <button type="button" onClick={() => onChange("")} className="absolute top-1.5 end-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-destructive transition-colors" title="Remove">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            <Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload"}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; await handleUpload(file); e.target.value = ""; }} />
          </label>
          <button type="button" onClick={() => setPickerOpen(true)} className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-bold text-navy hover:bg-secondary transition-colors">
            <Image className="h-3.5 w-3.5" /> Choose from Gallery
          </button>
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 min-w-[180px] h-9 rounded-lg border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder={placeholder || "https://…"}
            dir="ltr"
          />
        </div>
      </div>
      {pickerOpen && (
        <MediaPickerModal
          onSelect={url => { onChange(url); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function MediaGalleryTab() {
  const { t } = useLang();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<Partial<MediaItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const EMPTY: Partial<MediaItem> = { url: "", title: "", altText: "", caption: "", description: "", category: "general" };

  async function load() {
    setLoading(true); setError("");
    try { setItems(await getAdminMedia()); }
    catch { setError("Failed to load media library."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.url?.trim()) { setError("Image URL is required."); return; }
    setSaving(true); setError("");
    try {
      if (editing.id) {
        const updated = await updateMediaItem(editing.id, editing);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await createMediaItem(editing);
        setItems(prev => [created, ...prev]);
      }
      setEditing(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await deleteMediaItem(id); setItems(prev => prev.filter(i => i.id !== id)); setConfirmDelete(null); }
    catch { setError("Delete failed."); }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.url.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.altText.toLowerCase().includes(q);
    const matchCat = category === "all" || item.category === category;
    return matchSearch && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sort === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sort === "name")   return (a.title || "").localeCompare(b.title || "");
    if (sort === "mostused") return ((b as any).usedIn?.length || 0) - ((a as any).usedIn?.length || 0);
    return 0;
  });

  async function handleDropUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    setSaving(true); setError("");
    try {
      const reader = new FileReader();
      reader.onload = async ev => {
        const dataUrl = ev.target?.result as string;
        const dims = await getImageDimensions(dataUrl);
        const { url } = await uploadMediaFile(dataUrl, file.name.replace(/\.[^.]+$/, ""));
        const created = await createMediaItem({ url, title: file.name.replace(/\.[^.]+$/, ""), category: "general", altText: "", caption: "", description: "", ...(dims.width ? dims : {}) });
        setItems(prev => [created, ...prev]);
        setSaving(false);
      };
      reader.readAsDataURL(file);
    } catch { setSaving(false); }
  }

  if (editing !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-navy">{editing.id ? "Edit Image" : "Add New Image"}</h2>
            <p className="text-sm text-muted-foreground">Upload a file or paste an image URL.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save"}</Button>
            <Button variant="outline" onClick={() => { setEditing(null); setError(""); }}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="premium-card p-5 space-y-4">
              <h3 className="font-black text-navy flex items-center gap-2"><Image className="h-4 w-4" /> Image Source</h3>
              {/* File upload */}
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Upload File (max 5 MB)</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-navy/20 bg-background px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-navy/40 hover:bg-secondary">
                  <Upload className="h-5 w-5 text-navy" />
                  <span>Click to select an image</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setError(""); setSaving(true);
                    try {
                      const reader = new FileReader();
                      reader.onload = async ev => {
                        const dataUrl = ev.target?.result as string;
                        const dims = await getImageDimensions(dataUrl);
                        const { url } = await uploadMediaFile(dataUrl, file.name.replace(/\.[^.]+$/, ""));
                        setEditing(prev => ({ ...prev, url, title: prev?.title || file.name.replace(/\.[^.]+$/, ""), ...(dims.width ? dims : {}) }));
                        setSaving(false);
                      };
                      reader.readAsDataURL(file);
                    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); setSaving(false); }
                    e.target.value = "";
                  }} />
                </label>
                {saving && <p className="text-xs text-muted-foreground animate-pulse">Uploading…</p>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 border-t" /><span>or paste URL</span><div className="flex-1 border-t" /></div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Image URL *</label>
                <input
                  value={editing.url || ""}
                  onChange={e => setEditing(prev => ({ ...prev, url: e.target.value }))}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  placeholder="https://example.com/image.webp"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Category</label>
                <select
                  value={editing.category || "general"}
                  onChange={e => setEditing(prev => ({ ...prev, category: e.target.value }))}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none"
                >
                  {MEDIA_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="premium-card p-5 space-y-4">
              <h3 className="font-black text-navy flex items-center gap-2"><FileText className="h-4 w-4" /> Metadata</h3>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Image Title</label>
                <input value={editing.title || ""} onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="e.g. Villa exterior photo" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Alt Text (for SEO & accessibility)</label>
                <input value={editing.altText || ""} onChange={e => setEditing(prev => ({ ...prev, altText: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="e.g. Modern villa with pool in New Cairo" />
                <p className="mt-1 text-xs text-muted-foreground">Describe the image for search engines and screen readers.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Caption</label>
                <input value={editing.caption || ""} onChange={e => setEditing(prev => ({ ...prev, caption: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Short caption displayed under the image" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Description</label>
                <textarea value={editing.description || ""} onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="Longer description for internal reference" />
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="premium-card p-5">
              <h3 className="font-black text-navy mb-4 flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</h3>
              {editing.url ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl border bg-secondary aspect-video">
                    <img
                      src={editing.url}
                      alt={editing.altText || "Preview"}
                      className="h-full w-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  {editing.title && <p className="font-black text-navy text-sm">{editing.title}</p>}
                  {editing.caption && <p className="text-xs text-muted-foreground">{editing.caption}</p>}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 aspect-video text-center">
                  <Image className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">Enter an image URL to preview</p>
                </div>
              )}
            </div>
            {editing.id && (editing as any).usedIn?.length > 0 && (
              <div className="premium-card p-5 space-y-3">
                <h3 className="font-black text-navy flex items-center gap-2"><Link className="h-4 w-4" /> Used In</h3>
                <p className="text-xs text-muted-foreground">This image is referenced in {(editing as any).usedIn.length} place{(editing as any).usedIn.length !== 1 ? "s" : ""}.</p>
                <div className="space-y-2">
                  {(editing as any).usedIn.map((use: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm">
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy capitalize shrink-0">{use.type}</span>
                      <span className="text-navy font-medium truncate">{use.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {editing.id && (editing as any).usedIn?.length === 0 && (
              <div className="premium-card p-5">
                <h3 className="font-black text-navy flex items-center gap-2 mb-2"><Link className="h-4 w-4" /> Used In</h3>
                <p className="text-xs text-muted-foreground">This image is not used anywhere yet. Use the "Choose from Gallery" button in any content editor to reuse it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">Media Gallery</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage all website images centrally — add, edit, and organise your media library.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setEditing(EMPTY)}><Plus className="h-4 w-4" /> Add Image</Button>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border bg-background ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder="Search images by title, URL, or alt text…"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none">
            <option value="all">All Categories</option>
            {MEDIA_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="mostused">Most used</option>
        </select>
        <span className="flex h-10 items-center rounded-xl bg-secondary px-3 text-xs font-bold text-muted-foreground">{sorted.length} images</span>
      </div>

      {/* Drag & drop upload zone */}
      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleDropUpload(file);
        }}
        className={`flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-5 text-sm transition-colors ${dragOver ? "border-navy bg-navy/5 text-navy" : "border-muted-foreground/20 text-muted-foreground hover:border-navy/30"}`}
      >
        <Upload className="h-5 w-5 shrink-0" />
        <span>{saving ? "Uploading…" : "Drag & drop an image here to upload it directly to the library"}</span>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-video animate-pulse rounded-xl bg-secondary" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="premium-card p-16 text-center">
          <Image className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-black text-navy">{search || category !== "all" ? "No matching images" : "Media library is empty"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{search || category !== "all" ? "Try clearing the filters." : "Add your first image or drag one above."}</p>
          {!search && category === "all" && (
            <Button className="mt-5" onClick={() => setEditing(EMPTY)}><Plus className="h-4 w-4" /> Add Image</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map(item => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border bg-card shadow-float">
              <div className="relative aspect-video overflow-hidden bg-secondary">
                <img
                  src={item.url}
                  alt={item.altText || item.title || "image"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = "flex";
                  }}
                />
                <div className="hidden absolute inset-0 items-center justify-center bg-secondary">
                  <Image className="h-10 w-10 text-muted-foreground/40" />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Button size="sm" variant="outline" className="bg-white/90 text-navy border-0 h-8" onClick={() => setEditing(item)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white/90 text-navy border-0 h-8" onClick={() => copyUrl(item.url)}>
                    {copied === item.url ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  {confirmDelete === item.id ? (
                    <Button size="sm" variant="outline" className="bg-red-500 text-white border-0 h-8" onClick={() => remove(item.id)}>
                      Confirm
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="bg-white/90 text-destructive border-0 h-8" onClick={() => setConfirmDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <span className="absolute top-2 end-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white capitalize">{item.category}</span>
                {(item as any).usedIn?.length > 0 && (
                  <span className="absolute top-2 start-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-bold text-white">{(item as any).usedIn.length} use{(item as any).usedIn.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-black text-navy">{item.title || "Untitled"}</p>
                {item.altText && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.altText}</p>}
                <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                  {item.createdAt && <span className="text-[10px] text-muted-foreground/60">{new Date(item.createdAt).toLocaleDateString()}</span>}
                  {item.width && item.height && <span className="text-[10px] text-muted-foreground/60">{item.width}×{item.height}</span>}
                </div>
                <button
                  onClick={() => copyUrl(item.url)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-lg bg-secondary px-2 py-1.5 text-xs font-mono text-muted-foreground hover:text-navy transition-colors"
                  title="Copy URL"
                >
                  <Link className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.url.replace(/^https?:\/\//, "")}</span>
                  {copied === item.url && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HTML Snippets Admin Tab ──────────────────────────────────────────────────
function HtmlSnippetsTab() {
  const { t } = useLang();
  const [snippets, setSnippets] = useState<HtmlSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<HtmlSnippet> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const EMPTY: Partial<HtmlSnippet> = { name: "", html: "", placement: "body-end", enabled: true };

  async function load() {
    setLoading(true); setError("");
    try { setSnippets(await getAdminHtmlSnippets()); } catch { setError("Failed to load snippets."); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function saveSnippet() {
    if (!editing) return;
    setSaving(true); setError("");
    try {
      if (editing.id) {
        const updated = await updateHtmlSnippet(editing.id, editing);
        setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await createHtmlSnippet(editing);
        setSnippets(prev => [created, ...prev]);
      }
      setEditing(null); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setSaving(false); }
  }

  async function remove(id: string) {
    try { await deleteHtmlSnippet(id); setSnippets(prev => prev.filter(s => s.id !== id)); setConfirmDelete(null); }
    catch { setError("Delete failed"); }
  }

  async function toggleEnabled(snippet: HtmlSnippet) {
    try {
      const updated = await updateHtmlSnippet(snippet.id, { enabled: !snippet.enabled });
      setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch { setError("Failed to toggle status"); }
  }

  const PLACEMENTS = [
    { value: "head", label: "<head> — ideal for CSS and libraries" },
    { value: "body-start", label: "Start of <body>" },
    { value: "body-end", label: "End of <body> — ideal for scripts" },
    { value: "after-nav", label: "After navigation bar" },
    { value: "before-footer", label: "Before footer" },
  ];

  if (editing !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-navy">{editing.id ? t("admin.snippets.editSnippet") : t("admin.snippets.newSnippet")}</h2>
          <div className="flex gap-2">
            {saved && <span className="text-sm font-bold text-emerald-600">{t("admin.saved")}</span>}
            <Button onClick={saveSnippet} disabled={saving}><Save className="h-4 w-4" />{saving ? t("admin.saving") : t("admin.save")}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="premium-card p-5 space-y-5">
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.snippets.name")}</label>
            <input value={editing.name || ""} onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" placeholder="e.g. Crisp Chat Widget" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.snippets.placement")}</label>
            <select value={editing.placement || "body-end"} onChange={e => setEditing(prev => ({ ...prev, placement: e.target.value as HtmlSnippet["placement"] }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none">
              {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">{t("admin.snippets.code")}</label>
            <textarea
              value={editing.html || ""}
              onChange={e => setEditing(prev => ({ ...prev, html: e.target.value }))}
              rows={10}
              className="w-full rounded-lg border bg-[#0d1117] p-3 font-mono text-sm text-green-400 focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder="<!-- Place your code here -->"
            />
          </div>
          <button
            type="button"
            onClick={() => setEditing(prev => ({ ...prev, enabled: !prev?.enabled }))}
            className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2.5"
          >
            <span className="text-sm font-bold text-navy">{t("admin.snippets.enable")}</span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${editing.enabled ? "bg-emerald-500" : "bg-secondary border"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${editing.enabled ? "left-5" : "left-0.5"}`} />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">{t("admin.snippets.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.snippets.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setEditing(EMPTY)}><Plus className="h-4 w-4" /> {t("admin.snippets.new")}</Button>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : snippets.length === 0 ? (
        <div className="premium-card p-16 text-center"><Code2 className="mx-auto h-14 w-14 text-muted-foreground/30" /><p className="mt-4 text-lg font-black text-navy">{t("admin.snippets.noSnippets")}</p><p className="mt-2 text-sm text-muted-foreground">{t("admin.snippets.addCustom")}</p></div>
      ) : (
        <div className="space-y-3">
          {snippets.map(s => (
            <div key={s.id} className={`flex items-center justify-between rounded-2xl border bg-card px-5 py-4 ${!s.enabled ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-black text-navy">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{PLACEMENTS.find(p => p.value === s.placement)?.label ?? s.placement}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleEnabled(s)} className={`relative h-6 w-11 rounded-full transition-colors ${s.enabled ? "bg-emerald-500" : "bg-secondary border"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.enabled ? "left-5" : "left-0.5"}`} />
                </button>
                <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                {confirmDelete === s.id ? (
                  <>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => remove(s.id)}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root Admin Component ─────────────────────────────────────────────────────
function AdminRoot() {
  const { t } = useLang();
  const [adminKey, setAdminKeyState] = useState<string | null>(() => getAdminKey());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(SIDEBAR_GROUPS.map(g => g.id)));

  // Load stats on mount
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setGlobalError("");
    try {
      setStats(await getStats());
    } catch {
      setGlobalError("API server is offline. Please start the API server to load data.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) loadStats();
  }, [adminKey, loadStats]);

  useEffect(() => {
    if (!adminKey) return;
    const id = setInterval(loadStats, 30_000);
    return () => clearInterval(id);
  }, [adminKey, loadStats]);

  function handleLogin() {
    setAdminKeyState(getAdminKey());
  }

  function handleLogout() {
    clearAdminKey();
    setAdminKeyState(null);
  }

  // Gate: require admin login
  if (!adminKey) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-card border-r shadow-premium transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-lg font-black text-navy">OSOULK</p>
            <p className="text-xs text-muted-foreground">{t("admin.panel")}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation — grouped & collapsible */}
        <nav className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_GROUPS.map(group => {
            const isOpen = expandedGroups.has(group.id);
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => item.id === activeTab);

            function getBadgeCount(id: string): number {
              if (!stats) return 0;
              if (id === "reels")    return stats.pendingApprovals ?? 0;
              if (id === "crm")      return stats.newUsers ?? 0;
              if (id === "listings") return stats.pendingListings ?? 0;
              return 0;
            }
            const groupTotalBadge = group.items.reduce((sum, item) => sum + getBadgeCount(item.id), 0);

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => setExpandedGroups(prev => {
                    const next = new Set(prev);
                    if (next.has(group.id)) next.delete(group.id); else next.add(group.id);
                    return next;
                  })}
                  className={`flex w-full items-center gap-2.5 mx-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${hasActive ? "text-navy" : "text-muted-foreground hover:text-navy"}`}
                >
                  <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{t("admin.group." + group.id)}</span>
                  {!isOpen && groupTotalBadge > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  )}
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {isOpen && (
                  <div className="space-y-0.5 px-2 pb-1">
                    {group.items.map(({ id, icon: Icon }) => {
                      const badgeCount = getBadgeCount(id);
                      const badgeColor =
                        id === "reels"    ? "bg-amber-500" :
                        id === "crm"      ? "bg-emerald-500" :
                        id === "listings" ? "bg-blue-500" : "bg-amber-500";
                      return (
                        <button
                          key={id}
                          onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === id ? "bg-navy text-primary-foreground shadow-sm" : "text-navy/80 hover:bg-secondary hover:text-navy"}`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{t("admin.nav." + id)}</span>
                          {badgeCount > 0 && (
                            <span className={`rounded-full ${badgeColor} px-2 py-0.5 text-xs font-black text-white`}>
                              {badgeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/10">
              <ShieldCheck className="h-4 w-4 text-navy" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">{t("admin.adminRole")}</p>
              <p className="text-xs text-muted-foreground">{t("admin.fullAccess")}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> {t("admin.signOut")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy/20 text-navy lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-navy">
                {t("admin.nav." + activeTab)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {globalError && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" /> {t("admin.serverOffline")}
              </span>
            )}
            <button
              onClick={loadStats}
              className="flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-2 text-sm font-bold text-navy hover:bg-secondary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.refresh")}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 md:p-8 pb-24 md:pb-8">
          {activeTab === "dashboard" && <DashboardTab stats={stats} loading={statsLoading} />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SiteSettingsTab />}
          {activeTab === "theme" && <ThemeTab />}
          {activeTab === "sections" && <SectionsTab />}
          {activeTab === "textcontent" && <TextContentTab />}
          {activeTab === "listings" && <ListingsAdminTab />}
          {activeTab === "projects" && <ProjectsAdminTab />}
          {activeTab === "media" && <MediaGalleryTab />}
          {activeTab === "pages" && <PagesTab />}
          {activeTab === "htmlsnippets" && <HtmlSnippetsTab />}
          {activeTab === "crm" && <CRMTab adminKey={adminKey} />}
          {activeTab === "articles" && <ArticlesTab />}
          {activeTab === "faqs" && <FAQsTab />}
          {activeTab === "reels" && <ReelsTab adminKey={adminKey} />}
          {activeTab === "seo" && <SEOTab />}
          {activeTab === "server" && <ServerTab />}
          {activeTab === "activitylog" && <ActivityLogTab />}
          {activeTab === "subscribers" && <SubscribersTab adminKey={adminKey} />}
        </main>
      </div>
    </div>
  );
}

