CREATE TABLE mb_iam_login_log (
    id              BIGINT          PRIMARY KEY,
    user_id         BIGINT,
    username        VARCHAR(64)     NOT NULL,
    login_ip        VARCHAR(64),
    user_agent      VARCHAR(512),
    success         BOOLEAN         NOT NULL,
    failure_reason  VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_login_log_user ON mb_iam_login_log (user_id, created_at DESC);
CREATE INDEX idx_login_log_time ON mb_iam_login_log (created_at DESC);
COMMENT ON TABLE mb_iam_login_log IS '登录日志';
