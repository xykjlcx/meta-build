package com.metabuild.platform.iam.domain.user;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.infra.jooq.query.SortParser;
import com.metabuild.platform.iam.api.cmd.UserListQuery;
import com.metabuild.schema.tables.records.MbIamUserRecord;
import static com.metabuild.schema.tables.MbIamUserRole.MB_IAM_USER_ROLE;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SortField;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.metabuild.schema.tables.MbIamLoginLog.MB_IAM_LOGIN_LOG;
import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 用户数据访问层（仅 jOOQ，严禁出现 Service 逻辑）。
 */
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;
    private final Clock clock;

    public Optional<MbIamUserRecord> findById(Long id) {
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.ID.eq(id))
            .fetchOptional();
    }

    public Optional<MbIamUserRecord> findByUsername(String username) {
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.USERNAME.eq(username))
            .fetchOptional();
    }

    public boolean existsByUsername(String username) {
        return dsl.fetchExists(
            dsl.selectFrom(MB_IAM_USER).where(MB_IAM_USER.USERNAME.eq(username))
        );
    }

    /**
     * 检查 email 是否已被其他用户使用（排除指定 id，用于自己修改 profile 时跳过自身）。
     * email = null 或空串时视为无冲突（允许多个 null）。
     */
    public boolean existsByEmailExcludingId(String email, Long excludeId) {
        if (email == null || email.isBlank()) {
            return false;
        }
        var condition = MB_IAM_USER.EMAIL.eq(email);
        if (excludeId != null) {
            condition = condition.and(MB_IAM_USER.ID.ne(excludeId));
        }
        return dsl.fetchExists(dsl.selectFrom(MB_IAM_USER).where(condition));
    }

    public PageResult<MbIamUserRecord> findPage(PageQuery query) {
        var sortFields = SortParser.builder()
            .forTable(MB_IAM_USER)
            .allow("username", MB_IAM_USER.USERNAME)
            .allow("email", MB_IAM_USER.EMAIL)
            .defaultSort(MB_IAM_USER.CREATED_AT.desc())
            .parse(query.sort());

        long total = dsl.fetchCount(MB_IAM_USER);
        List<MbIamUserRecord> records = dsl.selectFrom(MB_IAM_USER)
            .orderBy(sortFields)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        return PageResult.of(records, total, query);
    }

    /**
     * Admin 列表分页查询（支持按部门 / 状态 / 关键词过滤 + LATERAL JOIN 聚合 lastLoginAt）。
     *
     * <p>递归后代过滤：当 {@code includeDescendants=true} 时，上层需传入已展开的 deptIds
     * 列表（由 Service 层调用 DeptRepository.findAllChildDeptIds 展开）。
     *
     * <p>sort 白名单：{@code username / nickname / createdAt / lastLoginAt}。默认 id desc。
     */
    public PageResult<UserListRow> findListPage(UserListQuery query, List<Long> deptFilterIds) {
        Condition where = DSL.noCondition();

        if (deptFilterIds != null && !deptFilterIds.isEmpty()) {
            where = where.and(MB_IAM_USER.DEPT_ID.in(deptFilterIds));
        } else if (query.deptId() != null) {
            where = where.and(MB_IAM_USER.DEPT_ID.eq(query.deptId()));
        }

        if (query.status() != null) {
            where = where.and(MB_IAM_USER.STATUS.eq(query.status()));
        }

        if (query.hasKeyword()) {
            String pattern = "%" + query.keyword() + "%";
            where = where.and(
                MB_IAM_USER.USERNAME.likeIgnoreCase(pattern)
                    .or(MB_IAM_USER.NICKNAME.likeIgnoreCase(pattern))
                    .or(MB_IAM_USER.EMAIL.likeIgnoreCase(pattern))
            );
        }

        // LATERAL JOIN 聚合 lastLoginAt
        Field<OffsetDateTime> lastLoginAt = DSL.field(
            DSL.name("ll", "last_login_at"), OffsetDateTime.class
        );
        var lateral = DSL.lateral(
            DSL.select(DSL.max(MB_IAM_LOGIN_LOG.CREATED_AT).as("last_login_at"))
                .from(MB_IAM_LOGIN_LOG)
                .where(MB_IAM_LOGIN_LOG.USER_ID.eq(MB_IAM_USER.ID))
                .and(MB_IAM_LOGIN_LOG.SUCCESS.eq(true))
        ).as("ll");

        List<SortField<?>> sortFields = buildListPageSort(query.page().sort(), lastLoginAt);

        long total = dsl.fetchCount(dsl.selectFrom(MB_IAM_USER).where(where));

        List<Record> records = dsl.select(MB_IAM_USER.fields())
            .select(lastLoginAt)
            .from(MB_IAM_USER)
            .leftJoin(lateral).on(DSL.trueCondition())
            .where(where)
            .orderBy(sortFields)
            .limit(query.page().size())
            .offset(query.page().offset())
            .fetch();

        List<UserListRow> rows = records.stream()
            .map(r -> new UserListRow(
                r.get(MB_IAM_USER.ID),
                r.get(MB_IAM_USER.USERNAME),
                r.get(MB_IAM_USER.EMAIL),
                r.get(MB_IAM_USER.PHONE),
                r.get(MB_IAM_USER.NICKNAME),
                r.get(MB_IAM_USER.AVATAR),
                r.get(MB_IAM_USER.DEPT_ID),
                r.get(MB_IAM_USER.STATUS),
                Boolean.TRUE.equals(r.get(MB_IAM_USER.MUST_CHANGE_PASSWORD)),
                r.get(MB_IAM_USER.PASSWORD_UPDATED_AT),
                r.get(lastLoginAt),
                r.get(MB_IAM_USER.CREATED_AT),
                r.get(MB_IAM_USER.UPDATED_AT)
            ))
            .toList();

        return PageResult.of(rows, total, query.page());
    }

    private List<SortField<?>> buildListPageSort(List<String> sortParams, Field<OffsetDateTime> lastLoginAt) {
        // 白名单：username / nickname / createdAt / lastLoginAt；默认 id desc
        if (sortParams == null || sortParams.isEmpty()) {
            return List.of(MB_IAM_USER.ID.desc());
        }
        List<SortField<?>> result = new ArrayList<>();
        for (String param : sortParams) {
            if (param == null || param.isBlank()) continue;
            String[] parts = param.split(",");
            String field = parts[0].trim().toLowerCase();
            boolean asc = parts.length < 2 || !"desc".equalsIgnoreCase(parts[1].trim());
            SortField<?> sf = switch (field) {
                case "username" -> asc ? MB_IAM_USER.USERNAME.asc() : MB_IAM_USER.USERNAME.desc();
                case "nickname" -> asc ? MB_IAM_USER.NICKNAME.asc() : MB_IAM_USER.NICKNAME.desc();
                case "createdat" -> asc ? MB_IAM_USER.CREATED_AT.asc() : MB_IAM_USER.CREATED_AT.desc();
                case "lastloginat" -> asc ? lastLoginAt.asc().nullsLast() : lastLoginAt.desc().nullsLast();
                case "id" -> asc ? MB_IAM_USER.ID.asc() : MB_IAM_USER.ID.desc();
                default -> null; // 静默忽略非白名单字段，保持向后兼容
            };
            if (sf != null) result.add(sf);
        }
        return result.isEmpty() ? List.of(MB_IAM_USER.ID.desc()) : result;
    }

    /**
     * 列表行（含聚合字段）。package-private，只在 platform-iam 领域内部使用。
     */
    public record UserListRow(
        Long id,
        String username,
        String email,
        String phone,
        String nickname,
        String avatar,
        Long deptId,
        Short status,
        boolean mustChangePassword,
        OffsetDateTime passwordUpdatedAt,
        OffsetDateTime lastLoginAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {}

    public Long insert(MbIamUserRecord record) {
        dsl.insertInto(MB_IAM_USER).set(record).execute();
        return record.getId();
    }

    /**
     * 乐观锁更新用户。
     * Repository 层负责 version + 1 和 updated_at（DSL UPDATE 不走 AuditFieldsRecordListener）。
     * Service 层传入 updatedBy。
     */
    public int update(MbIamUserRecord record, Long updatedBy) {
        return dsl.update(MB_IAM_USER)
            .set(MB_IAM_USER.EMAIL, record.getEmail())
            .set(MB_IAM_USER.PHONE, record.getPhone())
            .set(MB_IAM_USER.NICKNAME, record.getNickname())
            .set(MB_IAM_USER.AVATAR, record.getAvatar())
            .set(MB_IAM_USER.DEPT_ID, record.getDeptId())
            .set(MB_IAM_USER.OWNER_DEPT_ID, record.getOwnerDeptId())
            .set(MB_IAM_USER.STATUS, record.getStatus())
            .set(MB_IAM_USER.PASSWORD_HASH, record.getPasswordHash())
            .set(MB_IAM_USER.PASSWORD_UPDATED_AT, record.getPasswordUpdatedAt())
            .set(MB_IAM_USER.MUST_CHANGE_PASSWORD, record.getMustChangePassword())
            .set(MB_IAM_USER.VERSION, MB_IAM_USER.VERSION.plus(1))
            .set(MB_IAM_USER.UPDATED_BY, updatedBy)
            .set(MB_IAM_USER.UPDATED_AT, OffsetDateTime.now(clock))
            .where(MB_IAM_USER.ID.eq(record.getId()))
            .and(MB_IAM_USER.VERSION.eq(record.getVersion()))
            .execute();
    }

    public void deleteById(Long id) {
        dsl.deleteFrom(MB_IAM_USER).where(MB_IAM_USER.ID.eq(id)).execute();
    }

    /**
     * 查某角色的成员（分页 + keyword 模糊）。含被禁用用户，不过滤 status（Plan B 决策：
     * UI 用 badge 展示禁用状态，管理员视角要看到所有持有者）。
     */
    public PageResult<MbIamUserRecord> findMembersByRoleId(Long roleId, PageQuery page, String keyword) {
        Condition where = MB_IAM_USER.ID.in(
            dsl.select(MB_IAM_USER_ROLE.USER_ID)
                .from(MB_IAM_USER_ROLE)
                .where(MB_IAM_USER_ROLE.ROLE_ID.eq(roleId))
        );
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword + "%";
            where = where.and(
                MB_IAM_USER.USERNAME.likeIgnoreCase(pattern)
                    .or(MB_IAM_USER.NICKNAME.likeIgnoreCase(pattern))
                    .or(MB_IAM_USER.EMAIL.likeIgnoreCase(pattern))
            );
        }

        long total = dsl.fetchCount(dsl.selectFrom(MB_IAM_USER).where(where));
        List<MbIamUserRecord> records = dsl.selectFrom(MB_IAM_USER)
            .where(where)
            .orderBy(MB_IAM_USER.ID.desc())
            .limit(page.size())
            .offset(page.offset())
            .fetch();

        return PageResult.of(records, total, page);
    }
}
