-- =============================================================
-- V20260605_004__rename_oplog_to_log.sql
-- platform-oplog → platform-log：表名 + 索引 + FK 约束重命名
-- =============================================================

-- 表重命名
ALTER TABLE mb_operation_log RENAME TO mb_log_operation;

-- 索引重命名（保持与新表名一致）
ALTER INDEX idx_oplog_user RENAME TO idx_log_operation_user;
ALTER INDEX idx_oplog_time RENAME TO idx_log_operation_time;
ALTER INDEX idx_oplog_module RENAME TO idx_log_operation_module;

-- FK 约束重命名
ALTER TABLE mb_log_operation RENAME CONSTRAINT fk_operation_log_user TO fk_log_operation_user;
