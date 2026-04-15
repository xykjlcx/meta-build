-- ===== 微信绑定关系表 =====
CREATE TABLE mb_user_wechat_binding (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    user_id         BIGINT NOT NULL,
    platform        VARCHAR(20) NOT NULL,   -- 'MP' (公众号) / 'MINI' (小程序)
    app_id          VARCHAR(64) NOT NULL,
    open_id         VARCHAR(64) NOT NULL,
    union_id        VARCHAR(64),            -- 同一开放平台下多应用关联
    nickname        VARCHAR(100),
    avatar_url      VARCHAR(500),
    bound_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, user_id, platform, app_id)
);

CREATE INDEX idx_wechat_binding_user ON mb_user_wechat_binding (tenant_id, user_id);
CREATE INDEX idx_wechat_binding_openid ON mb_user_wechat_binding (app_id, open_id);

COMMENT ON TABLE mb_user_wechat_binding IS '微信绑定关系';
COMMENT ON COLUMN mb_user_wechat_binding.tenant_id IS '租户 ID（v1 默认 0）';
COMMENT ON COLUMN mb_user_wechat_binding.user_id IS '系统用户 ID';
COMMENT ON COLUMN mb_user_wechat_binding.platform IS '平台类型：MP=公众号 MINI=小程序';
COMMENT ON COLUMN mb_user_wechat_binding.app_id IS '微信应用 AppID';
COMMENT ON COLUMN mb_user_wechat_binding.open_id IS '微信 OpenID（同一用户在不同应用有不同 OpenID）';
COMMENT ON COLUMN mb_user_wechat_binding.union_id IS 'UnionID（同一开放平台下多应用共享）';
COMMENT ON COLUMN mb_user_wechat_binding.nickname IS '微信昵称';
COMMENT ON COLUMN mb_user_wechat_binding.avatar_url IS '微信头像 URL';
COMMENT ON COLUMN mb_user_wechat_binding.bound_at IS '绑定时间';
