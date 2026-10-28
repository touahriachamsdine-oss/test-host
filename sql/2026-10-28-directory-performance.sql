-- Directory performance: filters (country, year, difficulty) and ILIKE search.
CREATE INDEX IF NOT EXISTS idx_startups_country ON startups (country);
CREATE INDEX IF NOT EXISTS idx_startups_year_founded ON startups (year_founded DESC);
CREATE INDEX IF NOT EXISTS idx_startups_difficulty ON startups (difficulty_score);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_startups_name_trgm ON startups USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_startups_description_trgm ON startups USING gin (short_description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_startups_technology_trgm ON startups USING gin (technology gin_trgm_ops);
