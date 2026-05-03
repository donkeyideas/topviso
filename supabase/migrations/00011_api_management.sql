-- ============================================================
-- API Call Log — tracks every external API call
-- ============================================================
CREATE TABLE api_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'deepseek',
  endpoint text NOT NULL DEFAULT 'chat.completions',
  method text NOT NULL DEFAULT 'POST',
  status_code integer,
  response_time_ms integer,
  tokens_used integer,
  prompt_tokens integer,
  completion_tokens integer,
  cost_usd numeric(12, 8),
  is_success boolean NOT NULL DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_call_log_created ON api_call_log(created_at DESC);
CREATE INDEX idx_api_call_log_provider ON api_call_log(provider);
CREATE INDEX idx_api_call_log_provider_month ON api_call_log(provider, (date_trunc('month', created_at)));

ALTER TABLE api_call_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_call_log TO service_role;
GRANT SELECT ON api_call_log TO authenticated;

-- ============================================================
-- Platform API Configs — provider settings & keys
-- ============================================================
CREATE TABLE platform_api_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}',
  test_status text NOT NULL DEFAULT 'untested' CHECK (test_status IN ('untested', 'success', 'failed')),
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER platform_api_configs_updated_at
  BEFORE UPDATE ON platform_api_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE platform_api_configs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_api_configs TO service_role;
GRANT SELECT ON platform_api_configs TO authenticated;

-- Seed DeepSeek as initial provider
INSERT INTO platform_api_configs (provider, display_name, config) VALUES
  ('deepseek', 'DeepSeek AI', '{
    "model": "deepseek-chat",
    "base_url": "https://api.deepseek.com",
    "env_var": "DEEPSEEK_API_KEY",
    "cost_per_1k_input": 0.00014,
    "cost_per_1k_output": 0.00028
  }'::jsonb);
