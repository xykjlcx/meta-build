-- ===== 通知发送记录表 =====
CREATE TABLE mb_notification_log (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    channel_type    VARCHAR(20) NOT NULL,    -- IN_APP / EMAIL / WECHAT_MP / WECHAT_MINI
    recipient_id    BIGINT NOT NULL,
    template_code   VARCHAR(100),
    module          VARCHAR(50),
    reference_id    VARCHAR(100),
    status          SMALLINT NOT NULL,       -- 0=pending 1=success 2=failed
    error_message   TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_log_recipient ON mb_notification_log (tenant_id, recipient_id, created_at DESC);
CREATE INDEX idx_notif_log_module_ref ON mb_notification_log (module, reference_id);
CREATE INDEX idx_notif_log_status ON mb_notification_log (tenant_id, status);

COMMENT ON TABLE mb_notification_log IS '通知发送记录';
COMMENT ON COLUMN mb_notification_log.channel_type IS '渠道类型：IN_APP/EMAIL/WECHAT_MP/WECHAT_MINI';
COMMENT ON COLUMN mb_notification_log.recipient_id IS '接收人用户 ID';
COMMENT ON COLUMN mb_notification_log.template_code IS '模板编码';
COMMENT ON COLUMN mb_notification_log.module IS '来源模块（notice/order/...）';
COMMENT ON COLUMN mb_notification_log.reference_id IS '关联业务 ID';
COMMENT ON COLUMN mb_notification_log.status IS '状态：0=pending 1=success 2=failed';
COMMENT ON COLUMN mb_notification_log.error_message IS '失败原因';
COMMENT ON COLUMN mb_notification_log.sent_at IS '发送时间';
