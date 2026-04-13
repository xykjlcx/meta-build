-- M1: 用户表（平台 IAM 核心表）
-- 命名规范：V<yyyymmdd>_<nnn>__<module>_<table>.sql（ADR-0008）
-- 表前缀：mb_（ADR-0009）

CREATE TABLE mb_iam_user (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    username        VARCHAR(64)     NOT NULL,
    password_hash   VARCHAR(128)    NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(32),
    nickname        VARCHAR(64),
    avatar          VARCHAR(512),
    dept_id         BIGINT,
    status          SMALLINT        NOT NULL DEFAULT 1,
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 同租户用户名唯一
CREATE UNIQUE INDEX uk_iam_user_tenant_username ON mb_iam_user (tenant_id, username);

-- 查询优化索引
CREATE INDEX idx_iam_user_dept ON mb_iam_user (tenant_id, dept_id);
CREATE INDEX idx_iam_user_status ON mb_iam_user (tenant_id, status);

COMMENT ON TABLE mb_iam_user IS '用户表';
COMMENT ON COLUMN mb_iam_user.id IS '用户 ID（Snowflake）';
COMMENT ON COLUMN mb_iam_user.tenant_id IS '租户 ID（v1 固定为 0，v1.5+ 启用多租户）';
COMMENT ON COLUMN mb_iam_user.status IS '状态：1=启用，0=停用';
COMMENT ON COLUMN mb_iam_user.owner_dept_id IS '数据权限归属部门';
