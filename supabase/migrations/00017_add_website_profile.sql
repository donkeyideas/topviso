-- App Identity layer.
-- Captures a first-party source of truth about what the app actually IS —
-- crawled from the developer's website (or entered manually) and distilled by
-- the LLM into a structured profile. This breaks the "optimize the store
-- listing using only the store listing" feedback loop: buildAppContext() and
-- the keyword-seed pipeline read app_profile as the grounding anchor.
ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS app_profile jsonb,
  -- none | pending | ready | failed
  ADD COLUMN IF NOT EXISTS profile_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS profile_updated_at timestamptz;
