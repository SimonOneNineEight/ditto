-- Add down migration script here
ALTER TABLE users_auth
SET avatar_url = "";
WHERE avatar_url IS NULL;

ALTER TABLE users_auth
ALTER COLUMN avatar_url SET NOT NULL;
