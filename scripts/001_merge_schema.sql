CREATE TABLE IF NOT EXISTS domain_meta (
  slug TEXT PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'TO_CHECK',
  priority_tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain_slug TEXT NOT NULL,
  quota INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_domain ON teams(domain_slug);

ALTER TABLE startups ADD COLUMN IF NOT EXISTS submitted_by_team_code TEXT;

CREATE INDEX IF NOT EXISTS idx_startups_team_code ON startups(submitted_by_team_code);

INSERT INTO domain_meta (slug, label_en, label_ar, validation_status, priority_tier) VALUES
  ('ai-computing',           'AI & Advanced Computing',      'الذكاء الاصطناعي والحوسبة المتقدمة', 'VALIDATED', 'A'),
  ('robotics',               'Robotics',                      'الروبوتات',                          'VALIDATED', 'A'),
  ('biotech-healthtech',     'Biotech & HealthTech',          'التقنية الحيوية وتقنية الصحة',       'VALIDATED', 'A'),
  ('drones-autonomy',        'Autonomous Systems & Drones',   'الأنظمة الذاتية والطائرات المسيّرة', 'VALIDATED', 'A'),
  ('nanotech-materials',     'Nanotech & Advanced Materials', 'تقنية النانو والمواد المتقدمة',      'VALIDATED', 'A'),
  ('energy-storage',         'Energy & Storage',              'الطاقة وتخزينها',                    'VALIDATED', 'A'),
  ('space-aerospace',        'SpaceTech & Aerospace',         'تقنية الفضاء والطيران',              'VALIDATED', 'A'),
  ('agritech-foodtech',      'AgriTech & FoodTech',           'التقنية الزراعية والغذائية',         'VALIDATED', 'A'),
  ('medtech',                'MedTech',                       'التقنية الطبية',                     'VALIDATED', 'A'),
  ('semiconductors',         'Semiconductors & Electronics',  'أشباه الموصلات والإلكترونيات',       'VALIDATED', 'A'),
  ('cybersecurity',          'Cybersecurity',                 'الأمن السيبراني',                    'VALIDATED', 'A'),
  ('manufacturing-3d',       'Advanced Manufacturing & 3D Printing', 'التصنيع المتقدم والطباعة ثلاثية الأبعاد', 'VALIDATED', 'A'),
  ('cleantech',              'Environment, Water & CleanTech','البيئة والماء والتقنية النظيفة',      'VALIDATED', 'A'),
  ('cloud-iot',              'Cloud Computing & Industrial IoT', 'الحوسبة السحابية وإنترنت الأشياء الصناعي', 'VALIDATED', 'A'),
  ('other-deep-tech',        'Other Deep Tech',               'تقنيات عميقة أخرى',                  'VALIDATED', 'A')
ON CONFLICT (slug) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_ar = EXCLUDED.label_ar,
  validation_status = EXCLUDED.validation_status,
  priority_tier = EXCLUDED.priority_tier,
  updated_at = now();

INSERT INTO teams (code, name, domain_slug, quota) VALUES
  ('T01', 'AI & Advanced Computing',      'ai-computing',      500),
  ('T02', 'Robotics',                     'robotics',          500),
  ('T03', 'Biotech & HealthTech',         'biotech-healthtech',500),
  ('T04', 'Autonomous Systems & Drones',  'drones-autonomy',   500),
  ('T05', 'Nanotech & Advanced Materials','nanotech-materials',500),
  ('T06', 'Energy & Storage',             'energy-storage',    500),
  ('T07', 'SpaceTech & Aerospace',        'space-aerospace',   500),
  ('T08', 'AgriTech & FoodTech',          'agritech-foodtech', 500),
  ('T09', 'MedTech',                      'medtech',           500),
  ('T10', 'Semiconductors & Electronics', 'semiconductors',    500),
  ('T11', 'Cybersecurity',                'cybersecurity',     500),
  ('T12', 'Advanced Manufacturing & 3D Printing', 'manufacturing-3d', 500),
  ('T13', 'Environment, Water & CleanTech','cleantech',        500),
  ('T14', 'Cloud Computing & Industrial IoT','cloud-iot',      500),
  ('T15', 'Other Deep Tech',              'other-deep-tech',   500)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  domain_slug = EXCLUDED.domain_slug,
  quota = EXCLUDED.quota,
  updated_at = now();