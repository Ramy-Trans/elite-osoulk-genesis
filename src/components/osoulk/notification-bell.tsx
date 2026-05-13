import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellOff, Home, Search, X, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  getCachedUser, getUserId,
  getServerNotifications, markServerNotificationRead,
  markAllServerNotificationsRead, deleteServerNotification,
  type ServerNotification,
} from "@/lib/api";

const LOCAL_KEY = "osoulk_local_notifs";

export type AppNotification = {
  id: string;
  type: "info" | "success" | "warning" | "lead" | "listing" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  propertyId?: string;
};

function getLocalNotifs(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function saveLocalNotifs(n: AppNotification[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(n));
}

function seedWelcome(userId: string): AppNotification[] {
  const key = `osoulk_notif_seeded_${userId}`;
  if (localStorage.getItem(key)) return getLocalNotifs();
  const seeded: AppNotification[] = [
    {
      id: "seed-welcome",
      type: "success",
      title: "مرحباً بك في أصولك",
      body: "تم إنشاء حسابك بنجاح. استكشف أفضل العقارات في مصر.",
      read: false,
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: "seed-search",
      type: "info",
      title: "جرّب ميزة البحث المحفوظ",
      body: "احفظ بحثك وستصلك إشعارات فورية عند إضافة عقارات مطابقة.",
      read: false,
      createdAt: new Date(Date.now() - 1800_000).toISOString(),
    },
  ];
  saveLocalNotifs(seeded);
  localStorage.setItem(key, "1");
  return seeded;
}

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  lead: "bg-aqua/10 text-aqua",
  listing: "bg-gold/10 text-gold",
  system: "bg-navy/10 text-navy",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} ي`;
}

function mergeNotifications(
  server: ServerNotification[],
  local: AppNotification[],
): (AppNotification | ServerNotification)[] {
  const serverIds = new Set(server.map(n => n.id));
  const localFiltered = local.filter(n => !serverIds.has(n.id));
  return [
    ...server,
    ...localFiltered,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 40);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [server, setServer] = useState<ServerNotification[]>([]);
  const [local, setLocal] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = getCachedUser();

  const loadServer = useCallback(async () => {
    if (!getUserId()) return;
    const data = await getServerNotifications();
    setServer(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    const l = seedWelcome(user.id);
    setLocal(l);
    loadServer();
    const iv = setInterval(loadServer, 30_000);
    return () => clearInterval(iv);
  }, [user?.id, loadServer]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleNotifEvent() { loadServer(); }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("osoulk:notification", handleNotifEvent);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("osoulk:notification", handleNotifEvent);
    };
  }, [loadServer]);

  if (!user) return null;

  const all = mergeNotifications(server, local);
  const unread = all.filter(n => !n.read).length;

  async function handleClick(notif: AppNotification | ServerNotification) {
    const isServer = server.some(n => n.id === notif.id);
    if (isServer) {
      await markServerNotificationRead(notif.id);
      setServer(s => s.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } else {
      const updated = local.map(n => n.id === notif.id ? { ...n, read: true } : n);
      setLocal(updated);
      saveLocalNotifs(updated);
    }
    const pid = (notif as ServerNotification).propertyId;
    if (pid) {
      setOpen(false);
      navigate({ to: "/properties/$id", params: { id: pid } });
    }
  }

  async function handleDelete(e: React.MouseEvent, notif: AppNotification | ServerNotification) {
    e.stopPropagation();
    const isServer = server.some(n => n.id === notif.id);
    if (isServer) {
      await deleteServerNotification(notif.id);
      setServer(s => s.filter(n => n.id !== notif.id));
    } else {
      const updated = local.filter(n => n.id !== notif.id);
      setLocal(updated);
      saveLocalNotifs(updated);
    }
  }

  async function markAllRead() {
    await markAllServerNotificationsRead();
    setServer(s => s.map(n => ({ ...n, read: true })));
    const updated = local.map(n => ({ ...n, read: true }));
    setLocal(updated);
    saveLocalNotifs(updated);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-navy/20 text-navy transition-colors hover:bg-secondary"
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute end-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border bg-background shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-black text-navy">الإشعارات</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-bold text-aqua hover:underline"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> الكل مقروء
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-navy">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
            {all.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellOff className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-bold text-muted-foreground">لا توجد إشعارات</p>
                <p className="mt-1 text-xs text-muted-foreground">احفظ بحثاً وستصلك تنبيهات عند إضافة عقارات مطابقة</p>
              </div>
            ) : (
              all.map(n => {
                const pid = (n as ServerNotification).propertyId;
                const isListing = n.type === "listing" || !!pid;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`group relative flex w-full gap-3 border-b px-4 py-3.5 text-start transition-colors hover:bg-secondary/50 ${n.read ? "opacity-60" : "bg-navy/[0.02]"}`}
                  >
                    {/* Unread dot */}
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-all ${n.read ? "bg-transparent" : (isListing ? "bg-gold" : "bg-aqua")}`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-black text-navy leading-snug">{n.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[n.type] ?? TYPE_COLORS.info}`}>
                          {isListing ? <Home className="inline h-2.5 w-2.5" /> : n.type}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.body}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                        {pid && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-aqua">
                            <ExternalLink className="h-2.5 w-2.5" /> عرض العقار
                          </span>
                        )}
                        {!pid && (n as any).searchId && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-navy/50">
                            <Search className="h-2.5 w-2.5" /> بحث محفوظ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={e => handleDelete(e, n)}
                      className="absolute end-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:flex"
                      title="حذف"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2.5">
            <a
              href="/saved-searches"
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-navy hover:text-aqua transition-colors"
              onClick={() => setOpen(false)}
            >
              <Search className="h-3.5 w-3.5" />
              إدارة البحوث المحفوظة
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function pushNotification(notif: Omit<AppNotification, "id" | "createdAt" | "read">) {
  const existing = getLocalNotifs();
  const newNotif: AppNotification = {
    ...notif,
    id: Math.random().toString(36).slice(2),
    read: false,
    createdAt: new Date().toISOString(),
  };
  existing.unshift(newNotif);
  saveLocalNotifs(existing.slice(0, 30));
  window.dispatchEvent(new Event("osoulk:notification"));
}
