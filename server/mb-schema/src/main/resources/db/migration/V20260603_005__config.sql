CREATE TABLE mb_config (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    config_key      VARCHAR(128)    NOT NULL,
    config_value    TEXT,
    config_type     VARCHAR(32)     NOT NULL DEFAULT 'SYSTEM',
    remark          VARCHAR(512),
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_config_tenant_key ON mb_config (tenant_id, config_key);
COMMENT ON TABLE mb_config IS '系统配置表';
