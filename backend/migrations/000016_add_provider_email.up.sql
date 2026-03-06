ALTER TABLE users_auth ADD COLUMN provider_email TEXT NULL;

-- Backfill existing OAuth rows with the user's account email
UPDATE users_auth ua
SET provider_email = u.email
FROM users u
WHERE ua.user_id = u.id AND ua.auth_provider != 'local';
