package com.metabuild.platform.dict.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.cache.CacheEvictSupport;
import com.metabuild.platform.dict.api.dto.DictDataCreateCommand;
import com.metabuild.platform.dict.api.dto.DictDataView;
import com.metabuild.platform.dict.api.dto.DictTypeCreateCommand;
import com.metabuild.platform.dict.api.dto.DictTypeView;
import com.metabuild.schema.tables.records.MbDictDataRecord;
import com.metabuild.schema.tables.records.MbDictTypeRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * 字典业务服务（DictType + DictData CRUD，Redis 缓存）。
 * 缓存 key 规范：
 *   - dict:type:{code}   → 字典类型信息
 *   - dict:data:{typeId} → 该类型下的字典数据列表
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DictService {

    private static final String CACHE_TYPE_PREFIX = "dict:type:";
    private static final String CACHE_DATA_PREFIX = "dict:data:";

    private final DictTypeRepository typeRepository;
    private final DictDataRepository dataRepository;
    private final CacheEvictSupport cacheEvictSupport;
    private final StringRedisTemplate redisTemplate;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;

    // ───────── DictType ─────────

    public PageResult<DictTypeView> listTypes(PageQuery query) {
        return typeRepository.findPage(query).map(this::toTypeResponse);
    }

    public DictTypeView getTypeById(Long id) {
        return typeRepository.findById(id)
            .map(this::toTypeResponse)
            .orElseThrow(() -> new NoSuchElementException("字典类型不存在: " + id));
    }

    @Transactional
    public Long createType(DictTypeCreateCommand req) {
        if (typeRepository.existsByCode(req.code())) {
            throw new IllegalArgumentException("字典编码已存在: " + req.code());
        }
        MbDictTypeRecord record = new MbDictTypeRecord();
        record.setId(idGenerator.nextId());
        record.setName(req.name());
        record.setCode(req.code());
        record.setRemark(req.remark());
        record.setStatus((short) 1);
        record.setVersion(0);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        record.setOwnerDeptId(currentUser.isAuthenticated() ? currentUser.deptId() : 0L);
        typeRepository.insert(record);
        return record.getId();
    }

    @Transactional
    public void deleteType(Long id) {
        MbDictTypeRecord type = typeRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("字典类型不存在: " + id));
        dataRepository.deleteByDictTypeId(id);
        typeRepository.deleteById(id);
        // 失效缓存
        cacheEvictSupport.evictAfterCommit(
            CACHE_TYPE_PREFIX + type.getCode(),
            CACHE_DATA_PREFIX + id
        );
    }

    // ───────── DictData ─────────

    public List<DictDataView> listDataByTypeId(Long dictTypeId) {
        return dataRepository.findByDictTypeId(dictTypeId).stream()
            .map(this::toDataResponse)
            .toList();
    }

    @Transactional
    public Long createData(DictDataCreateCommand req) {
        MbDictDataRecord record = new MbDictDataRecord();
        record.setId(idGenerator.nextId());
        record.setDictTypeId(req.dictTypeId());
        record.setLabel(req.label());
        record.setValue(req.value());
        record.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        record.setRemark(req.remark());
        record.setStatus((short) 1);
        record.setVersion(0);
        record.setCreatedBy(currentUser.userIdOrSystem());
        record.setUpdatedBy(currentUser.userIdOrSystem());
        dataRepository.insert(record);
        // 失效该类型的数据缓存
        cacheEvictSupport.evictAfterCommit(CACHE_DATA_PREFIX + req.dictTypeId());
        return record.getId();
    }

    @Transactional
    public void deleteData(Long id) {
        MbDictDataRecord data = dataRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("字典数据不存在: " + id));
        dataRepository.deleteById(id);
        cacheEvictSupport.evictAfterCommit(CACHE_DATA_PREFIX + data.getDictTypeId());
    }

    // ───────── Converters ─────────

    private DictTypeView toTypeResponse(MbDictTypeRecord r) {
        return new DictTypeView(
            r.getId(), r.getName(), r.getCode(), r.getStatus(),
            r.getRemark(), r.getCreatedAt(), r.getUpdatedAt()
        );
    }

    private DictDataView toDataResponse(MbDictDataRecord r) {
        return new DictDataView(
            r.getId(), r.getDictTypeId(), r.getLabel(), r.getValue(),
            r.getStatus(), r.getSortOrder(), r.getRemark(), r.getCreatedAt()
        );
    }
}
