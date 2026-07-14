-- SBUs, alphabetical by name
INSERT INTO sbus (code, name, sort_order, cluster_group) VALUES
('AALL',  'Akij Agri Life Ltd', 1, 'trading'),
('AASL',  'Akij Air Limited', 2, 'logistics'),
('AAIL',  'Akij Automobiles Industries Ltd. - Tyre', 3, 'logistics'),
('ABSL',  'Akij Building Solutions Ltd - Benzol', 4, 'logistics'),
('ACL',   'Akij Commodities Ltd', 5, 'trading'),
('ACEL',  'Akij Consumer Electronics Ltd.', 6, 'trading'),
('AEFL',  'Akij Electrofeb Ltd.', 7, 'trading'),
('AENL',  'Akij Engineering Ltd.', 8, 'trading'),
('AEL',   'Akij Essential Ltd - Trading', 9, 'trading'),
('AHBL',  'Akij Health & Beauty Ltd.', 10, 'trading'),
('ALL',   'Akij Logistics Ltd', 11, 'logistics'),
('BTL',   'Bongo Traders Ltd', 12, 'logistics'),
('DyTCL', 'Daily Trading Company Ltd.', 13, 'logistics'),
('NTL',   'Nobayon Traders Ltd.', 14, 'trading'),
('SATHS', 'South Asia Travels & Hajj Ltd.', 15, 'logistics');

-- 18-KPI balanced scorecard master
INSERT INTO kpis (sl, perspective, strategic_goal, name, weight_pct, direction, industry_benchmark, uom, target_validation, kpi_driver, measurement_criteria, data_source, frequency, evidence_type, evidence_link_label, evidence_owner_role, required_evidence, capturing_method) VALUES
(1, 'Financial', 'Achieve Cluster Revenue Growth', 'Cluster Revenue Achievement vs Budget', 20, 'higher_better', '95%-100% Budget Achievement', 'BDT', 'Approved Annual Budget', 'Revenue Growth & Business Performance', '(Actual Revenue ÷ Budgeted Revenue) × 100', 'ERP/MIS/Finance Report', 'Monthly', 'Report', 'ERP Link', 'Finance', 'Revenue Report', 'System Generated'),
(2, 'Financial', 'Improve Cluster Profitability', 'Cluster EBITDA Margin', 10, 'higher_better', 'Trading & Logistics EBITDA Margin: 8%-12%', '%', 'Approved Budget', 'Profitability & Cost Management', '(EBITDA ÷ Total Revenue) × 100', 'Finance Report', 'Monthly', 'Report', 'Finance Dashboard', 'Finance', 'P&L Statement', 'System Generated'),
(3, 'Financial', 'Strengthen Cash Flow Management', 'Collection Efficiency', 8, 'higher_better', '≥95% Collection Rate', '%', 'Collection Plan', 'Cash Conversion & Receivable Management', '(Amount Collected ÷ Total Due Receivables) × 100', 'AR Aging Report', 'Monthly', 'Report', 'ERP Link', 'Finance', 'Collection Report', 'System Generated'),
(4, 'Financial', 'Optimize Working Capital Efficiency', 'Working Capital Days', 7, 'lower_better', '45-60 Days', 'Days', 'Approved Working Capital Plan', 'Liquidity & Working Capital Optimization', 'Inventory Days + Receivable Days – Payable Days', 'Finance Dashboard', 'Monthly', 'Report', 'Dashboard Link', 'Finance', 'WC Report', 'System Generated'),
(5, 'Financial', 'Strengthen Financial Sustainability', 'Driving Self-Sufficiency Financing', 5, 'higher_better', '70%-80% Internal Funding Coverage', '%', 'Approved Funding Plan', 'Financial Sustainability & Funding Efficiency', '(Internally Generated Funds ÷ Total Funding Requirement) × 100', 'Finance Report', 'Monthly', 'Report', 'Finance Dashboard', 'Finance', 'Funding Status Report', 'System Generated'),

(6, 'Customer', 'Strengthen Market Presence and Intelligence', 'Market Share Growth (Through Market Visit Effectiveness)', 8, 'higher_better', '≥90% Planned Visits with Action Closure', '%', 'Approved Visit Plan', 'Market Coverage, Competitive Intelligence & Channel Development', '[(Actual Strategic Market Visits ÷ Planned Market Visits) × 70%] + [(Action Items Implemented ÷ Identified Action Items) × 30%]', 'Market Visit Report (MVR)', 'Monthly', 'Report', 'MVR Link', 'CBO/SBU', 'Market Visit Reports', 'Manual & System Entry'),
(7, 'Customer', 'Expand Customer Base and Penetration', 'Customer Growth', 7, 'higher_better', '8%-12% Monthly Customer Addition Growth', '%', 'Approved Sales Plan', 'Customer Acquisition & Market Penetration', '(New Customers Acquired ÷ Monthly Customer Acquisition Target) × 100', 'Sales MIS', 'Monthly', 'Report', 'CRM Link', 'CBO/SBU', 'Customer Acquisition Report', 'System Generated'),
(8, 'Customer', 'Strengthen Stakeholder Relationship and Retention', 'Customer & Supplier Visit to Reflect Retention', 5, 'higher_better', '≥90% Visit Completion', '%', 'Approved Visit Schedule', 'Relationship Management & Stakeholder Engagement', '(Actual Customer and Supplier Visits Completed ÷ Planned Visits) × 100', 'Visit Reports', 'Monthly', 'Report', 'Visit Tracker', 'CBO/SBU', 'Visit Reports', 'Manual Entry'),
(9, 'Customer', 'Drive Business Expansion and Diversification', 'Strategic Partnership & New Business Development', 5, 'higher_better', '2-3 Strategic Initiatives per Quarter', 'No.', 'Approved Strategic Plan', 'Business Expansion & Diversification', '(Completed Strategic Initiatives ÷ Planned Strategic Initiatives) × 100', 'Project Tracker', 'Monthly', 'Document', 'Project Folder', 'CBO/SBU', 'MoU/Project Status', 'Manual Update'),
(10, 'Customer', 'Expand International Business Network', 'Global Connection for Business Expansion', 5, 'higher_better', '3-5 International Engagements per Quarter', 'No.', 'Approved Business Development Plan', 'International Networking & Market Development', '(Actual Global Business Engagements Completed ÷ Planned Engagements) × 100', 'Meeting Reports', 'Monthly', 'Document', 'Meeting Folder', 'CBO/SBU', 'Meeting Minutes/MoU', 'Manual Update'),

