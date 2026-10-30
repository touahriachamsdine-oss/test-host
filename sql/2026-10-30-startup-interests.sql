-- Interests: members marking a project they want to build (team matching).
CREATE TABLE IF NOT EXISTS startup_interests (
  startup_id text NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (startup_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_startup_interests_startup ON startup_interests (startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_interests_member ON startup_interests (member_id);
CREATE INDEX IF NOT EXISTS idx_startup_interests_created ON startup_interests (created_at DESC);
