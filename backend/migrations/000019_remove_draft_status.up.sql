-- Reassign any applications with Draft status to Saved
UPDATE applications
SET application_status_id = (SELECT id FROM application_status WHERE name = 'Saved'),
    updated_at = CURRENT_TIMESTAMP
WHERE application_status_id = (SELECT id FROM application_status WHERE name = 'Draft');

-- Remove the Draft status
DELETE FROM application_status WHERE name = 'Draft';
