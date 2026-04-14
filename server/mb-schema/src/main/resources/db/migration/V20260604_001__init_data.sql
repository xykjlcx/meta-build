-- 初始化数据：超管用户 + 超管角色 + 默认部门 + 绑定
-- 使用固定 ID 以确保可重入

-- 超管用户（id=1）
INSERT INTO mb_iam_user (id, tenant_id, username, password_hash, status, owner_dept_id, created_by, created_at, updated_by, updated_at, version, password_updated_at, must_change_password)
VALUES (1, 0, 'admin', '$2a$10$N.ZOn9G6/YOoFV0ui0rUGuECf8CSQQJ0G1kCq6N1wJi0ACG0BXWPW', 1, 0, 0, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP, true)
ON CONFLICT (id) DO NOTHING;

-- 默认部门（根部门）
INSERT INTO mb_iam_dept (id, tenant_id, parent_id, name, sort_order, status, owner_dept_id, created_by, created_at, updated_by, updated_at)
VALUES (1, 0, 0, '总公司', 1, 1, 1, 0, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 超管角色
INSERT INTO mb_iam_role (id, tenant_id, name, code, sort_order, status, data_scope, owner_dept_id, created_by, created_at, updated_by, updated_at)
VALUES (1, 0, '超级管理员', 'SUPER_ADMIN', 1, 1, 'ALL', 1, 0, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 更新 M1 已有的 admin 用户（id=1），绑定部门
UPDATE mb_iam_user SET dept_id = 1, owner_dept_id = 1 WHERE id = 1;

-- 超管用户-角色绑定
INSERT INTO mb_iam_user_role (user_id, role_id) VALUES (1, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;
