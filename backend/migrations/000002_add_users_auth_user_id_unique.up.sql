-- Add unique constraint on users_auth.user_id for OAuth support
-- This ensures each user can only have one authentication method

ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_id_unique UNIQUE (user_id);