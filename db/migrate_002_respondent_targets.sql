ALTER TABLE kpi_entries
  ADD COLUMN target_value numeric;

DROP TABLE IF EXISTS kpi_targets;

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
