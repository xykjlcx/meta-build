package com.metabuild.platform.dict.web;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.dict.api.dto.DictDataCreateRequest;
import com.metabuild.platform.dict.api.dto.DictDataResponse;
import com.metabuild.platform.dict.api.dto.DictTypeCreateRequest;
import com.metabuild.platform.dict.api.dto.DictTypeResponse;
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
    public PageResult<DictTypeResponse> listTypes(PageQuery query) {
        return dictService.listTypes(query);
    }

    @GetMapping("/types/{id}")
    @RequirePermission("dict:type:detail")
    public DictTypeResponse getType(@PathVariable Long id) {
        return dictService.getTypeById(id);
    }

    @PostMapping("/types")
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("dict:type:create")
    public DictTypeResponse createType(@Valid @RequestBody DictTypeCreateRequest request) {
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
    public List<DictDataResponse> listData(@PathVariable Long typeId) {
        return dictService.listDataByTypeId(typeId);
    }

    @PostMapping("/data")
    @ResponseStatus(HttpStatus.CREATED)
    @RequirePermission("dict:data:create")
    public DictDataResponse createData(@Valid @RequestBody DictDataCreateRequest request) {
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
