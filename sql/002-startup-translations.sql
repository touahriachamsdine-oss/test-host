-- Per-locale translations for startup content (2026-09-15)
-- Run against startup_ideas_dz as postgres. Idempotent.
-- Source of truth stays the English columns in startups; these rows
-- carry the fr/ar display values (name, country, sub_domain,
-- short_description, technology, why_relevant).

CREATE TABLE IF NOT EXISTS startup_translations (
  startup_id text NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('fr', 'ar')),
  name text NOT NULL,
  country text,
  sub_domain text,
  short_description text NOT NULL,
  technology text NOT NULL,
  why_relevant text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (startup_id, locale)
);

CREATE INDEX IF NOT EXISTS startup_translations_locale_idx
  ON startup_translations (locale);