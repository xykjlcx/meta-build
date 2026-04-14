CREATE TABLE mb_iam_role (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    name            VARCHAR(64)     NOT NULL,
    code            VARCHAR(64)     NOT NULL,
    sort_order      INT             NOT NULL DEFAULT 0,
    status          SMALLINT        NOT NULL DEFAULT 1,
    data_scope      VARCHAR(32)     NOT NULL DEFAULT 'SELF',
    remark          VARCHAR(512),
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_iam_role_tenant_code ON mb_iam_role (tenant_id, code);
COMMENT ON TABLE mb_iam_role IS '角色表';
COMMENT ON COLUMN mb_iam_role.data_scope IS '数据权限范围：ALL/CUSTOM_DEPT/OWN_DEPT/OWN_DEPT_AND_CHILD/SELF';
