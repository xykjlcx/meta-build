package com.metabuild.common.log;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解，标注在 Controller 方法上。
 * 实现由 platform-log 模块的 OperationLogAspect 负责拦截和异步写入。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {
    /** 所属模块（如 "iam", "dict", "file"） */
    String module();
    /** 操作描述（如 "创建用户", "上传文件"） */
    String operation();
}
