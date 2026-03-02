-- Rollback multi-provider auth changes

-- Step 1: Re-add refresh token columns to users_auth
ALTER TABLE users_auth ADD COLUMN refresh_token TEXT NULL;
ALTER TABLE users_auth ADD COLUMN refresh_token_expires_at TIMESTAMP NULL;

-- Step 2: Migrate refresh tokens back
UPDATE users_auth ua
SET refresh_token = urt.refresh_token,
    refresh_token_expires_at = urt.expires_at
FROM user_refresh_tokens urt
WHERE ua.user_id = urt.user_id;

-- Step 3: Drop the refresh tokens table
DROP TABLE IF EXISTS user_refresh_tokens;

-- Step 4: Drop composite unique constraint
ALTER TABLE users_auth DROP CONSTRAINT IF EXISTS users_auth_user_provider_unique;

-- Step 5: Remove duplicate auth rows per user (keep the most recent one)
DELETE FROM users_auth a
USING users_auth b
WHERE a.user_id = b.user_id
  AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));

-- Step 6: Re-add one-to-one constraint
ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_id_unique UNIQUE (user_id);
