-- CEO KPI schema

CREATE TABLE sbus (
  id             serial PRIMARY KEY,
  code           text UNIQUE NOT NULL,
  name           text UNIQUE NOT NULL,
  sort_order     int NOT NULL,
  cluster_group  text NOT NULL DEFAULT 'trading' CHECK (cluster_group IN ('trading', 'logistics'))
);

CREATE TABLE kpis (
  id                  serial PRIMARY KEY,
  sl                  int UNIQUE NOT NULL,
  perspective         text NOT NULL CHECK (perspective IN ('Financial', 'Customer', 'Internal Process', 'Learning & Growth')),
  strategic_goal      text NOT NULL,
  name                text NOT NULL,
  weight_pct          numeric(5,2) NOT NULL,
  direction           text NOT NULL CHECK (direction IN ('higher_better', 'lower_better')),
  industry_benchmark  text,
  uom                 text NOT NULL,
  target_validation   text,
  kpi_driver          text,
  measurement_criteria text,
  data_source         text,
  frequency           text,
  evidence_type       text,
  evidence_link_label text,
  evidence_owner_role text NOT NULL CHECK (evidence_owner_role IN ('Finance', 'CBO/SBU', 'CEO''s Office', 'CEO')),
  required_evidence   text,
  capturing_method    text
);

-- One admin (dashboard-side) action per SBU+role+month: submitting locks that role's KPI batch for that SBU/month.
CREATE TABLE kpi_submissions (
  id                serial PRIMARY KEY,
  sbu_id            int NOT NULL REFERENCES sbus(id),
  role              text NOT NULL CHECK (role IN ('Finance', 'CBO/SBU', 'CEO''s Office', 'CEO')),
  month             date NOT NULL,
  submitted_by_enroll text NOT NULL,
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sbu_id, role, month)
);

-- Cluster-wide "Overall KPI Goal" set by the admin — one value per KPI per month, not per SBU.
-- Shown on the Dashboard as a benchmark alongside the bottom-up sum of respondent-entered targets.
CREATE TABLE kpi_cluster_goals (
  id                serial PRIMARY KEY,
  kpi_id            int NOT NULL REFERENCES kpis(id),
  month             date NOT NULL,
  target_value      numeric NOT NULL,
  is_locked         boolean NOT NULL DEFAULT false,
  locked_by_enroll  text,
  locked_at         timestamptz,
  UNIQUE (kpi_id, month)
);

-- Each respondent enters both their own target and achievement for their SBU; achievement_pct
-- and weighted_score are computed from those two values at submit time.
CREATE TABLE kpi_entries (
  id                serial PRIMARY KEY,
  kpi_id            int NOT NULL REFERENCES kpis(id),
  sbu_id            int NOT NULL REFERENCES sbus(id),
  month             date NOT NULL,
  submission_id     int REFERENCES kpi_submissions(id),
  target_value      numeric,
  achievement_value numeric,
  achievement_pct   numeric,
  weighted_score    numeric,
  evidence_link     text,
  evidence_note     text,
  entered_by_enroll text,
  entered_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, sbu_id, month)
);

-- Global "Save Month" lock: only inserted once every SBU x role has a kpi_submissions row for that month.
CREATE TABLE month_finalizations (
  id                serial PRIMARY KEY,
  month             date UNIQUE NOT NULL,
  finalized_by_enroll text NOT NULL,
  finalized_at      timestamptz NOT NULL DEFAULT now()
);

-- Enroll numbers allowed into the Dashboard (also the only valid "admin" identities for locking goals and finalizing months).
CREATE TABLE dashboard_admins (
  enroll_number text PRIMARY KEY,
  name          text
);

CREATE INDEX idx_kpi_cluster_goals_month ON kpi_cluster_goals(month);
CREATE INDEX idx_kpi_entries_month ON kpi_entries(month);
CREATE INDEX idx_kpi_submissions_month ON kpi_submissions(month);

-- Simplified system (branch: simplified): one submission per perspective per month, cluster-wide (no SBU).
-- Kept fully separate from kpi_submissions/kpi_entries above so the original per-SBU flow is untouched.
CREATE TABLE kpi_submissions_simple (
  id                  serial PRIMARY KEY,
  perspective         text NOT NULL CHECK (perspective IN ('Financial', 'Customer', 'Internal Process', 'Learning & Growth')),
  month               date NOT NULL,
  submitted_by_enroll text NOT NULL,
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (perspective, month)
);

CREATE TABLE kpi_entries_simple (
  id                serial PRIMARY KEY,
  kpi_id            int NOT NULL REFERENCES kpis(id),
  month             date NOT NULL,
  submission_id     int REFERENCES kpi_submissions_simple(id),
  target_value      numeric,
  achievement_value numeric,
  achievement_pct   numeric,
  weighted_score    numeric,
  evidence_link     text,
  evidence_type     text,
  data_source       text,
  evidence_owner    text,
  entered_by_enroll text,
  entered_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, month)
);

CREATE INDEX idx_kpi_entries_simple_month ON kpi_entries_simple(month);
CREATE INDEX idx_kpi_submissions_simple_month ON kpi_submissions_simple(month);

-- Allowlist of which kpis rows the simplified flow shows — a trimmed subset of the
-- full 18-KPI catalog. Kept as a separate join table (not a column on kpis, not a
-- delete) so main's full KPI list is completely unaffected.
CREATE TABLE kpi_simple_set (
  kpi_id int PRIMARY KEY REFERENCES kpis(id)
);

-- Cluster-wide "Save and close" lock for the simplified flow — one row per month,
-- inserted once all 4 perspectives have submitted. Mirrors month_finalizations but
-- keyed on perspective completion instead of SBU x role completion.
CREATE TABLE month_finalizations_simple (
  id                  serial PRIMARY KEY,
  month               date UNIQUE NOT NULL,
  finalized_by_enroll text NOT NULL,
  finalized_at        timestamptz NOT NULL DEFAULT now()
);
