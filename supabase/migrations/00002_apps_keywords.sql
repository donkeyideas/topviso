-- ============================================================
-- ASO Apps & Keywords Migration
-- Tables: apps, app_metadata_snapshots, keywords, keyword_ranks_daily,
--         competitors, reviews, api_keys
-- ============================================================

CREATE TYPE platform AS ENUM ('ios', 'android');

-- ============================================================
-- apps
-- ============================================================
CREATE TABLE apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform platform NOT NULL,
  store_id text NOT NULL,
  name text NOT NULL,
  icon_url text,
  developer text,
  category text,
  current_version text,
  added_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, platform, store_id)
);

CREATE INDEX idx_apps_org ON apps(organization_id);
CREATE INDEX idx_apps_store_id ON apps(store_id);

CREATE TRIGGER apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apps_select" ON apps
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "apps_insert" ON apps
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "apps_update" ON apps
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "apps_delete" ON apps
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- app_metadata_snapshots
-- ============================================================
CREATE TABLE app_metadata_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  locale text NOT NULL DEFAULT 'en-US',
  title text,
  subtitle text,
  description text,
  keywords_field text,
  promotional_text text,
  version text,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_meta_app ON app_metadata_snapshots(app_id);
CREATE INDEX idx_app_meta_snapshot ON app_metadata_snapshots(app_id, snapshot_at DESC);

ALTER TABLE app_metadata_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_meta_select" ON app_metadata_snapshots
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================
-- keywords
-- ============================================================
CREATE TABLE keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  text text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  is_tracked boolean NOT NULL DEFAULT true,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id, text, country)
);

CREATE INDEX idx_keywords_app ON keywords(app_id);
CREATE INDEX idx_keywords_org ON keywords(organization_id);

CREATE TRIGGER keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "keywords_select" ON keywords
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "keywords_insert" ON keywords
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "keywords_delete" ON keywords
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- keyword_ranks_daily
-- ============================================================
CREATE TABLE keyword_ranks_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  date date NOT NULL,
  rank integer,
  impressions_estimate integer,
  search_volume integer,
  difficulty integer,
  kei numeric(8,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, date)
);

CREATE INDEX idx_kw_ranks_kw ON keyword_ranks_daily(keyword_id);
CREATE INDEX idx_kw_ranks_date ON keyword_ranks_daily(keyword_id, date DESC);

ALTER TABLE keyword_ranks_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kw_ranks_select" ON keyword_ranks_daily
  FOR SELECT USING (
    keyword_id IN (
      SELECT k.id FROM keywords k
      JOIN organization_members om ON om.organization_id = k.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================
-- competitors
-- ============================================================
CREATE TABLE competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  competitor_app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id, competitor_app_id)
);

CREATE INDEX idx_competitors_app ON competitors(app_id);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitors_select" ON competitors
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "competitors_insert" ON competitors
  FOR INSERT WITH CHECK (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'member')
    )
  );

-- ============================================================
-- reviews
-- ============================================================
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  store_review_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  author text,
  country text,
  version text,
  reviewed_at timestamptz,
  reply_body text,
  reply_at timestamptz,
  sentiment_score numeric(4,3),
  cluster_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id, store_review_id)
);

CREATE INDEX idx_reviews_app ON reviews(app_id);
CREATE INDEX idx_reviews_reviewed ON reviews(app_id, reviewed_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(app_id, rating);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================
-- api_keys
-- ============================================================
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  prefix text NOT NULL,
  hashed_key text NOT NULL,
  last_used_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix);

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON api_keys
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "api_keys_delete" ON api_keys
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- app_rankings_daily
-- ============================================================
CREATE TABLE app_rankings_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  date date NOT NULL,
  country text NOT NULL DEFAULT 'US',
  category text,
  rank_overall integer,
  rank_category integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id, date, country)
);

CREATE INDEX idx_app_rankings_app ON app_rankings_daily(app_id);

ALTER TABLE app_rankings_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_rankings_select" ON app_rankings_daily
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================
-- app_installs_estimate
-- ============================================================
CREATE TABLE app_installs_estimate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  date date NOT NULL,
  country text NOT NULL DEFAULT 'US',
  downloads_low integer,
  downloads_high integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(app_id, date, country)
);

CREATE INDEX idx_app_installs_app ON app_installs_estimate(app_id);

ALTER TABLE app_installs_estimate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_installs_select" ON app_installs_estimate
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
    )
  );
