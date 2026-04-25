import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Film, Building2, FileText, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — OSOULK" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Reel = { id: string; title: string; description: string | null; status: string; created_at: string };
type Listing = { id: string; title: string; price: number; city: string | null; moderation: string; created_at: string };
type Article = { id: string; title: string; slug: string; published: boolean; category: string | null };

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"reels" | "listings" | "articles" | "users">("reels");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/auth" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = (roles || []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      if (admin) loadAll();
    })();
  }, [navigate]);

  const loadAll = async () => {
    const [r, l, a] = await Promise.all([
      supabase.from("reels").select("*").order("created_at", { ascending: false }),
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
    ]);
    setReels((r.data as Reel[]) || []);
    setListings((l.data as Listing[]) || []);
    setArticles((a.data as Article[]) || []);
  };

  const moderate = async (table: "reels" | "listings", id: string, value: "approved" | "rejected") => {
    const col = table === "reels" ? "status" : "moderation";
    const { error } = await supabase.from(table).update({ [col]: value }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); loadAll(); }
  };

  if (isAdmin === null) return <div className="container-luxe py-20">Loading…</div>;

  if (!isAdmin) return (
    <div className="container-luxe py-20 max-w-lg text-center">
      <ShieldCheck className="h-10 w-10 mx-auto text-[color:var(--gold)]" />
      <h1 className="mt-4 font-display text-3xl">Admin access required</h1>
      <p className="mt-3 text-muted-foreground">Your account doesn't have admin privileges. Contact an existing admin to grant you access via the user_roles table.</p>
      <Link to="/" className="mt-6 inline-flex px-6 py-2.5 rounded-sm gradient-ink text-ivory text-sm">Back to home</Link>
    </div>
  );

  const tabs = [
    { id: "reels" as const, label: "Reels", icon: Film, count: reels.filter((r) => r.status === "pending").length },
    { id: "listings" as const, label: "Listings", icon: Building2, count: listings.filter((l) => l.moderation === "pending").length },
    { id: "articles" as const, label: "Articles & SEO", icon: FileText, count: articles.length },
    { id: "users" as const, label: "Users", icon: Users, count: 0 },
  ];

  return (
    <div className="container-luxe py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Admin Dashboard</p>
      <h1 className="mt-2 font-display text-4xl">Moderation & content</h1>

      <div className="mt-8 flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition ${tab === t.id ? "border-[color:var(--gold)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px]">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "reels" && (
          <Table headers={["Title", "Status", "Created", "Actions"]} rows={reels.map((r) => [
            r.title,
            <Badge key="s" v={r.status} />,
            new Date(r.created_at).toLocaleDateString(),
            <Actions key="a" onApprove={() => moderate("reels", r.id, "approved")} onReject={() => moderate("reels", r.id, "rejected")} />,
          ])} empty="No reels yet." />
        )}
        {tab === "listings" && (
          <Table headers={["Title", "Price", "City", "Status", "Actions"]} rows={listings.map((l) => [
            l.title,
            `EGP ${Number(l.price).toLocaleString()}`,
            l.city ?? "—",
            <Badge key="s" v={l.moderation} />,
            <Actions key="a" onApprove={() => moderate("listings", l.id, "approved")} onReject={() => moderate("listings", l.id, "rejected")} />,
          ])} empty="No listings yet." />
        )}
        {tab === "articles" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Articles include full SEO fields: meta title, meta description, keywords, slug, and structured data is auto-generated.</p>
            <Table headers={["Title", "Slug", "Category", "Published"]} rows={articles.map((a) => [
              a.title, a.slug, a.category ?? "—", a.published ? <Badge key="p" v="approved" /> : <Badge key="p" v="pending" />,
            ])} empty="No articles yet — create one from the dashboard." />
          </div>
        )}
        {tab === "users" && (
          <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Manage users and grant reel-upload permissions from the Cloud dashboard. Use SQL: <code className="px-2 py-1 rounded bg-secondary">UPDATE profiles SET can_upload_reels = true WHERE id = '...';</code>
          </div>
        )}
      </div>
    </div>
  );
}

function Table({ headers, rows, empty }: { headers: string[]; rows: any[][]; empty: string }) {
  if (rows.length === 0) return <div className="rounded-md border border-border bg-card p-12 text-center text-muted-foreground">{empty}</div>;
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>{headers.map((h) => <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => <td key={j} className="px-5 py-4 align-middle">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ v }: { v: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs ${map[v] ?? "bg-secondary"}`}>{v}</span>;
}

function Actions({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onApprove} className="h-8 w-8 grid place-items-center rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition" aria-label="Approve"><Check className="h-4 w-4" /></button>
      <button onClick={onReject} className="h-8 w-8 grid place-items-center rounded-full bg-destructive/15 text-destructive hover:bg-destructive/25 transition" aria-label="Reject"><X className="h-4 w-4" /></button>
    </div>
  );
}
