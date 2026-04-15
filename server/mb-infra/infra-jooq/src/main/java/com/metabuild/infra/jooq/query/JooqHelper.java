package com.metabuild.infra.jooq.query;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.UpdatableRecord;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * jOOQ 批量操作工具类（M1：5 个基础方法）。
 */
@Component
public class JooqHelper {

    private final DSLContext dsl;

    public JooqHelper(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * 批量插入。
     */
    public <R extends UpdatableRecord<R>> int[] batchInsert(Collection<R> records) {
        if (records.isEmpty()) return new int[0];
        return dsl.batchInsert(records).execute();
    }

    /**
     * 批量更新。
     */
    public <R extends UpdatableRecord<R>> int[] batchUpdate(Collection<R> records) {
        if (records.isEmpty()) return new int[0];
        return dsl.batchUpdate(records).execute();
    }

    /**
     * 批量删除。
     */
    public <R extends UpdatableRecord<R>> int[] batchDelete(Collection<R> records) {
        if (records.isEmpty()) return new int[0];
        return dsl.batchDelete(records).execute();
    }

    /**
     * 检查记录是否存在。
     */
    public boolean exists(org.jooq.Select<?> select) {
        return dsl.fetchExists(select);
    }

    /**
     * 统计记录数。
     */
    public <R extends Record> long count(Table<R> table) {
        return dsl.fetchCount(table);
    }
}
