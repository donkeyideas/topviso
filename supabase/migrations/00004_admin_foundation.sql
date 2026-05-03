-- ============================================================
-- Admin Foundation Migration
-- Tables for admin BI dashboard, audit, impersonation, CMS
-- ============================================================

-- ============================================================
-- admin_audit_log — every admin action is recorded
-- ============================================================
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_actor ON admin_audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON admin_audit_log(resource_type, resource_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No RLS policies — access via service role only

-- ============================================================
-- impersonation_sessions
-- ============================================================
CREATE TABLE impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  target_user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL CHECK (char_length(reason) >= 10),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  ended_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_impersonation_active ON impersonation_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_impersonation_admin ON impersonation_sessions(admin_user_id);

ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- daily_mrr_snapshot — materialized daily for revenue charts
-- ============================================================
CREATE TABLE daily_mrr_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  plan_tier plan_tier NOT NULL,
  mrr_cents bigint NOT NULL DEFAULT 0,
  customer_count integer NOT NULL DEFAULT 0,
  new_mrr_cents bigint NOT NULL DEFAULT 0,
  expansion_mrr_cents bigint NOT NULL DEFAULT 0,
  contraction_mrr_cents bigint NOT NULL DEFAULT 0,
  churned_mrr_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_mrr_snapshot_date_plan ON daily_mrr_snapshot(snapshot_date, plan_tier);
CREATE INDEX idx_mrr_snapshot_date ON daily_mrr_snapshot(snapshot_date DESC);

ALTER TABLE daily_mrr_snapshot ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- daily_usage_snapshot — DAU/WAU/MAU + session metrics
-- ============================================================
CREATE TABLE daily_usage_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  dau integer NOT NULL DEFAULT 0,
  wau integer NOT NULL DEFAULT 0,
  mau integer NOT NULL DEFAULT 0,
  avg_session_duration_seconds integer NOT NULL DEFAULT 0,
  avg_actions_per_session numeric(6,1) NOT NULL DEFAULT 0,
  total_api_calls bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_snapshot_date ON daily_usage_snapshot(snapshot_date DESC);

ALTER TABLE daily_usage_snapshot ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- account_churn_scores — per-org churn risk
-- ============================================================
CREATE TABLE account_churn_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  churn_risk_pct numeric(5,2) NOT NULL DEFAULT 0,
  health_score integer NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  risk_factors jsonb DEFAULT '[]',
  last_activity_at timestamptz,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_churn_scores_org ON account_churn_scores(organization_id);
CREATE INDEX idx_churn_scores_risk ON account_churn_scores(churn_risk_pct DESC);

ALTER TABLE account_churn_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- module_retention_buckets — feature retention impact
-- ============================================================
CREATE TABLE module_retention_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  cohort_month date NOT NULL,
  retained_pct numeric(5,2) NOT NULL DEFAULT 0,
  sample_size integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_retention_module_month ON module_retention_buckets(module_name, cohort_month);

ALTER TABLE module_retention_buckets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- hourly_request_rollup — API request volume heatmap
-- ============================================================
CREATE TABLE hourly_request_rollup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_ts timestamptz NOT NULL,
  endpoint text NOT NULL,
  total_requests integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  p50_ms integer NOT NULL DEFAULT 0,
  p95_ms integer NOT NULL DEFAULT 0,
  p99_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_request_rollup_hour_ep ON hourly_request_rollup(hour_ts, endpoint);
CREATE INDEX idx_request_rollup_hour ON hourly_request_rollup(hour_ts DESC);

ALTER TABLE hourly_request_rollup ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- incidents
-- ============================================================
CREATE TYPE incident_severity AS ENUM ('sev1', 'sev2', 'sev3', 'sev4');
CREATE TYPE incident_status AS ENUM ('investigating', 'identified', 'monitoring', 'resolved', 'postmortem');

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity incident_severity NOT NULL DEFAULT 'sev3',
  status incident_status NOT NULL DEFAULT 'investigating',
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  postmortem_url text,
  timeline jsonb DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_started ON incidents(started_at DESC);

CREATE TRIGGER incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- feature_flags
-- ============================================================
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_pct integer NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  targeting_rules jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- nps_responses
-- ============================================================
CREATE TABLE nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  organization_id uuid REFERENCES organizations(id),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 10),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nps_user ON nps_responses(user_id);
CREATE INDEX idx_nps_created ON nps_responses(created_at DESC);

ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- feature_metrics — per-feature adoption & impact
-- ============================================================
CREATE TABLE feature_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  snapshot_date date NOT NULL,
  total_users integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  adoption_pct numeric(5,2) NOT NULL DEFAULT 0,
  retention_impact_pct numeric(5,2) NOT NULL DEFAULT 0,
  expansion_correlation numeric(5,2) NOT NULL DEFAULT 0,
  avg_nps_score numeric(3,1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_feature_metrics_key_date ON feature_metrics(feature_key, snapshot_date);

ALTER TABLE feature_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- signup_funnel_daily — acquisition funnel stages
-- ============================================================
CREATE TABLE signup_funnel_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_date date NOT NULL,
  channel text NOT NULL DEFAULT 'organic',
  visitors integer NOT NULL DEFAULT 0,
  signups integer NOT NULL DEFAULT 0,
  activated integer NOT NULL DEFAULT 0,
  trial_started integer NOT NULL DEFAULT 0,
  converted integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_funnel_date_channel ON signup_funnel_daily(funnel_date, channel);
CREATE INDEX idx_funnel_date ON signup_funnel_daily(funnel_date DESC);

ALTER TABLE signup_funnel_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- homepage_sections — CMS for marketing homepage
-- ============================================================
CREATE TABLE homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homepage_sections_order ON homepage_sections(sort_order);

CREATE TRIGGER homepage_sections_updated_at
  BEFORE UPDATE ON homepage_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- Seed default homepage sections
INSERT INTO homepage_sections (section_key, title, sort_order, content) VALUES
  ('hero', 'Hero', 0, '{}'),
  ('logo_marquee', 'Logo Marquee', 1, '{}'),
  ('problem', 'Problem Section', 2, '{}'),
  ('features', 'Features', 3, '{}'),
  ('testimonials', 'Testimonials', 4, '{}'),
  ('comparison', 'Comparison', 5, '{}'),
  ('pricing', 'Pricing', 6, '{}'),
  ('final_cta', 'Final CTA', 7, '{}'),
  ('footer', 'Footer', 8, '{}');
