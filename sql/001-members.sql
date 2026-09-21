-- Public member accounts + saved startups (2026-09-15)
-- Run against startup_ideas_dz as postgres. Idempotent.

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_startups (
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  startup_id text NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, startup_id)
);

-- lowercase-normalized email lookups
CREATE INDEX IF NOT EXISTS saved_startups_member_idx ON saved_startups (member_id);