-- Add target_keywords column to apps table.
-- Used by the "Target Keywords" optimization goal so the AI optimizer
-- can build metadata around user-selected hero keywords.
ALTER TABLE apps
  ADD COLUMN IF NOT EXISTS target_keywords text[] NOT NULL DEFAULT '{}'::text[];
