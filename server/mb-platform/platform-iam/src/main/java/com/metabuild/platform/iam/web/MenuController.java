package com.metabuild.platform.iam.web;

import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.iam.api.dto.MenuCreateRequest;
import com.metabuild.platform.iam.api.dto.MenuResponse;
import com.metabuild.platform.iam.domain.menu.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 菜单管理 Controller。
 */
@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    @RequirePermission("iam:menu:list")
    public List<MenuResponse> tree() {
        return menuService.tree();
    }

    @GetMapping("/{id}")
    @RequirePermission("iam:menu:detail")
    public MenuResponse getById(@PathVariable Long id) {
        return menuService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("iam:menu:create")
    public MenuResponse create(@Valid @RequestBody MenuCreateRequest request) {
        Long id = menuService.createMenu(request);
        return menuService.getById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("iam:menu:delete")
    public void delete(@PathVariable Long id) {
        menuService.deleteMenu(id);
    }
}
