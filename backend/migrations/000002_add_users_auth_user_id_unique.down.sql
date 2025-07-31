-- Remove unique constraint on users_auth.user_id

ALTER TABLE users_auth DROP CONSTRAINT IF EXISTS users_auth_user_id_unique;