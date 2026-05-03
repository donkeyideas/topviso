-- ============================================================
-- FIX ALL RLS POLICIES TO USE get_user_org_ids()
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, ensure the helper function exists
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- ============================================================
-- organization_members (fix self-referencing recursion)
-- ============================================================
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    OR
    (user_id = auth.uid())
  );

DROP POLICY IF EXISTS "org_members_update" ON organization_members;
CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- ============================================================
-- organizations
-- ============================================================
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "org_delete" ON organizations;
CREATE POLICY "org_delete" ON organizations
  FOR DELETE USING (
    id IN (SELECT get_user_org_ids())
  );

-- ============================================================
-- apps
-- ============================================================
DROP POLICY IF EXISTS "apps_select" ON apps;
CREATE POLICY "apps_select" ON apps
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "apps_insert" ON apps;
CREATE POLICY "apps_insert" ON apps
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "apps_update" ON apps;
CREATE POLICY "apps_update" ON apps
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "apps_delete" ON apps;
CREATE POLICY "apps_delete" ON apps
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- ============================================================
-- app_metadata_snapshots
-- ============================================================
DROP POLICY IF EXISTS "app_meta_select" ON app_metadata_snapshots;
CREATE POLICY "app_meta_select" ON app_metadata_snapshots
  FOR SELECT USING (
    app_id IN (
      SELECT id FROM apps WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- keywords
-- ============================================================
DROP POLICY IF EXISTS "keywords_select" ON keywords;
CREATE POLICY "keywords_select" ON keywords
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "keywords_insert" ON keywords;
CREATE POLICY "keywords_insert" ON keywords
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "keywords_delete" ON keywords;
CREATE POLICY "keywords_delete" ON keywords
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- ============================================================
-- keyword_ranks_daily
-- ============================================================
DROP POLICY IF EXISTS "kw_ranks_select" ON keyword_ranks_daily;
CREATE POLICY "kw_ranks_select" ON keyword_ranks_daily
  FOR SELECT USING (
    keyword_id IN (
      SELECT id FROM keywords WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- competitors
-- ============================================================
DROP POLICY IF EXISTS "competitors_select" ON competitors;
CREATE POLICY "competitors_select" ON competitors
  FOR SELECT USING (
    app_id IN (
      SELECT id FROM apps WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "competitors_insert" ON competitors;
CREATE POLICY "competitors_insert" ON competitors
  FOR INSERT WITH CHECK (
    app_id IN (
      SELECT id FROM apps WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- reviews
-- ============================================================
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (
    app_id IN (
      SELECT id FROM apps WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- api_keys
-- ============================================================
DROP POLICY IF EXISTS "api_keys_select" ON api_keys;
CREATE POLICY "api_keys_select" ON api_keys
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "api_keys_insert" ON api_keys;
CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "api_keys_delete" ON api_keys;
CREATE POLICY "api_keys_delete" ON api_keys
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- ============================================================
-- app_rankings_daily
-- ============================================================
DROP POLICY IF EXISTS "app_rankings_select" ON app_rankings_daily;
CREATE POLICY "app_rankings_select" ON app_rankings_daily
  FOR SELECT USING (
    app_id IN (
      SELECT id FROM apps WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- app_installs_estimate
-- ============================================================
DROP POLICY IF EXISTS "app_installs_select" ON app_installs_estimate;
CREATE POLICY "app_installs_select" ON app_installs_estimate
  FOR SELECT USING (
    app_id IN (
      SELECT id FROM apps WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- invitations
-- ============================================================
DROP POLICY IF EXISTS "invitations_select" ON invitations;
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
  );

DROP POLICY IF EXISTS "invitations_delete" ON invitations;
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (
    organization_id IN (SELECT get_user_org_ids())
  );
