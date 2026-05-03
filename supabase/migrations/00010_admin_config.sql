-- Admin configuration key-value store
CREATE TABLE admin_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Only service-role can access (admin pages use getSupabaseAdmin)
-- No RLS policies = no access via regular client, only service role

-- Seed default COGS values
INSERT INTO admin_config (key, value) VALUES
  ('cogs', '{"supabase": 25, "vercel": 20, "deepseek": 10}'::jsonb);
