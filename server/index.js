import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import { existsSync, mkdirSync, writeFileSync, readdirSync, copyFileSync } from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createHash } from "crypto";
import os from "os";

import { rateLimiter, strictRateLimiter } from "./middleware/ratelimit.js";
import { cache, bustCache, bustCachePrefix, getCacheSize } from "./middleware/cache.js";
import { concurrencyLimiter, getActiveCount } from "./middleware/concurrency.js";
import { requestLogger } from "./middleware/request-logger.js";

import db, {
  setDataDir,
  setDbAvailable, startReconnectLoop,
  setPgAvailable, startPgReconnectLoop,
} from "./database/adapter.js";
import { testConnection, getPool } from "./config/db.js";
import { initPgPool, getPgPool } from "./config/pg.js";
import { ensurePgSchema } from "./database/schema-pg.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const START_TIME = Date.now();

// ─── Data directory ───────────────────────────────────────────────────────────
let DATA_DIR;
if (IS_SERVERLESS) {
  DATA_DIR = "/tmp/osoulk-data";
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    const bundledDir = join(__dirname, "data");
    if (existsSync(bundledDir)) {
      for (const file of readdirSync(bundledDir)) {
        const src = join(bundledDir, file);
        const dst = join(DATA_DIR, file);
        if (!existsSync(dst)) copyFileSync(src, dst);
      }
    }
  }
} else {
  DATA_DIR = join(__dirname, "data");
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}
setDataDir(DATA_DIR);

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "osoulk2026";
const ROLES = ["individual", "broker", "developer", "admin", "data-entry"];
const PLAN_LIMITS = { free: 1, basic: 3, standard: 5, broker: 10, elite: 20 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeRole(r) { return ROLES.includes(r) ? r : "individual"; }
function hashPwd(pwd) { return createHash("sha256").update(String(pwd)).digest("hex"); }
function deepMerge(base, over) {
  if (over == null) return base;
  if (typeof base !== "object" || Array.isArray(base) || typeof over !== "object" || Array.isArray(over)) return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
  return out;
}

// ─── In-memory log ring ───────────────────────────────────────────────────────
const LOG_RING = [];
const _origLog = console.log.bind(console);
const _origErr = console.error.bind(console);
console.log = (...args) => {
  LOG_RING.push({ time: new Date().toISOString(), level: "info", msg: args.map(String).join(" ") });
  if (LOG_RING.length > 300) LOG_RING.shift();
  _origLog(...args);
};
console.error = (...args) => {
  LOG_RING.push({ time: new Date().toISOString(), level: "error", msg: args.map(String).join(" ") });
  if (LOG_RING.length > 300) LOG_RING.shift();
  _origErr(...args);
};

// ─── User cache ───────────────────────────────────────────────────────────────
const _userCache = new Map();
const USER_CACHE_TTL = 30_000;
function invalidateUserCache(id) { if (id) _userCache.delete(id); else _userCache.clear(); }

// ─── Express setup ────────────────────────────────────────────────────────────
const app = express();
app.use(compression());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "5mb" }));
app.use(requestLogger);
app.use(rateLimiter);
app.use(concurrencyLimiter);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use((req, res, next) => {
  req.setTimeout(25_000, () => {
    if (!res.headersSent) res.status(503).json({ ok: false, error: "Request timed out." });
  });
  next();
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!key || key !== ADMIN_PASSWORD)
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  next();
}

async function requireUser(req, res, next) {
  const id = req.headers["x-user-id"];
  if (!id) return res.status(401).json({ ok: false, message: "Not signed in" });
  const cached = _userCache.get(id);
  if (cached && cached.expiresAt > Date.now()) { req.user = cached.user; return next(); }
  try {
    const users = await db.getAll("users");
    const u = users.find(x => x.id === id);
    if (!u) { _userCache.delete(id); return res.status(401).json({ ok: false, message: "Session invalid" }); }
    _userCache.set(id, { user: u, expiresAt: Date.now() + USER_CACHE_TTL });
    req.user = u;
    next();
  } catch { res.status(500).json({ ok: false, message: "Server error" }); }
}

