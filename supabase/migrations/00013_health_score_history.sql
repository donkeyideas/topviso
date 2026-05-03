-- Health score history for per-org health trajectory charts
CREATE TABLE IF NOT EXISTS account_health_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  health_score integer NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  churn_risk_pct numeric(5,2) NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_health_history_org_date
  ON account_health_history(organization_id, snapshot_date);

-- RLS
ALTER TABLE account_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on account_health_history"
  ON account_health_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
