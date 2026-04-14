-- =============================================================
-- V20260414_001__add_foreign_keys.sql
-- 全表补 FK：核心表 RESTRICT，弱关联 SET NULL
-- =============================================================

-- ==============================
-- 第一步：DROP NOT NULL（必须在 UPDATE NULL 之前）
-- ==============================
ALTER TABLE mb_iam_dept ALTER COLUMN parent_id DROP NOT NULL;
ALTER TABLE mb_iam_dept ALTER COLUMN parent_id SET DEFAULT NULL;
ALTER TABLE mb_iam_route_tree ALTER COLUMN parent_id DROP NOT NULL;
ALTER TABLE mb_iam_route_tree ALTER COLUMN parent_id SET DEFAULT NULL;
ALTER TABLE mb_iam_menu ALTER COLUMN parent_id DROP NOT NULL;
ALTER TABLE mb_iam_menu ALTER COLUMN parent_id SET DEFAULT NULL;
ALTER TABLE mb_file_metadata ALTER COLUMN uploader_id DROP NOT NULL;
ALTER TABLE mb_operation_log ALTER COLUMN user_id DROP NOT NULL;
-- mb_iam_login_log.user_id 本就 NULLABLE，无需 ALTER

-- ==============================
-- 第二步：修正 0 → NULL 占位值
-- ==============================
UPDATE mb_iam_dept SET parent_id = NULL WHERE parent_id = 0;
UPDATE mb_iam_user SET dept_id = NULL WHERE dept_id = 0;
UPDATE mb_iam_dept SET leader_user_id = NULL WHERE leader_user_id = 0;
UPDATE mb_iam_route_tree SET parent_id = NULL WHERE parent_id = 0;
UPDATE mb_iam_menu SET parent_id = NULL WHERE parent_id = 0;
UPDATE mb_file_metadata SET uploader_id = NULL WHERE uploader_id = 0;
UPDATE mb_operation_log SET user_id = NULL WHERE user_id = 0;
UPDATE mb_notification SET sender_id = NULL WHERE sender_id = 0;

-- ==============================
-- 第三步：添加外键约束
-- ==============================

-- iam_user → iam_dept
ALTER TABLE mb_iam_user
    ADD CONSTRAINT fk_iam_user_dept
    FOREIGN KEY (dept_id) REFERENCES mb_iam_dept(id)
    ON DELETE RESTRICT;

-- iam_dept → iam_dept（自引用，parent_id）
ALTER TABLE mb_iam_dept
    ADD CONSTRAINT fk_iam_dept_parent
    FOREIGN KEY (parent_id) REFERENCES mb_iam_dept(id)
    ON DELETE RESTRICT;

-- iam_dept → iam_user（leader_user_id）
ALTER TABLE mb_iam_dept
    ADD CONSTRAINT fk_iam_dept_leader
    FOREIGN KEY (leader_user_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- iam_user_role → iam_user
ALTER TABLE mb_iam_user_role
    ADD CONSTRAINT fk_iam_user_role_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE CASCADE;

-- iam_user_role → iam_role
ALTER TABLE mb_iam_user_role
    ADD CONSTRAINT fk_iam_user_role_role
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id)
    ON DELETE CASCADE;

-- iam_role_menu → iam_role
ALTER TABLE mb_iam_role_menu
    ADD CONSTRAINT fk_iam_role_menu_role
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id)
    ON DELETE CASCADE;

-- iam_role_menu → iam_menu
ALTER TABLE mb_iam_role_menu
    ADD CONSTRAINT fk_iam_role_menu_menu
    FOREIGN KEY (menu_id) REFERENCES mb_iam_menu(id)
    ON DELETE CASCADE;

-- iam_role_data_scope_dept → iam_role
ALTER TABLE mb_iam_role_data_scope_dept
    ADD CONSTRAINT fk_iam_role_dsd_role
    FOREIGN KEY (role_id) REFERENCES mb_iam_role(id)
    ON DELETE CASCADE;

-- iam_role_data_scope_dept → iam_dept
ALTER TABLE mb_iam_role_data_scope_dept
    ADD CONSTRAINT fk_iam_role_dsd_dept
    FOREIGN KEY (dept_id) REFERENCES mb_iam_dept(id)
    ON DELETE CASCADE;

-- iam_password_history → iam_user
ALTER TABLE mb_iam_password_history
    ADD CONSTRAINT fk_iam_password_history_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE CASCADE;

-- iam_login_log → iam_user（弱关联，用户删除后日志保留）
ALTER TABLE mb_iam_login_log
    ADD CONSTRAINT fk_iam_login_log_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- dict_data → dict_type
ALTER TABLE mb_dict_data
    ADD CONSTRAINT fk_dict_data_dict_type
    FOREIGN KEY (dict_type_id) REFERENCES mb_dict_type(id)
    ON DELETE RESTRICT;

-- file_metadata → iam_user（uploader）
ALTER TABLE mb_file_metadata
    ADD CONSTRAINT fk_file_metadata_uploader
    FOREIGN KEY (uploader_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- notification → iam_user（sender）
ALTER TABLE mb_notification
    ADD CONSTRAINT fk_notification_sender
    FOREIGN KEY (sender_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- notification_read → notification
ALTER TABLE mb_notification_read
    ADD CONSTRAINT fk_notification_read_notification
    FOREIGN KEY (notification_id) REFERENCES mb_notification(id)
    ON DELETE CASCADE;

-- notification_read → iam_user
ALTER TABLE mb_notification_read
    ADD CONSTRAINT fk_notification_read_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE CASCADE;

-- operation_log → iam_user（弱关联）
ALTER TABLE mb_operation_log
    ADD CONSTRAINT fk_operation_log_user
    FOREIGN KEY (user_id) REFERENCES mb_iam_user(id)
    ON DELETE SET NULL;

-- iam_route_tree → iam_route_tree（自引用）
ALTER TABLE mb_iam_route_tree
    ADD CONSTRAINT fk_iam_route_tree_parent
    FOREIGN KEY (parent_id) REFERENCES mb_iam_route_tree(id)
    ON DELETE CASCADE;

-- iam_menu → iam_menu（自引用）
ALTER TABLE mb_iam_menu
    ADD CONSTRAINT fk_iam_menu_parent
    FOREIGN KEY (parent_id) REFERENCES mb_iam_menu(id)
    ON DELETE CASCADE;

-- 说明：owner_dept_id 不加 FK —— 此字段是数据权限快照字段，记录操作时的归属部门
-- job_log 不加 FK —— 独立调度记录，无用户关联
