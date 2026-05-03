-- LLM mention tracking: persists results from daily LLM polls
CREATE TABLE IF NOT EXISTS llm_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  surface text NOT NULL,
  prompt text NOT NULL,
  mentioned boolean NOT NULL DEFAULT false,
  position text,
  response_excerpt text,
  polled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_llm_mentions_app ON llm_mentions(app_id);
CREATE INDEX idx_llm_mentions_app_surface ON llm_mentions(app_id, surface, polled_at DESC);

ALTER TABLE llm_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llm_mentions_select" ON llm_mentions
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
    )
  );
