-- Add down migration script here
ALTER TABLE users_auth
SET refresh_token = "";
SET refresh_token_expires_at = "";
WHERE refresh_token IS NULL;

ALTER TABLE users_auth
ALTER COLUMN refresh_token SET NOT NULL,
ALTER COLUMN refresh_token_expires_at SET NOT NULL;
