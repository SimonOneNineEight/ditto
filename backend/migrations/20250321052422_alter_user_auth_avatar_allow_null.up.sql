-- Add up migration script here
ALTER TABLE users_auth
ALTER COLUMN avatar_url DROP NOT NULL;
