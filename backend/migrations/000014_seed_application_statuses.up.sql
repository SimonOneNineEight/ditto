INSERT INTO application_status (name, created_at, updated_at)
SELECT name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES ('Saved'), ('Applied'), ('Interview'), ('Offer'), ('Rejected')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM application_status WHERE application_status.name = v.name);
