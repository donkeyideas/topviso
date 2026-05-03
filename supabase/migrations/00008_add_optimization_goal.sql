-- Add optimization_goal column to apps table
-- Valid values: balanced, visibility, keyword-opportunities, conversion, competitive-edge
ALTER TABLE apps ADD COLUMN IF NOT EXISTS optimization_goal text NOT NULL DEFAULT 'balanced';
