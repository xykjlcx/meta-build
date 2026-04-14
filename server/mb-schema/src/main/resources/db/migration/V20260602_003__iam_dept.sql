CREATE TABLE mb_iam_dept (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    parent_id       BIGINT          NOT NULL DEFAULT 0,
    name            VARCHAR(128)    NOT NULL,
    sort_order      INT             NOT NULL DEFAULT 0,
    status          SMALLINT        NOT NULL DEFAULT 1,
    leader_user_id  BIGINT,
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_iam_dept_parent ON mb_iam_dept (tenant_id, parent_id);
COMMENT ON TABLE mb_iam_dept IS '部门表';
