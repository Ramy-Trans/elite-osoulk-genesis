-- ====================================================
-- OSOULK — ROW LEVEL SECURITY POLICIES
-- Paste this into: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: all policies use DROP IF EXISTS first
-- ====================================================

-- ====================================================
-- HELPER: is_admin()
-- Returns true when the calling user has admin/super_admin role
-- ====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- ENABLE RLS (idempotent)
-- ====================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- DROP EXISTING POLICIES (clean slate)
-- ====================================================
DROP POLICY IF EXISTS "profiles: own read"       ON profiles;
DROP POLICY IF EXISTS "profiles: admin read"     ON profiles;
DROP POLICY IF EXISTS "profiles: own insert"     ON profiles;
DROP POLICY IF EXISTS "profiles: own update"     ON profiles;
DROP POLICY IF EXISTS "profiles: admin update"   ON profiles;

DROP POLICY IF EXISTS "pages: public read"       ON pages;
DROP POLICY IF EXISTS "pages: owner read"        ON pages;
DROP POLICY IF EXISTS "pages: insert"            ON pages;
DROP POLICY IF EXISTS "pages: owner update"      ON pages;
DROP POLICY IF EXISTS "pages: admin update"      ON pages;
DROP POLICY IF EXISTS "pages: owner delete"      ON pages;
DROP POLICY IF EXISTS "pages: admin delete"      ON pages;

-- legacy names from schema.sql
DROP POLICY IF EXISTS "public pages"   ON pages;
DROP POLICY IF EXISTS "owner pages"    ON pages;
DROP POLICY IF EXISTS "insert pages"   ON pages;
DROP POLICY IF EXISTS "update pages"   ON pages;
DROP POLICY IF EXISTS "delete pages"   ON pages;

DROP POLICY IF EXISTS "listings: public read"    ON listings;
DROP POLICY IF EXISTS "listings: owner all"      ON listings;
DROP POLICY IF EXISTS "listings: admin all"      ON listings;

-- legacy names
DROP POLICY IF EXISTS "public listings" ON listings;
DROP POLICY IF EXISTS "owner listings"  ON listings;

DROP POLICY IF EXISTS "crm_leads: assigned read"  ON crm_leads;
DROP POLICY IF EXISTS "crm_leads: assigned write" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads: admin all"      ON crm_leads;

-- legacy names
DROP POLICY IF EXISTS "assigned leads" ON crm_leads;
DROP POLICY IF EXISTS "update leads"   ON crm_leads;

DROP POLICY IF EXISTS "saved_searches: own all"  ON saved_searches;

-- legacy names
DROP POLICY IF EXISTS "own searches" ON saved_searches;

DROP POLICY IF EXISTS "notifications: own read"   ON notifications;
DROP POLICY IF EXISTS "notifications: own update" ON notifications;
DROP POLICY IF EXISTS "notifications: admin all"  ON notifications;

-- legacy names
DROP POLICY IF EXISTS "own notifications"    ON notifications;
DROP POLICY IF EXISTS "update notifications" ON notifications;

-- ====================================================
-- PROFILES
-- id = auth.uid() (profiles.id is the auth user id)
-- ====================================================

-- Any authenticated user can read their own profile; admins read all
CREATE POLICY "profiles: own read"
ON profiles FOR SELECT
USING (id = auth.uid() OR is_admin());

-- Trigger auto-inserts on signup — allow that insert
CREATE POLICY "profiles: own insert"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Users update their own profile; admins update any
CREATE POLICY "profiles: own update"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: admin update"
ON profiles FOR UPDATE
USING (is_admin());

-- ====================================================
-- PAGES
-- visibility: 'public' | 'published' | 'draft' | 'private'
-- created_by references profiles(id), nullable (admin-created pages may be NULL)
-- ====================================================

-- Anyone (even anon) can read publicly visible pages
CREATE POLICY "pages: public read"
ON pages FOR SELECT
USING (visibility IN ('public', 'published'));

-- Owners and admins can read any page (including drafts)
CREATE POLICY "pages: owner read"
ON pages FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (created_by = auth.uid() OR is_admin())
);

-- Any authenticated user can create a page
CREATE POLICY "pages: insert"
ON pages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Owners can update their own pages; admins can update any (incl. NULL created_by)
CREATE POLICY "pages: owner update"
ON pages FOR UPDATE
USING (created_by = auth.uid() OR created_by IS NULL OR is_admin())
WITH CHECK (created_by = auth.uid() OR created_by IS NULL OR is_admin());

-- Owners can delete their own pages; admins can delete any
CREATE POLICY "pages: owner delete"
ON pages FOR DELETE
USING (created_by = auth.uid() OR created_by IS NULL OR is_admin());

-- ====================================================
-- LISTINGS
-- owner_id references profiles(id)
-- approval_status: 'pending' | 'approved' | 'rejected'
-- ====================================================

-- Anyone can read approved listings
CREATE POLICY "listings: public read"
ON listings FOR SELECT
USING (approval_status = 'approved');

-- Owners see ALL their own listings (any approval_status)
CREATE POLICY "listings: owner all"
ON listings FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Admins have full access to all listings
CREATE POLICY "listings: admin all"
ON listings FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ====================================================
-- CRM LEADS
-- assigned_to references profiles(id)
-- ====================================================

-- Users see only leads assigned to them; admins see all
CREATE POLICY "crm_leads: assigned read"
ON crm_leads FOR SELECT
USING (assigned_to = auth.uid() OR is_admin());

-- Users can create leads (broker/developer inserting their own leads)
CREATE POLICY "crm_leads: insert"
ON crm_leads FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update leads assigned to them; admins update any
CREATE POLICY "crm_leads: assigned write"
ON crm_leads FOR UPDATE
USING (assigned_to = auth.uid() OR is_admin())
WITH CHECK (assigned_to = auth.uid() OR is_admin());

-- Admins can delete leads
CREATE POLICY "crm_leads: admin delete"
ON crm_leads FOR DELETE
USING (is_admin());

-- ====================================================
-- SAVED SEARCHES
-- user_id references profiles(id)
-- ====================================================

-- Users have full control over their own searches
CREATE POLICY "saved_searches: own all"
ON saved_searches FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ====================================================
-- NOTIFICATIONS
-- user_id references profiles(id)
-- ====================================================

-- Users read their own notifications; admins read all
CREATE POLICY "notifications: own read"
ON notifications FOR SELECT
USING (user_id = auth.uid() OR is_admin());

-- Users mark their own notifications read
CREATE POLICY "notifications: own update"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Only admins/server can insert notifications
CREATE POLICY "notifications: admin insert"
ON notifications FOR INSERT
WITH CHECK (is_admin());

-- Users delete their own; admins delete any
CREATE POLICY "notifications: own delete"
ON notifications FOR DELETE
USING (user_id = auth.uid() OR is_admin());

-- ====================================================
-- DONE
-- Run SELECT * FROM pg_policies WHERE schemaname = 'public';
-- to verify all policies are applied.
-- ====================================================
