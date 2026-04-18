package com.metabuild.infra.archunit;

import com.tngtech.archunit.core.domain.JavaAnnotation;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;

/**
 * 缓存规则：@CacheEvict 禁止 allEntries=true。
 *
 * <p>MUST NOT #4：规模大了形同虚设（nxboot 反面教材）。必须精准声明 key，
 * 避免一次性失效整张缓存导致雷击。</p>
 *
 * <p>同样覆盖 {@code @Caching(evict = {@CacheEvict(..., allEntries=true)})} 组合用法，
 * 因为组合场景里的 CacheEvict 仍然会被 Spring 作为独立注解处理。</p>
 */
public final class CacheRule {

    private CacheRule() {}

    public static final ArchRule NO_CACHE_EVICT_ALL_ENTRIES =
        methods()
            .that().areAnnotatedWith("org.springframework.cache.annotation.CacheEvict")
            .should(noAllEntriesTrue())
            .allowEmptyShould(true)  // 预防性规则：当前项目 0 个 @CacheEvict 用法，未来出现时拦截
            .because("@CacheEvict(allEntries=true) 规模大了形同虚设（MUST NOT #4），必须精准声明 key");

    private static ArchCondition<JavaMethod> noAllEntriesTrue() {
        return new ArchCondition<>("not use @CacheEvict(allEntries=true)") {
            @Override
            public void check(JavaMethod method, ConditionEvents events) {
                method.getAnnotations().stream()
                    .filter(a -> a.getRawType().getName().equals(
                        "org.springframework.cache.annotation.CacheEvict"))
                    .forEach(annotation -> checkAllEntries(annotation, method, events));
            }

            private void checkAllEntries(JavaAnnotation<?> annotation,
                                          JavaMethod method,
                                          ConditionEvents events) {
                Object value = annotation.get("allEntries").orElse(false);
                if (Boolean.TRUE.equals(value)) {
                    events.add(SimpleConditionEvent.violated(method,
                        method.getFullName()
                        + " 使用了 @CacheEvict(allEntries=true)，违反 MUST NOT #4。"
                        + " 应精准声明 key，如 @CacheEvict(key = \"#id\")。"));
                }
            }
        };
    }
}
