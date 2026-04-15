-- ===== 通知公告主表 =====
CREATE TABLE biz_notice (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,                        -- 富文本 HTML（后端 jsoup 净化）
    status          SMALLINT NOT NULL DEFAULT 0, -- 0=草稿 1=已发布 2=已撤回
    pinned          BOOLEAN NOT NULL DEFAULT FALSE,
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    owner_dept_id   BIGINT NOT NULL DEFAULT 0,   -- 数据权限字段
    version         INT NOT NULL DEFAULT 0,      -- 乐观锁
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_tenant_status ON biz_notice (tenant_id, status);
CREATE INDEX idx_notice_tenant_created ON biz_notice (tenant_id, created_at DESC);
CREATE INDEX idx_notice_tenant_dept ON biz_notice (tenant_id, owner_dept_id);
CREATE INDEX idx_notice_pinned ON biz_notice (tenant_id, pinned DESC, created_at DESC);

COMMENT ON TABLE biz_notice IS '通知公告';
COMMENT ON COLUMN biz_notice.id IS '主键（Snowflake）';
COMMENT ON COLUMN biz_notice.tenant_id IS '租户 ID（v1 默认 0）';
COMMENT ON COLUMN biz_notice.title IS '公告标题';
COMMENT ON COLUMN biz_notice.content IS '公告内容（富文本 HTML，后端 jsoup 净化）';
COMMENT ON COLUMN biz_notice.status IS '状态：0=草稿 1=已发布 2=已撤回';
COMMENT ON COLUMN biz_notice.pinned IS '是否置顶';
COMMENT ON COLUMN biz_notice.start_time IS '生效开始时间';
COMMENT ON COLUMN biz_notice.end_time IS '生效结束时间';
COMMENT ON COLUMN biz_notice.owner_dept_id IS '所属部门 ID（数据权限）';
COMMENT ON COLUMN biz_notice.version IS '乐观锁版本号';
COMMENT ON COLUMN biz_notice.created_by IS '创建人 ID';
COMMENT ON COLUMN biz_notice.created_at IS '创建时间';
COMMENT ON COLUMN biz_notice.updated_by IS '最后修改人 ID';
COMMENT ON COLUMN biz_notice.updated_at IS '最后修改时间';

-- ===== 通知目标表（多态关联）=====
CREATE TABLE biz_notice_target (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    target_type     VARCHAR(20) NOT NULL,   -- ALL / DEPT / ROLE / USER
    target_id       BIGINT,                 -- 对应 ID（ALL 时为 NULL）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_target_notice ON biz_notice_target (notice_id);

COMMENT ON TABLE biz_notice_target IS '通知目标（多态关联：全员/部门/角色/用户）';
COMMENT ON COLUMN biz_notice_target.target_type IS '目标类型：ALL=全员 DEPT=部门 ROLE=角色 USER=指定用户';
COMMENT ON COLUMN biz_notice_target.target_id IS '目标 ID（ALL 时为 NULL，DEPT=部门ID，ROLE=角色ID，USER=用户ID）';

-- ===== 通知接收人表（发布时展开到具体用户）=====
CREATE TABLE biz_notice_recipient (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    read_at         TIMESTAMPTZ,            -- NULL=未读，有值=已读
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uk_notice_recipient ON biz_notice_recipient (notice_id, user_id);
CREATE INDEX idx_notice_recipient_user ON biz_notice_recipient (user_id, read_at);
CREATE INDEX idx_notice_recipient_notice ON biz_notice_recipient (notice_id);

COMMENT ON TABLE biz_notice_recipient IS '通知接收人（发布时从 target 展开到具体用户）';
COMMENT ON COLUMN biz_notice_recipient.read_at IS '已读时间（NULL=未读）';

-- ===== 公告附件关联表 =====
CREATE TABLE biz_notice_attachment (
    id              BIGINT PRIMARY KEY,
    notice_id       BIGINT NOT NULL,
    file_id         BIGINT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notice_att_notice ON biz_notice_attachment (notice_id);
CREATE INDEX idx_notice_att_file ON biz_notice_attachment (file_id);

COMMENT ON TABLE biz_notice_attachment IS '公告附件关联';
COMMENT ON COLUMN biz_notice_attachment.tenant_id IS '租户 ID';
COMMENT ON COLUMN biz_notice_attachment.created_by IS '创建人 ID';
