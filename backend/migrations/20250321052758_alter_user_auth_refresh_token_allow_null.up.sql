-- Add up migration script here
ALTER TABLE users_auth
    ALTER COLUMN refresh_token DROP NOT NULL,
    ALTER COLUMN refresh_token_expires_at DROP NOT NULL;
