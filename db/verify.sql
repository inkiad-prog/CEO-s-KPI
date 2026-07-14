SELECT 'sbus' AS table, count(*) FROM sbus
UNION ALL SELECT 'kpis', count(*) FROM kpis
UNION ALL SELECT 'dashboard_admins', count(*) FROM dashboard_admins;
