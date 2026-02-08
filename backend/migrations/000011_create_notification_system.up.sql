CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    interview_24h BOOLEAN DEFAULT TRUE,
    interview_1h BOOLEAN DEFAULT TRUE,
    assessment_3d BOOLEAN DEFAULT TRUE,
    assessment_1d BOOLEAN DEFAULT TRUE,
    assessment_1h BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_read ON notifications(user_id, read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE TRIGGER update_user_notification_preferences_timestamp
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
