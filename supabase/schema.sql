-- ─── Osoulk Supabase Schema ───────────────────────────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- This creates all tables needed for the Osoulk platform.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users (public profile — separate from Supabase Auth) ────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT         NOT NULL DEFAULT '',
  email         TEXT         NOT NULL UNIQUE,
  phone         TEXT         DEFAULT '',
  role          TEXT         NOT NULL DEFAULT 'individual',
  plan          TEXT         NOT NULL DEFAULT 'free',
  status        TEXT         NOT NULL DEFAULT 'active',
  company       TEXT         DEFAULT '',
  provider      TEXT         DEFAULT 'email',
  free_package  BOOLEAN      DEFAULT FALSE,
  plan_expires_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Subscribers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT         NOT NULL UNIQUE,
  name          TEXT         DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Reel Requests ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reel_requests (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT         NOT NULL DEFAULT '',
  email         TEXT         NOT NULL DEFAULT '',
  phone         TEXT         DEFAULT '',
  property_id   TEXT         DEFAULT '',
  reason        TEXT         DEFAULT '',
  status        TEXT         NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── User Listings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_listings (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID         REFERENCES users(id) ON DELETE CASCADE,
  owner_name    TEXT         DEFAULT '',
  owner_role    TEXT         DEFAULT 'individual',
  owner_phone   TEXT         DEFAULT '',
  title         TEXT         NOT NULL DEFAULT '',
  title_ar      TEXT         DEFAULT '',
  summary       TEXT         DEFAULT '',
  summary_ar    TEXT         DEFAULT '',
  location      TEXT         DEFAULT '',
  location_ar   TEXT         DEFAULT '',
  price         TEXT         DEFAULT '',
  type          TEXT         DEFAULT '',
  listing_type  TEXT         DEFAULT 'sale',
  description   TEXT         DEFAULT '',
  description_ar TEXT        DEFAULT '',
  bedrooms      INT          DEFAULT 0,
  bathrooms     INT          DEFAULT 0,
  size          TEXT         DEFAULT '',
  floor         TEXT         DEFAULT '',
  finishing     TEXT         DEFAULT '',
  furnishing    TEXT         DEFAULT '',
  status        TEXT         DEFAULT 'available',
  image_url     TEXT         DEFAULT '',
  images        JSONB        DEFAULT '[]',
  tags          JSONB        DEFAULT '[]',
  whatsapp_phone TEXT        DEFAULT '',
  email         TEXT         DEFAULT '',
  governorate   TEXT         DEFAULT '',
  area          TEXT         DEFAULT '',
  address       TEXT         DEFAULT '',
  lat           FLOAT,
  lng           FLOAT,
  price_per_meter TEXT       DEFAULT '',
  installment_available BOOLEAN DEFAULT FALSE,
  down_payment  TEXT         DEFAULT '',
  maintenance_fees TEXT      DEFAULT '',
  video_url     TEXT         DEFAULT '',
  seo_image     TEXT         DEFAULT '',
  seo_title     TEXT         DEFAULT '',
  seo_description TEXT       DEFAULT '',
  seo_keywords  TEXT         DEFAULT '',
  canonical_url TEXT         DEFAULT '',
  approval_status TEXT       NOT NULL DEFAULT 'pending',
  featured      BOOLEAN      DEFAULT FALSE,
  is_paused     BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Developer Projects (user-owned) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dev_projects (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id  UUID         REFERENCES users(id) ON DELETE CASCADE,
  developer_name TEXT        DEFAULT '',
  name          TEXT         NOT NULL DEFAULT '',
  location      TEXT         DEFAULT '',
  units         INT          DEFAULT 0,
  sold_units    INT          DEFAULT 0,
  status        TEXT         DEFAULT 'active',
  delivery_date TEXT         DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Inquiries / CRM Leads ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id  UUID         REFERENCES users(id) ON DELETE SET NULL,
  from_name     TEXT         DEFAULT '',
  from_email    TEXT         DEFAULT '',
  property_id   TEXT         DEFAULT '',
  message       TEXT         DEFAULT '',
  to_role       TEXT         DEFAULT '',
  status        TEXT         DEFAULT 'open',
  crm_status    TEXT         DEFAULT 'new',
  follow_up_date DATE,
  source        TEXT         DEFAULT 'website',
  notes         JSONB        DEFAULT '[]',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Articles / Blog ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT         NOT NULL DEFAULT '',
  title_ar      TEXT         DEFAULT '',
  slug          TEXT         UNIQUE NOT NULL DEFAULT '',
  category      TEXT         DEFAULT '',
  category_ar   TEXT         DEFAULT '',
  summary       TEXT         DEFAULT '',
  summary_ar    TEXT         DEFAULT '',
  content       TEXT         DEFAULT '',
  content_ar    TEXT         DEFAULT '',
  cover_image   TEXT         DEFAULT '',
  status        TEXT         DEFAULT 'draft',
  featured      BOOLEAN      DEFAULT FALSE,
  tags          JSONB        DEFAULT '[]',
  seo_title     TEXT         DEFAULT '',
  seo_description TEXT       DEFAULT '',
  seo_keywords  JSONB        DEFAULT '[]',
  seo_image     TEXT         DEFAULT '',
  canonical_url TEXT         DEFAULT '',
  reading_time  INT          DEFAULT 0,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── FAQs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  question      TEXT         DEFAULT '',
  question_ar   TEXT         DEFAULT '',
  answer        TEXT         DEFAULT '',
  answer_ar     TEXT         DEFAULT '',
  category      TEXT         DEFAULT '',
  category_ar   TEXT         DEFAULT '',
  sort_order    INT          DEFAULT 0,
  seo_title     TEXT         DEFAULT '',
  seo_title_ar  TEXT         DEFAULT '',
  seo_description TEXT       DEFAULT '',
  seo_description_ar TEXT    DEFAULT '',
  seo_keywords  JSONB        DEFAULT '[]',
  seo_keywords_ar JSONB      DEFAULT '[]',
  canonical_url TEXT         DEFAULT '',
  seo_image     TEXT         DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Public Projects / Compounds ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_projects (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT         UNIQUE NOT NULL DEFAULT '',
  name          TEXT         DEFAULT '',
  name_ar       TEXT         DEFAULT '',
  developer_name TEXT        DEFAULT '',
  developer_name_ar TEXT     DEFAULT '',
  logo_url      TEXT         DEFAULT '',
  developer_website TEXT     DEFAULT '',
  hero_image    TEXT         DEFAULT '',
  gallery       JSONB        DEFAULT '[]',
  description   TEXT         DEFAULT '',
  description_ar TEXT        DEFAULT '',
  location      TEXT         DEFAULT '',
  location_ar   TEXT         DEFAULT '',
  governorate   TEXT         DEFAULT '',
  address       TEXT         DEFAULT '',
  lat           FLOAT,
  lng           FLOAT,
  price_from    TEXT         DEFAULT '',
  price_to      TEXT         DEFAULT '',
  status        TEXT         DEFAULT 'available',
  delivery_date TEXT         DEFAULT '',
  total_units   INT          DEFAULT 0,
  available_units INT        DEFAULT 0,
  amenities     JSONB        DEFAULT '[]',
  amenities_ar  JSONB        DEFAULT '[]',
  featured      BOOLEAN      DEFAULT FALSE,
  publish_status TEXT        DEFAULT 'draft',
  sort_order    INT          DEFAULT 0,
  broker_notes  TEXT         DEFAULT '',
  commission_notes TEXT      DEFAULT '',
  seo_title     TEXT         DEFAULT '',
  seo_description TEXT       DEFAULT '',
  seo_keywords  TEXT         DEFAULT '',
  seo_image     TEXT         DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── CMS Pages ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT         UNIQUE NOT NULL DEFAULT '',
  title         TEXT         DEFAULT '',
  title_ar      TEXT         DEFAULT '',
  hero_image    TEXT         DEFAULT '',
  hero_title    TEXT         DEFAULT '',
  hero_title_ar TEXT         DEFAULT '',
  content       TEXT         DEFAULT '',
  content_ar    TEXT         DEFAULT '',
  publish_status TEXT        DEFAULT 'draft',
  seo_title     TEXT         DEFAULT '',
  seo_description TEXT       DEFAULT '',
  seo_keywords  TEXT         DEFAULT '',
  og_image      TEXT         DEFAULT '',
  head_code     TEXT         DEFAULT '',
  body_code     TEXT         DEFAULT '',
  show_in_nav   BOOLEAN      DEFAULT FALSE,
  show_in_menu  BOOLEAN      DEFAULT FALSE,
  show_in_footer BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── HTML Snippets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS html_snippets (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT         DEFAULT '',
  html          TEXT         DEFAULT '',
  placement     TEXT         DEFAULT 'body-end',
  enabled       BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Media Gallery ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  url           TEXT         NOT NULL DEFAULT '',
  title         TEXT         DEFAULT '',
  alt_text      TEXT         DEFAULT '',
  caption       TEXT         DEFAULT '',
  description   TEXT         DEFAULT '',
  category      TEXT         DEFAULT '',
  width         INT,
  height        INT,
  used_in       JSONB        DEFAULT '[]',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Activity Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          TEXT         DEFAULT 'Access',
  event         TEXT         DEFAULT '',
  subject       TEXT         DEFAULT '',
  user_id       UUID,
  user_name     TEXT         DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Content Sections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
  id            TEXT         PRIMARY KEY,
  label         TEXT         DEFAULT '',
  visible       BOOLEAN      DEFAULT TRUE,
  sort_order    INT          DEFAULT 0,
  title         TEXT         DEFAULT '',
  title_ar      TEXT         DEFAULT '',
  subtitle      TEXT         DEFAULT '',
  subtitle_ar   TEXT         DEFAULT '',
  body          TEXT         DEFAULT '',
  body_ar       TEXT         DEFAULT '',
  cta_text      TEXT         DEFAULT '',
  cta_text_ar   TEXT         DEFAULT '',
  image         TEXT         DEFAULT '',
  seo_title     TEXT         DEFAULT '',
  seo_title_ar  TEXT         DEFAULT '',
  seo_description TEXT       DEFAULT '',
  seo_description_ar TEXT    DEFAULT '',
  seo_keywords  JSONB        DEFAULT '[]',
  seo_keywords_ar JSONB      DEFAULT '[]',
  canonical_url TEXT         DEFAULT '',
  og_image      TEXT         DEFAULT '',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Site Settings (single row KV) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id            INT          PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data          JSONB        NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── SEO Data ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo (
  page          TEXT         PRIMARY KEY,
  title         TEXT         DEFAULT '',
  description   TEXT         DEFAULT '',
  keywords      TEXT         DEFAULT '',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Property Views ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_views (
  property_id   TEXT         PRIMARY KEY,
  view_count    INT          NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Saved Searches ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT         DEFAULT '',
  filters       JSONB        DEFAULT '{}',
  alert_frequency TEXT       DEFAULT 'instant',
  paused        BOOLEAN      DEFAULT FALSE,
  match_count   INT          DEFAULT 0,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT         DEFAULT '',
  title         TEXT         DEFAULT '',
  body          TEXT         DEFAULT '',
  read          BOOLEAN      DEFAULT FALSE,
  property_id   TEXT         DEFAULT '',
  search_id     UUID,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  opened_at     TIMESTAMPTZ
);

-- ─── Text Content ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS text_content (
  id            INT          PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data          JSONB        NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Section SEO ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS section_seo (
  id            INT          PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data          JSONB        NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Public read for content tables
ALTER TABLE pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE html_snippets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_content   ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_seo    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon can read published content)
CREATE POLICY "public read pages"           ON pages           FOR SELECT USING (publish_status = 'published');
CREATE POLICY "public read articles"        ON articles        FOR SELECT USING (status = 'published');
CREATE POLICY "public read faqs"            ON faqs            FOR SELECT TO anon USING (true);
CREATE POLICY "public read public_projects" ON public_projects FOR SELECT USING (publish_status = 'published');
CREATE POLICY "public read html_snippets"   ON html_snippets   FOR SELECT USING (enabled = true);
CREATE POLICY "public read site_settings"   ON site_settings   FOR SELECT TO anon USING (true);
CREATE POLICY "public read seo"             ON seo             FOR SELECT TO anon USING (true);
CREATE POLICY "public read sections"        ON sections        FOR SELECT TO anon USING (true);
CREATE POLICY "public read text_content"    ON text_content    FOR SELECT TO anon USING (true);
CREATE POLICY "public read section_seo"     ON section_seo     FOR SELECT TO anon USING (true);
CREATE POLICY "public read property_views"  ON property_views  FOR SELECT TO anon USING (true);
CREATE POLICY "public read user_listings"   ON user_listings   FOR SELECT USING (approval_status = 'approved');
CREATE POLICY "public read media"           ON media           FOR SELECT TO anon USING (true);

-- Allow anon inserts for subscribe, reel requests, property views, inquiries
CREATE POLICY "anon insert subscribers"     ON subscribers     FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon insert reel_requests"   ON reel_requests   FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon upsert property_views"  ON property_views  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Users can read/update their own profile
CREATE POLICY "users read own"              ON users           FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "users update own"            ON users           FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "anon insert users"           ON users           FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users
CREATE POLICY "auth read own listings"      ON user_listings   FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = owner_id));
CREATE POLICY "auth insert listings"        ON user_listings   FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = owner_id));
CREATE POLICY "auth update listings"        ON user_listings   FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = owner_id));
CREATE POLICY "auth delete listings"        ON user_listings   FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = owner_id));

