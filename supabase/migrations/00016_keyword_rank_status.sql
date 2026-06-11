-- Honest rank-check state. Before this migration, a `rank IS NULL` row could
-- mean three different things: (a) we checked and the app isn't in the top
-- 250, (b) the scraper failed silently, (c) we never checked it. The UI
-- couldn't tell them apart, so failed scrapes looked identical to genuine
-- non-rankings — which is exactly the bug users reported.
--
-- New columns:
--   status            — 'ranked' | 'not_in_top_250' | 'error'
--   last_checked_at   — full timestamp of the most recent check (date is
--                       already the partition key; this gives intra-day
--                       precision so cron can refresh without losing time)
--   error_reason      — short string when status='error' (rate_limit, network,
--                       parse_error, etc.)
--   source            — which scraper produced the row ('gplay', 'itunes').
--                       Lets us compare implementations and roll back if a
--                       new scraper ever regresses.

ALTER TABLE keyword_ranks_daily
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ranked'
    CHECK (status IN ('ranked', 'not_in_top_250', 'error')),
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS error_reason text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'gplay'
    CHECK (source IN ('gplay', 'itunes'));

-- Backfill existing rows: rank IS NULL was historically used for both
-- "not in top 250" and "scraper errored." We can't distinguish them now —
-- assume not_in_top_250 since that's the less alarming default. The next
-- cron sweep will overwrite with the real status.
UPDATE keyword_ranks_daily
  SET status = CASE WHEN rank IS NULL THEN 'not_in_top_250' ELSE 'ranked' END
  WHERE status = 'ranked';  -- only touch rows still at the default

-- Lets cron pick the oldest-checked keywords first.
CREATE INDEX IF NOT EXISTS idx_kw_ranks_last_checked
  ON keyword_ranks_daily(last_checked_at);
