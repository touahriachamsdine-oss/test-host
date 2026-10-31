-- Project reports (wrong info, translation issues, broken links) and digest opt-in.
CREATE TABLE IF NOT EXISTS startup_reports (
  id bigserial PRIMARY KEY,
  startup_id text NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('wrong_info', 'translation', 'broken_link', 'duplicate', 'other')),
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text
);

CREATE INDEX IF NOT EXISTS idx_startup_reports_status ON startup_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startup_reports_startup ON startup_reports (startup_id);

ALTER TABLE members ADD COLUMN IF NOT EXISTS digest_opt_in boolean NOT NULL DEFAULT false;
