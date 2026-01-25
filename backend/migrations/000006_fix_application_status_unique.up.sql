-- Step 1: Create a temp table with the canonical (oldest) status ID for each name
CREATE TEMP TABLE canonical_statuses AS
SELECT DISTINCT ON (name) id, name
FROM application_status
ORDER BY name, created_at ASC;

-- Step 2: Update applications to use canonical status IDs
UPDATE applications a
SET application_status_id = cs.id
FROM application_status s, canonical_statuses cs
WHERE a.application_status_id = s.id
  AND s.name = cs.name
  AND s.id != cs.id;

-- Step 3: Delete duplicate statuses (keep only canonical ones)
DELETE FROM application_status
WHERE id NOT IN (SELECT id FROM canonical_statuses);

-- Step 4: Drop temp table
DROP TABLE canonical_statuses;

-- Step 5: Add unique constraint on name
ALTER TABLE application_status ADD CONSTRAINT application_status_name_unique UNIQUE (name);
