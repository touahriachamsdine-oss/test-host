-- Member profiles, project pins and anonymous page-view analytics
-- Applied to Neon on 2026-10-29.

ALTER TABLE members ADD COLUMN IF NOT EXISTS role_type text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS student_serial text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS college_id text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS study_year smallint;
ALTER TABLE members ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS grade text;

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_type_check;
ALTER TABLE members
  ADD CONSTRAINT members_role_type_check
  CHECK (role_type IS NULL OR role_type IN ('student', 'teacher'));

CREATE TABLE IF NOT EXISTS startup_flags (
  startup_id text NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (startup_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_startup_flags_created ON startup_flags (created_at DESC);

CREATE TABLE IF NOT EXISTS page_views (
  id bigserial PRIMARY KEY,
  path text NOT NULL,
  startup_id text,
  locale text NOT NULL,
  member_id uuid,
  college_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_startup ON page_views (startup_id) WHERE startup_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_college ON page_views (college_id) WHERE college_id IS NOT NULL;
