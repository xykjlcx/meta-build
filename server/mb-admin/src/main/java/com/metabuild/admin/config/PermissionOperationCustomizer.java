package com.metabuild.admin.config;

import com.metabuild.infra.security.RequirePermission;
import io.swagger.v3.oas.models.Operation;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;

/**
 * OpenAPI 操作定制器：将 @RequirePermission 注解中的权限码
 * 追加到 Swagger 接口描述中，方便前端和 QA 查阅权限要求。
 */
@Component
public class PermissionOperationCustomizer implements OperationCustomizer {

    @Override
    public Operation customize(Operation operation, HandlerMethod handlerMethod) {
        RequirePermission rp = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (rp != null) {
            String permissions = String.join(", ", rp.value());
            String desc = operation.getDescription() != null ? operation.getDescription() : "";
            operation.setDescription(desc + "\n\n**权限:** `" + permissions + "`");
        }
        return operation;
    }
}
