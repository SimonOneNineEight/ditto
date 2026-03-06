-- Multi-provider auth: allow multiple auth methods per user

-- Step 1: Drop the one-to-one constraint
ALTER TABLE users_auth DROP CONSTRAINT IF EXISTS users_auth_user_id_unique;

-- Step 2: Add one-per-provider constraint
ALTER TABLE users_auth ADD CONSTRAINT users_auth_user_provider_unique
  UNIQUE (user_id, auth_provider);

-- Step 3: Create a dedicated refresh token table (per-user, not per-provider)
CREATE TABLE user_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_refresh_tokens_user_unique UNIQUE (user_id)
);

-- Step 4: Migrate existing refresh tokens
INSERT INTO user_refresh_tokens (user_id, refresh_token, expires_at)
SELECT user_id, refresh_token, refresh_token_expires_at
FROM users_auth
WHERE refresh_token IS NOT NULL;

-- Step 5: Drop refresh token columns from users_auth
ALTER TABLE users_auth DROP COLUMN refresh_token;
ALTER TABLE users_auth DROP COLUMN refresh_token_expires_at;
