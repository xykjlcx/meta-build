-- =============================================================
-- V20260605_002__add_check_constraints.sql
-- 枚举字段补 CHECK 约束，防止脏数据
-- =============================================================

-- iam_role.data_scope
ALTER TABLE mb_iam_role
    ADD CONSTRAINT chk_iam_role_data_scope
    CHECK (data_scope IN ('ALL', 'OWN_DEPT', 'OWN_DEPT_AND_CHILD', 'CUSTOM_DEPT', 'SELF'));

-- iam_route_tree.route_type
ALTER TABLE mb_iam_route_tree
    ADD CONSTRAINT chk_iam_route_tree_route_type
    CHECK (route_type IN ('LAYOUT', 'PAGE', 'MENU', 'BUTTON', 'EXTERNAL'));

-- iam_menu.menu_type
ALTER TABLE mb_iam_menu
    ADD CONSTRAINT chk_iam_menu_menu_type
    CHECK (menu_type IN ('DIRECTORY', 'MENU', 'BUTTON'));

-- notification.type
ALTER TABLE mb_notification
    ADD CONSTRAINT chk_notification_type
    CHECK (type IN ('SYSTEM', 'BUSINESS', 'APPROVAL'));

-- notification.status（0=草稿 1=已发布 2=已撤回）
ALTER TABLE mb_notification
    ADD CONSTRAINT chk_notification_status
    CHECK (status IN (0, 1, 2));

-- config.config_type
ALTER TABLE mb_config
    ADD CONSTRAINT chk_config_config_type
    CHECK (config_type IN ('SYSTEM', 'BUSINESS'));

-- job_log.status
ALTER TABLE mb_job_log
    ADD CONSTRAINT chk_job_log_status
    CHECK (status IN ('SUCCESS', 'FAILURE', 'RUNNING'));

-- 通用 status（0=停用 1=正常）
ALTER TABLE mb_iam_user
    ADD CONSTRAINT chk_iam_user_status CHECK (status IN (0, 1));
ALTER TABLE mb_iam_role
    ADD CONSTRAINT chk_iam_role_status CHECK (status IN (0, 1));
ALTER TABLE mb_iam_dept
    ADD CONSTRAINT chk_iam_dept_status CHECK (status IN (0, 1));
ALTER TABLE mb_dict_type
    ADD CONSTRAINT chk_dict_type_status CHECK (status IN (0, 1));
ALTER TABLE mb_dict_data
    ADD CONSTRAINT chk_dict_data_status CHECK (status IN (0, 1));
