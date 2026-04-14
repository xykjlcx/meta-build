CREATE TABLE mb_iam_role_data_scope_dept (
    role_id     BIGINT NOT NULL,
    dept_id     BIGINT NOT NULL,
    PRIMARY KEY (role_id, dept_id)
);
COMMENT ON TABLE mb_iam_role_data_scope_dept IS '角色-数据权限自定义部门关联表（CUSTOM_DEPT 时使用）';
