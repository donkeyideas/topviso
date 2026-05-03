-- Add dashboard_mode preference to profiles
-- 'focused' = V2 streamlined (9 pages), 'full_suite' = V1 full (22 pages)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_mode text NOT NULL DEFAULT 'focused';
