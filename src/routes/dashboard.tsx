import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLang } from "@/lib/language";
import {
  LayoutDashboard, Heart, MessageSquare, User, Briefcase, Building2,
  Plus, Trash2, Edit2, Save, X, LogOut, AlertCircle, CheckCircle2,
  Mail, Phone, ShieldCheck, TrendingUp, BarChart3, Layers3,
  Clock, Settings, Wallet, Check, Ban, ExternalLink, RefreshCw,
  FileDown, StickyNote, CalendarClock, ChevronDown, ChevronUp, GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type CurrentUser, type Role, type UserListing, type Project, type Inquiry, type PublicListing,
  getCachedUser, getMe, userLogin, setUserSession, clearUserSession,
  updateMe, getMyListings, createListing, deleteListing,
  getMyProjects, createProject, updateProject, deleteProject,
  getMyInquiries, updateInquiry, updateInquiryFull, exportLeadsCsv, CRM_STATUSES,
  getAllListingsAdmin, setListingApproval, adminDeleteListing,
} from "@/lib/api";

async function fetchAllViews(): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/properties/views");
    if (!res.ok) return {};
    return await res.json();
  } catch { return {}; }
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Osoulk" },
      { name: "description", content: "Personal dashboard for Osoulk users — manage saved properties, listings, projects and inquiries." },
    ],
  }),
  component: DashboardRoot,
});

// ─── Role definitions ────────────────────────────────────────────────────────
function getRoleInfo(t: (k: string) => string): Record<Role, { label: string; color: string; icon: React.ElementType; desc: string }> {
  return {
    individual:   { label: t("dash.roleIndividual"), color: "text-aqua",  icon: User,      desc: t("dash.individual") },
    broker:       { label: t("dash.roleBroker"),     color: "text-gold",  icon: Briefcase, desc: t("dash.brokerDesc") },
    developer:    { label: t("dash.roleDeveloper"),  color: "text-navy",  icon: Building2, desc: t("dash.developerDesc") },
    admin:        { label: t("dash.roleAdmin"),       color: "text-emerald-600", icon: ShieldCheck, desc: t("dash.adminDesc2") },
    "data-entry": { label: "Data Entry",              color: "text-muted-foreground", icon: User, desc: "Data entry role" },
  };
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background"><div className="os-container py-10">{children}</div></div>;
}

