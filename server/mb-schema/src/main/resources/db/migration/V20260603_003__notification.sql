CREATE TABLE mb_notification (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    title           VARCHAR(255)    NOT NULL,
    content         TEXT,
    type            VARCHAR(32)     NOT NULL DEFAULT 'SYSTEM',
    sender_id       BIGINT,
    status          SMALLINT        NOT NULL DEFAULT 1,
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notification_status ON mb_notification (tenant_id, status);
CREATE INDEX idx_notification_time ON mb_notification (tenant_id, created_at DESC);

CREATE TABLE mb_notification_read (
    notification_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, user_id)
);
COMMENT ON TABLE mb_notification IS '通知公告表';
COMMENT ON TABLE mb_notification_read IS '通知已读记录（追加表）';
