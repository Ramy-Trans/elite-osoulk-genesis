-- ====================================================
-- OSOULK — Fix listings table: add all missing columns
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: all use ADD COLUMN IF NOT EXISTS
-- ====================================================

-- Bilingual fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS title_ar          TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS summary           TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS summary_ar        TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description_ar    TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_ar       TEXT;

-- Type / category
ALTER TABLE listings ADD COLUMN IF NOT EXISTS type              TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type      TEXT;

-- Unit details
ALTER TABLE listings ADD COLUMN IF NOT EXISTS size              TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS floor             TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS finishing         TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS furnishing        TEXT;

-- Media
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url         TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS images            JSONB  DEFAULT '[]';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tags              JSONB  DEFAULT '[]';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS video_url         TEXT;

-- Contact
ALTER TABLE listings ADD COLUMN IF NOT EXISTS whatsapp_phone    TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS email             TEXT;

-- Location details
ALTER TABLE listings ADD COLUMN IF NOT EXISTS governorate       TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS area              TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS address           TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lat               NUMERIC(10,8);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lng               NUMERIC(11,8);

-- Financial extras
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_per_meter       TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS installment_available BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS down_payment          TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS maintenance_fees      TEXT;

-- Owner snapshot (denormalised for speed)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_name        TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_role        TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_phone       TEXT;

-- SEO per-listing
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_title         TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_description   TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_keywords      TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_image         TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS canonical_url     TEXT;

-- Status flags
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured          BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_paused         BOOLEAN DEFAULT FALSE;

-- ====================================================
-- Also create public_projects table if missing
-- (used by the Compounds / Projects admin section)
-- ====================================================
CREATE TABLE IF NOT EXISTS public_projects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                TEXT UNIQUE,
  name                TEXT,
  name_ar             TEXT,
  developer_name      TEXT,
  developer_name_ar   TEXT,
  logo_url            TEXT,
  developer_website   TEXT,
  hero_image          TEXT,
  gallery             JSONB   DEFAULT '[]',
  description         TEXT,
  description_ar      TEXT,
  location            TEXT,
  location_ar         TEXT,
  governorate         TEXT,
  address             TEXT,
  lat                 NUMERIC(10,8),
  lng                 NUMERIC(11,8),
  price_from          TEXT,
  price_to            TEXT,
  status              TEXT    DEFAULT 'available',
  delivery_date       TEXT,
  total_units         INT     DEFAULT 0,
  available_units     INT     DEFAULT 0,
  amenities           JSONB   DEFAULT '[]',
  amenities_ar        JSONB   DEFAULT '[]',
  featured            BOOLEAN DEFAULT FALSE,
  visibility          TEXT    DEFAULT 'draft',
  sort_order          INT     DEFAULT 0,
  broker_notes        TEXT,
  commission_notes    TEXT,
  seo_title           TEXT,
  seo_description     TEXT,
  seo_keywords        TEXT,
  seo_image           TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects: public read"  ON public_projects;
DROP POLICY IF EXISTS "projects: admin all"    ON public_projects;

CREATE POLICY "projects: public read"
ON public_projects FOR SELECT
USING (visibility = 'published');

CREATE POLICY "projects: admin all"
ON public_projects FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ====================================================
-- Indexes for new columns
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_listings_governorate ON listings(governorate);
CREATE INDEX IF NOT EXISTS idx_listings_type        ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_featured    ON listings(featured);

-- ====================================================
-- Done. Run SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'listings' ORDER BY ordinal_position;
-- to verify all columns were added.
-- ====================================================
