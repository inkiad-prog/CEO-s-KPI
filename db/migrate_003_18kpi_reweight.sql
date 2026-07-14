-- Drop "Leadership & Functional Training Effectiveness" (id 17), renumber the two rows after it,
-- reweight all 18 remaining KPIs, and move Strategic Partnership / Global Connection from
-- CBO/SBU to CEO's Office per the updated master scorecard.

DELETE FROM kpis WHERE id = 17;

UPDATE kpis SET sl = sl - 1 WHERE sl > 17;

UPDATE kpis SET weight_pct = 20 WHERE id = 1;
UPDATE kpis SET weight_pct = 10 WHERE id = 2;
UPDATE kpis SET weight_pct = 8  WHERE id = 3;
UPDATE kpis SET weight_pct = 7  WHERE id = 4;
UPDATE kpis SET weight_pct = 5  WHERE id = 5;
UPDATE kpis SET weight_pct = 8  WHERE id = 6;
UPDATE kpis SET weight_pct = 7  WHERE id = 7;
UPDATE kpis SET weight_pct = 5  WHERE id = 8;
UPDATE kpis SET weight_pct = 5, evidence_owner_role = 'CEO''s Office' WHERE id = 9;
UPDATE kpis SET weight_pct = 5, evidence_owner_role = 'CEO''s Office' WHERE id = 10;
UPDATE kpis SET weight_pct = 3  WHERE id = 11;
UPDATE kpis SET weight_pct = 3  WHERE id = 12;
UPDATE kpis SET weight_pct = 3  WHERE id = 13;
UPDATE kpis SET weight_pct = 3  WHERE id = 14;
UPDATE kpis SET weight_pct = 3  WHERE id = 15;
UPDATE kpis SET weight_pct = 2  WHERE id = 16;
UPDATE kpis SET weight_pct = 2  WHERE id = 18;
UPDATE kpis SET weight_pct = 1  WHERE id = 19;
