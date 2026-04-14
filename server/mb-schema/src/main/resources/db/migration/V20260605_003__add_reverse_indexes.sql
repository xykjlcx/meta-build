-- =============================================================
-- V20260605_003__add_reverse_indexes.sql
-- FK 反向查询索引，避免级联删除时全表扫描
-- =============================================================

-- user_role 按 role_id 反向查询
CREATE INDEX idx_iam_user_role_role_id ON mb_iam_user_role(role_id);

-- role_menu 按 menu_id 反向查询
CREATE INDEX idx_iam_role_menu_menu_id ON mb_iam_role_menu(menu_id);

-- role_data_scope_dept 按 dept_id 反向查询
CREATE INDEX idx_iam_role_dsd_dept_id ON mb_iam_role_data_scope_dept(dept_id);

-- notification_read 按 user_id 查询（"我的已读通知"）
CREATE INDEX idx_notification_read_user_id ON mb_notification_read(user_id, read_at DESC);

-- password_history 按 user_id（CASCADE 删除用户时需要）
CREATE INDEX idx_iam_password_history_user_id ON mb_iam_password_history(user_id);

-- login_log 按 user_id（SET NULL 时需要；原有复合索引前缀不匹配纯 user_id 查找）
CREATE INDEX idx_iam_login_log_user_id ON mb_iam_login_log(user_id);

-- notification_read 按 notification_id（CASCADE 删除通知时需要）
CREATE INDEX idx_notification_read_notification_id ON mb_notification_read(notification_id);
