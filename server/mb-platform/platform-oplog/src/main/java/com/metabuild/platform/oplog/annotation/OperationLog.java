package com.metabuild.platform.oplog.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解，标注在 Controller 方法上。
 * 由 {@link com.metabuild.platform.oplog.domain.OperationLogAspect} 拦截，异步写入 mb_operation_log 表。
 * <p>
 * 示例：
 * <pre>
 * {@literal @}OperationLog(module = "iam", operation = "创建用户")
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {

    /** 所属模块（如 "iam", "dict", "file"） */
    String module();

    /** 操作描述（如 "创建用户", "上传文件"） */
    String operation();
}
