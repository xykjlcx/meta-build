package com.metabuild.platform.iam.web;

import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.cmd.DeptCreateCmd;
import com.metabuild.platform.iam.api.vo.DeptVo;
import com.metabuild.platform.iam.domain.dept.DeptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 部门管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/depts")
@RequiredArgsConstructor
public class DeptController {

    private final DeptService deptService;

    @GetMapping
    @RequirePermission("iam:dept:list")
    public List<DeptVo> tree() {
        return deptService.tree();
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:dept:detail")
    public DeptVo getById(@PathVariable Long id) {
        return deptService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:dept:create")
    public DeptVo create(@Valid @RequestBody DeptCreateCmd request) {
        Long id = deptService.createDept(request);
        return deptService.getById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("iam:dept:delete")
    public void delete(@PathVariable Long id) {
        deptService.deleteDept(id);
    }
}