CREATE POLICY "auth read own inquiries"     ON inquiries       FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = from_user_id));
CREATE POLICY "auth insert inquiries"       ON inquiries       FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update own inquiries"   ON inquiries       FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = from_user_id));

CREATE POLICY "auth read own searches"      ON saved_searches  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "auth insert searches"        ON saved_searches  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "auth update own searches"    ON saved_searches  FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "auth delete own searches"    ON saved_searches  FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "auth read own notifications" ON notifications   FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "auth update own notifs"      ON notifications   FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));
CREATE POLICY "auth delete own notifs"      ON notifications   FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "auth read own projects"      ON dev_projects    FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = developer_id));
CREATE POLICY "auth insert projects"        ON dev_projects    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = developer_id));
CREATE POLICY "auth update own projects"    ON dev_projects    FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = developer_id));
CREATE POLICY "auth delete own projects"    ON dev_projects    FOR DELETE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = developer_id));

-- Insert site settings row if not exists
INSERT INTO site_settings (id, data) VALUES (1, '{"brandName":"Osoulk","tagline":"المنصة العقارية الفاخرة في مصر","contactPhone":"+201025812666","contactEmail":"","whatsappNumber":"+201025812666","address":"","socials":{"facebook":"","instagram":"","youtube":"","linkedin":"","tiktok":""},"hero":{"kicker":"","title":"","subtitle":"","kickerAr":"البحث الذكي","titleAr":"اعثر على عقار أحلامك في مصر","subtitleAr":"تجربة عقارية فاخرة للمشترين والبائعين والوكالات والمستثمرين"},"promoBar":{"enabled":true,"text":"","textAr":"عرض محدود — ابدأ الآن وحقق نتائج عقارية أفضل."},"features":{"googleSignIn":true,"newsletter":true,"reels":true,"brokerSignup":true,"developerSignup":true},"theme":{"accent":"#C9A84C"}}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO text_content (id, data) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;
INSERT INTO section_seo  (id, data) VALUES (1, '{}') ON CONFLICT (id) DO NOTHING;
