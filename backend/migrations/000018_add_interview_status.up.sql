ALTER TABLE interviews ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'scheduled';

ALTER TABLE interviews ADD CONSTRAINT interviews_status_check
    CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-- Backfill: mark interviews with an outcome as completed
UPDATE interviews SET status = 'completed' WHERE outcome IS NOT NULL;
