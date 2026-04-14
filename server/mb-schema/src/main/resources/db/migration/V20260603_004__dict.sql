CREATE TABLE mb_dict_type (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    name            VARCHAR(128)    NOT NULL,
    code            VARCHAR(64)     NOT NULL,
    status          SMALLINT        NOT NULL DEFAULT 1,
    remark          VARCHAR(512),
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_dict_type_tenant_code ON mb_dict_type (tenant_id, code);

CREATE TABLE mb_dict_data (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    dict_type_id    BIGINT          NOT NULL,
    label           VARCHAR(128)    NOT NULL,
    value           VARCHAR(128)    NOT NULL,
    sort_order      INT             NOT NULL DEFAULT 0,
    status          SMALLINT        NOT NULL DEFAULT 1,
    css_class       VARCHAR(64),
    remark          VARCHAR(512),
    version         INT             NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uk_dict_data_type_value ON mb_dict_data (tenant_id, dict_type_id, value);
COMMENT ON TABLE mb_dict_type IS '字典类型表';
COMMENT ON TABLE mb_dict_data IS '字典数据表';
