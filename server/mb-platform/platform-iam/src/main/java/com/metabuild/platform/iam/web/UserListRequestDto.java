package com.metabuild.platform.iam.web;

import com.metabuild.infra.web.pagination.PageRequestDto;

/**
 * 用户分页列表请求 DTO。
 *
 * <p>在通用 PageRequestDto 基础上扩展 IAM 特定筛选字段：
 * {@code deptId} / {@code includeDescendants} / {@code status} / {@code keyword}。
 */
public class UserListRequestDto extends PageRequestDto {

    private Long deptId;
    /** true = 按部门树递归查后代（需 deptId 不为空） */
    private Boolean includeDescendants;
    private Short status;
    /** 模糊搜索 username / nickname / email（%xxx%） */
    private String keyword;

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public Boolean getIncludeDescendants() {
        return includeDescendants;
    }

    public void setIncludeDescendants(Boolean includeDescendants) {
        this.includeDescendants = includeDescendants;
    }

    public Short getStatus() {
        return status;
    }

    public void setStatus(Short status) {
        this.status = status;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }
}
