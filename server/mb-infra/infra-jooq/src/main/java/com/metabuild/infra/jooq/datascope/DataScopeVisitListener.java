package com.metabuild.infra.jooq.datascope;

import com.metabuild.common.security.CurrentUser;
import org.springframework.beans.factory.ObjectProvider;

/**
 * @deprecated 命名已收敛到 {@link DataScopeExecuteListener}，保留该类仅用于兼容历史引用。
 */
@Deprecated(forRemoval = false)
public class DataScopeVisitListener extends DataScopeExecuteListener {

    public DataScopeVisitListener(DataScopeRegistry registry, ObjectProvider<CurrentUser> currentUserProvider) {
        super(registry, currentUserProvider);
    }
}
