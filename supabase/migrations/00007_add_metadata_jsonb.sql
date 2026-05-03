-- Add metadata JSONB column to app_metadata_snapshots
-- Stores full store data (score, ratings, installs, genreId, screenshots, etc.)
ALTER TABLE app_metadata_snapshots ADD COLUMN IF NOT EXISTS metadata jsonb;
