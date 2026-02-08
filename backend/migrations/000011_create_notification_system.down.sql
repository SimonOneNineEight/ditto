DROP TRIGGER IF EXISTS update_user_notification_preferences_timestamp ON user_notification_preferences;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP TABLE IF EXISTS user_notification_preferences;
DROP TABLE IF EXISTS notifications;