// ─── Login screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onAuthed }: { onAuthed: (u: CurrentUser) => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { user } = await userLogin(email, password);
      setUserSession(user);
      onAuthed(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dash.signInBtn"));
    } finally { setLoading(false); }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-md">
        <div className="premium-card p-8">
          <div className="mb-6 text-center">
            <LayoutDashboard className="mx-auto h-10 w-10 text-navy" />
            <h1 className="mt-3 text-2xl font-black text-navy">{t("dash.signIn")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("dash.signInSub")}</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t("dash.email")}
              className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder={t("dash.password")}
              className="h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? t("dash.signingIn") : t("dash.signInBtn")}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {t("dash.noAccount")}{" "}
            <Link to="/" className="font-bold text-navy underline">{t("dash.createHome")}</Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function Stat({ label, value, icon: Icon, color }: { label: string; value: React.ReactNode; icon: React.ElementType; color: string }) {
  return (
    <div className="premium-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
        </div>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
}

// ─── Profile section (shared) ─────────────────────────────────────────────────
function ProfileSection({ user, onUpdate }: { user: CurrentUser; onUpdate: (u: CurrentUser) => void }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || "", company: user.company || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true); setError("");
    try {
      const updated = await updateMe(form);
      onUpdate(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-navy flex items-center gap-2"><Settings className="h-5 w-5" /> {t("dash.profile")}</h3>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit2 className="h-4 w-4" /> {t("dash.edit")}</Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? t("dash.saving") : t("dash.save")}</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setForm({ fullName: user.fullName, phone: user.phone || "", company: user.company || "" }); }}><X className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
      {error && <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("dash.fullName")}</p>
          {editing ? (
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
          ) : <p className="mt-1 font-bold text-navy">{user.fullName}</p>}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("dash.email2")}</p>
          <p className="mt-1 text-muted-foreground">{user.email}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("dash.phone")}</p>
          {editing ? (
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
          ) : <p className="mt-1 font-bold text-navy">{user.phone || "—"}</p>}
        </div>
        {(user.role === "broker" || user.role === "developer") && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("dash.company")}</p>
            {editing ? (
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm" />
            ) : <p className="mt-1 font-bold text-navy">{user.company || "—"}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CRM status helpers ───────────────────────────────────────────────────────
function getCrmStatusConfig(t: (k: string) => string): Record<string, { label: string; color: string; bg: string }> {
  return {
    new:         { label: t("crm.new"),         color: "text-amber-700",   bg: "bg-amber-50" },
    contacted:   { label: t("crm.contacted"),   color: "text-blue-700",    bg: "bg-blue-50" },
    interested:  { label: t("crm.interested"),  color: "text-violet-700",  bg: "bg-violet-50" },
    viewing:     { label: t("crm.viewing"),     color: "text-cyan-700",    bg: "bg-cyan-50" },
    negotiation: { label: t("crm.negotiation"), color: "text-orange-700",  bg: "bg-orange-50" },
    closed:      { label: t("crm.closed"),      color: "text-slate-700",   bg: "bg-slate-100" },
    sold:        { label: t("crm.sold"),        color: "text-emerald-700", bg: "bg-emerald-50" },
  };
}

// ─── Single lead card (CRM) ───────────────────────────────────────────────────
function LeadCard({ item, isLead, onUpdate }: {
  item: Inquiry; isLead: boolean;
  onUpdate: (updated: Inquiry) => void;
}) {
  const { t } = useLang();
  const CRM_STATUS_CONFIG = getCrmStatusConfig(t);
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const crmStatus = item.crmStatus || "new";
  const cfg = CRM_STATUS_CONFIG[crmStatus] || CRM_STATUS_CONFIG.new;

  async function patch(data: Parameters<typeof updateInquiryFull>[1]) {
    setSaving(true);
    try {
      const updated = await updateInquiryFull(item.id, data);
      onUpdate(updated);
    } finally { setSaving(false); }
  }

  async function addNote() {
    const text = noteText.trim();
    if (!text) return;
    await patch({ note: text });
    setNoteText("");
  }

  const followUpDate = item.followUpDate ? new Date(item.followUpDate) : null;
  const isOverdue = followUpDate && followUpDate < new Date() && crmStatus !== "sold" && crmStatus !== "closed";

  return (
    <div className={`rounded-xl border bg-card transition-all ${isOverdue ? "border-destructive/40" : ""}`}>
      {/* Lead header */}
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-navy">{item.fromName}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {isOverdue && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">{t("crm.overdue")}</span>}
          </div>
          <p className="text-xs text-muted-foreground">{item.fromEmail}</p>
          {item.propertyId && (
            <Link to="/properties/$id" params={{ id: item.propertyId }} className="text-xs text-navy underline">
              {t("crm.viewProp")} →
            </Link>
          )}
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">"{item.message}"</p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{new Date(item.createdAt).toLocaleDateString("en-EG", { day:"numeric",month:"short",year:"numeric" })}</span>
            {item.followUpDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-bold" : ""}`}>
                <CalendarClock className="h-3 w-3" />
                {t("crm.followUp")} {new Date(item.followUpDate).toLocaleDateString()}
              </span>
            )}
            {(item.notes?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1"><StickyNote className="h-3 w-3" />{item.notes!.length} {item.notes!.length !== 1 ? t("crm.notes2") : t("crm.note")}</span>
            )}
          </div>
        </div>

        {isLead && (
          <div className="flex flex-col gap-2 shrink-0">
            <select
              value={crmStatus}
              disabled={saving}
              onChange={e => patch({ crmStatus: e.target.value })}
              className="h-8 rounded-lg border bg-background px-2 text-xs font-bold"
            >
              {CRM_STATUSES.map(s => <option key={s} value={s}>{CRM_STATUS_CONFIG[s]?.label ?? s}</option>)}
            </select>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 rounded-lg border px-2 h-8 text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? t("crm.close") : t("crm.manage")}
            </button>
          </div>
        )}
      </div>

      {/* Expanded CRM section */}
      {expanded && isLead && (
        <div className="border-t bg-secondary/30 p-4 space-y-4">
          {/* Follow-up date */}
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t("crm.followUpDate")}</label>
            <input
              type="date"
              value={item.followUpDate ? item.followUpDate.slice(0, 10) : ""}
              onChange={e => patch({ followUpDate: e.target.value })}
              className="mt-1 h-9 w-full max-w-xs rounded-lg border bg-background px-3 text-sm"
            />
          </div>

          {/* Lead source */}
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t("crm.leadSource")}</label>
            <select
              value={item.source || ""}
              onChange={e => patch({ source: e.target.value })}
              className="mt-1 h-9 w-full max-w-xs rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">{t("crm.unknown")}</option>
              <option value="website">{t("crm.website")}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="referral">{t("crm.referral")}</option>
              <option value="ad">{t("crm.ad")}</option>
              <option value="phone">{t("crm.phone")}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t("crm.notes")}</label>
            {(item.notes?.length ?? 0) > 0 && (
              <div className="mt-2 space-y-2">
                {item.notes!.map(n => (
                  <div key={n.id} className="rounded-lg bg-card border px-3 py-2">
                    <p className="text-sm">{n.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.authorName} · {new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <textarea
                ref={noteRef}
                rows={2}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={t("crm.addNote")}
                className="flex-1 rounded-lg border bg-background p-2.5 text-sm resize-none"
              />
              <Button size="sm" disabled={!noteText.trim() || saving} onClick={addNote} className="self-end">
                <StickyNote className="h-4 w-4" /> {t("crm.add")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inquiries / CRM panel (shared) ──────────────────────────────────────────
function InquiriesPanel({ user }: { user: CurrentUser }) {
  const { t } = useLang();
  const CRM_STATUS_CONFIG = getCrmStatusConfig(t);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getMyInquiries()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function updateItem(updated: Inquiry) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  async function doExport() {
    setExporting(true);
    try {
      const blob = await exportLeadsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    finally { setExporting(false); }
  }

  const isLead = user.role !== "individual";
  const filtered = filter === "all" ? items : items.filter(i => (i.crmStatus || "new") === filter);

  // Pipeline counts for brokers/developers
  const pipelineCount = isLead
    ? Object.fromEntries(CRM_STATUSES.map(s => [s, items.filter(i => (i.crmStatus || "new") === s).length]))
    : {};

  return (
    <div className="premium-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-navy flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {isLead ? t("crm.pipeline") : t("crm.inquiries")}
        </h3>
        {isLead && (
          <Button size="sm" variant="outline" onClick={doExport} disabled={exporting}>
            {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {t("crm.exportCsv")}
          </Button>
        )}
      </div>

      {/* Pipeline status bar (brokers/developers only) */}
      {isLead && items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors ${filter === "all" ? "bg-navy text-white border-navy" : "bg-background text-muted-foreground hover:bg-secondary"}`}
          >
            {t("crm.all")} ({items.length})
          </button>
          {CRM_STATUSES.map(s => {
            const cfg = CRM_STATUS_CONFIG[s];
            const count = pipelineCount[s] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors ${filter === s ? `${cfg.bg} ${cfg.color} border-current` : "bg-background text-muted-foreground hover:bg-secondary"}`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {items.length === 0
            ? (isLead ? t("crm.noLeads") : t("crm.noInquiries"))
            : t("crm.noStatus").replace("{s}", filter)}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map(i => (
            <LeadCard key={i.id} item={i} isLead={isLead} onUpdate={updateItem} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Property Views Widget ───────────────────────────────────────────────
function PropertyViewsWidget() {
  const [views, setViews] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    const data = await fetchAllViews();
    setViews(data);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const entries = Object.entries(views).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (loading) return (
    <div className="premium-card p-6 space-y-3">
      <div className="h-5 w-48 animate-pulse rounded-lg bg-secondary" />
      {[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-secondary" />)}
    </div>
  );

  if (!entries.length) return null;

  return (
    <div className="premium-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-navy flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Live Property Views
        </h3>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={refresh} className="rounded-lg border px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>
      <div className="mt-2 text-2xl font-black text-navy">{total.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">total views</span></div>
      <div className="mt-4 space-y-2">
        {entries.slice(0, 8).map(([id, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={id} className="flex items-center gap-3">
              <Link
                to="/properties/$id"
                params={{ id }}
                className="w-40 shrink-0 truncate text-xs font-bold text-navy hover:underline"
              >{id}</Link>
              <div className="flex-1 rounded-full bg-secondary h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-aqua transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-black text-navy">{count.toLocaleString()}</span>
              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}

// ─── Recently Viewed widget ───────────────────────────────────────────────────
function RecentlyViewedWidget() {
  const { t } = useLang();
  const [recent, setRecent] = useState<{ id: string; title: string; image: string }[]>([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("osoulk_recently_viewed") || "[]");
      setRecent(Array.isArray(raw) ? raw.slice(0, 5) : []);
    } catch { setRecent([]); }
  }, []);

  if (!recent.length) return null;

  return (
    <div className="premium-card p-6">
      <h3 className="text-lg font-black text-navy flex items-center gap-2">
        <Clock className="h-5 w-5" /> {t("dash.recentlyViewed")}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map(r => (
          <Link
            key={r.id}
            to="/properties/$id"
            params={{ id: r.id }}
            className="group flex items-center gap-3 rounded-xl border bg-background p-2.5 hover:bg-secondary/60 transition-colors"
          >
            <img
              src={r.image}
              alt={r.title}
              className="h-12 w-16 shrink-0 rounded-lg object-cover"
            />
            <span className="flex-1 min-w-0 text-sm font-bold text-navy group-hover:underline line-clamp-2">{r.title}</span>
          </Link>
        ))}
        <Link
          to="/compare"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary/60 hover:text-navy transition-colors"
        >
          <GitBranch className="h-4 w-4" /> {t("dash.compare")} →
        </Link>
      </div>
    </div>
  );
}

// ─── Individual dashboard ────────────────────────────────────────────────────
function IndividualDash({ user, onUpdate }: { user: CurrentUser; onUpdate: (u: CurrentUser) => void }) {
  const { t } = useLang();
  const [savedCount, setSavedCount] = useState<number>(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("osoulk_saved");
    try { setSavedCount(raw ? JSON.parse(raw).length : 0); } catch { setSavedCount(0); }
  }, []);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("dash.savedProps")} value={savedCount} icon={Heart} color="text-gold" />
        <Stat label={t("dash.activeInquiries")} value="—" icon={MessageSquare} color="text-aqua" />
        <Stat label={t("dash.plan")} value={<span className="capitalize">{user.plan}</span>} icon={Wallet} color="text-navy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection user={user} onUpdate={onUpdate} />
        <div className="premium-card p-6">
          <h3 className="text-lg font-black text-navy flex items-center gap-2"><Heart className="h-5 w-5" /> {t("dash.savedPropsSection")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("dash.savedPropsDesc")}</p>
          <Button asChild className="mt-4" variant="outline"><Link to="/saved">{t("dash.openSaved")}</Link></Button>
        </div>
      </div>

      <PropertyViewsWidget />

      <RecentlyViewedWidget />

      <InquiriesPanel user={user} />

      <div className="premium-card p-6">
        <h3 className="text-lg font-black text-navy flex items-center gap-2"><TrendingUp className="h-5 w-5" /> {t("dash.quickActions")}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline"><Link to="/explore">{t("dash.browseProps")}</Link></Button>
          <Button asChild variant="outline"><Link to="/agencies">{t("dash.findAgency")}</Link></Button>
          <Button asChild><Link to="/packages">{t("dash.upgradePlan")}</Link></Button>
        </div>
      </div>
    </div>
  );
}

// ─── Broker dashboard ─────────────────────────────────────────────────────────
function BrokerDash({ user, onUpdate }: { user: CurrentUser; onUpdate: (u: CurrentUser) => void }) {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", price: "", type: "apartment", description: "", imageUrl: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setListings(await getMyListings()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submitListing(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createListing(form);
      setListings(prev => [created, ...prev]);
      setForm({ title: "", location: "", price: "", type: "apartment", description: "", imageUrl: "" });
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  }

  async function remove(id: string) {
    await deleteListing(id);
    setListings(prev => prev.filter(l => l.id !== id));
  }

  const { t, lang } = useLang();
  const stats = {
    total: listings.length,
    pending: listings.filter(l => l.status === "pending").length,
    approved: listings.filter(l => l.status === "approved").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label={t("dash.myListings")} value={stats.total} icon={Layers3} color="text-navy" />
        <Stat label={t("dash.pendingReview")} value={stats.pending} icon={Clock} color="text-amber-600" />
        <Stat label={t("dash.live")} value={stats.approved} icon={CheckCircle2} color="text-emerald-600" />
        <Stat label={t("dash.plan")} value={<span className="capitalize">{user.plan}</span>} icon={Wallet} color="text-gold" />
      </div>

      <ProfileSection user={user} onUpdate={onUpdate} />

      <div className="premium-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-navy flex items-center gap-2"><Layers3 className="h-5 w-5" /> {t("dash.myListings")}</h3>
          <Button onClick={() => setCreating(c => !c)} size="sm">
            {creating ? <><X className="h-4 w-4" /> {t("dash.cancel")}</> : <><Plus className="h-4 w-4" /> {t("dash.newListing")}</>}
          </Button>
        </div>

        {creating && (
          <form onSubmit={submitListing} className="mt-4 grid gap-3 rounded-xl border bg-secondary/50 p-4 sm:grid-cols-2">
            <input required placeholder={t("dash.titlePlaceholder")} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <input placeholder={t("dash.locationPlaceholder")} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <input required placeholder={t("dash.pricePlaceholder")} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm">
              <option value="apartment">{t("create.types.apartment")}</option>
              <option value="villa">{t("create.types.villa")}</option>
              <option value="townhouse">{lang === "ar" ? "تاون هاوس" : "Townhouse"}</option>
              <option value="office">{t("create.types.office")}</option>
              <option value="retail">{lang === "ar" ? "تجاري" : "Retail"}</option>
              <option value="land">{t("create.types.land")}</option>
            </select>
            <textarea placeholder={t("create.description")} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="rounded-lg border bg-background p-3 text-sm sm:col-span-2" />
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">{lang === "ar" ? "رابط صورة العقار (اختياري)" : "Property Image URL (optional)"}</label>
              <input
                type="url"
                placeholder="https://…"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-mono"
                dir="ltr"
              />
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="mt-1.5 h-24 w-full rounded-lg object-cover border"
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2"><AlertCircle className="mr-1 inline h-4 w-4" />{error}</p>}
            <div className="sm:col-span-2"><Button type="submit"><Save className="h-4 w-4" /> {t("dash.submitReview")}</Button></div>
          </form>
        )}

        {loading ? (
          <div className="mt-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
        ) : listings.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("dash.noListings")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-secondary text-xs font-black uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2 text-left">{t("dash.title")}</th><th className="px-4 py-2 text-left">{t("dash.location")}</th><th className="px-4 py-2 text-left">{t("dash.price")}</th><th className="px-4 py-2 text-left">{t("dash.status")}</th><th className="px-4 py-2 text-left">{t("dash.actions")}</th></tr>
              </thead>
              <tbody className="divide-y">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-bold text-navy">{l.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.location || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.price}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${l.status === "approved" ? "bg-emerald-50 text-emerald-700" : l.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-50 text-amber-700"}`}>{l.status}</span></td>
                    <td className="px-4 py-3"><button onClick={() => remove(l.id)} className="text-destructive hover:underline text-xs font-bold flex items-center gap-1"><Trash2 className="h-3 w-3" /> {t("dash.delete")}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InquiriesPanel user={user} />
    </div>
  );
}

// ─── Developer dashboard ──────────────────────────────────────────────────────
function DeveloperDash({ user, onUpdate }: { user: CurrentUser; onUpdate: (u: CurrentUser) => void }) {
  const { t, lang } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", units: 0, status: "planning", deliveryDate: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setProjects(await getMyProjects()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submitProject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await createProject(form);
      setProjects(prev => [created, ...prev]);
      setForm({ name: "", location: "", units: 0, status: "planning", deliveryDate: "" });
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  }

  async function bumpSold(id: string, current: number) {
    const next = current + 1;
    const updated = await updateProject(id, { soldUnits: next });
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function remove(id: string) {
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  const totalUnits = projects.reduce((a, b) => a + (b.units || 0), 0);
  const soldUnits  = projects.reduce((a, b) => a + (b.soldUnits || 0), 0);
  const sellThrough = totalUnits ? Math.round((soldUnits / totalUnits) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label={t("dash.projects")} value={projects.length} icon={Building2} color="text-navy" />
        <Stat label={t("dash.totalUnits")} value={totalUnits} icon={Layers3} color="text-aqua" />
        <Stat label={t("dash.soldUnits")} value={soldUnits} icon={TrendingUp} color="text-emerald-600" />
        <Stat label={t("dash.sellThrough")} value={`${sellThrough}%`} icon={BarChart3} color="text-gold" />
      </div>

      <ProfileSection user={user} onUpdate={onUpdate} />

      <div className="premium-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-navy flex items-center gap-2"><Building2 className="h-5 w-5" /> {t("dash.myProjects")}</h3>
          <Button onClick={() => setCreating(c => !c)} size="sm">
            {creating ? <><X className="h-4 w-4" /> {t("dash.cancel")}</> : <><Plus className="h-4 w-4" /> {t("dash.newProject")}</>}
          </Button>
        </div>

        {creating && (
          <form onSubmit={submitProject} className="mt-4 grid gap-3 rounded-xl border bg-secondary/50 p-4 sm:grid-cols-2">
            <input required placeholder={t("dash.projName")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <input placeholder={t("dash.location")} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <input type="number" min={0} placeholder={t("dash.units")} value={form.units} onChange={e => setForm(f => ({ ...f, units: Number(e.target.value) }))} className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm">
              <option value="planning">{lang === "ar" ? "تخطيط" : "Planning"}</option>
              <option value="under_construction">{lang === "ar" ? "قيد الإنشاء" : "Under construction"}</option>
              <option value="selling">{lang === "ar" ? "في البيع" : "Selling"}</option>
              <option value="delivered">{lang === "ar" ? "تم التسليم" : "Delivered"}</option>
            </select>
            <input type="date" placeholder={t("dash.deliveryDate")} value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm sm:col-span-2" />
            {error && <p className="text-sm text-destructive sm:col-span-2"><AlertCircle className="mr-1 inline h-4 w-4" />{error}</p>}
            <div className="sm:col-span-2"><Button type="submit"><Save className="h-4 w-4" /> {t("dash.saveProject")}</Button></div>
          </form>
        )}

        {loading ? (
          <div className="mt-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
        ) : projects.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("dash.noProjects")}</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {projects.map(p => {
              const pct = p.units ? Math.round((p.soldUnits / p.units) * 100) : 0;
              return (
                <div key={p.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-navy truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.location || "—"}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold capitalize">{p.status.replace("_", " ")}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-secondary px-3 py-2"><p className="font-bold uppercase tracking-wide text-muted-foreground">{t("dash.units")}</p><p className="text-base font-black text-navy">{p.units}</p></div>
                    <div className="rounded-lg bg-secondary px-3 py-2"><p className="font-bold uppercase tracking-wide text-muted-foreground">{t("dash.sold")}</p><p className="text-base font-black text-emerald-600">{p.soldUnits}</p></div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-aqua transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pct}% {t("dash.sold")} {p.deliveryDate ? `· ${t("dash.delivers")} ${p.deliveryDate}` : ""}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => bumpSold(p.id, p.soldUnits)} disabled={p.soldUnits >= p.units}><Plus className="h-3.5 w-3.5" /> {t("dash.sale")}</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(p.id)} className="text-destructive border-destructive/40"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InquiriesPanel user={user} />
    </div>
  );
}

// ─── Admin listings approval panel ───────────────────────────────────────────
function AdminListingsPanel() {
  const { t } = useLang();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try { setListings(await getAllListingsAdmin()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, status: "approved" | "rejected" | "pending") {
    setBusy(id + status);
    try {
      const updated = await setListingApproval(id, status);
      setListings(prev => prev.map(l => l.id === id ? { ...l, approvalStatus: updated.approvalStatus } : l));
    } finally { setBusy(null); }
  }

  async function remove(id: string) {
    setBusy(id + "del");
    try {
      await adminDeleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
    } finally { setBusy(null); }
  }

  const filtered = listings.filter(l => filter === "all" ? true : l.approvalStatus === filter);
  const pendingCount = listings.filter(l => l.approvalStatus === "pending").length;

  return (
    <div className="premium-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-navy flex items-center gap-2">
          <Layers3 className="h-5 w-5" />
          {t("dash.userListingApprovals")}
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">
              {pendingCount} {t("dash.pending")}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border overflow-hidden text-xs font-bold">
            {(["pending", "approved", "rejected", "all"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 capitalize transition-colors ${filter === f ? "bg-navy text-white" : "bg-background text-muted-foreground hover:bg-secondary"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t("dash.refresh")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-2 font-bold text-muted-foreground">
            {filter === "pending" ? t("dash.noReviewNeeded") : t("dash.noReviewNeeded")}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map(l => (
            <div key={l.id} className={`flex flex-wrap gap-4 rounded-xl border p-4 transition-colors ${
              l.approvalStatus === "pending" ? "border-amber-200 bg-amber-50/50"
              : l.approvalStatus === "approved" ? "border-emerald-200 bg-emerald-50/30"
              : "border-destructive/20 bg-destructive/5"
            }`}>
              {/* Thumbnail */}
              {(l.images?.[0] || l.imageUrl) && (
                <img
                  src={l.images?.[0] || l.imageUrl}
                  alt={l.title}
                  loading="lazy"
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-navy">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.location} · {l.type} · {l.price}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("dash.by")} <span className="font-bold">{l.ownerName}</span> ({l.ownerRole}) · {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black capitalize ${
                    l.approvalStatus === "approved" ? "bg-emerald-100 text-emerald-700"
                    : l.approvalStatus === "rejected" ? "bg-destructive/10 text-destructive"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                    {l.approvalStatus}
                  </span>
                </div>

                {l.description && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{l.description}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {l.approvalStatus !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => changeStatus(l.id, "approved")}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs h-8 px-3"
                    >
                      {busy === l.id + "approved" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      {t("dash.approve")}
                    </Button>
                  )}
                  {l.approvalStatus !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => changeStatus(l.id, "rejected")}
                      className="border-destructive/40 text-destructive hover:bg-destructive/5 text-xs h-8 px-3"
                    >
                      {busy === l.id + "rejected" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                      {t("dash.reject")}
                    </Button>
                  )}
                  {l.approvalStatus === "approved" && (
                    <Link
                      to="/properties/$id"
                      params={{ id: l.id }}
                      className="flex items-center gap-1 rounded-lg border px-3 h-8 text-xs font-bold text-navy hover:bg-secondary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> {t("dash.viewLive")}
                    </Link>
                  )}
                  <button
                    disabled={!!busy}
                    onClick={() => remove(l.id)}
                    className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 h-8 text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors ml-auto"
                  >
                    {busy === l.id + "del" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    {t("dash.delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
function DashboardRoot() {
  const [user, setUser] = useState<CurrentUser | null>(() => getCachedUser());
  const [loadingMe, setLoadingMe] = useState<boolean>(!!getCachedUser());

  useEffect(() => {
    if (!user) { setLoadingMe(false); return; }
    getMe()
      .then(fresh => { setUser(fresh); setUserSession(fresh); })
      .catch(() => { clearUserSession(); setUser(null); })
      .finally(() => setLoadingMe(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <LoginScreen onAuthed={u => setUser(u)} />;
  if (loadingMe) return <PageShell><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />)}</div></PageShell>;

  function logout() { clearUserSession(); setUser(null); }
  function onUserUpdate(u: CurrentUser) { setUser(u); setUserSession(u); }

  const { t } = useLang();
  const ROLE_INFO = getRoleInfo(t);
  const info = ROLE_INFO[user.role] || ROLE_INFO.individual;
  const RoleIcon = info.icon;

  return (
    <PageShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary ${info.color}`}>
            <RoleIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{info.desc}</p>
            <h1 className="text-2xl font-black text-navy">{t("dash.welcome")} {user.fullName.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-3"><Mail className="inline h-3.5 w-3.5" /> {user.email}{user.phone && <><span>·</span><Phone className="inline h-3.5 w-3.5" /> {user.phone}</>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full bg-secondary px-3 py-1.5 text-xs font-black uppercase tracking-wide ${info.color}`}>{info.label}</span>
          {user.role === "admin" && (
            <Button asChild variant="outline" size="sm"><Link to="/admin"><ShieldCheck className="h-4 w-4" /> {t("dash.adminPanel")}</Link></Button>
          )}
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> {t("dash.signOut")}</Button>
        </div>
      </div>

      {user.role === "broker"     && <BrokerDash     user={user} onUpdate={onUserUpdate} />}
      {user.role === "developer"  && <DeveloperDash  user={user} onUpdate={onUserUpdate} />}
      {user.role === "individual" && <IndividualDash user={user} onUpdate={onUserUpdate} />}
      {user.role === "admin" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={t("dash.platformAdmin")} value={t("dash.fullAccess")} icon={ShieldCheck} color="text-emerald-600" />
            <Stat label={t("dash.pendingListings")} value="—" icon={Clock} color="text-amber-600" />
            <Stat label={t("dash.plan")} value={<span className="capitalize">{user.plan}</span>} icon={Wallet} color="text-gold" />
          </div>

          <div className="premium-card p-6">
            <h3 className="text-lg font-black text-navy flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> {t("dash.administrator")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("dash.adminDesc")}</p>
            <Button asChild className="mt-4"><Link to="/admin">{t("dash.openAdmin")}</Link></Button>
          </div>

          <AdminListingsPanel />

          <ProfileSection user={user} onUpdate={onUserUpdate} />
          <InquiriesPanel user={user} />
        </div>
      )}
    </PageShell>
  );
}
