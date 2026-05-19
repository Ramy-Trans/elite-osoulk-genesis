-- ====================================================
-- EXTENSIONS
-- ====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================
-- ENUMS
-- ====================================================
DO $$ BEGIN
CREATE TYPE user_role AS ENUM ('user','owner','broker','developer','admin','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE user_plan AS ENUM ('free','basic','standard','broker','elite','developer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE listing_status AS ENUM ('sale','rent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE TYPE lead_stage AS ENUM ('new','contacted','interested','viewing','negotiation','closed','sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ====================================================
-- PROFILES
-- ====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  plan user_plan DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- MEDIA
-- ====================================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SEO
-- ====================================================
CREATE TABLE IF NOT EXISTS seo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_title TEXT,
  meta_description TEXT,
  slug TEXT UNIQUE,
  og_image_id UUID REFERENCES media(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- PAGES (FIXED body_code)
-- ====================================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  body_code TEXT,
  visibility TEXT DEFAULT 'public',
  seo_id UUID REFERENCES seo(id),
  featured_image_id UUID REFERENCES media(id),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- LISTINGS
-- ====================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  status listing_status DEFAULT 'sale',
  approval_status approval_status DEFAULT 'pending',
  price NUMERIC(15,2),
  location TEXT,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  area_size NUMERIC(10,2),
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  featured_image TEXT,
  views BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- CRM LEADS
-- ====================================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  stage lead_stage DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SAVED SEARCHES
-- ====================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_name TEXT,
  filters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- NOTIFICATIONS
-- ====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- AUTH TRIGGER
-- ====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================
-- ENABLE RLS
-- ====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- HELPER: ADMIN CHECK
-- ====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin','super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- PROFILES RLS
-- ====================================================
CREATE POLICY "own profile"
ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin());

CREATE POLICY "update profile"
ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin());

-- ====================================================
-- PAGES RLS (SAFE CMS)
-- ====================================================
CREATE POLICY "public pages"
ON pages FOR SELECT
USING (visibility = 'public');

CREATE POLICY "owner pages"
ON pages FOR SELECT
USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "insert pages"
ON pages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "update pages"
ON pages FOR UPDATE
USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "delete pages"
ON pages FOR DELETE
USING (created_by = auth.uid() OR is_admin());

-- ====================================================
-- LISTINGS RLS (NO LEAKS)
-- ====================================================
CREATE POLICY "public listings"
ON listings FOR SELECT
USING (approval_status = 'approved');

CREATE POLICY "owner listings"
ON listings FOR ALL
USING (owner_id = auth.uid() OR is_admin());

-- ====================================================
-- CRM LEADS RLS (STRICT PRIVATE)
-- ====================================================
CREATE POLICY "assigned leads"
ON crm_leads FOR SELECT
USING (assigned_to = auth.uid() OR is_admin());

CREATE POLICY "update leads"
ON crm_leads FOR UPDATE
USING (assigned_to = auth.uid() OR is_admin());

-- ====================================================
-- SAVED SEARCHES RLS
-- ====================================================
CREATE POLICY "own searches"
ON saved_searches FOR ALL
USING (user_id = auth.uid());

-- ====================================================
-- NOTIFICATIONS RLS
-- ====================================================
CREATE POLICY "own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "update notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid() OR is_admin());

-- ====================================================
-- INDEXES
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_crm_stage ON crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ====================================================
-- END FULL PRODUCTION SAAS
-- ====================================================