-- Startup enrichment: history + HQ location (2026-09-21)
-- Run against startup_ideas_dz as postgres. Idempotent.
-- Adds a timeline-style history paragraph and HQ location (city + GPS)
-- to startups, and the same fields to per-locale translations.

ALTER TABLE startups ADD COLUMN IF NOT EXISTS history text;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS hq_city text;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE startup_translations ADD COLUMN IF NOT EXISTS history text;
ALTER TABLE startup_translations ADD COLUMN IF NOT EXISTS hq_city text;