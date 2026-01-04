CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL, -- 'url_extraction', 'api_general', etc
    request_count INT NOT NULL DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_user_resource_window
    ON rate_limits(user_id, resource, window_start, window_end);

CREATE INDEX idx_rate_limits_window_end ON rate_limits(window_end);


