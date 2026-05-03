-- ============================================================
-- ASO Foundation Migration
-- Tables: profiles, organizations, organization_members, invitations
-- ============================================================

-- Enums
CREATE TYPE plan_tier AS ENUM ('solo', 'team', 'enterprise');
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- profiles (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  default_organization_id uuid,
  is_superuser boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- organizations
-- ============================================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan_tier plan_tier NOT NULL DEFAULT 'solo',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  seat_limit integer NOT NULL DEFAULT 1,
  app_limit integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer ON organizations(stripe_customer_id);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- organization_members
-- ============================================================
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

CREATE TRIGGER org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their org
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Only owner/admin can insert members
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    -- Also allow self-insert (for creating first org)
    OR user_id = auth.uid()
  );

-- Only owner/admin can update roles
CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owner/admin can remove members
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Org policies (must come after organization_members table exists)
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (true);  -- Anyone can create an org (during onboarding)

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_delete" ON organizations
  FOR DELETE USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- invitations
-- ============================================================
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Add FK from profiles to organizations (now that both tables exist)
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_default_org
  FOREIGN KEY (default_organization_id)
  REFERENCES organizations(id)
  ON DELETE SET NULL;
