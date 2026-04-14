CREATE TABLE mb_job_log (
    id              BIGINT          PRIMARY KEY,
    job_name        VARCHAR(128)    NOT NULL,
    status          VARCHAR(32)     NOT NULL,
    start_time      TIMESTAMPTZ     NOT NULL,
    end_time        TIMESTAMPTZ,
    duration_ms     BIGINT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_job_log_name ON mb_job_log (job_name, created_at DESC);
COMMENT ON TABLE mb_job_log IS '定时任务日志（追加表）';
