CREATE TABLE mb_iam_menu (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    parent_id       BIGINT          NOT NULL DEFAULT 0,
    name            VARCHAR(128)    NOT NULL,
    permission_code VARCHAR(128),
    menu_type       VARCHAR(32)     NOT NULL DEFAULT 'MENU',
    icon            VARCHAR(128),
    sort_order      INT             NOT NULL DEFAULT 0,
    visible         BOOLEAN         NOT NULL DEFAULT true,
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_iam_menu_parent ON mb_iam_menu (tenant_id, parent_id);
COMMENT ON TABLE mb_iam_menu IS '菜单表';
