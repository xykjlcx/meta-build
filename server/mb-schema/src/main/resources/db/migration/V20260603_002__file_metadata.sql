CREATE TABLE mb_file_metadata (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    original_name   VARCHAR(255)    NOT NULL,
    stored_name     VARCHAR(255)    NOT NULL,
    file_path       VARCHAR(512)    NOT NULL,
    file_size       BIGINT          NOT NULL,
    content_type    VARCHAR(128),
    file_extension  VARCHAR(32),
    sha256          VARCHAR(64),
    uploader_id     BIGINT          NOT NULL,
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_file_sha256 ON mb_file_metadata (sha256);
CREATE INDEX idx_file_uploader ON mb_file_metadata (tenant_id, uploader_id);
COMMENT ON TABLE mb_file_metadata IS '文件元数据表';
