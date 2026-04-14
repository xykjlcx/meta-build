-- M4: mb_iam_user 补充字段（version + 密码安全）
ALTER TABLE mb_iam_user ADD COLUMN version INT NOT NULL DEFAULT 0;
ALTER TABLE mb_iam_user ADD COLUMN password_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE mb_iam_user ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;
