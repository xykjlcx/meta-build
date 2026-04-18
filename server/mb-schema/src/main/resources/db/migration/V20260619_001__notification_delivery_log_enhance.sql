-- ===== 通知投递日志表字段语义重构（见 meta-0023 连带改进） =====
-- 1) notice_id → business_id（业务来源 ID 通用化，配合 business_type 使用）
-- 2) 原 message_type（实际存的是业务事件 code）删除，重新区分为 business_type / event_type / message_type 三字段
-- 3) duration_ms INTEGER → BIGINT（对齐 mb_operation_log 的 duration_ms，避免超时场景 cast 丢精度）
-- 4) 新增 trace_id 关联 MDC 链路追踪，便于后续 ELK / OpenTelemetry 集成

-- 字段重命名 + 类型调整
ALTER TABLE mb_notification_delivery_log RENAME COLUMN notice_id TO business_id;
ALTER TABLE mb_notification_delivery_log DROP COLUMN message_type;
ALTER TABLE mb_notification_delivery_log ALTER COLUMN duration_ms TYPE BIGINT;

-- 索引重命名（保持语义一致）
ALTER INDEX idx_notif_delivery_log_notice_channel RENAME TO idx_notif_delivery_log_business_channel;

-- 新增字段
ALTER TABLE mb_notification_delivery_log ADD COLUMN business_type VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE mb_notification_delivery_log ADD COLUMN event_type VARCHAR(64);
ALTER TABLE mb_notification_delivery_log ADD COLUMN message_type VARCHAR(32);
ALTER TABLE mb_notification_delivery_log ADD COLUMN trace_id VARCHAR(64);

-- 注释
COMMENT ON COLUMN mb_notification_delivery_log.business_id IS '业务来源 ID（notice.id / order.id / approval.id），由 business_type 区分';
COMMENT ON COLUMN mb_notification_delivery_log.business_type IS '业务大类：NOTICE / ORDER / APPROVAL 等';
COMMENT ON COLUMN mb_notification_delivery_log.event_type IS '业务事件：NOTICE_PUBLISHED / ORDER_SHIPPED 等';
COMMENT ON COLUMN mb_notification_delivery_log.message_type IS '消息格式：TEXT / HTML / TEMPLATE / CARD 等（区别于 channel 投递渠道）';
COMMENT ON COLUMN mb_notification_delivery_log.trace_id IS 'MDC 链路追踪 ID，关联 ELK / OpenTelemetry 日志';
COMMENT ON COLUMN mb_notification_delivery_log.duration_ms IS '耗时（毫秒，BIGINT）';
