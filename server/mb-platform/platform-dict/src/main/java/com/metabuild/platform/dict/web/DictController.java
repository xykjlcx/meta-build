package com.metabuild.platform.dict.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.dict.api.dto.DictDataCreateCommand;
import com.metabuild.platform.dict.api.dto.DictDataView;
import com.metabuild.platform.dict.api.dto.DictTypeCreateCommand;
import com.metabuild.platform.dict.api.dto.DictTypeView;
import com.metabuild.platform.dict.domain.DictService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 字典管理 Controller（DictType + DictData）。
 */
@RestController
@RequestMapping("/api/v1/dict")
@RequiredArgsConstructor
public class DictController {

    private final DictService dictService;

    // ───────── DictType ─────────

    @GetMapping("/types")
    @RequirePermission("dict:type:list")
    public PageResult<DictTypeView> listTypes(PageQuery query) {
        return dictService.listTypes(query);
    }

    @GetMapping("/types/{id}")
    @RequirePermission("dict:type:detail")
    public DictTypeView getType(@PathVariable Long id) {
        return dictService.getTypeById(id);
    }

    @PostMapping("/types")
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("dict:type:create")
    public DictTypeView createType(@Valid @RequestBody DictTypeCreateCommand request) {
        Long id = dictService.createType(request);
        return dictService.getTypeById(id);
    }

    @DeleteMapping("/types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("dict:type:delete")
    public void deleteType(@PathVariable Long id) {
        dictService.deleteType(id);
    }

    // ───────── DictData ─────────

    @GetMapping("/types/{typeId}/data")
    @RequirePermission("dict:data:list")
    public List<DictDataView> listData(@PathVariable Long typeId) {
        return dictService.listDataByTypeId(typeId);
    }

    @PostMapping("/data")
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("dict:data:create")
    public DictDataView createData(@Valid @RequestBody DictDataCreateCommand request) {
        Long id = dictService.createData(request);
        return dictService.listDataByTypeId(request.dictTypeId()).stream()
            .filter(d -> d.id().equals(id))
            .findFirst()
            .orElseThrow();
    }

    @DeleteMapping("/data/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequirePermission("dict:data:delete")
    public void deleteData(@PathVariable Long id) {
        dictService.deleteData(id);
    }
}
