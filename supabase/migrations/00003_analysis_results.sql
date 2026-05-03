-- Analysis results table for persisting LLM-generated data
-- Each row stores one analysis type per app (upsert pattern)

CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by app + type
CREATE INDEX idx_analysis_app_type ON analysis_results(app_id, analysis_type);

-- Only keep latest per app + type (enables upsert)
CREATE UNIQUE INDEX idx_analysis_unique ON analysis_results(app_id, analysis_type);

-- RLS
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own org analysis"
  ON analysis_results FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert own org analysis"
  ON analysis_results FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update own org analysis"
  ON analysis_results FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()));
