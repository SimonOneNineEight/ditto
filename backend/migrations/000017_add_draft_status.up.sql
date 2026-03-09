INSERT INTO application_status (name, created_at, updated_at)
SELECT 'Draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM application_status WHERE name = 'Draft');
