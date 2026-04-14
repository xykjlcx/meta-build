CREATE TABLE mb_iam_password_history (
    id              BIGINT          PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    password_hash   VARCHAR(128)    NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_password_history_user ON mb_iam_password_history (user_id, created_at DESC);
COMMENT ON TABLE mb_iam_password_history IS '密码历史表（防重用）';
