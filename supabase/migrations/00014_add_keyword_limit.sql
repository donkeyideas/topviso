-- Add keyword_limit to organizations (mirrors seat_limit and app_limit)
ALTER TABLE organizations
  ADD COLUMN keyword_limit integer NOT NULL DEFAULT 50;

-- Backfill existing orgs based on their plan_tier
UPDATE organizations SET keyword_limit = 50    WHERE plan_tier = 'solo';
UPDATE organizations SET keyword_limit = 500   WHERE plan_tier = 'team';
UPDATE organizations SET keyword_limit = 5000  WHERE plan_tier = 'enterprise';
