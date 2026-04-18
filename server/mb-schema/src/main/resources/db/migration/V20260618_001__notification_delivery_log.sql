-- ===== 通知投递日志表（按渠道维度记录投递结果） =====
CREATE TABLE mb_notification_delivery_log (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    notice_id       BIGINT,
    message_type    VARCHAR(64),
    channel         VARCHAR(32) NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(16) NOT NULL,
    duration_ms     INTEGER NOT NULL,
    error_code      VARCHAR(64),
    error_message   VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_delivery_log_notice_channel ON mb_notification_delivery_log (notice_id, channel);
CREATE INDEX idx_notif_delivery_log_created_at ON mb_notification_delivery_log (created_at);
CREATE INDEX idx_notif_delivery_log_status ON mb_notification_delivery_log (status);

COMMENT ON TABLE mb_notification_delivery_log IS '通知投递日志（按渠道维度，区别于按收件人维度的 mb_notification_log）';
COMMENT ON COLUMN mb_notification_delivery_log.notice_id IS '业务来源 ID（如 notice.id），可空';
COMMENT ON COLUMN mb_notification_delivery_log.message_type IS '消息类型，如 NOTICE_PUBLISHED';
COMMENT ON COLUMN mb_notification_delivery_log.channel IS '渠道：IN_APP/EMAIL/WECHAT_MP/WECHAT_MINI';
COMMENT ON COLUMN mb_notification_delivery_log.recipient_count IS '本次投递的收件人数量';
COMMENT ON COLUMN mb_notification_delivery_log.status IS '状态：SUCCESS/TIMEOUT/FAILED';
COMMENT ON COLUMN mb_notification_delivery_log.duration_ms IS '耗时（毫秒）';
COMMENT ON COLUMN mb_notification_delivery_log.error_code IS '失败错误码';
COMMENT ON COLUMN mb_notification_delivery_log.error_message IS '失败信息（最多 500 字符）';
