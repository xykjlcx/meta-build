CREATE TABLE mb_iam_route_tree (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    parent_id       BIGINT          NOT NULL DEFAULT 0,
    path            VARCHAR(255)    NOT NULL,
    name            VARCHAR(128)    NOT NULL,
    component       VARCHAR(255),
    redirect        VARCHAR(255),
    icon            VARCHAR(128),
    sort_order      INT             NOT NULL DEFAULT 0,
    hidden          BOOLEAN         NOT NULL DEFAULT false,
    permission_code VARCHAR(128),
    route_type      VARCHAR(32)     NOT NULL DEFAULT 'MENU',
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_route_tree_parent ON mb_iam_route_tree (tenant_id, parent_id);
COMMENT ON TABLE mb_iam_route_tree IS '路由树';