// ─── Activity log (fire and forget — never blocks a response) ─────────────────
function logActivity({ type = "Access", event = "", subject = "", userId = "", userName = "" } = {}) {
  const entry = { id: randomUUID(), type, event, subject, userId, userName, createdAt: new Date().toISOString() };
  db.insert("activity-log", entry).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/api/ping", (_req, res) => res.json({ ok: true, status: "running", ts: Date.now() }));

app.get("/api/health", async (_req, res) => {
  try {
    const mem = process.memoryUsage();
    const uptimeMs = Date.now() - START_TIME;
    let dbStatus = "disconnected", dbError = null, dbLatencyMs = null;
    if (db.isMysql) {
      try { const t0 = Date.now(); const c = await getPool().getConnection(); await c.query("SELECT 1"); c.release(); dbLatencyMs = Date.now() - t0; dbStatus = "connected"; }
      catch (e) { dbError = e.message; dbStatus = "error"; }
    } else if (db.isPg) {
      try { const t0 = Date.now(); const c = await getPgPool().connect(); await c.query("SELECT 1"); c.release(); dbLatencyMs = Date.now() - t0; dbStatus = "connected"; }
      catch (e) { dbError = e.message; dbStatus = "error"; }
    } else { dbStatus = "json-files"; }
    res.json({
      ok: dbStatus !== "error", status: dbStatus === "error" ? "degraded" : "ok",
      db: dbStatus, ...(dbError && { dbError }), ...(dbLatencyMs !== null && { dbLatencyMs }),
      uptime: `${Math.floor(uptimeMs / 3600000)}h ${Math.floor((uptimeMs % 3600000) / 60000)}m`, uptimeMs,
      memory: { heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + " MB", heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + " MB", rss: Math.round(mem.rss / 1024 / 1024) + " MB" },
      system: { platform: os.platform(), arch: os.arch(), nodeVersion: process.version },
      timestamp: new Date().toISOString(),
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/stats", cache(30), async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      db.getAll("subscribers"), db.getAll("users"), db.getAll("reel-requests"),
      db.getObj("views"), db.getAll("articles"), db.getAll("public-projects"), db.getAll("user-listings"),
    ]);
    const safe = (r, fb) => r.status === "fulfilled" ? (r.value ?? fb) : fb;
    const [subs, users, reels, views, articles, projects, listings] = results.map((r, i) =>
      safe(r, [0, 1, 2, 4, 5, 6].includes(i) ? [] : {})
    );
    const now = Date.now();
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();
    const thisM = users.filter(u => u.createdAt >= thisMonth).length + subs.filter(s => s.createdAt >= thisMonth).length;
    const lastM = users.filter(u => u.createdAt >= lastMonth && u.createdAt < thisMonth).length + subs.filter(s => s.createdAt >= lastMonth && s.createdAt < thisMonth).length;
    const growth = lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : (thisM > 0 ? 100 : null);
    const yesterday = new Date(now - 86400000).toISOString();
    res.json({
      ok: true, subscribers: subs.length, users: users.length,
      listings: 9 + listings.filter(l => l.approvalStatus === "approved").length,
      reels: reels.length, agencies: 4,
      pendingApprovals: reels.filter(r => r.status === "pending").length,
      approvedReels: reels.filter(r => r.status === "approved").length,
      totalViews: Object.values(views).reduce((a, b) => a + (Number(b) || 0), 0),
      growth, articles: articles.filter(a => a.status === "published").length,
      projects: projects.filter(p => p.publishStatus === "published").length,
      newUsers: users.filter(u => u.createdAt >= yesterday).length,
      pendingListings: listings.filter(l => l.approvalStatus === "pending").length,
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, name = "" } = req.body ?? {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "A valid email is required." });
    const subs = await db.getAll("subscribers");
    if (subs.find(s => s.email.toLowerCase() === email.toLowerCase()))
      return res.status(409).json({ message: "This email is already subscribed." });
    const entry = { id: randomUUID(), email, name, createdAt: new Date().toISOString() };
    await db.insert("subscribers", entry);
    res.json({ message: "Subscribed successfully!", subscriber: entry });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Admin Auth ───────────────────────────────────────────────────────────────
app.post("/api/admin/login", strictRateLimiter, (req, res) => {
  try {
    const { password } = req.body ?? {};
    if (!password) return res.status(400).json({ ok: false, message: "Password is required." });
    if (String(password) !== String(ADMIN_PASSWORD))
      return res.status(401).json({ ok: false, message: "Invalid admin password." });
    res.json({ ok: true, token: ADMIN_PASSWORD });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ─── User Auth ────────────────────────────────────────────────────────────────
async function handleRegister(req, res) {
  try {
    const { fullName, email, phone = "", password, role = "individual", company = "" } = req.body ?? {};
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "Full name, email and password are required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "A valid email is required." });
    if (String(password).length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    const users = await db.getAll("users");
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(409).json({ message: "An account with this email already exists." });
    const user = {
      id: randomUUID(), fullName: String(fullName).trim(), email: String(email).toLowerCase().trim(),
      phone: String(phone), passwordHash: hashPwd(password),
      plan: "free", role: normalizeRole(role), company: String(company),
      status: "active", createdAt: new Date().toISOString(),
    };
    await db.insert("users", user);
    const { passwordHash: _ph, ...safe } = user;
    res.status(201).json({ message: "Account created successfully!", user: safe });
  } catch (e) {
    console.error("[register]", e.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
}

app.post("/api/register", strictRateLimiter, handleRegister);
app.post("/api/admin/signup", strictRateLimiter, handleRegister);

app.post("/api/login", strictRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });
    const users = await db.getAll("users");
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user || user.passwordHash !== hashPwd(password))
      return res.status(401).json({ message: "Invalid email or password." });
    if (user.status === "inactive")
      return res.status(403).json({ message: "Account is deactivated." });
    const { passwordHash: _ph, ...safe } = user;
    logActivity({ type: "Access", event: "Login", userId: user.id, userName: user.fullName });
    res.json({ message: "Signed in successfully", user: safe, token: user.id });
  } catch (e) {
    console.error("[login]", e.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ message: "البريد الإلكتروني مطلوب." });
    const users = await db.getAll("users");
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user) return res.status(404).json({ message: "لا يوجد حساب مرتبط بهذا البريد." });
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    await db.updateOne("users", user.id, {
      resetToken: token,
      resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
    });
    res.json({ message: "تم إنشاء رمز إعادة التعيين.", token });
  } catch (e) {
    console.error("[forgot-password]", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body ?? {};
    if (!token || !newPassword) return res.status(400).json({ message: "الرمز وكلمة المرور الجديدة مطلوبان." });
    if (String(newPassword).length < 6) return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." });
    const users = await db.getAll("users");
    const user = users.find(u => u.resetToken === String(token).toUpperCase());
    if (!user) return res.status(400).json({ message: "الرمز غير صحيح أو منتهي الصلاحية." });
    if (new Date(user.resetTokenExpiry) < new Date())
      return res.status(400).json({ message: "انتهت صلاحية الرمز. يرجى طلب رمز جديد." });
    await db.updateOne("users", user.id, {
      passwordHash: hashPwd(newPassword),
      resetToken: null,
      resetTokenExpiry: null,
    });
    invalidateUserCache(user.id);
    res.json({ message: "تم تحديث كلمة المرور بنجاح." });
  } catch (e) {
    console.error("[reset-password]", e.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body ?? {};
  if (!credential) return res.status(400).json({ message: "Missing credential" });
  try {
    const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!tokenRes.ok) return res.status(401).json({ message: "Invalid Google token" });
    const payload = await tokenRes.json();
    if (!payload.email) return res.status(401).json({ message: "Could not retrieve email from Google" });
    const users = await db.getAll("users");
    let user = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) {
      user = {
        id: randomUUID(), fullName: payload.name || payload.email,
        email: payload.email.toLowerCase(), phone: "", passwordHash: null,
        provider: "google", plan: "free", role: "individual", status: "active",
        createdAt: new Date().toISOString(),
      };
      await db.insert("users", user);
    }
    const { passwordHash: _ph, ...safe } = user;
    res.json({ message: "Signed in with Google successfully!", user: safe, token: user.id });
  } catch { res.status(500).json({ message: "Google authentication failed" }); }
});

// ─── Me ───────────────────────────────────────────────────────────────────────
app.get("/api/me", requireUser, (req, res) => {
  const { passwordHash: _ph, ...safe } = req.user;
  res.json(safe);
});

app.patch("/api/me", requireUser, async (req, res) => {
  try {
    const updates = {};
    if (req.body.fullName !== undefined) updates.fullName = req.body.fullName;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.company !== undefined) updates.company = req.body.company;
    updates.updatedAt = new Date().toISOString();
    const updated = await db.updateOne("users", req.user.id, updates);
    if (!updated) return res.status(404).json({ message: "User not found" });
    invalidateUserCache(req.user.id);
    const { passwordHash: _ph, ...safe } = updated;
    res.json(safe);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Saved Listings ───────────────────────────────────────────────────────────
app.get("/api/me/saved", requireUser, async (req, res) => {
  try { const all = await db.getObj("saved"); res.json(all[req.user.id] || []); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/me/saved", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("saved");
    all[req.user.id] = Array.isArray(req.body) ? req.body : [];
    await db.setObj("saved", all);
    res.json(all[req.user.id]);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Inquiries / CRM ─────────────────────────────────────────────────────────
app.get("/api/me/inquiries", requireUser, async (req, res) => {
  try {
    const all = await db.getAll("inquiries");
    const result = req.user.role === "individual"
      ? all.filter(i => i.fromUserId === req.user.id)
      : all.filter(i => i.toRole === req.user.role || i.toUserId === req.user.id);
    res.json(result);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/me/inquiries", requireUser, async (req, res) => {
  try {
    const { propertyId = "", message = "", toRole = "broker" } = req.body || {};
    if (!message) return res.status(400).json({ message: "Message required" });
    const entry = {
      id: randomUUID(), fromUserId: req.user.id, fromName: req.user.fullName,
      fromEmail: req.user.email, propertyId, message, toRole, status: "new",
      createdAt: new Date().toISOString(),
    };
    await db.insert("inquiries", entry);
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/me/inquiries/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getAll("inquiries");
    const item = all.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (req.body.status) item.status = req.body.status;
    if (req.body.crmStatus) item.crmStatus = req.body.crmStatus;
    if (req.body.followUpDate !== undefined) item.followUpDate = req.body.followUpDate;
    if (req.body.source) item.source = req.body.source;
    if (req.body.note) {
      if (!item.notes) item.notes = [];
      item.notes.push({ id: randomUUID(), text: req.body.note, authorName: req.user.fullName, createdAt: new Date().toISOString() });
    }
    item.updatedAt = new Date().toISOString();
    await db.replaceAll("inquiries", all);
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/me/leads/export", requireUser, async (req, res) => {
  try {
    if (!["broker", "developer", "admin"].includes(req.user.role))
      return res.status(403).json({ message: "Only brokers and developers can export leads." });
    const all = await db.getAll("inquiries");
    const leads = all.filter(i => i.toRole === req.user.role || i.toUserId === req.user.id);
    const esc = v => `"${String(v || "").replace(/"/g, '""')}"`;
    const header = ["ID", "Name", "Email", "Property", "Message", "Status", "CRM Status", "Follow-up", "Notes", "Created"].join(",");
    const rows = leads.map(l => [l.id, esc(l.fromName), esc(l.fromEmail), l.propertyId || "", esc(l.message), l.status || "", l.crmStatus || "", l.followUpDate || "", esc((l.notes || []).map(n => n.text).join(" | ")), l.createdAt || ""].join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.csv"`);
    res.send([header, ...rows].join("\n"));
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── User Listings ────────────────────────────────────────────────────────────
app.get("/api/me/listings", requireUser, async (req, res) => {
  try { res.json((await db.getAll("user-listings")).filter(l => l.ownerId === req.user.id)); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/me/listings", requireUser, async (req, res) => {
  try {
    const {
      title, titleAr = "", summary = "", summaryAr = "", location, locationAr = "",
      price, type = "apartment", listingType = "sale", description = "", descriptionAr = "",
      bedrooms = 0, bathrooms = 0, size = "", status = "For Sale",
      imageUrl = "", images = [], ownerPhone = "", tags = [],
      whatsappPhone = "", email = "", governorate = "", area = "", address = "",
      lat = null, lng = null, floor = "", finishing = "", furnishing = "",
      pricePerMeter = "", installmentAvailable = false, downPayment = "", maintenanceFees = "",
      videoUrl = "", seoImage = "", seoTitle = "", seoDescription = "", seoKeywords = "", canonicalUrl = "",
      featured = false,
    } = req.body || {};
    if (!title || !price) return res.status(400).json({ message: "Title and price are required." });
    const all = await db.getAll("user-listings");
    if (!["developer", "admin"].includes(req.user.role)) {
      const mine = all.filter(l => l.ownerId === req.user.id && l.approvalStatus !== "rejected");
      const limit = PLAN_LIMITS[req.user.plan || "free"] ?? 1;
      if (mine.length >= limit)
        return res.status(403).json({ message: `Your plan allows up to ${limit} listing${limit !== 1 ? "s" : ""}. Upgrade to add more.`, limitReached: true, limit, current: mine.length });
    }
    const entry = {
      id: randomUUID(), ownerId: req.user.id, ownerName: req.user.fullName,
      ownerPhone: ownerPhone || req.user.phone || "", ownerRole: req.user.role,
      title, titleAr, summary, summaryAr, location, locationAr, price, type, listingType,
      description, descriptionAr, bedrooms: Number(bedrooms) || 0, bathrooms: Number(bathrooms) || 0,
      size, floor, finishing, furnishing, status,
      imageUrl, images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      whatsappPhone, email, governorate, area, address,
      lat: lat !== null ? (Number(lat) || null) : null,
      lng: lng !== null ? (Number(lng) || null) : null,
      pricePerMeter, installmentAvailable: !!installmentAvailable, downPayment, maintenanceFees,
      videoUrl, seoImage, seoTitle, seoDescription, seoKeywords, canonicalUrl,
      featured: !!featured, isPaused: false, approvalStatus: "pending",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await db.insert("user-listings", entry);
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/me/listings/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getAll("user-listings");
    const item = all.find(l => l.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.ownerId !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const ALLOWED = ["title", "titleAr", "summary", "summaryAr", "location", "locationAr", "price", "type", "listingType", "description", "descriptionAr", "status", "bedrooms", "bathrooms", "size", "imageUrl", "images", "tags", "ownerPhone", "whatsappPhone", "email", "governorate", "area", "address", "lat", "lng", "floor", "finishing", "furnishing", "pricePerMeter", "installmentAvailable", "downPayment", "maintenanceFees", "videoUrl", "seoImage", "seoTitle", "seoDescription", "seoKeywords", "canonicalUrl", "featured", "isPaused"];
    for (const k of ALLOWED) { if (req.body[k] !== undefined) item[k] = req.body[k]; }
    item.updatedAt = new Date().toISOString();
    await db.replaceAll("user-listings", all);
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/me/listings/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getAll("user-listings");
    const item = all.find(l => l.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.ownerId !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    await db.replaceAll("user-listings", all.filter(l => l.id !== req.params.id));
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Developer Projects ───────────────────────────────────────────────────────
app.get("/api/me/projects", requireUser, async (req, res) => {
  try { res.json((await db.getAll("projects")).filter(p => p.developerId === req.user.id)); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/me/projects", requireUser, async (req, res) => {
  try {
    if (!["developer", "admin"].includes(req.user.role))
      return res.status(403).json({ message: "Only developers can create projects." });
    const { name, location, units = 0, status = "planning", deliveryDate = "" } = req.body || {};
    if (!name) return res.status(400).json({ message: "Name is required." });
    const entry = { id: randomUUID(), developerId: req.user.id, developerName: req.user.fullName, name, location, units: Number(units) || 0, status, deliveryDate, soldUnits: 0, createdAt: new Date().toISOString() };
    await db.insert("projects", entry);
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/me/projects/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getAll("projects");
    const item = all.find(p => p.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.developerId !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    for (const k of ["name", "location", "units", "status", "deliveryDate", "soldUnits"])
      if (req.body[k] !== undefined) item[k] = req.body[k];
    await db.replaceAll("projects", all);
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/me/projects/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getAll("projects");
    const item = all.find(p => p.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.developerId !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    await db.replaceAll("projects", all.filter(p => p.id !== req.params.id));
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Saved Searches ───────────────────────────────────────────────────────────
app.get("/api/me/saved-searches", requireUser, async (req, res) => {
  try { const all = await db.getObj("saved-searches"); res.json(all[req.user.id] || []); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/me/saved-searches", requireUser, async (req, res) => {
  try {
    const { name, filters, alertFrequency = "instant" } = req.body || {};
    if (!name || !filters) return res.status(400).json({ message: "Name and filters required" });
    const all = await db.getObj("saved-searches");
    const list = all[req.user.id] || [];
    if (list.find(s => s.name.toLowerCase() === name.toLowerCase()))
      return res.status(409).json({ message: "A saved search with this name already exists." });
    const entry = { id: randomUUID(), name, filters, alertFrequency, paused: false, matchCount: 0, createdAt: new Date().toISOString() };
    list.push(entry);
    all[req.user.id] = list.slice(-20);
    await db.setObj("saved-searches", all);
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/me/saved-searches/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("saved-searches");
    const list = all[req.user.id] || [];
    const item = list.find(s => s.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (req.body.name !== undefined) item.name = req.body.name;
    if (req.body.alertFrequency !== undefined) item.alertFrequency = req.body.alertFrequency;
    if (req.body.paused !== undefined) item.paused = !!req.body.paused;
    if (req.body.filters !== undefined) item.filters = req.body.filters;
    item.updatedAt = new Date().toISOString();
    all[req.user.id] = list;
    await db.setObj("saved-searches", all);
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/me/saved-searches/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("saved-searches");
    all[req.user.id] = (all[req.user.id] || []).filter(s => s.id !== req.params.id);
    await db.setObj("saved-searches", all);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Notifications ────────────────────────────────────────────────────────────
app.get("/api/me/notifications", requireUser, async (req, res) => {
  try { const all = await db.getObj("server-notifications"); res.json(all[req.user.id] || []); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/me/notifications/:id/read", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("server-notifications");
    const n = (all[req.user.id] || []).find(x => x.id === req.params.id);
    if (n) { n.read = true; n.openedAt = new Date().toISOString(); }
    await db.setObj("server-notifications", all);
    res.json({ ok: true });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/me/notifications/read-all", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("server-notifications");
    all[req.user.id] = (all[req.user.id] || []).map(n => ({ ...n, read: true }));
    await db.setObj("server-notifications", all);
    res.json({ ok: true });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/me/notifications/:id", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("server-notifications");
    all[req.user.id] = (all[req.user.id] || []).filter(n => n.id !== req.params.id);
    await db.setObj("server-notifications", all);
    res.json({ ok: true });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Alert Settings ───────────────────────────────────────────────────────────
app.get("/api/me/alert-settings", requireUser, async (req, res) => {
  try { const all = await db.getObj("alert-settings"); res.json(all[req.user.id] || { emailFrequency: "instant", inApp: true }); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/me/alert-settings", requireUser, async (req, res) => {
  try {
    const all = await db.getObj("alert-settings");
    all[req.user.id] = { ...(all[req.user.id] || {}), ...(req.body || {}) };
    await db.setObj("alert-settings", all);
    res.json(all[req.user.id]);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Public Listings ──────────────────────────────────────────────────────────
app.get("/api/listings", cache(30), async (_req, res) => {
  try { res.json((await db.getAll("user-listings")).filter(l => l.approvalStatus === "approved")); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/listings/:id", async (req, res) => {
  try {
    const item = (await db.getAll("user-listings")).find(l => l.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Property Views ───────────────────────────────────────────────────────────
app.post("/api/properties/:id/view", async (req, res) => {
  try { res.json({ views: await db.incrementView(req.params.id) }); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/properties/views", async (_req, res) => {
  try { res.json(await db.getObj("views")); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/properties/:id/views", async (req, res) => {
  try { const v = await db.getObj("views"); res.json({ views: v[req.params.id] || 0 }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Reel Requests ────────────────────────────────────────────────────────────
app.post("/api/reel-request", async (req, res) => {
  try {
    const { name, email, reason } = req.body ?? {};
    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });
    const entry = { id: randomUUID(), name, email, reason, status: "pending", createdAt: new Date().toISOString() };
    await db.insert("reel-requests", entry);
    res.json({ message: "Request submitted. We'll review and contact you." });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── SEO ──────────────────────────────────────────────────────────────────────
const DEFAULT_SEO = {
  home: { title: "أصولك — وساطة عقارية فاخرة في مصر", description: "اكتشف العقارات المميزة والمجمعات والوكالات في مصر.", keywords: "عقارات, مصر, شراء, إيجار, استثمار" },
  explore: { title: "استكشف العقارات — أصولك", description: "تصفح آلاف العقارات المتاحة للبيع والإيجار في مصر.", keywords: "استكشف عقارات, بحث عقاري, مصر" },
  articles: { title: "مقالات عقارية — أصولك", description: "دليل شامل للمشترين والمستثمرين في السوق العقاري المصري.", keywords: "مقالات عقارية, استثمار" },
  faqs: { title: "أسئلة شائعة — أصولك", description: "إجابات على أكثر الأسئلة شيوعاً حول العقارات في مصر.", keywords: "أسئلة, عقارات, مصر" },
  agencies: { title: "وكالات عقارية — أصولك", description: "تواصل مع أفضل وكالات العقارات في مصر.", keywords: "وكالات عقارية, وسطاء, مصر" },
  packages: { title: "باقات الإدراج — أصولك", description: "اختر الباقة المناسبة لظهورك العقاري.", keywords: "باقات, تسعير, إدراج عقاري" },
};
app.get("/api/seo", cache(60), async (_req, res) => {
  try {
    const stored = await db.getObj("seo");
    const merged = {};
    for (const p of Object.keys(DEFAULT_SEO)) merged[p] = { ...DEFAULT_SEO[p], ...(stored[p] || {}) };
    for (const p of Object.keys(stored)) { if (!merged[p]) merged[p] = stored[p]; }
    res.json(merged);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/seo/:page", async (req, res) => {
  try {
    const stored = await db.getObj("seo");
    res.json({ ...(DEFAULT_SEO[req.params.page] || {}), ...(stored[req.params.page] || {}) });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Public Projects ──────────────────────────────────────────────────────────
app.get("/api/projects", cache(60), async (_req, res) => {
  try {
    res.json((await db.getAll("public-projects"))
      .filter(p => !p.publishStatus || p.publishStatus === "published")
      .sort((a, b) => (a.order || 0) - (b.order || 0)));
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/projects/:id", async (req, res) => {
  try {
    const item = (await db.getAll("public-projects")).find(p => p.id === req.params.id || p.slug === req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Articles ─────────────────────────────────────────────────────────────────
app.get("/api/articles", async (req, res) => {
  try {
    const articles = await db.getAll("articles");
    res.json(req.query.status ? articles.filter(a => a.status === req.query.status) : articles);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/articles/:id", async (req, res) => {
  try {
    const a = (await db.getAll("articles")).find(x => x.id === req.params.id || x.slug === req.params.id);
    if (!a) return res.status(404).json({ message: "Article not found" });
    res.json(a);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── FAQs ─────────────────────────────────────────────────────────────────────
app.get("/api/faqs", async (_req, res) => {
  try { res.json(await db.getAll("faqs")); } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Site Settings ────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  brandName: "Osoulk", tagline: "Egypt's premium real estate platform",
  contactPhone: "+201025812666", contactEmail: "hello@osoulk.com",
  whatsappNumber: "+201025812666", address: "Cairo, Egypt",
  logo: { url: "", title: "Osoulk", titleAr: "أصولك", altText: "Osoulk real estate logo", altTextAr: "شعار أصولك للعقارات", caption: "", captionAr: "", description: "" },
  socials: { facebook: "", instagram: "", youtube: "", linkedin: "", tiktok: "" },
  hero: { kicker: "The premium real-estate platform in Egypt", title: "Find your dream property in Egypt.", subtitle: "A premium real-estate experience for buyers, sellers, agencies and investors.", kickerAr: "المنصة العقارية الفاخرة في مصر", titleAr: "اعثر على عقار أحلامك في مصر.", subtitleAr: "تجربة عقارية فاخرة للمشترين والبائعين والوكالات والمستثمرين." },
  heroSlides: [],
  promoBar: { enabled: true, text: "Limited offer — start now and get better real-estate results.", textAr: "عرض محدود — ابدأ الآن وحقق نتائج عقارية أفضل." },
  features: { googleSignIn: true, newsletter: true, reels: true, brokerSignup: true, developerSignup: true },
  theme: { accent: "gold", primaryColor: "#061E46", secondaryColor: "#22c4b7", ctaColor: "#c9a227", navbarBg: "#ffffff", navbarText: "#061E46", footerBg: "#061E46", footerText: "#ffffff", cardBg: "#ffffff", inputBg: "#f4f5f6" },
  analytics: { gaTrackingId: "", enabled: false },
};
app.get("/api/site-settings", cache(60), async (_req, res) => {
  try { res.json(deepMerge(DEFAULT_SETTINGS, await db.getObj("site-settings"))); }
  catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Content Sections ─────────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id: "hero", label: "Hero", visible: true, order: 1 },
  { id: "properties", label: "Featured Properties", visible: true, order: 2 },
  { id: "features", label: "Features Strip", visible: true, order: 3 },
  { id: "launches", label: "New Launches", visible: true, order: 4 },
  { id: "buy", label: "Buy with Confidence", visible: true, order: 5 },
  { id: "trust", label: "Trust / Stats", visible: true, order: 6 },
  { id: "articles", label: "Editorial Articles", visible: true, order: 7 },
  { id: "consultation", label: "Consultation Form", visible: true, order: 8 },
  { id: "appCta", label: "Mobile App CTA", visible: true, order: 9 },
  { id: "faq", label: "FAQ Preview", visible: true, order: 10 },
];
async function getMergedSections() {
  const stored = await db.getAll("sections");
  if (!stored.length) return DEFAULT_SECTIONS;
  const byId = Object.fromEntries(stored.map(s => [s.id, s]));
  return DEFAULT_SECTIONS.map(d => byId[d.id] ? { ...d, ...byId[d.id] } : d).sort((a, b) => a.order - b.order);
}
app.get("/api/sections", cache(30), async (_req, res) => {
  try { res.json(await getMergedSections()); } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Text Content ─────────────────────────────────────────────────────────────
const DEFAULT_TEXT_CONTENT = {
  hero: { kicker: "المنصة العقارية الفاخرة في مصر", title: "اعثر على عقار أحلامك في مصر.", subtitle: "تجربة عقارية فاخرة للمشترين والبائعين والوكالات والمستثمرين.", ctaPrimary: "استكشف العقارات", ctaSecondary: "احصل على استشارة" },
  navbar: { explore: "استكشف", sell: "بيع", reels: "فيديوهات", agencies: "وكالات", packages: "الباقات", about: "عن أصولك", contact: "تواصل معنا", addProperty: "أضف عقارك" },
  footer: { tagline: "منصة أصولك — وساطة عقارية فاخرة في مصر", copy: "© 2026 أصولك. جميع الحقوق محفوظة." },
  trust: { stat1Label: "عقار مدرج", stat2Label: "وكالة موثوقة", stat3Label: "صفقة ناجحة", stat4Label: "مستخدم مسجل" },
  cta: { packages: "اختر باقتك", packagesDesc: "باقات مرنة للأفراد والوسطاء والمطورين", register: "إنشاء حساب", login: "تسجيل الدخول" },
};
app.get("/api/text-content", async (_req, res) => {
  try { res.json(deepMerge(DEFAULT_TEXT_CONTENT, await db.getObj("text-content"))); }
  catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/section-seo", async (_req, res) => {
  try { res.json(await db.getObj("section-seo")); } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/html-snippets", cache(60), async (_req, res) => {
  try { res.json((await db.getAll("html-snippets")).filter(s => s.enabled !== false)); }
  catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/pages", cache(60), async (_req, res) => {
  try { res.json((await db.getAll("pages")).filter(p => p.publishStatus === "published")); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/pages/:slug", async (req, res) => {
  try {
    const item = (await db.getAll("pages")).find(p => p.slug === req.params.slug || p.id === req.params.slug);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/viewings", async (req, res) => {
  try {
    const { propertyId, propertyTitle, name, phone, date, time, notes, contactPhone } = req.body ?? {};
    if (!propertyId || !name || !phone || !date)
      return res.status(400).json({ message: "Missing required fields" });
    const entry = { id: randomUUID(), propertyId: String(propertyId), propertyTitle: String(propertyTitle ?? ""), name: String(name), phone: String(phone), date: String(date), time: String(time ?? "10:00"), notes: String(notes ?? ""), contactPhone: String(contactPhone ?? ""), status: "pending", createdAt: new Date().toISOString() };
    await db.insert("viewings", entry);
    res.json({ message: "Viewing request received", id: entry.id });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ─── Standalone HTML pages ────────────────────────────────────────────────────
app.get("/p/:slug", async (req, res) => {
  try {
    const pages = await db.getAll("pages");
    const page = pages.find(p => p.slug === req.params.slug);
    if (!page || page.publishStatus !== "published") {
      return res.status(404).type("html").send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>404</title></head><body style="font-family:system-ui;text-align:center;padding:4rem"><h1>404 — الصفحة غير موجودة</h1><a href="/">العودة للرئيسية</a></body></html>`);
    }
    const rawHtml = page.bodyCode || page.content || "";
    if (/^\s*<!doctype/i.test(rawHtml) || /^\s*<html/i.test(rawHtml))
      return res.type("html").send(rawHtml);
    const title = page.seoTitle || page.titleAr || page.title || "أصولك";
    const desc = (page.seoDescription || "").replace(/"/g, "&quot;");
    res.type("html").send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${desc}"><title>${title}</title>${page.headCode || ""}</head><body>${rawHtml}</body></html>`);
  } catch { res.status(500).type("html").send("<h1>Server error</h1>"); }
});

// ─── Sitemap & Robots ─────────────────────────────────────────────────────────
const STATIC_ROUTES = ["/", "/explore", "/agencies", "/packages", "/about", "/contact", "/reels", "/sell", "/faqs", "/articles", "/estimator"];
const PROPERTY_IDS = ["ahel-masr-walkway", "green5-north", "nakheel-compound", "lamirada-duplex", "l010-142", "l010-b14", "standalone-villa", "tayba-garden", "beit-alwatan-6oct"];
const AGENCY_IDS = ["ras-el-hekma", "97-hills", "blanca-gardens", "solana-east"];

app.get("/sitemap.xml", (_req, res) => {
  const base = process.env.SITE_URL || "https://osoulk.com";
  const now = new Date().toISOString().slice(0, 10);
  const urls = [
    ...STATIC_ROUTES.map(r => ({ loc: `${base}${r}`, priority: r === "/" ? "1.0" : "0.8", changefreq: "weekly" })),
    ...PROPERTY_IDS.map(id => ({ loc: `${base}/properties/${id}`, priority: "0.9", changefreq: "weekly" })),
    ...AGENCY_IDS.map(id => ({ loc: `${base}/agencies/${id}`, priority: "0.7", changefreq: "monthly" })),
  ];
  res.setHeader("Content-Type", "application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${now}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join("\n")}\n</urlset>`);
});
app.get("/robots.txt", (_req, res) => {
  const base = process.env.SITE_URL || "https://osoulk.com";
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /dashboard\n\nSitemap: ${base}/sitemap.xml\n`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/api/admin/activity-log", requireAdmin, async (_req, res) => {
  try { res.json((await db.getAll("activity-log")).slice(0, 500)); } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/server/logs", requireAdmin, (_req, res) => res.json([...LOG_RING].reverse().slice(0, 200)));

app.get("/api/db-status", requireAdmin, async (_req, res) => {
  if (!db.isMysql && !db.isPg) return res.json({ mode: "json-files", connected: true });
  const mode = db.isMysql ? "mysql" : "postgresql";
  const t0 = Date.now();
  try {
    if (db.isMysql) { const c = await getPool().getConnection(); await c.ping(); c.release(); }
    else { const c = await getPgPool().connect(); await c.query("SELECT 1"); c.release(); }
    res.json({ mode, connected: true, latencyMs: Date.now() - t0 });
  } catch (e) { res.json({ mode, connected: false, error: e.message }); }
});

app.get("/api/subscribers", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("subscribers")); } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/users", requireAdmin, async (_req, res) => {
  try { res.json((await db.getAll("users")).map(({ passwordHash: _, ...u }) => u)); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    const updates = {};
    for (const f of ["plan", "status", "fullName", "phone", "company", "planExpiry", "featuredListings"]) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (req.body.role !== undefined) updates.role = normalizeRole(req.body.role);
    if (req.body.isFree !== undefined) updates.isFree = !!req.body.isFree;
    if (req.body.featuredListings !== undefined) updates.featuredListings = Number(req.body.featuredListings) || 0;
    updates.updatedAt = new Date().toISOString();
    const updated = await db.updateOne("users", req.params.id, updates);
    if (!updated) return res.status(404).json({ message: "User not found" });
    invalidateUserCache(req.params.id);
    const { passwordHash: _, ...safe } = updated;
    res.json(safe);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    const users = await db.getAll("users");
    if (!users.find(u => u.id === req.params.id))
      return res.status(404).json({ message: "User not found" });
    await db.replaceAll("users", users.filter(u => u.id !== req.params.id));
    invalidateUserCache(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/admin/create-user", requireAdmin, async (req, res) => {
  try {
    const { fullName, email, phone = "", role = "individual", plan = "free", company = "", password: customPwd } = req.body ?? {};
    if (!fullName || !email) return res.status(400).json({ message: "Full name and email are required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "A valid email is required." });
    const users = await db.getAll("users");
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(409).json({ message: "An account with this email already exists." });
    const tempPassword = customPwd || Math.random().toString(36).slice(-8) + "A1!";
    const user = { id: randomUUID(), fullName, email: email.toLowerCase().trim(), phone, passwordHash: hashPwd(tempPassword), plan, role: normalizeRole(role), company, status: "active", createdByAdmin: true, createdAt: new Date().toISOString() };
    await db.insert("users", user);
    const { passwordHash: _, ...safe } = user;
    res.json({ message: "User created successfully.", user: safe, tempPassword });
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
  try {
    const users = await db.getAll("users");
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const newPwd = req.body.password || Math.random().toString(36).slice(-8) + "A1!";
    await db.updateOne("users", req.params.id, { passwordHash: hashPwd(newPwd), updatedAt: new Date().toISOString() });
    invalidateUserCache(req.params.id);
    res.json({ message: "Password reset successfully.", newPassword: newPwd });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/reel-requests", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("reel-requests")); } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/reel-requests/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("reel-requests");
    const r = all.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });
    r.status = req.body.status ?? r.status;
    r.updatedAt = new Date().toISOString();
    await db.replaceAll("reel-requests", all);
    res.json(r);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/reel-requests/:id", requireAdmin, async (req, res) => {
  try {
    await db.replaceAll("reel-requests", (await db.getAll("reel-requests")).filter(r => r.id !== req.params.id));
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/api/seo/:page", requireAdmin, async (req, res) => {
  try {
    const stored = await db.getObj("seo");
    stored[req.params.page] = { ...(stored[req.params.page] || {}), ...req.body, updatedAt: new Date().toISOString() };
    await db.setObj("seo", stored);
    bustCache("/api/seo");
    res.json(stored[req.params.page]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/seo", requireAdmin, async (req, res) => {
  try {
    const { page } = req.body ?? {};
    if (!page) return res.status(400).json({ message: "page key required" });
    const stored = await db.getObj("seo");
    if (!stored[page]) { stored[page] = { title: "", description: "", keywords: "", updatedAt: new Date().toISOString() }; await db.setObj("seo", stored); }
    bustCache("/api/seo");
    res.json(stored[page]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/seo/:page", requireAdmin, async (req, res) => {
  try {
    if (DEFAULT_SEO[req.params.page]) return res.status(400).json({ message: "Cannot delete built-in page" });
    const stored = await db.getObj("seo");
    delete stored[req.params.page];
    await db.setObj("seo", stored);
    bustCache("/api/seo");
    res.json({ ok: true });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/api/site-settings", requireAdmin, async (req, res) => {
  try {
    const stored = await db.getObj("site-settings");
    const merged = deepMerge(deepMerge(DEFAULT_SETTINGS, stored), req.body || {});
    merged.updatedAt = new Date().toISOString();
    await db.setObj("site-settings", merged);
    bustCache("/api/site-settings");
    res.json(merged);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/admin/sections", requireAdmin, async (_req, res) => {
  try { res.json(await getMergedSections()); } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/sections", requireAdmin, async (req, res) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : [];
    const stored = await db.getAll("sections");
    const byId = Object.fromEntries(stored.map(s => [s.id, s]));
    const valid = incoming.filter(s => s && typeof s.id === "string").map(s => ({ ...(byId[s.id] || {}), id: s.id, label: s.label || s.id, visible: !!s.visible, order: Number(s.order) || 0 }));
    await db.replaceAll("sections", valid);
    bustCache("/api/sections");
    res.json(valid);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/admin/sections/:id", requireAdmin, async (req, res) => {
  try {
    const stored = await db.getAll("sections");
    const byId = Object.fromEntries(stored.map(s => [s.id, s]));
    const defaults = DEFAULT_SECTIONS.find(d => d.id === req.params.id);
    if (!defaults) return res.status(404).json({ message: "Section not found" });
    const current = byId[req.params.id] || { ...defaults };
    const FIELDS = ["title", "titleAr", "subtitle", "subtitleAr", "body", "bodyAr", "ctaText", "ctaTextAr", "image", "seoTitle", "seoTitleAr", "seoDescription", "seoDescriptionAr", "seoKeywords", "seoKeywordsAr", "canonicalUrl", "ogImage"];
    const updated = { ...current };
    for (const k of FIELDS) { if (req.body[k] !== undefined) updated[k] = req.body[k]; }
    byId[req.params.id] = updated;
    await db.replaceAll("sections", DEFAULT_SECTIONS.map(d => byId[d.id] ? { ...d, ...byId[d.id] } : d));
    bustCache("/api/sections");
    res.json(updated);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/api/text-content", requireAdmin, async (req, res) => {
  try {
    const stored = await db.getObj("text-content");
    const merged = deepMerge(deepMerge(DEFAULT_TEXT_CONTENT, stored), req.body || {});
    merged.updatedAt = new Date().toISOString();
    await db.setObj("text-content", merged);
    res.json(merged);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/api/section-seo", requireAdmin, async (req, res) => {
  try { await db.setObj("section-seo", req.body || {}); res.json(req.body || {}); }
  catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/inquiries/all", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("inquiries")); } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/admin/email-queue", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("email-queue")); } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/analytics", requireAdmin, async (_req, res) => {
  try {
    const [users, inquiries, views, listings, allSearches, alertStats, sentAlerts] = await Promise.all([
      db.getAll("users"), db.getAll("inquiries"), db.getObj("views"),
      db.getAll("user-listings"), db.getObj("saved-searches"), db.getObj("alert-stats"), db.getObj("sent-alerts"),
    ]);
    const now = Date.now();
    const days30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(now - (29 - i) * 86400000); const ds = d.toISOString().slice(0, 10); return { label: `${d.getMonth() + 1}/${d.getDate()}`, users: users.filter(u => u.createdAt?.slice(0, 10) === ds).length }; });
    const leadsChart = Array.from({ length: 30 }, (_, i) => { const d = new Date(now - (29 - i) * 86400000); const ds = d.toISOString().slice(0, 10); return { label: `${d.getMonth() + 1}/${d.getDate()}`, leads: inquiries.filter(q => q.createdAt?.slice(0, 10) === ds).length }; });
    const topProperties = Object.entries(views).sort(([, a], [, b]) => b - a).slice(0, 8).map(([id, count]) => ({ id, views: count }));
    const planChart = Object.entries(users.reduce((acc, u) => { const p = u.plan || "free"; acc[p] = (acc[p] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
    const roleChart = Object.entries(users.reduce((acc, u) => { const r = u.role || "individual"; acc[r] = (acc[r] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
    const crmFunnel = ["new", "contacted", "interested", "viewing", "negotiation", "closed", "sold"].map(stage => ({ stage, count: inquiries.filter(q => (q.crmStatus || "new") === stage).length }));
    const listingStatus = { pending: listings.filter(l => l.approvalStatus === "pending").length, approved: listings.filter(l => l.approvalStatus === "approved").length, rejected: listings.filter(l => l.approvalStatus === "rejected").length };
    const totalSavedSearches = Object.values(allSearches).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
    const pausedSearches = Object.values(allSearches).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.filter(s => s.paused).length : 0), 0);
    const topSearchCombos = Object.entries(alertStats.searchNames || {}).sort(([, a], [, b]) => b - a).slice(0, 10).map(([combo, count]) => ({ combo, count }));
    const alertsChart = Array.from({ length: 30 }, (_, i) => { const d = new Date(now - (29 - i) * 86400000); const ds = d.toISOString().slice(0, 10); return { label: `${d.getMonth() + 1}/${d.getDate()}`, alerts: Object.values(sentAlerts).filter(ts => typeof ts === "string" && ts.slice(0, 10) === ds).length }; });
    res.json({ userGrowth: days30, leadsChart, topProperties, planChart, roleChart, crmFunnel, listingStatus, savedSearchAnalytics: { total: totalSavedSearches, paused: pausedSearches, active: totalSavedSearches - pausedSearches, totalAlertsSent: alertStats.totalSent || 0, topSearchCombos, alertsChart }, totals: { users: users.length, leads: inquiries.length, listings: listings.length, totalViews: Object.values(views).reduce((a, b) => a + b, 0) } });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/listings/all", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("user-listings")); } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/admin/listings/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!["approved", "rejected", "pending"].includes(status))
      return res.status(400).json({ message: "Invalid status" });
    const updated = await db.updateOne("user-listings", req.params.id, { approvalStatus: status, updatedAt: new Date().toISOString() });
    if (!updated) return res.status(404).json({ message: "Not found" });
    bustCache("/api/listings");
    bustCache("/api/stats");
    res.json(updated);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/admin/listings/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("user-listings");
    const idx = all.findIndex(l => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    all[idx] = { ...all[idx], ...req.body, id: all[idx].id, images: Array.isArray(req.body.images) ? req.body.images : (all[idx].images || []), tags: Array.isArray(req.body.tags) ? req.body.tags : (all[idx].tags || []), updatedAt: new Date().toISOString() };
    await db.replaceAll("user-listings", all);
    res.json(all[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/projects/all", requireAdmin, async (_req, res) => { try { res.json(await db.getAll("projects")); } catch { res.status(500).json({ message: "Server error" }); } });
app.get("/api/admin/projects", requireAdmin, async (_req, res) => { try { res.json(await db.getAll("public-projects")); } catch { res.status(500).json({ message: "Server error" }); } });
app.post("/api/admin/projects", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("public-projects");
    const rawSlug = (req.body.slug || req.body.name || "project").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slug = all.find(p => p.slug === rawSlug) ? `${rawSlug}-${Date.now()}` : rawSlug;
    const entry = { id: randomUUID(), slug, name: req.body.name || "", nameAr: req.body.nameAr || "", developerName: req.body.developerName || "", developerNameAr: req.body.developerNameAr || "", logoUrl: req.body.logoUrl || "", heroImage: req.body.heroImage || "", gallery: req.body.gallery || [], description: req.body.description || "", descriptionAr: req.body.descriptionAr || "", location: req.body.location || "", locationAr: req.body.locationAr || "", governorate: req.body.governorate || "", address: req.body.address || "", lat: req.body.lat || null, lng: req.body.lng || null, priceFrom: req.body.priceFrom || "", priceTo: req.body.priceTo || "", status: req.body.status || "under-construction", deliveryDate: req.body.deliveryDate || "", totalUnits: Number(req.body.totalUnits) || 0, availableUnits: Number(req.body.availableUnits) || 0, amenities: req.body.amenities || [], amenitiesAr: req.body.amenitiesAr || [], featured: !!req.body.featured, publishStatus: req.body.publishStatus || "published", order: Number(req.body.order) || all.length, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.insert("public-projects", entry);
    bustCache("/api/projects");
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("public-projects");
    const idx = all.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    const FIELDS = ["name", "nameAr", "slug", "developerName", "developerNameAr", "logoUrl", "heroImage", "gallery", "description", "descriptionAr", "location", "locationAr", "governorate", "address", "lat", "lng", "priceFrom", "priceTo", "status", "deliveryDate", "totalUnits", "availableUnits", "amenities", "amenitiesAr", "featured", "publishStatus", "order"];
    for (const k of FIELDS) { if (req.body[k] !== undefined) all[idx][k] = req.body[k]; }
    all[idx].updatedAt = new Date().toISOString();
    await db.replaceAll("public-projects", all);
    bustCache("/api/projects");
    res.json(all[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/admin/projects/:id", requireAdmin, async (req, res) => {
  try {
    await db.replaceAll("public-projects", (await db.getAll("public-projects")).filter(p => p.id !== req.params.id));
    bustCache("/api/projects");
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/articles", requireAdmin, async (req, res) => {
  try {
    const { titleAr = "", slug = "", category = "", categoryAr = "", summary = "", summaryAr = "", content = "", contentAr = "", coverImage = "", status = "draft", featured = false, tags = [], seoTitle = "", seoTitleAr = "", seoDescription = "", seoDescriptionAr = "", seoKeywords = [], seoKeywordsAr = [], seoImage = "", canonicalUrl = "", canonicalUrlAr = "", slugAr = "" } = req.body ?? {};
    const title = req.body.title || titleAr || "";
    if (!title && !titleAr) return res.status(400).json({ message: "Title is required." });
    const articles = await db.getAll("articles");
    const baseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `article-${Date.now()}`;
    const uniqueSlug = articles.find(a => a.slug === baseSlug) ? `${baseSlug}-${Date.now()}` : baseSlug;
    const article = { id: randomUUID(), title, titleAr, slug: uniqueSlug, slugAr, category, categoryAr, summary, summaryAr, content, contentAr, coverImage, status, featured, tags, seoTitle: seoTitle || title, seoTitleAr: seoTitleAr || titleAr, seoDescription, seoDescriptionAr, seoKeywords, seoKeywordsAr, seoImage, canonicalUrl, canonicalUrlAr, readingTime: Math.ceil((content || contentAr).split(/\s+/).length / 200) || 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.insert("articles", article);
    res.json(article);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/articles/:id", requireAdmin, async (req, res) => {
  try {
    const articles = await db.getAll("articles");
    const idx = articles.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Article not found" });
    articles[idx] = { ...articles[idx], ...req.body, id: articles[idx].id, createdAt: articles[idx].createdAt, updatedAt: new Date().toISOString(), readingTime: Math.ceil((req.body.content || articles[idx].content || "").split(/\s+/).length / 200) || 1 };
    await db.replaceAll("articles", articles);
    res.json(articles[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/articles/:id", requireAdmin, async (req, res) => {
  try { await db.replaceAll("articles", (await db.getAll("articles")).filter(a => a.id !== req.params.id)); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/faqs", requireAdmin, async (req, res) => {
  try {
    const { question = "", questionAr = "", answer = "", answerAr = "", category = "general", categoryAr = "", order = 0, seoTitle = "", seoTitleAr = "", seoDescription = "", seoDescriptionAr = "", seoKeywords = [], seoKeywordsAr = [], canonicalUrl = "", seoImage = "" } = req.body ?? {};
    if (!questionAr || !answerAr) return res.status(400).json({ message: "Arabic question and answer are required." });
    const faq = { id: randomUUID(), question, questionAr, answer, answerAr, category, categoryAr, order, seoTitle, seoTitleAr, seoDescription, seoDescriptionAr, seoKeywords, seoKeywordsAr, canonicalUrl, seoImage, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.insert("faqs", faq);
    res.json(faq);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/faqs/:id", requireAdmin, async (req, res) => {
  try {
    const faqs = await db.getAll("faqs");
    const idx = faqs.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "FAQ not found" });
    faqs[idx] = { ...faqs[idx], ...req.body, id: faqs[idx].id, updatedAt: new Date().toISOString() };
    await db.replaceAll("faqs", faqs);
    res.json(faqs[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/faqs/:id", requireAdmin, async (req, res) => {
  try { await db.replaceAll("faqs", (await db.getAll("faqs")).filter(f => f.id !== req.params.id)); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/admin/pages", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("pages")); } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/admin/pages", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("pages");
    const rawSlug = (req.body.slug || req.body.title || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || `page-${randomUUID().slice(0, 8)}`;
    if (all.find(p => p.slug === rawSlug)) return res.status(409).json({ message: "A page with this slug already exists." });
    const entry = { id: randomUUID(), slug: rawSlug, title: req.body.title || "", titleAr: req.body.titleAr || "", heroImage: req.body.heroImage || "", heroTitle: req.body.heroTitle || "", heroTitleAr: req.body.heroTitleAr || "", content: req.body.content || "", contentAr: req.body.contentAr || "", publishStatus: req.body.publishStatus || "draft", renderMode: req.body.renderMode || "cms", seoTitle: req.body.seoTitle || "", seoDescription: req.body.seoDescription || "", seoKeywords: req.body.seoKeywords || "", ogImage: req.body.ogImage || "", headCode: req.body.headCode || "", bodyCode: req.body.bodyCode || "", showInNav: Boolean(req.body.showInNav), showInMenu: Boolean(req.body.showInMenu), showInFooter: Boolean(req.body.showInFooter), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.insert("pages", entry);
    bustCache("/api/pages");
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/admin/pages/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("pages");
    const idx = all.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    for (const k of ["slug", "title", "titleAr", "heroImage", "heroTitle", "heroTitleAr", "content", "contentAr", "publishStatus", "renderMode", "seoTitle", "seoDescription", "seoKeywords", "ogImage", "headCode", "bodyCode", "showInNav", "showInMenu", "showInFooter"]) { if (req.body[k] !== undefined) all[idx][k] = req.body[k]; }
    all[idx].updatedAt = new Date().toISOString();
    await db.replaceAll("pages", all);
    bustCache("/api/pages");
    res.json(all[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/admin/pages/:id", requireAdmin, async (req, res) => {
  try {
    await db.replaceAll("pages", (await db.getAll("pages")).filter(p => p.id !== req.params.id));
    bustCache("/api/pages");
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/admin/viewings", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("viewings")); } catch { res.status(500).json({ message: "Server error" }); }
});
app.patch("/api/admin/viewings/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("viewings");
    const idx = all.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    if (req.body.status) all[idx].status = req.body.status;
    if (req.body.notes !== undefined) all[idx].adminNotes = req.body.notes;
    all[idx].updatedAt = new Date().toISOString();
    await db.replaceAll("viewings", all);
    res.json(all[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/admin/viewings/:id", requireAdmin, async (req, res) => {
  try { await db.replaceAll("viewings", (await db.getAll("viewings")).filter(v => v.id !== req.params.id)); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/admin/html-snippets", requireAdmin, async (_req, res) => {
  try { res.json(await db.getAll("html-snippets")); } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/admin/html-snippets", requireAdmin, async (req, res) => {
  try {
    const entry = { id: randomUUID(), name: req.body.name || "Snippet", html: req.body.html || "", placement: req.body.placement || "body-end", enabled: req.body.enabled !== false, createdAt: new Date().toISOString() };
    await db.insert("html-snippets", entry);
    bustCache("/api/html-snippets");
    res.json(entry);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/admin/html-snippets/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("html-snippets");
    const idx = all.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    for (const k of ["name", "html", "placement", "enabled"]) { if (req.body[k] !== undefined) all[idx][k] = req.body[k]; }
    await db.replaceAll("html-snippets", all);
    bustCache("/api/html-snippets");
    res.json(all[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/admin/html-snippets/:id", requireAdmin, async (req, res) => {
  try {
    await db.replaceAll("html-snippets", (await db.getAll("html-snippets")).filter(s => s.id !== req.params.id));
    bustCache("/api/html-snippets");
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/admin/upload-media", requireAdmin, (req, res) => {
  const { dataUrl, filename } = req.body ?? {};
  if (!dataUrl || !dataUrl.startsWith("data:")) return res.status(400).json({ message: "Invalid data URL" });
  try {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ message: "Malformed data URL" });
    const ext = matches[1].split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length > 5 * 1024 * 1024) return res.status(413).json({ message: "File exceeds 5 MB limit" });
    const mediaDir = join(__dirname, "..", "public", "media");
    if (!existsSync(mediaDir)) mkdirSync(mediaDir, { recursive: true });
    const safe = (filename || "upload").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const fname = `${safe}_${Date.now()}.${ext}`;
    writeFileSync(join(mediaDir, fname), buffer);
    res.json({ url: `/media/${fname}` });
  } catch { res.status(500).json({ message: "Upload failed" }); }
});
app.get("/api/admin/media", requireAdmin, async (_req, res) => {
  try {
    const [media, articles, pages, projects, userListings] = await Promise.all([
      db.getAll("media"), db.getAll("articles"), db.getAll("pages"), db.getAll("public-projects"), db.getAll("user-listings"),
    ]);
    const usedInMap = {};
    const push = (url, entry) => { if (!url) return; (usedInMap[url] = usedInMap[url] || []).push(entry); };
    articles.forEach(a => { push(a.coverImage, { type: "article", label: a.titleAr || a.title || "Article", id: a.id }); push(a.seoImage, { type: "article-seo", label: `SEO: ${a.titleAr || a.title}`, id: a.id }); });
    pages.forEach(p => { push(p.heroImage, { type: "page", label: `Page: ${p.titleAr || p.title || p.slug}`, id: p.id }); push(p.ogImage, { type: "page-og", label: `OG: ${p.titleAr || p.title || p.slug}`, id: p.id }); });
    projects.forEach(p => { push(p.heroImage, { type: "project", label: `Project: ${p.nameAr || p.name}`, id: p.id }); (p.gallery || []).forEach(url => push(url, { type: "project-gallery", label: `Gallery: ${p.nameAr || p.name}`, id: p.id })); });
    userListings.forEach(l => { push(l.imageUrl, { type: "listing", label: `Listing: ${l.title || "Untitled"}`, id: l.id }); (l.images || []).forEach(url => push(url, { type: "listing-gallery", label: `Gallery: ${l.title || "Untitled"}`, id: l.id })); });
    res.json(media.map(m => ({ ...m, usedIn: usedInMap[m.url] || [] })));
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/admin/media", requireAdmin, async (req, res) => {
  try {
    const { url, title, altText, caption, description, category, width, height } = req.body ?? {};
    if (!url) return res.status(400).json({ message: "url is required" });
    const item = { id: randomUUID(), url: url.trim(), title: title || "", altText: altText || "", caption: caption || "", description: description || "", category: category || "general", ...(width ? { width: Number(width) } : {}), ...(height ? { height: Number(height) } : {}), createdAt: new Date().toISOString() };
    const all = await db.getAll("media");
    all.unshift(item);
    await db.replaceAll("media", all);
    res.status(201).json(item);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/admin/media/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("media");
    const idx = all.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    all[idx] = { ...all[idx], ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    await db.replaceAll("media", all);
    res.json(all[idx]);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/admin/media/:id", requireAdmin, async (req, res) => {
  try {
    const all = await db.getAll("media");
    if (!all.find(m => m.id === req.params.id)) return res.status(404).json({ message: "Not found" });
    await db.replaceAll("media", all.filter(m => m.id !== req.params.id));
    res.json({ ok: true });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
process.on("uncaughtException", err => console.error("[server] uncaughtException:", err));
process.on("unhandledRejection", reason => console.error("[server] unhandledRejection:", reason));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[express error]", err?.message || err);
  if (!res.headersSent) res.status(500).json({ ok: false, error: "An unexpected error occurred." });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUP — DB first, then server
// ═══════════════════════════════════════════════════════════════════════════════
async function startServer() {
  // 1. Connect PostgreSQL first (if DATABASE_URL is set and no MySQL override)
  if (!process.env.DB_HOST && process.env.DATABASE_URL) {
    try {
      console.log("[pg] Connecting to PostgreSQL…");
      const pool = await initPgPool();
      if (pool) {
        setPgAvailable(true);
        console.log("[pg] Connected — adapter switched to PostgreSQL mode.");
        try { await ensurePgSchema(); }
        catch (e) { console.error("[pg] Schema init error (non-fatal):", e.message); }
      } else {
        console.error("[pg] Connection failed — falling back to JSON files.");
        startPgReconnectLoop(120_000);
      }
    } catch (e) {
      console.error("[pg] Startup error:", e.message);
      startPgReconnectLoop(120_000);
    }
  }

  // 2. Connect MySQL if DB_HOST is set
  if (process.env.DB_HOST) {
    try {
      const r = await testConnection(3, 2000);
      setDbAvailable(r.ok);
      if (r.ok) console.log("[mysql] Connected.");
      else { console.error("[mysql] Could not connect — falling back to JSON files."); startReconnectLoop(120_000); }
    } catch { setDbAvailable(false); startReconnectLoop(120_000); }
  }

  // 3. Attach frontend (production SPA or Vite dev middleware)
  if (!IS_SERVERLESS) {
    const DIST_CLIENT = join(__dirname, "..", "dist", "client");
    if (existsSync(DIST_CLIENT)) {
      app.use("/assets", express.static(join(DIST_CLIENT, "assets"), { immutable: true, maxAge: "1y" }));
      app.use(express.static(DIST_CLIENT, { index: false }));
      app.get(/(.*)/, (req, res, next) => {
        if (req.path.startsWith("/api/")) return next();
        res.sendFile(join(DIST_CLIENT, "index.html"));
      });
      console.log("[server] Serving production SPA from dist/client/");
    } else {
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
        app.use(vite.middlewares);
        console.log("[server] Vite dev middleware attached — frontend + API on port", process.env.PORT || 5000);
      } catch (e) {
        console.warn("[server] Could not attach Vite middleware:", e.message);
      }
    }

    // 4. Start listening
    const PORT = parseInt(process.env.PORT || "5000", 10);
    const server = app.listen(PORT, "0.0.0.0", () => {
      const mode = db.isMysql ? "MySQL" : db.isPg ? "PostgreSQL" : "JSON files";
      console.log(`[server] Osoulk running on http://0.0.0.0:${PORT} [mode: ${mode}]`);
      console.log(`[server] Admin password: ${process.env.ADMIN_PASSWORD ? "set via env" : "using default (osoulk2026)"}`);
    });
    server.timeout = 25_000;
    server.keepAliveTimeout = 30_000;
    server.headersTimeout = 31_000;
  }
}

startServer().catch(err => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Replit sends SIGTERM before killing the process on restarts/deploys.
// We drain open HTTP connections and close the PG pool cleanly.
async function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down gracefully…`);
  try {
    const pool = getPgPool();
    if (pool) await pool.end();
  } catch { /* ignore */ }
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

export default app;
