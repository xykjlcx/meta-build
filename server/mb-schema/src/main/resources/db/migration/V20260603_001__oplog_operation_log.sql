CREATE TABLE mb_operation_log (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    user_id         BIGINT          NOT NULL,
    username        VARCHAR(64)     NOT NULL,
    module          VARCHAR(64)     NOT NULL,
    operation       VARCHAR(128)    NOT NULL,
    method          VARCHAR(255)    NOT NULL,
    request_url     VARCHAR(512),
    request_params  TEXT,
    response_result TEXT,
    ip              VARCHAR(64),
    user_agent      VARCHAR(512),
    duration_ms     BIGINT,
    success         BOOLEAN         NOT NULL DEFAULT true,
    error_message   TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oplog_user ON mb_operation_log (tenant_id, user_id, created_at DESC);
CREATE INDEX idx_oplog_time ON mb_operation_log (tenant_id, created_at DESC);
CREATE INDEX idx_oplog_module ON mb_operation_log (tenant_id, module);
COMMENT ON TABLE mb_operation_log IS '操作日志（追加表，不注册 DataScope）';
