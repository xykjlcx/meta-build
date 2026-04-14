package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.GeneralCodingRules;

/**
 * 通用编码规则包：复用 ArchUnit 内置的 GeneralCodingRules。
 *
 * <p>规则 #12：禁止字段注入（@Autowired/@Inject 字段），使用构造函数注入。</p>
 * <p>规则 #13：禁止使用 System.out/err，使用 SLF4J 日志。</p>
 * <p>规则 #14：禁止使用 java.util.logging，统一使用 SLF4J。</p>
 */
public final class GeneralCodingRulesBundle {

    private GeneralCodingRulesBundle() {}

    /**
     * 禁止字段注入（@Autowired/@Inject 字段）。
     * 使用构造函数注入（搭配 @RequiredArgsConstructor）。
     */
    public static final ArchRule NO_FIELD_INJECTION =
        GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;

    /**
     * 禁止使用 System.out/System.err 输出。
     * 统一使用 SLF4J 日志框架。
     */
    public static final ArchRule NO_STANDARD_STREAMS =
        GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS;

    /**
     * 禁止使用 java.util.logging（JUL）。
     * 统一使用 SLF4J + Logback。
     */
    public static final ArchRule NO_JAVA_UTIL_LOGGING =
        GeneralCodingRules.NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING;
}
