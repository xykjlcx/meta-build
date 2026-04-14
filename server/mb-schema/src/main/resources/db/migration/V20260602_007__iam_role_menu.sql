CREATE TABLE mb_iam_role_menu (
    role_id     BIGINT NOT NULL,
    menu_id     BIGINT NOT NULL,
    PRIMARY KEY (role_id, menu_id)
);
COMMENT ON TABLE mb_iam_role_menu IS '角色-菜单关联表';