(11, 'Internal Process', 'Enhance Commercial Excellence', 'CEP, NRM & Product Mix Achievement', 3, 'higher_better', '≥90% Initiative Completion', '%', 'Approved Commercial Plan', 'Commercial Excellence & Revenue Optimization', '(Actual CEP, NRM and Product Mix Initiatives Achieved ÷ Planned Initiatives) × 100', 'Sales & Marketing MIS', 'Monthly', 'Report', 'MIS Link', 'CEO''s Office', 'Commercial Performance Report', 'System Generated'),
(12, 'Internal Process', 'Improve Planning and Forecast Accuracy', 'Demand Planning & Variance Management', 3, 'higher_better', 'Forecast Accuracy ≥85%', '%', 'Approved Demand Plan', 'Forecast Accuracy & Supply Chain Planning', '100 − [|Actual Demand − Forecast Demand| ÷ Forecast Demand × 100]', 'Supply Chain MIS', 'Monthly', 'Report', 'Dashboard Link', 'CEO''s Office', 'Demand Planning Report', 'System Generated'),
(13, 'Internal Process', 'Strengthen Governance and Risk Management', 'Governance Compliance & Audit Closure Rate', 3, 'higher_better', '≥95% Closure Rate', '%', 'Audit Action Plan', 'Governance, Risk & Compliance Management', '(Audit Findings Closed Within Timeline ÷ Total Audit Findings) × 100', 'Internal Audit Report', 'Monthly', 'Report', 'Audit Portal', 'CEO''s Office', 'Audit Closure Report', 'System Generated'),
(14, 'Internal Process', 'Accelerate Digital Transformation', 'ERP & Automation Achievement', 3, 'higher_better', '≥90% Milestone Completion', '%', 'Approved ERP Roadmap', 'Digital Transformation & Process Excellence', '(Completed ERP and Automation Milestones ÷ Planned Milestones) × 100', 'PMO Reports', 'Monthly', 'Document', 'PMO Folder', 'CEO''s Office', 'Milestone Tracker', 'Manual Update'),
(15, 'Internal Process', 'Ensure Timely Execution of Strategic Projects and New Ventures', 'Project & Business Setup Completion', 3, 'higher_better', '≥90% Milestone Completion', '%', 'Approved Project Plan', 'Project Execution & New Venture Readiness', '(Completed Project Milestones ÷ Planned Project Milestones) × 100', 'PMO Dashboard', 'Monthly', 'Document', 'Project Dashboard', 'CEO''s Office', 'Project Status Report', 'Manual Update'),

(16, 'Learning & Growth', 'Build Leadership Pipeline and Business Continuity', 'Successor Readiness & Critical Talent Development', 2, 'higher_better', '≥80% Critical Positions Covered', '%', 'Approved Succession Plan', 'Leadership Pipeline & Business Continuity', '(Critical Positions with Ready Successors ÷ Total Critical Positions) × 100', 'HR Dashboard', 'Monthly', 'Report', 'HRIS Link', 'CEO', 'Succession Matrix', 'System Generated'),
(17, 'Learning & Growth', 'Foster Employee Engagement and Culture', 'Employee Engagement Score', 2, 'higher_better', '≥85% Engagement Score', '%', 'Approved Engagement Plan', 'Employee Experience & Organizational Culture', 'Employee Engagement Survey Score (%)', 'Engagement Survey', 'Monthly', 'Survey', 'Survey Link', 'CEO', 'Survey Report', 'System Generated'),
(18, 'Learning & Growth', 'Strengthen Organizational Design and Performance Governance', 'Organogram & PMS Management', 1, 'higher_better', '100% Compliance', '%', 'Approved Organization Structure & PMS Calendar', 'Organization Governance & Performance Management', '[(Approved Organogram Implementation × 50%) + (PMS Completion Compliance × 50%)]', 'HR Dashboard', 'Monthly', 'Document', 'HR Folder', 'CEO', 'Approved Organogram and PMS Tracker', 'Manual & System Generated');

-- Dashboard-access enroll numbers (also the only valid admins for locking targets / finalizing months)
INSERT INTO dashboard_admins (enroll_number) VALUES
('565503'),
('567217'),
('569553'),
('569138'),
('124921'),
('571392');
