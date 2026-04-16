package com.metabuild.platform.dict.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.exception.ConflictException;
import com.metabuild.common.exception.NotFoundException;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.cache.CacheEvictSupport;
import com.metabuild.platform.dict.api.DictErrorCodes;
import com.metabuild.platform.dict.api.cmd.DictDataCreateCmd;
import com.metabuild.platform.dict.api.vo.DictDataVo;
import com.metabuild.platform.dict.api.cmd.DictTypeCreateCmd;
import com.metabuild.platform.dict.api.vo.DictTypeVo;
import com.metabuild.schema.tables.records.MbDictDataRecord;
import com.metabuild.schema.tables.records.MbDictTypeRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    public PageResult<DictTypeVo> listTypes(PageQuery query) {
        return typeRepository.findPage(query).map(this::toTypeResponse);
    }

    public DictTypeVo getTypeById(Long id) {
        return typeRepository.findById(id)
            .map(this::toTypeResponse)
            .orElseThrow(() -> new NotFoundException(DictErrorCodes.TYPE_NOT_FOUND, id));
    }

    @Transactional
    public Long createType(DictTypeCreateCmd req) {
        if (typeRepository.existsByCode(req.code())) {
            throw new ConflictException(DictErrorCodes.TYPE_CODE_EXISTS, req.code());
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
            .orElseThrow(() -> new NotFoundException(DictErrorCodes.TYPE_NOT_FOUND, id));
        dataRepository.deleteByDictTypeId(id);
        typeRepository.deleteById(id);
        // 失效缓存
        cacheEvictSupport.evictAfterCommit(
            CACHE_TYPE_PREFIX + type.getCode(),
            CACHE_DATA_PREFIX + id
        );
    }

    // ───────── DictData ─────────

    public List<DictDataVo> listDataByTypeId(Long dictTypeId) {
        return dataRepository.findByDictTypeId(dictTypeId).stream()
            .map(this::toDataResponse)
            .toList();
    }

    @Transactional
    public Long createData(DictDataCreateCmd req) {
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
            .orElseThrow(() -> new NotFoundException(DictErrorCodes.DATA_NOT_FOUND, id));
        dataRepository.deleteById(id);
        cacheEvictSupport.evictAfterCommit(CACHE_DATA_PREFIX + data.getDictTypeId());
    }

    // ───────── Converters ─────────

    private DictTypeVo toTypeResponse(MbDictTypeRecord r) {
        return new DictTypeVo(
            r.getId(), r.getName(), r.getCode(), r.getStatus(),
            r.getRemark(), r.getCreatedAt(), r.getUpdatedAt()
        );
    }

    private DictDataVo toDataResponse(MbDictDataRecord r) {
        return new DictDataVo(
            r.getId(), r.getDictTypeId(), r.getLabel(), r.getValue(),
            r.getStatus(), r.getSortOrder(), r.getRemark(), r.getCreatedAt()
        );
    }
}
