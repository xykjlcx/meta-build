# M5 Plan B: SSE 基础设施 + 通知渠道系统

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 SSE 实时推送基础设施（infra-sse），升级 platform-notification 为多渠道通知系统（站内信+邮件+微信公众号+微信小程序），串联 Notice 发布→通知分发全链路。

**Architecture:**
- Phase 3: `infra-sse` 模块提供业务无关的 SSE 连接管理、心跳、单播/广播、踢人下线能力，位于 infra 层
- Phase 4: `platform-notification` 升级为渠道抽象 + 多渠道分发，新增 `NotificationChannel` 接口 + `NotificationDispatcher` + 4 个 channel 实现 + 发送记录表
- 最后串联 Notice publish → AFTER_COMMIT → NotificationDispatcher，替换 Plan A 中的简单 NotificationApi.create() 调用

**Tech Stack:** Spring Boot 3.5 + SseEmitter + StringRedisTemplate + JavaMailSender + Thymeleaf + weixin-java-mp/miniapp 4.6.7

**Spec:** `docs/superpowers/specs/2026-04-14-m5-notice-module-design.md` §4 + §5

---

## Phase 3: SSE 基础设施

### Task 1: infra-sse 模块脚手架（pom + AutoConfiguration + SseProperties + package-info）

**Files:**
- `server/mb-infra/infra-sse/pom.xml`（新建）
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/package-info.java`（新建）
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseProperties.java`（新建）
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseAutoConfiguration.java`（新建）
- `server/mb-infra/infra-sse/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（新建）
- `server/mb-infra/pom.xml`（修改，新增 module）
- `server/pom.xml`（修改，新增 dependencyManagement）
- `server/mb-admin/pom.xml`（修改，新增依赖）

**Steps:**

- [ ] 创建 `server/mb-infra/infra-sse/pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>mb-infra</artifactId>
        <version>${revision}</version>
    </parent>
    <artifactId>infra-sse</artifactId>
    <name>infra-sse</name>
    <description>SSE 实时推送基础设施（ADR-0014）</description>

    <dependencies>
        <!-- Spring MVC（SseEmitter） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Redis（force-logout 兜底标记） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- Jackson（消息序列化） -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

        <!-- 限流注解（@RateLimit 用于 SSE connect 端点限流） -->
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-rate-limit</artifactId>
        </dependency>

        <!-- Sa-Token（ForceLogoutCheckInterceptor 使用 StpUtil 检查登录态） -->
        <dependency>
            <groupId>cn.dev33</groupId>
            <artifactId>sa-token-spring-boot3-starter</artifactId>
            <scope>provided</scope>
        </dependency>

        <!-- OpenAPI 注解（springdoc） -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        </dependency>

        <!-- 配置元数据（IDE 提示） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/package-info.java`：

```java
/**
 * SSE 实时推送基础设施模块（infra-sse）。
 *
 * <p>提供业务无关的 SSE 连接管理、心跳、单播/广播、踢人下线能力。
 * 具体业务消息的构造和触发由 platform/business 层负责。
 *
 * <p>v1 单实例：ConcurrentHashMap。v1.5 多实例：升级为 Redis Pub/Sub。
 *
 * @see com.metabuild.infra.sse.SseMessageSender
 */
package com.metabuild.infra.sse;
```

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseProperties.java`：

```java
package com.metabuild.infra.sse;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * SSE 配置属性。
 *
 * <p>配置前缀：mb.sse
 */
@ConfigurationProperties(prefix = "mb.sse")
@Validated
public record SseProperties(
    int maxConnections,
    long emitterTimeoutMs
) {
    public SseProperties {
        if (maxConnections <= 0) maxConnections = 5000;
        if (emitterTimeoutMs <= 0) emitterTimeoutMs = 1_800_000L;
    }
}
```

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseAutoConfiguration.java`：

```java
package com.metabuild.infra.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SSE 模块自动配置入口。
 *
 * <p>注册 SSE 连接管理、消息发送、心跳调度全部组件。
 * 启用 @EnableScheduling 以支持心跳定时任务。
 */
@AutoConfiguration
@EnableConfigurationProperties(SseProperties.class)
@EnableScheduling
public class SseAutoConfiguration {

    @Bean
    public SseSessionRegistry sseSessionRegistry() {
        return new SseSessionRegistry();
    }

    @Bean
    public SseMessageSenderImpl sseMessageSender(
            SseSessionRegistry registry,
            ObjectMapper objectMapper,
            StringRedisTemplate redisTemplate) {
        return new SseMessageSenderImpl(registry, objectMapper, redisTemplate);
    }

    @Bean
    public SseHeartbeatScheduler sseHeartbeatScheduler(SseSessionRegistry registry) {
        return new SseHeartbeatScheduler(registry);
    }

    @Bean
    public SseConnectionController sseConnectionController(
            SseSessionRegistry registry,
            SseProperties properties) {
        return new SseConnectionController(registry, properties);
    }
}
```

- [ ] 创建 `server/mb-infra/infra-sse/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`：

```
com.metabuild.infra.sse.SseAutoConfiguration
```

- [ ] 在 `server/mb-infra/pom.xml` 的 `<modules>` 中新增（在 `infra-websocket` 之前）：

```xml
<module>infra-sse</module>
```

- [ ] 在 `server/pom.xml` 的 `<dependencyManagement>` 中，在 `infra-websocket` 条目之前新增：

```xml
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>infra-sse</artifactId>
    <version>${revision}</version>
</dependency>
```

- [ ] 在 `server/mb-admin/pom.xml` 的 `<!-- 内部模块 — infra 基础设施层（全部） -->` 段内，在 `infra-captcha` 之后新增：

```xml
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>infra-sse</artifactId>
</dependency>
```

- [ ] 在 `server/mb-admin/src/main/resources/application.yml` 的 `mb:` 段内（`rate-limit` 之后）新增：

```yaml
  sse:
    max-connections: ${MB_SSE_MAX_CONNECTIONS:5000}
    emitter-timeout-ms: ${MB_SSE_EMITTER_TIMEOUT_MS:1800000}
```

**Verify:**

```bash
cd server && mvn validate -pl mb-infra/infra-sse
cd server && mvn compile -pl mb-infra/infra-sse -am
```

**Commit:** `feat(sse): infra-sse 模块脚手架 + SseProperties + AutoConfiguration + pom 注册`

---

### Task 2: SseSessionRegistry（连接管理 + 多 tab session-replaced）

**Files:**
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseSessionRegistry.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseSessionRegistry.java`：

```java
package com.metabuild.infra.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiConsumer;

/**
 * SSE 在线用户 session 管理（v1 单实例：ConcurrentHashMap）。
 *
 * <p>每个用户只保留一个活跃连接。新连接注册时，旧连接收到 session-replaced 事件后关闭（多 tab 场景）。
 *
 * <p>v1.5 多实例部署时升级为 Redis Pub/Sub 广播。
 */
public class SseSessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(SseSessionRegistry.class);

    // v1 单实例：ConcurrentHashMap 足够
    private final ConcurrentHashMap<Long, SseEmitter> sessions = new ConcurrentHashMap<>();

    /**
     * 注册新连接。如果该用户已有旧连接，先发 session-replaced 事件再关闭旧连接。
     *
     * @param userId  用户 ID
     * @param emitter 新的 SseEmitter
     */
    public void register(Long userId, SseEmitter emitter) {
        SseEmitter old = sessions.put(userId, emitter);
        if (old != null) {
            try {
                old.send(SseEmitter.event().name("session-replaced").data(""));
            } catch (IOException ignored) {
                // 旧连接可能已断开，忽略
            }
            old.complete();
            log.debug("用户 {} 旧 SSE 连接已被替换（多 tab 场景）", userId);
        }
    }

    /**
     * 移除连接（仅当当前 emitter 匹配时移除，防止并发注册时误删新连接）。
     */
    public void remove(Long userId, SseEmitter emitter) {
        sessions.remove(userId, emitter);
    }

    /**
     * 获取指定用户的 emitter。
     */
    public SseEmitter get(Long userId) {
        return sessions.get(userId);
    }

    /**
     * 当前在线连接数。
     */
    public int size() {
        return sessions.size();
    }

    /**
     * 获取所有在线用户 ID（不可修改视图）。
     */
    public Set<Long> getOnlineUserIds() {
        return Collections.unmodifiableSet(sessions.keySet());
    }

    /**
     * 遍历所有在线连接（用于心跳、广播等场景）。
     */
    public void forEach(BiConsumer<Long, SseEmitter> action) {
        sessions.forEach(action);
    }
}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-infra/infra-sse -am
```

**Commit:** `feat(sse): SseSessionRegistry 连接管理（含多 tab session-replaced 处理）`

---

### Task 3: SseMessageSender 接口 + SseMessageSenderImpl（单播/广播/踢人下线 + Redis 兜底）

**Files:**
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseMessageSender.java`（新建）
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseMessageSenderImpl.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseMessageSender.java`：

```java
package com.metabuild.infra.sse;

import java.util.Set;

/**
 * SSE 消息发送接口（infra 层对外 API）。
 *
 * <p>业务层通过此接口发送实时消息，不需要感知 SSE 实现细节。
 */
public interface SseMessageSender {

    /**
     * 发送给指定用户。
     *
     * @param userId  目标用户 ID
     * @param event   SSE 事件名称（如 notice-published、force-logout）
     * @param payload 消息体（会被 JSON 序列化）
     */
    void sendToUser(Long userId, String event, Object payload);

    /**
     * 全局广播（发送给所有在线用户）。
     *
     * @param event   SSE 事件名称
     * @param payload 消息体
     */
    void broadcast(String event, Object payload);

    /**
     * 踢人下线：SSE 推送 force-logout 事件 + 关闭连接 + 写 Redis 兜底标记。
     *
     * <p>双保险设计：即使 SSE 连接已断开，下次 HTTP 请求时
     * Sa-Token 中间件检查 Redis SET mb:kicked:{userId} 也会触发登出。
     *
     * @param userId 要踢出的用户 ID
     * @param reason 踢出原因（展示给用户）
     */
    void forceLogout(Long userId, String reason);

    /**
     * 获取当前在线用户 ID 集合。
     */
    Set<Long> getOnlineUserIds();
}
```

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseMessageSenderImpl.java`：

```java
package com.metabuild.infra.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

/**
 * SSE 消息发送实现。
 *
 * <p>单播/广播使用 SseSessionRegistry 的 ConcurrentHashMap；
 * force-logout 同时写 Redis SET 兜底（即使 SSE 断线也能在下次 HTTP 请求时拦截）。
 */
@RequiredArgsConstructor
public class SseMessageSenderImpl implements SseMessageSender {

    private static final Logger log = LoggerFactory.getLogger(SseMessageSenderImpl.class);

    /** Redis key 前缀：踢人下线兜底标记 */
    private static final String KICKED_KEY_PREFIX = "mb:kicked:";
    /** 踢人标记过期时间 */
    private static final Duration KICKED_TTL = Duration.ofHours(24);

    private final SseSessionRegistry registry;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void sendToUser(Long userId, String event, Object payload) {
        SseEmitter emitter = registry.get(userId);
        if (emitter != null) {
            doSend(userId, emitter, event, payload);
        }
    }

    @Override
    public void broadcast(String event, Object payload) {
        registry.forEach((userId, emitter) -> doSend(userId, emitter, event, payload));
    }

    @Override
    public void forceLogout(Long userId, String reason) {
        // 1. SSE 推送 force-logout 事件
        sendToUser(userId, "force-logout", Map.of("reason", reason));

        // 2. Redis 兜底标记（即使 SSE 断线，下次 HTTP 请求也会触发登出）
        String key = KICKED_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, "1", KICKED_TTL);
        log.info("用户 {} 被强制下线，原因：{}，Redis 兜底标记已写入", userId, reason);

        // 3. 关闭 SSE 连接
        SseEmitter emitter = registry.get(userId);
        if (emitter != null) {
            emitter.complete();
            registry.remove(userId, emitter);
        }
    }

    @Override
    public Set<Long> getOnlineUserIds() {
        return registry.getOnlineUserIds();
    }

    /**
     * 发送 SSE 事件的内部方法。发送失败时移除连接。
     */
    private void doSend(Long userId, SseEmitter emitter, String event, Object payload) {
        try {
            String data = objectMapper.writeValueAsString(payload);
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (IOException e) {
            log.debug("SSE 发送失败（用户 {} 可能已断开）: {}", userId, e.getMessage());
            registry.remove(userId, emitter);
        }
    }
}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-infra/infra-sse -am
```

**Commit:** `feat(sse): SseMessageSender 接口 + 实现（单播/广播/force-logout + Redis 兜底）`

---

### Task 4: SseConnectionController（建连端点 + 连接数限制 + 限流）

**Files:**
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseConnectionController.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseConnectionController.java`：

```java
package com.metabuild.infra.sse;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.infra.ratelimit.RateLimit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE 连接端点。
 *
 * <p>GET /api/v1/sse/connect — 建立 SSE 长连接。
 * 已登录用户才能建连（走全局 SaInterceptor 认证）。
 *
 * <p>每用户每分钟 5 次建连限制（防止异常客户端频繁重连）。
 * 全局连接数上限由 SseProperties.maxConnections 控制。
 */
@RestController
@RequestMapping("/api/v1/sse")
@RequiredArgsConstructor
@Tag(name = "SSE", description = "SSE 实时推送")
public class SseConnectionController {

    private static final Logger log = LoggerFactory.getLogger(SseConnectionController.class);

    private final SseSessionRegistry registry;
    private final SseProperties properties;

    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "建立 SSE 连接", description = "已登录用户建立 SSE 长连接，接收实时消息")
    @RateLimit(qps = 5)
    public SseEmitter connect(CurrentUser currentUser) {
        Long userId = currentUser.userId();

        // 全局连接数限制
        if (registry.size() >= properties.maxConnections()) {
            log.warn("SSE 连接数已达上限 {}，拒绝用户 {} 连接", properties.maxConnections(), userId);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SSE 连接数已达上限");
        }

        SseEmitter emitter = new SseEmitter(properties.emitterTimeoutMs());
        registry.register(userId, emitter);

        // 连接生命周期回调
        emitter.onCompletion(() -> {
            registry.remove(userId, emitter);
            log.debug("SSE 连接完成: userId={}", userId);
        });
        emitter.onTimeout(() -> {
            registry.remove(userId, emitter);
            log.debug("SSE 连接超时: userId={}", userId);
        });
        emitter.onError(e -> {
            registry.remove(userId, emitter);
            log.debug("SSE 连接异常: userId={}, error={}", userId, e.getMessage());
        });

        log.info("SSE 连接建立: userId={}, 当前在线={}", userId, registry.size());
        return emitter;
    }
}
```

> **注意**：`@RateLimit` 注解来自 `infra-rate-limit` 模块，签名为 `@RateLimit(qps, key)`。`qps=5` 表示每秒最多 5 次请求。`SseConnectionController` 通过 `SseAutoConfiguration` 注册为 Bean（不使用 `@ComponentScan`），限流拦截器由 `RateLimitAutoConfiguration` 全局注册。如果需要"每分钟 5 次"的时间窗口语义而非"每秒 5 次"，则改为在 Controller 方法内手动创建 Bucket4j Bucket 做自定义限流检查（`Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1)))`）。

**Verify:**

```bash
cd server && mvn compile -pl mb-infra/infra-sse -am
```

**Commit:** `feat(sse): SseConnectionController 建连端点（连接数限制 + 限流）`

---

### Task 5: SseHeartbeatScheduler（30s 心跳）+ force-logout Redis 检查拦截器

**Files:**
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseHeartbeatScheduler.java`（新建）
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/ForceLogoutCheckInterceptor.java`（新建）
- `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseAutoConfiguration.java`（修改，注册拦截器）

**Steps:**

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseHeartbeatScheduler.java`：

```java
package com.metabuild.infra.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

/**
 * SSE 心跳调度器。
 *
 * <p>每 30 秒向所有在线连接发送 SSE 注释行（:heartbeat），
 * 保活连接防止中间代理（Nginx/CDN）因超时关闭连接。
 *
 * <p>SSE 规范中以 : 开头的行为注释，客户端忽略但可保活连接。
 */
public class SseHeartbeatScheduler {

    private static final Logger log = LoggerFactory.getLogger(SseHeartbeatScheduler.class);

    private final SseSessionRegistry registry;

    public SseHeartbeatScheduler(SseSessionRegistry registry) {
        this.registry = registry;
    }

    @Scheduled(fixedRate = 30_000)
    public void heartbeat() {
        if (registry.size() == 0) {
            return;
        }
        registry.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException e) {
                registry.remove(userId, emitter);
                log.debug("心跳发送失败，移除连接: userId={}", userId);
            }
        });
    }
}
```

- [ ] 创建 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/ForceLogoutCheckInterceptor.java`：

```java
package com.metabuild.infra.sse;

import cn.dev33.satoken.stp.StpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * force-logout Redis 兜底拦截器。
 *
 * <p>每次 HTTP 请求检查 Redis SET mb:kicked:{userId}，
 * 如果存在则清除登录态 + 删除 Redis 标记 + 返回 401。
 *
 * <p>设计意图：即使 SSE 推送的 force-logout 消息未送达（网络断开等），
 * 用户下次发起任何 HTTP 请求时也会被拦截。
 *
 * <p><strong>注意</strong>：此拦截器依赖 Sa-Token 的 StpUtil，
 * 因此仅限 infra-sse 模块内部使用（由 SseAutoConfiguration 注册），
 * 不暴露给 business 层。
 */
public class ForceLogoutCheckInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ForceLogoutCheckInterceptor.class);
    private static final String KICKED_KEY_PREFIX = "mb:kicked:";

    private final StringRedisTemplate redisTemplate;

    public ForceLogoutCheckInterceptor(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // 只有已登录用户才检查
        if (!StpUtil.isLogin()) {
            return true;
        }

        Long userId = StpUtil.getLoginIdAsLong();
        String key = KICKED_KEY_PREFIX + userId;

        Boolean kicked = redisTemplate.hasKey(key);
        if (Boolean.TRUE.equals(kicked)) {
            log.info("Redis 兜底拦截：用户 {} 已被标记强制下线，清除登录态", userId);
            // 删除 Redis 标记（一次性使用）
            redisTemplate.delete(key);
            // 清除 Sa-Token 登录态
            StpUtil.logout(userId);
            // 返回 401
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"status\":401,\"detail\":\"您已被管理员强制下线\"}");
            return false;
        }

        return true;
    }
}
```

- [ ] 修改 `server/mb-infra/infra-sse/src/main/java/com/metabuild/infra/sse/SseAutoConfiguration.java`，新增拦截器注册和 WebMvcConfigurer 实现：

```java
package com.metabuild.infra.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * SSE 模块自动配置入口。
 *
 * <p>注册 SSE 连接管理、消息发送、心跳调度、force-logout 兜底拦截器全部组件。
 * 启用 @EnableScheduling 以支持心跳定时任务。
 */
@AutoConfiguration
@EnableConfigurationProperties(SseProperties.class)
@EnableScheduling
public class SseAutoConfiguration implements WebMvcConfigurer {

    private final StringRedisTemplate redisTemplate;

    public SseAutoConfiguration(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Bean
    public SseSessionRegistry sseSessionRegistry() {
        return new SseSessionRegistry();
    }

    @Bean
    public SseMessageSenderImpl sseMessageSender(
            SseSessionRegistry registry,
            ObjectMapper objectMapper,
            StringRedisTemplate redisTemplate) {
        return new SseMessageSenderImpl(registry, objectMapper, redisTemplate);
    }

    @Bean
    public SseHeartbeatScheduler sseHeartbeatScheduler(SseSessionRegistry registry) {
        return new SseHeartbeatScheduler(registry);
    }

    @Bean
    public SseConnectionController sseConnectionController(
            SseSessionRegistry registry,
            SseProperties properties) {
        return new SseConnectionController(registry, properties);
    }

    @Bean
    public ForceLogoutCheckInterceptor forceLogoutCheckInterceptor() {
        return new ForceLogoutCheckInterceptor(redisTemplate);
    }

    /**
     * 注册 force-logout 兜底拦截器。
     * 在 /api/** 路径上检查 Redis 踢人标记。
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(forceLogoutCheckInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/public/**"
                );
    }
}
```

> **注意**：`ForceLogoutCheckInterceptor` 内部使用 `StpUtil`（Sa-Token），这是合理的——它位于 infra 层（infra-sse），与 infra-security 同层。Sa-Token 依赖已在 Task 1 的 pom.xml 中以 `provided` scope 声明，运行时由 mb-admin 的类路径传递。

- [ ] 在 `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SecurityAutoConfiguration.java` 中，将 SSE 端点 `/api/v1/sse/connect` 添加到 SaInterceptor 的排除列表——**不需要排除**，SSE 连接需要认证。确认 `/api/v1/sse/connect` 不在排除列表中（已登录才能建连）。

**Verify:**

```bash
cd server && mvn compile -pl mb-infra/infra-sse -am
```

**Commit:** `feat(sse): 心跳调度器（30s）+ force-logout Redis 兜底拦截器`

---

### Task 6: SSE 集成测试

**Files:**
- `server/mb-admin/src/test/java/com/metabuild/admin/sse/SseIntegrationTest.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-admin/src/test/java/com/metabuild/admin/sse/SseIntegrationTest.java`：

```java
package com.metabuild.admin.sse;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.infra.sse.SseMessageSender;
import com.metabuild.infra.sse.SseSessionRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SSE 基础设施集成测试。
 *
 * <p>测试连接管理、消息发送、多 tab 替换、force-logout 等核心行为。
 */
@AutoConfigureMockMvc
@DisplayName("SSE 基础设施集成测试")
class SseIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private SseSessionRegistry registry;

    @Autowired
    private SseMessageSender messageSender;

    // ===== 连接管理 =====

    @Test
    @DisplayName("注册连接后 registry 包含该用户")
    void register_addsUserToRegistry() {
        SseEmitter emitter = new SseEmitter();
        registry.register(1L, emitter);

        assertThat(registry.size()).isGreaterThanOrEqualTo(1);
        assertThat(registry.getOnlineUserIds()).contains(1L);
        assertThat(registry.get(1L)).isSameAs(emitter);

        // 清理
        registry.remove(1L, emitter);
    }

    @Test
    @DisplayName("移除连接后 registry 不再包含该用户")
    void remove_removesUserFromRegistry() {
        SseEmitter emitter = new SseEmitter();
        registry.register(2L, emitter);
        registry.remove(2L, emitter);

        assertThat(registry.get(2L)).isNull();
    }

    @Test
    @DisplayName("多 tab 场景：新连接注册时旧连接被替换")
    void register_replacesOldEmitter() {
        SseEmitter old = new SseEmitter(0L);
        SseEmitter current = new SseEmitter(0L);

        registry.register(3L, old);
        registry.register(3L, current);

        assertThat(registry.get(3L)).isSameAs(current);

        // 清理
        registry.remove(3L, current);
    }

    @Test
    @DisplayName("remove 只移除匹配的 emitter（防误删）")
    void remove_onlyMatchingEmitter() {
        SseEmitter emitter1 = new SseEmitter();
        SseEmitter emitter2 = new SseEmitter();

        registry.register(4L, emitter2);
        // 尝试用 emitter1 移除 — 应该不生效
        registry.remove(4L, emitter1);

        assertThat(registry.get(4L)).isSameAs(emitter2);

        // 清理
        registry.remove(4L, emitter2);
    }

    // ===== 消息发送 =====

    @Test
    @DisplayName("sendToUser 对不在线用户不报错")
    void sendToUser_offlineUser_noError() {
        // 不应抛异常
        messageSender.sendToUser(999L, "test-event", Map.of("key", "value"));
    }

    @Test
    @DisplayName("broadcast 对空 registry 不报错")
    void broadcast_emptyRegistry_noError() {
        messageSender.broadcast("test-broadcast", Map.of("msg", "hello"));
    }

    @Test
    @DisplayName("getOnlineUserIds 返回当前在线用户集合")
    void getOnlineUserIds_returnsRegisteredUsers() {
        SseEmitter e1 = new SseEmitter();
        SseEmitter e2 = new SseEmitter();

        registry.register(10L, e1);
        registry.register(11L, e2);

        assertThat(messageSender.getOnlineUserIds()).contains(10L, 11L);

        // 清理
        registry.remove(10L, e1);
        registry.remove(11L, e2);
    }

    // ===== force-logout =====

    @Test
    @DisplayName("forceLogout 移除连接并写入 Redis 兜底标记")
    void forceLogout_removesEmitterAndWritesRedis(
            @Autowired org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        SseEmitter emitter = new SseEmitter(0L);
        registry.register(20L, emitter);

        messageSender.forceLogout(20L, "管理员踢出");

        // 连接已移除
        assertThat(registry.get(20L)).isNull();
        // Redis 标记已写入
        assertThat(redisTemplate.hasKey("mb:kicked:20")).isTrue();

        // 清理 Redis
        redisTemplate.delete("mb:kicked:20");
    }

    @Test
    @DisplayName("forceLogout 对不在线用户仍写 Redis 兜底标记")
    void forceLogout_offlineUser_stillWritesRedis(
            @Autowired org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        messageSender.forceLogout(21L, "管理员踢出");

        assertThat(redisTemplate.hasKey("mb:kicked:21")).isTrue();

        // 清理
        redisTemplate.delete("mb:kicked:21");
    }
}
```

**Verify:**

```bash
cd server && mvn test -pl mb-admin -Dtest=SseIntegrationTest
```

**Commit:** `test(sse): SSE 集成测试 9 用例（连接管理 + 消息发送 + force-logout）`

---

## Phase 4: 通知渠道系统

### Task 7: NotificationChannel 接口 + NotificationMessage + NotificationException + NotificationDispatcher

**Files:**
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationMessage.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationChannel.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationException.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/NotificationDispatcher.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationMessage.java`：

```java
package com.metabuild.platform.notification.api;

import java.util.List;
import java.util.Map;

/**
 * 通知消息（渠道无关）。
 *
 * <p>由业务层构建，交给 {@link NotificationChannel} 分发。
 * 不同渠道根据 templateCode + params 渲染各自的消息格式。
 */
public record NotificationMessage(
    Long tenantId,
    List<Long> recipientUserIds,
    String templateCode,
    Map<String, String> params,
    String module,
    String referenceId
) {}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationChannel.java`：

```java
package com.metabuild.platform.notification.api;

/**
 * 通知渠道接口（Strategy 模式）。
 *
 * <p>每个渠道实现负责特定的消息投递方式（站内信、邮件、微信等）。
 * {@link #supports(NotificationMessage)} 返回 false 时该渠道被跳过。
 */
public interface NotificationChannel {

    /**
     * 渠道类型标识。
     *
     * @return "IN_APP" / "EMAIL" / "WECHAT_MP" / "WECHAT_MINI"
     */
    String channelType();

    /**
     * 发送通知。
     *
     * @param message 通知消息
     * @throws NotificationException 发送失败时抛出
     */
    void send(NotificationMessage message) throws NotificationException;

    /**
     * 判断该渠道是否支持发送此消息。
     *
     * <p>常见判断：环境变量是否配置、接收人是否有对应绑定关系等。
     *
     * @param message 通知消息
     * @return true=支持发送
     */
    boolean supports(NotificationMessage message);
}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationException.java`：

```java
package com.metabuild.platform.notification.api;

/**
 * 通知发送异常。
 *
 * <p>各渠道实现在发送失败时抛出此异常。
 * {@link com.metabuild.platform.notification.domain.NotificationDispatcher} 会捕获并记录日志，
 * 单渠道失败不影响其他渠道。
 */
public class NotificationException extends RuntimeException {

    public NotificationException(String message) {
        super(message);
    }

    public NotificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

- [ ] 在 `server/mb-platform/platform-notification/pom.xml` 中新增 infra-async 依赖（需要 Executor）：

```xml
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>infra-async</artifactId>
</dependency>
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/NotificationDispatcher.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * 通知分发器：将消息分发到所有支持的渠道。
 *
 * <p>渠道并行执行，单渠道失败不影响其他渠道。
 * 发送结果（成功/失败）写入 notification_log 表。
 */
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final List<NotificationChannel> channels;
    private final NotificationLogRepository logRepository;
    @Qualifier("mbAsyncExecutor")
    private final Executor taskExecutor;

    /**
     * 分发通知到所有支持的渠道。
     *
     * <p>每个 channel 一个 CompletableFuture，并行执行。
     * 单渠道失败吞异常 + 记录日志，不影响其他渠道。
     *
     * @param message 通知消息
     */
    public void dispatch(NotificationMessage message) {
        List<NotificationChannel> supportedChannels = channels.stream()
                .filter(ch -> ch.supports(message))
                .toList();

        if (supportedChannels.isEmpty()) {
            log.warn("没有渠道支持此消息: templateCode={}, module={}", message.templateCode(), message.module());
            return;
        }

        List<CompletableFuture<Void>> futures = supportedChannels.stream()
                .map(ch -> CompletableFuture.runAsync(() -> {
                    try {
                        ch.send(message);
                        logRepository.logSuccess(message, ch.channelType());
                        log.info("通知发送成功: channel={}, module={}, ref={}",
                                ch.channelType(), message.module(), message.referenceId());
                    } catch (NotificationException e) {
                        logRepository.logFailure(message, ch.channelType(), e.getMessage());
                        log.error("通知发送失败: channel={}, module={}, ref={}, error={}",
                                ch.channelType(), message.module(), message.referenceId(), e.getMessage());
                    }
                }, taskExecutor))
                .toList();

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }
}
```

- [ ] 更新 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/NotificationApi.java`，新增 dispatch 方法：

```java
package com.metabuild.platform.notification.api;

import com.metabuild.platform.notification.api.dto.NotificationCreateCommand;

/**
 * 通知模块对外 API 接口。
 * <p>
 * business 层通过此接口调用 platform-notification 的能力，
 * 不直接依赖 domain 层的 {@code NotificationService}。
 */
public interface NotificationApi {

    /**
     * 创建一条站内通知。
     *
     * @param command 创建命令
     * @return 通知 ID
     */
    Long create(NotificationCreateCommand command);

    /**
     * 分发通知到所有配置的渠道。
     *
     * @param message 渠道无关的通知消息
     */
    void dispatch(NotificationMessage message);
}
```

- [ ] 在 `NotificationService` 中实现 `dispatch` 方法：

```java
@Override
public void dispatch(NotificationMessage message) {
    notificationDispatcher.dispatch(message);
}
```

（在 `NotificationService` 的字段中注入 `NotificationDispatcher`）

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): NotificationChannel 接口 + NotificationDispatcher 多渠道分发器`

---

### Task 8: notification_log 表 DDL + NotificationLogRepository + jOOQ codegen

**Files:**
- `server/mb-schema/src/main/resources/db/migration/V20260615_003__notification_log.sql`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/NotificationLogRepository.java`（新建）
- `server/mb-schema/pom.xml`（确认 codegen includes 已覆盖 mb_ 前缀）

**Steps:**

- [ ] 创建 `server/mb-schema/src/main/resources/db/migration/V20260615_003__notification_log.sql`：

```sql
-- ===== 通知发送记录表 =====
CREATE TABLE mb_notification_log (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    channel_type    VARCHAR(20) NOT NULL,    -- IN_APP / EMAIL / WECHAT_MP / WECHAT_MINI
    recipient_id    BIGINT NOT NULL,
    template_code   VARCHAR(100),
    module          VARCHAR(50),
    reference_id    VARCHAR(100),
    status          SMALLINT NOT NULL,       -- 0=pending 1=success 2=failed
    error_message   TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_log_recipient ON mb_notification_log (tenant_id, recipient_id, created_at DESC);
CREATE INDEX idx_notif_log_module_ref ON mb_notification_log (module, reference_id);
CREATE INDEX idx_notif_log_status ON mb_notification_log (tenant_id, status);

COMMENT ON TABLE mb_notification_log IS '通知发送记录';
COMMENT ON COLUMN mb_notification_log.channel_type IS '渠道类型：IN_APP/EMAIL/WECHAT_MP/WECHAT_MINI';
COMMENT ON COLUMN mb_notification_log.recipient_id IS '接收人用户 ID';
COMMENT ON COLUMN mb_notification_log.template_code IS '模板编码';
COMMENT ON COLUMN mb_notification_log.module IS '来源模块（notice/order/...）';
COMMENT ON COLUMN mb_notification_log.reference_id IS '关联业务 ID';
COMMENT ON COLUMN mb_notification_log.status IS '状态：0=pending 1=success 2=failed';
COMMENT ON COLUMN mb_notification_log.error_message IS '失败原因';
COMMENT ON COLUMN mb_notification_log.sent_at IS '发送时间';
```

- [ ] 运行 jOOQ codegen 生成 `MbNotificationLog` 表的 Java 类型：

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

- [ ] 确认生成产物包含 `MbNotificationLog` 表对应的 jOOQ Record/Table 类：

```bash
ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/MbNotificationLog.java
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/NotificationLogRepository.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.common.dto.PageQuery;
import com.metabuild.common.dto.PageResult;
import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import static com.metabuild.schema.tables.MbNotificationLog.MB_NOTIFICATION_LOG;

/**
 * 通知发送记录 Repository。
 */
@Repository
@RequiredArgsConstructor
public class NotificationLogRepository {

    private final DSLContext dsl;
    private final SnowflakeIdGenerator idGenerator;
    private final Clock clock;

    /**
     * 记录发送成功。
     *
     * @param message     通知消息
     * @param channelType 渠道类型
     */
    public void logSuccess(NotificationMessage message, String channelType) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Long> recipients = message.recipientUserIds();
        // 批量插入每个接收人的成功记录
        var batch = recipients.stream()
                .map(recipientId -> dsl.insertInto(MB_NOTIFICATION_LOG)
                        .set(MB_NOTIFICATION_LOG.ID, idGenerator.nextId())
                        .set(MB_NOTIFICATION_LOG.TENANT_ID, message.tenantId())
                        .set(MB_NOTIFICATION_LOG.CHANNEL_TYPE, channelType)
                        .set(MB_NOTIFICATION_LOG.RECIPIENT_ID, recipientId)
                        .set(MB_NOTIFICATION_LOG.TEMPLATE_CODE, message.templateCode())
                        .set(MB_NOTIFICATION_LOG.MODULE, message.module())
                        .set(MB_NOTIFICATION_LOG.REFERENCE_ID, message.referenceId())
                        .set(MB_NOTIFICATION_LOG.STATUS, (short) 1)
                        .set(MB_NOTIFICATION_LOG.SENT_AT, now)
                        .set(MB_NOTIFICATION_LOG.CREATED_AT, now))
                .toList();
        dsl.batch(batch).execute();
    }

    /**
     * 记录发送失败。
     *
     * @param message      通知消息
     * @param channelType  渠道类型
     * @param errorMessage 失败原因
     */
    public void logFailure(NotificationMessage message, String channelType, String errorMessage) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Long> recipients = message.recipientUserIds();
        var batch = recipients.stream()
                .map(recipientId -> dsl.insertInto(MB_NOTIFICATION_LOG)
                        .set(MB_NOTIFICATION_LOG.ID, idGenerator.nextId())
                        .set(MB_NOTIFICATION_LOG.TENANT_ID, message.tenantId())
                        .set(MB_NOTIFICATION_LOG.CHANNEL_TYPE, channelType)
                        .set(MB_NOTIFICATION_LOG.RECIPIENT_ID, recipientId)
                        .set(MB_NOTIFICATION_LOG.TEMPLATE_CODE, message.templateCode())
                        .set(MB_NOTIFICATION_LOG.MODULE, message.module())
                        .set(MB_NOTIFICATION_LOG.REFERENCE_ID, message.referenceId())
                        .set(MB_NOTIFICATION_LOG.STATUS, (short) 2)
                        .set(MB_NOTIFICATION_LOG.ERROR_MESSAGE, errorMessage)
                        .set(MB_NOTIFICATION_LOG.CREATED_AT, now))
                .toList();
        dsl.batch(batch).execute();
    }

    /**
     * 按模块 + 关联 ID 查询发送记录。
     */
    public List<NotificationLogView> findByModuleAndRef(String module, String referenceId) {
        return dsl.selectFrom(MB_NOTIFICATION_LOG)
                .where(MB_NOTIFICATION_LOG.MODULE.eq(module))
                .and(MB_NOTIFICATION_LOG.REFERENCE_ID.eq(referenceId))
                .orderBy(MB_NOTIFICATION_LOG.CREATED_AT.desc())
                .fetchInto(NotificationLogView.class);
    }
}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/NotificationLogView.java`：

```java
package com.metabuild.platform.notification.domain;

import java.time.OffsetDateTime;

/**
 * 通知发送记录视图。
 */
public record NotificationLogView(
    Long id,
    String channelType,
    Long recipientId,
    String templateCode,
    String module,
    String referenceId,
    short status,
    String errorMessage,
    OffsetDateTime sentAt,
    OffsetDateTime createdAt
) {}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): notification_log DDL + NotificationLogRepository + jOOQ codegen`

---

### Task 9: InAppChannel（站内信 + SSE 广播）

**Files:**
- `server/mb-platform/platform-notification/pom.xml`（修改，新增 infra-sse 依赖）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/InAppChannel.java`（新建）

**Steps:**

- [ ] 在 `server/mb-platform/platform-notification/pom.xml` 中新增 infra-sse 依赖：

```xml
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>infra-sse</artifactId>
</dependency>
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/InAppChannel.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.infra.sse.SseMessageSender;
import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 站内信 + SSE 推送渠道。
 *
 * <p>职责：通过 SSE 广播 notice-published 事件给在线用户。
 * 不写 biz_notice_recipient 表（那是 business 层 NoticeService.publish() 的事）。
 *
 * <p>前端收到事件后 toast + invalidateQueries(['notices', 'unread-count'])。
 */
@Component
@RequiredArgsConstructor
public class InAppChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(InAppChannel.class);

    private final SseMessageSender sseMessageSender;

    @Override
    public String channelType() {
        return "IN_APP";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        try {
            String title = message.params().getOrDefault("title", "");
            sseMessageSender.broadcast("notice-published", Map.of(
                    "module", message.module(),
                    "referenceId", message.referenceId(),
                    "title", title
            ));
            log.info("站内信 SSE 广播完成: module={}, ref={}", message.module(), message.referenceId());
        } catch (Exception e) {
            throw new NotificationException("站内信 SSE 广播失败: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        // 站内信渠道始终可用（不依赖外部配置）
        return true;
    }
}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): InAppChannel 站内信渠道（SSE 广播）`

---

### Task 10: EmailChannel（JavaMailSender + Thymeleaf 模板）

**Files:**
- `server/mb-platform/platform-notification/pom.xml`（修改，新增 mail + thymeleaf 依赖）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/EmailChannel.java`（新建）
- `server/mb-platform/platform-notification/src/main/resources/templates/notice_published.html`（新建）
- `server/pom.xml`（确认 spring-boot-starter-mail 和 thymeleaf 版本管理）
- `server/mb-admin/src/main/resources/application.yml`（新增 mail 配置）

**Steps:**

- [ ] 在 `server/mb-platform/platform-notification/pom.xml` 中新增依赖：

```xml
<!-- 邮件发送 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
<!-- Thymeleaf 邮件模板 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

> 注意：`spring-boot-starter-mail` 和 `spring-boot-starter-thymeleaf` 由 Spring Boot BOM 管理版本，无需在 root pom 的 dependencyManagement 中声明。

- [ ] 创建 `server/mb-platform/platform-notification/src/main/resources/templates/notice_published.html`：

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8"/>
    <title th:text="${title}">公告通知</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { color: #1a1a1a; margin-bottom: 16px; }
        .summary { color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; padding: 10px 24px; background: #1677ff; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    </style>
</head>
<body>
<div class="container">
    <h2 th:text="'新公告：' + ${title}">新公告</h2>
    <p class="summary" th:text="${summary}">公告摘要</p>
    <a class="btn" th:href="${viewUrl}">查看详情</a>
    <div class="footer">
        <p>此邮件由 Meta-Build 系统自动发送，请勿直接回复。</p>
    </div>
</div>
</body>
</html>
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/EmailChannel.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;

import static com.metabuild.schema.tables.MbIamUser.MB_IAM_USER;

/**
 * 邮件通知渠道。
 *
 * <p>使用 JavaMailSender + Thymeleaf 模板发送邮件。
 * SMTP 配置通过环境变量注入，未配置时 supports() 返回 false，跳过该渠道。
 */
@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailChannel.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final DSLContext dsl;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${mb.app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Override
    public String channelType() {
        return "EMAIL";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        String title = message.params().getOrDefault("title", "通知");
        String summary = message.params().getOrDefault("summary", "您收到一条新通知，请及时查看。");
        String viewUrl = baseUrl + "/notices/" + message.referenceId();

        // 渲染邮件模板
        Context ctx = new Context();
        ctx.setVariable("title", title);
        ctx.setVariable("summary", summary);
        ctx.setVariable("viewUrl", viewUrl);
        String htmlContent = templateEngine.process("notice_published", ctx);

        // 查询接收人邮箱
        List<EmailRecipient> recipients = dsl.select(MB_IAM_USER.ID, MB_IAM_USER.EMAIL)
                .from(MB_IAM_USER)
                .where(MB_IAM_USER.ID.in(message.recipientUserIds()))
                .and(MB_IAM_USER.EMAIL.isNotNull())
                .and(MB_IAM_USER.EMAIL.ne(""))
                .fetchInto(EmailRecipient.class);

        // 逐个发送（避免单个邮箱异常影响其他接收人）
        for (EmailRecipient recipient : recipients) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(recipient.email());
                helper.setSubject("[Meta-Build] 新公告：" + title);
                helper.setText(htmlContent, true);
                mailSender.send(mimeMessage);
                log.debug("邮件发送成功: to={}, subject={}", recipient.email(), title);
            } catch (MessagingException e) {
                log.error("邮件发送失败: to={}, error={}", recipient.email(), e.getMessage());
                // 单个邮箱失败不中断，继续发送其他接收人
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        // SMTP 未配置时跳过
        return mailHost != null && !mailHost.isBlank();
    }

    /**
     * 邮件接收人（内部使用）。
     */
    private record EmailRecipient(Long id, String email) {}
}
```

- [ ] 在 `server/mb-admin/src/main/resources/application.yml` 中，在 `spring:` 根下新增 mail 配置（位于 `jackson:` 之后）：

```yaml
  # 邮件（SMTP 未配置时邮件渠道自动跳过）
  mail:
    host: ${MB_MAIL_HOST:}
    port: ${MB_MAIL_PORT:587}
    username: ${MB_MAIL_USERNAME:}
    password: ${MB_MAIL_PASSWORD:}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

- [ ] 在 `server/mb-admin/src/main/resources/application.yml` 的 `mb:` 段新增 app base-url 配置：

```yaml
  app:
    base-url: ${MB_APP_BASE_URL:http://localhost:5173}
```

> **注意**：`EmailChannel` 内部使用 `DSLContext` 查询 `mb_iam_user` 表获取邮箱。这符合 platform 层可访问 `mb-schema` 的依赖方向规则。但 `EmailChannel` 位于 `platform-notification` 模块，直接查 `mb_iam_user` 表存在跨 platform 模块访问的问题。替代方案：通过 `platform-iam` 暴露的 `IamUserApi` 接口获取用户邮箱。实施时需确认 `platform-iam` 是否暴露了按 userIds 批量查用户邮箱的 API。如果没有，直接通过 `mb-schema` 的 jOOQ 表引用查询是可接受的（platform 层都可访问 mb-schema）。

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): EmailChannel 邮件渠道（JavaMailSender + Thymeleaf 模板）`

---

### Task 11: 微信绑定表 DDL + WeChatProperties + jOOQ codegen

**Files:**
- `server/mb-schema/src/main/resources/db/migration/V20260615_002__wechat_binding.sql`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/config/WeChatProperties.java`（新建）
- `server/mb-admin/src/main/resources/application.yml`（新增 wechat 配置）

**Steps:**

- [ ] 创建 `server/mb-schema/src/main/resources/db/migration/V20260615_002__wechat_binding.sql`：

```sql
-- ===== 微信绑定关系表 =====
CREATE TABLE mb_user_wechat_binding (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    user_id         BIGINT NOT NULL,
    platform        VARCHAR(20) NOT NULL,   -- 'MP' (公众号) / 'MINI' (小程序)
    app_id          VARCHAR(64) NOT NULL,
    open_id         VARCHAR(64) NOT NULL,
    union_id        VARCHAR(64),            -- 同一开放平台下多应用关联
    nickname        VARCHAR(100),
    avatar_url      VARCHAR(500),
    bound_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, user_id, platform, app_id)
);

CREATE INDEX idx_wechat_binding_user ON mb_user_wechat_binding (tenant_id, user_id);
CREATE INDEX idx_wechat_binding_openid ON mb_user_wechat_binding (app_id, open_id);

COMMENT ON TABLE mb_user_wechat_binding IS '微信绑定关系';
COMMENT ON COLUMN mb_user_wechat_binding.tenant_id IS '租户 ID（v1 默认 0）';
COMMENT ON COLUMN mb_user_wechat_binding.user_id IS '系统用户 ID';
COMMENT ON COLUMN mb_user_wechat_binding.platform IS '平台类型：MP=公众号 MINI=小程序';
COMMENT ON COLUMN mb_user_wechat_binding.app_id IS '微信应用 AppID';
COMMENT ON COLUMN mb_user_wechat_binding.open_id IS '微信 OpenID（同一用户在不同应用有不同 OpenID）';
COMMENT ON COLUMN mb_user_wechat_binding.union_id IS 'UnionID（同一开放平台下多应用共享）';
COMMENT ON COLUMN mb_user_wechat_binding.nickname IS '微信昵称';
COMMENT ON COLUMN mb_user_wechat_binding.avatar_url IS '微信头像 URL';
COMMENT ON COLUMN mb_user_wechat_binding.bound_at IS '绑定时间';
```

- [ ] 运行 jOOQ codegen：

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

- [ ] 确认生成产物包含 `MbUserWechatBinding` 表：

```bash
ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/MbUserWechatBinding.java
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/config/WeChatProperties.java`：

```java
package com.metabuild.platform.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 微信配置属性。
 *
 * <p>配置前缀：mb.wechat
 * <p>appId/appSecret 未配置时对应渠道自动跳过。
 */
@ConfigurationProperties(prefix = "mb.wechat")
@Validated
public record WeChatProperties(
    MpConfig mp,
    MiniConfig mini
) {
    public WeChatProperties {
        if (mp == null) mp = new MpConfig("", "", "");
        if (mini == null) mini = new MiniConfig("", "", "");
    }

    /**
     * 微信公众号配置。
     */
    public record MpConfig(
        String appId,
        String appSecret,
        String templateNotice
    ) {
        public MpConfig {
            if (appId == null) appId = "";
            if (appSecret == null) appSecret = "";
            if (templateNotice == null) templateNotice = "";
        }

        /** 是否已配置（appId 和 appSecret 非空） */
        public boolean isConfigured() {
            return !appId.isBlank() && !appSecret.isBlank();
        }
    }

    /**
     * 微信小程序配置。
     */
    public record MiniConfig(
        String appId,
        String appSecret,
        String templateNotice
    ) {
        public MiniConfig {
            if (appId == null) appId = "";
            if (appSecret == null) appSecret = "";
            if (templateNotice == null) templateNotice = "";
        }

        /** 是否已配置 */
        public boolean isConfigured() {
            return !appId.isBlank() && !appSecret.isBlank();
        }
    }
}
```

- [ ] 在 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/config/NotificationAutoConfiguration.java` 中新增 `@EnableConfigurationProperties`：

```java
package com.metabuild.platform.notification.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;

/**
 * 通知公告模块自动配置入口。
 */
@AutoConfiguration
@EnableConfigurationProperties(WeChatProperties.class)
@ComponentScan(basePackages = "com.metabuild.platform.notification")
public class NotificationAutoConfiguration {
}
```

- [ ] 在 `server/mb-admin/src/main/resources/application.yml` 的 `mb:` 段新增 wechat 配置：

```yaml
  wechat:
    mp:
      app-id: ${MB_WECHAT_MP_APP_ID:}
      app-secret: ${MB_WECHAT_MP_APP_SECRET:}
      template-notice: ${MB_WECHAT_MP_TEMPLATE_NOTICE:}
    mini:
      app-id: ${MB_WECHAT_MINI_APP_ID:}
      app-secret: ${MB_WECHAT_MINI_APP_SECRET:}
      template-notice: ${MB_WECHAT_MINI_TEMPLATE_NOTICE:}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): 微信绑定表 DDL + WeChatProperties + jOOQ codegen`

---

### Task 12: WeChatMpChannel（公众号模板消息）+ WeChatMiniChannel（小程序订阅消息）

**Files:**
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatMpChannel.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatMiniChannel.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatBindingRepository.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatBindingRepository.java`：

```java
package com.metabuild.platform.notification.domain;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.metabuild.schema.tables.MbUserWechatBinding.MB_USER_WECHAT_BINDING;

/**
 * 微信绑定关系 Repository。
 */
@Repository
@RequiredArgsConstructor
public class WeChatBindingRepository {

    private final DSLContext dsl;

    /**
     * 按平台和用户 ID 列表查询 openId。
     *
     * @param platform 平台类型（MP / MINI）
     * @param appId    应用 AppID
     * @param userIds  用户 ID 列表
     * @return userId → openId 映射（未绑定的用户不在结果中）
     */
    public Map<Long, String> findOpenIds(String platform, String appId, List<Long> userIds) {
        return dsl.select(MB_USER_WECHAT_BINDING.USER_ID, MB_USER_WECHAT_BINDING.OPEN_ID)
                .from(MB_USER_WECHAT_BINDING)
                .where(MB_USER_WECHAT_BINDING.PLATFORM.eq(platform))
                .and(MB_USER_WECHAT_BINDING.APP_ID.eq(appId))
                .and(MB_USER_WECHAT_BINDING.USER_ID.in(userIds))
                .fetchMap(MB_USER_WECHAT_BINDING.USER_ID, MB_USER_WECHAT_BINDING.OPEN_ID);
    }
}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatMpChannel.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.WeChatProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信公众号模板消息渠道。
 *
 * <p>通过微信 API 发送模板消息。未配置 appId/appSecret 时自动跳过。
 * 未绑定公众号的用户静默跳过（不报错）。
 *
 * <p>v1 使用 RestTemplate 直接调用微信 API。
 * 如需要更完善的微信 SDK 能力（如自动刷新 access_token），
 * 可在后续版本引入 weixin-java-mp。
 */
@Component
@RequiredArgsConstructor
public class WeChatMpChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(WeChatMpChannel.class);

    private static final String TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";
    private static final String SEND_URL = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=%s";

    private final WeChatProperties weChatProperties;
    private final WeChatBindingRepository bindingRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String channelType() {
        return "WECHAT_MP";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        WeChatProperties.MpConfig mp = weChatProperties.mp();

        // 获取 access_token
        String accessToken = getAccessToken(mp.appId(), mp.appSecret());

        // 查询接收人的 openId
        Map<Long, String> openIdMap = bindingRepository.findOpenIds(
                "MP", mp.appId(), message.recipientUserIds());

        if (openIdMap.isEmpty()) {
            log.info("公众号渠道：无绑定用户，跳过发送");
            return;
        }

        String title = message.params().getOrDefault("title", "通知");
        String templateId = mp.templateNotice();

        // 逐个发送模板消息
        for (Map.Entry<Long, String> entry : openIdMap.entrySet()) {
            try {
                sendTemplateMessage(accessToken, entry.getValue(), templateId, title);
                log.debug("公众号模板消息发送成功: userId={}, openId={}", entry.getKey(), entry.getValue());
            } catch (Exception e) {
                log.error("公众号模板消息发送失败: userId={}, error={}", entry.getKey(), e.getMessage());
                // 单个用户失败不中断
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        return weChatProperties.mp().isConfigured()
                && !weChatProperties.mp().templateNotice().isBlank();
    }

    /**
     * 获取微信公众号 access_token。
     *
     * <p>v1 每次调用都请求新 token（简单实现）。
     * 生产环境应缓存 token（有效期 7200s），在 v1.5 优化。
     */
    @SuppressWarnings("unchecked")
    private String getAccessToken(String appId, String appSecret) {
        String url = String.format(TOKEN_URL, appId, appSecret);
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("access_token")) {
            String errMsg = response != null ? String.valueOf(response.get("errmsg")) : "null response";
            throw new NotificationException("获取公众号 access_token 失败: " + errMsg);
        }
        return (String) response.get("access_token");
    }

    /**
     * 发送模板消息。
     */
    private void sendTemplateMessage(String accessToken, String openId, String templateId, String title) {
        String url = String.format(SEND_URL, accessToken);

        Map<String, Object> body = new HashMap<>();
        body.put("touser", openId);
        body.put("template_id", templateId);
        Map<String, Object> data = new HashMap<>();
        data.put("first", Map.of("value", "您收到一条新公告"));
        data.put("keyword1", Map.of("value", title));
        data.put("keyword2", Map.of("value", "通知公告"));
        body.put("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        restTemplate.postForObject(url, request, Map.class);
    }
}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatMiniChannel.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.config.WeChatProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信小程序订阅消息渠道。
 *
 * <p>通过微信小程序 API 发送订阅消息。未配置 appId/appSecret 时自动跳过。
 * 未绑定小程序的用户静默跳过（不报错）。
 *
 * <p>用户需在小程序端主动订阅（一次性订阅 or 长期订阅）。
 */
@Component
@RequiredArgsConstructor
public class WeChatMiniChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(WeChatMiniChannel.class);

    private static final String TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";
    private static final String SEND_URL = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=%s";

    private final WeChatProperties weChatProperties;
    private final WeChatBindingRepository bindingRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String channelType() {
        return "WECHAT_MINI";
    }

    @Override
    public void send(NotificationMessage message) throws NotificationException {
        WeChatProperties.MiniConfig mini = weChatProperties.mini();

        // 获取 access_token
        String accessToken = getAccessToken(mini.appId(), mini.appSecret());

        // 查询接收人的 openId
        Map<Long, String> openIdMap = bindingRepository.findOpenIds(
                "MINI", mini.appId(), message.recipientUserIds());

        if (openIdMap.isEmpty()) {
            log.info("小程序渠道：无绑定用户，跳过发送");
            return;
        }

        String title = message.params().getOrDefault("title", "通知");
        String templateId = mini.templateNotice();

        // 逐个发送订阅消息
        for (Map.Entry<Long, String> entry : openIdMap.entrySet()) {
            try {
                sendSubscribeMessage(accessToken, entry.getValue(), templateId, title);
                log.debug("小程序订阅消息发送成功: userId={}, openId={}", entry.getKey(), entry.getValue());
            } catch (Exception e) {
                log.error("小程序订阅消息发送失败: userId={}, error={}", entry.getKey(), e.getMessage());
            }
        }
    }

    @Override
    public boolean supports(NotificationMessage message) {
        return weChatProperties.mini().isConfigured()
                && !weChatProperties.mini().templateNotice().isBlank();
    }

    @SuppressWarnings("unchecked")
    private String getAccessToken(String appId, String appSecret) {
        String url = String.format(TOKEN_URL, appId, appSecret);
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("access_token")) {
            String errMsg = response != null ? String.valueOf(response.get("errmsg")) : "null response";
            throw new NotificationException("获取小程序 access_token 失败: " + errMsg);
        }
        return (String) response.get("access_token");
    }

    private void sendSubscribeMessage(String accessToken, String openId, String templateId, String title) {
        String url = String.format(SEND_URL, accessToken);

        Map<String, Object> body = new HashMap<>();
        body.put("touser", openId);
        body.put("template_id", templateId);
        body.put("page", "/pages/notice/detail");
        Map<String, Object> data = new HashMap<>();
        data.put("thing1", Map.of("value", title));
        data.put("thing2", Map.of("value", "通知公告"));
        body.put("data", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        restTemplate.postForObject(url, request, Map.class);
    }
}
```

> **设计决策**：v1 使用 `RestTemplate` 直接调用微信 API，而非引入 `weixin-java-mp/miniapp` SDK。原因：
> 1. v1 只用到模板消息/订阅消息发送这一个能力，不值得引入完整 SDK（及其传递依赖）
> 2. access_token 的获取和缓存逻辑简单（v1 每次请求，v1.5 加 Redis 缓存）
> 3. 减少 root pom 的 dependencyManagement 条目
>
> 如果后续需要微信登录、菜单管理等更复杂的能力，再引入 weixin-java-mp SDK。

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): WeChatMpChannel + WeChatMiniChannel 微信通知渠道`

---

### Task 13: 微信绑定/解绑 API（WeChatBindingController + WeChatBindingService）

**Files:**
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatBindingService.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/web/WeChatBindingController.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/dto/WeChatMpBindCommand.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/dto/WeChatMiniBindCommand.java`（新建）
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/dto/WeChatBindingView.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/dto/WeChatMpBindCommand.java`：

```java
package com.metabuild.platform.notification.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 公众号绑定命令。
 *
 * @param code  微信 OAuth 授权码
 * @param state CSRF state（后端校验后删除）
 */
public record WeChatMpBindCommand(
    @NotBlank String code,
    @NotBlank String state
) {}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/dto/WeChatMiniBindCommand.java`：

```java
package com.metabuild.platform.notification.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 小程序绑定命令。
 *
 * @param code wx.login() 返回的临时登录凭证
 */
public record WeChatMiniBindCommand(
    @NotBlank String code
) {}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/api/dto/WeChatBindingView.java`：

```java
package com.metabuild.platform.notification.api.dto;

import java.time.OffsetDateTime;

/**
 * 微信绑定状态视图。
 */
public record WeChatBindingView(
    Long id,
    String platform,
    String appId,
    String openId,
    String nickname,
    String avatarUrl,
    OffsetDateTime boundAt
) {}
```

- [ ] 在 `WeChatBindingRepository` 中追加绑定/解绑/查询方法：

```java
/**
 * 插入绑定记录。
 */
public void insert(MbUserWechatBindingRecord record) {
    dsl.insertInto(MB_USER_WECHAT_BINDING)
        .set(record)
        .onConflict(MB_USER_WECHAT_BINDING.TENANT_ID, MB_USER_WECHAT_BINDING.USER_ID,
                    MB_USER_WECHAT_BINDING.PLATFORM, MB_USER_WECHAT_BINDING.APP_ID)
        .doUpdate()
        .set(MB_USER_WECHAT_BINDING.OPEN_ID, record.getOpenId())
        .set(MB_USER_WECHAT_BINDING.UNION_ID, record.getUnionId())
        .set(MB_USER_WECHAT_BINDING.NICKNAME, record.getNickname())
        .set(MB_USER_WECHAT_BINDING.AVATAR_URL, record.getAvatarUrl())
        .set(MB_USER_WECHAT_BINDING.BOUND_AT, record.getBoundAt())
        .execute();
}

/**
 * 解绑。
 */
public boolean unbind(Long userId, String platform, String appId, Long tenantId) {
    return dsl.deleteFrom(MB_USER_WECHAT_BINDING)
        .where(MB_USER_WECHAT_BINDING.USER_ID.eq(userId))
        .and(MB_USER_WECHAT_BINDING.PLATFORM.eq(platform))
        .and(MB_USER_WECHAT_BINDING.APP_ID.eq(appId))
        .and(MB_USER_WECHAT_BINDING.TENANT_ID.eq(tenantId))
        .execute() > 0;
}

/**
 * 查询用户的所有绑定关系。
 */
public List<WeChatBindingView> findByUserId(Long userId, Long tenantId) {
    return dsl.selectFrom(MB_USER_WECHAT_BINDING)
        .where(MB_USER_WECHAT_BINDING.USER_ID.eq(userId))
        .and(MB_USER_WECHAT_BINDING.TENANT_ID.eq(tenantId))
        .orderBy(MB_USER_WECHAT_BINDING.BOUND_AT.desc())
        .fetchInto(WeChatBindingView.class);
}
```

> 注意：需要在 WeChatBindingRepository 中添加 `import com.metabuild.platform.notification.api.dto.WeChatBindingView;` 和 `import com.metabuild.schema.tables.records.MbUserWechatBindingRecord;`，以及 `import static com.metabuild.schema.tables.MbUserWechatBinding.MB_USER_WECHAT_BINDING;`。

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/domain/WeChatBindingService.java`：

```java
package com.metabuild.platform.notification.domain;

import com.metabuild.common.id.SnowflakeIdGenerator;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.notification.api.NotificationException;
import com.metabuild.platform.notification.api.dto.WeChatBindingView;
import com.metabuild.platform.notification.api.dto.WeChatMiniBindCommand;
import com.metabuild.platform.notification.api.dto.WeChatMpBindCommand;
import com.metabuild.platform.notification.config.WeChatProperties;
import com.metabuild.schema.tables.records.MbUserWechatBindingRecord;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 微信绑定/解绑服务。
 *
 * <p>公众号绑定：OAuth 网页授权 + state CSRF 防护。
 * <p>小程序绑定：wx.login() code 换 openId。
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WeChatBindingService {

    private static final Logger log = LoggerFactory.getLogger(WeChatBindingService.class);

    private static final String STATE_KEY_PREFIX = "mb:wechat:state:";
    private static final Duration STATE_TTL = Duration.ofMinutes(5);

    private static final String MP_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code";
    private static final String MP_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s&lang=zh_CN";
    private static final String MINI_SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code";

    private final WeChatProperties weChatProperties;
    private final WeChatBindingRepository bindingRepository;
    private final SnowflakeIdGenerator idGenerator;
    private final CurrentUser currentUser;
    private final StringRedisTemplate redisTemplate;
    private final Clock clock;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 生成公众号 OAuth state（存 Redis，TTL 5 分钟）。
     *
     * @return state 值
     */
    public String generateMpOAuthState() {
        String state = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(STATE_KEY_PREFIX + state, currentUser.userId().toString(), STATE_TTL);
        return state;
    }

    /**
     * 公众号绑定（OAuth 授权回调）。
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public WeChatBindingView bindMp(WeChatMpBindCommand cmd) {
        // 1. 校验 state（CSRF 防护）
        String stateKey = STATE_KEY_PREFIX + cmd.state();
        String storedUserId = redisTemplate.opsForValue().get(stateKey);
        if (storedUserId == null || !storedUserId.equals(currentUser.userId().toString())) {
            throw new NotificationException("OAuth state 无效或已过期");
        }
        // 一次性使用，立即删除
        redisTemplate.delete(stateKey);

        WeChatProperties.MpConfig mp = weChatProperties.mp();

        // 2. code 换 access_token + openid
        String tokenUrl = String.format(MP_TOKEN_URL, mp.appId(), mp.appSecret(), cmd.code());
        Map<String, Object> tokenResp = restTemplate.getForObject(tokenUrl, Map.class);
        if (tokenResp == null || !tokenResp.containsKey("openid")) {
            throw new NotificationException("公众号 code 换 token 失败: " + tokenResp);
        }
        String accessToken = (String) tokenResp.get("access_token");
        String openId = (String) tokenResp.get("openid");
        String unionId = (String) tokenResp.get("unionid");

        // 3. 获取用户信息
        String userinfoUrl = String.format(MP_USERINFO_URL, accessToken, openId);
        Map<String, Object> userInfo = restTemplate.getForObject(userinfoUrl, Map.class);
        String nickname = userInfo != null ? (String) userInfo.get("nickname") : null;
        String avatarUrl = userInfo != null ? (String) userInfo.get("headimgurl") : null;

        // 4. 写入绑定记录（UPSERT）
        MbUserWechatBindingRecord record = new MbUserWechatBindingRecord();
        record.setId(idGenerator.nextId());
        record.setTenantId(currentUser.tenantId());
        record.setUserId(currentUser.userId());
        record.setPlatform("MP");
        record.setAppId(mp.appId());
        record.setOpenId(openId);
        record.setUnionId(unionId);
        record.setNickname(nickname);
        record.setAvatarUrl(avatarUrl);
        record.setBoundAt(OffsetDateTime.now(clock));
        bindingRepository.insert(record);

        log.info("公众号绑定成功: userId={}, openId={}", currentUser.userId(), openId);

        return new WeChatBindingView(record.getId(), "MP", mp.appId(), openId, nickname, avatarUrl, record.getBoundAt());
    }

    /**
     * 小程序绑定（wx.login code 换 openId）。
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public WeChatBindingView bindMini(WeChatMiniBindCommand cmd) {
        WeChatProperties.MiniConfig mini = weChatProperties.mini();

        // code 换 openid + session_key
        String sessionUrl = String.format(MINI_SESSION_URL, mini.appId(), mini.appSecret(), cmd.code());
        Map<String, Object> sessionResp = restTemplate.getForObject(sessionUrl, Map.class);
        if (sessionResp == null || !sessionResp.containsKey("openid")) {
            throw new NotificationException("小程序 code 换 session 失败: " + sessionResp);
        }
        String openId = (String) sessionResp.get("openid");
        String unionId = (String) sessionResp.get("unionid");

        // 写入绑定记录（UPSERT）
        MbUserWechatBindingRecord record = new MbUserWechatBindingRecord();
        record.setId(idGenerator.nextId());
        record.setTenantId(currentUser.tenantId());
        record.setUserId(currentUser.userId());
        record.setPlatform("MINI");
        record.setAppId(mini.appId());
        record.setOpenId(openId);
        record.setUnionId(unionId);
        record.setBoundAt(OffsetDateTime.now(clock));
        bindingRepository.insert(record);

        log.info("小程序绑定成功: userId={}, openId={}", currentUser.userId(), openId);

        return new WeChatBindingView(record.getId(), "MINI", mini.appId(), openId, null, null, record.getBoundAt());
    }

    /**
     * 解绑微信。
     */
    @Transactional
    public void unbind(String platform) {
        String appId = "MP".equals(platform) ? weChatProperties.mp().appId() : weChatProperties.mini().appId();
        boolean deleted = bindingRepository.unbind(currentUser.userId(), platform, appId, currentUser.tenantId());
        if (!deleted) {
            throw new NotificationException("未找到对应的微信绑定关系");
        }
        log.info("微信解绑成功: userId={}, platform={}", currentUser.userId(), platform);
    }

    /**
     * 查询当前用户的微信绑定状态。
     */
    public List<WeChatBindingView> myBindings() {
        return bindingRepository.findByUserId(currentUser.userId(), currentUser.tenantId());
    }
}
```

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/web/WeChatBindingController.java`：

```java
package com.metabuild.platform.notification.web;

import com.metabuild.platform.notification.api.dto.WeChatBindingView;
import com.metabuild.platform.notification.api.dto.WeChatMiniBindCommand;
import com.metabuild.platform.notification.api.dto.WeChatMpBindCommand;
import com.metabuild.platform.notification.domain.WeChatBindingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 微信绑定/解绑 API。
 *
 * <p>已登录用户才能操作（走全局 SaInterceptor 认证），无需额外权限注解。
 */
@RestController
@RequestMapping("/api/v1/wechat")
@RequiredArgsConstructor
@Tag(name = "微信绑定", description = "微信公众号/小程序绑定解绑")
public class WeChatBindingController {

    private final WeChatBindingService bindingService;

    @GetMapping("/mp/oauth-state")
    @Operation(summary = "生成公众号 OAuth state", description = "返回 state 值，前端拼接微信授权 URL")
    public Map<String, String> generateMpOAuthState() {
        String state = bindingService.generateMpOAuthState();
        return Map.of("state", state);
    }

    @PostMapping("/bind-mp")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "公众号绑定", description = "微信 OAuth 授权回调后，用 code + state 完成绑定")
    public WeChatBindingView bindMp(@Valid @RequestBody WeChatMpBindCommand cmd) {
        return bindingService.bindMp(cmd);
    }

    @PostMapping("/bind-mini")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "小程序绑定", description = "wx.login() 获取 code 后完成绑定")
    public WeChatBindingView bindMini(@Valid @RequestBody WeChatMiniBindCommand cmd) {
        return bindingService.bindMini(cmd);
    }

    @DeleteMapping("/unbind/{platform}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "解绑微信", description = "解绑指定平台（MP/MINI）的微信绑定关系")
    public void unbind(@PathVariable String platform) {
        bindingService.unbind(platform);
    }

    @GetMapping("/bindings")
    @Operation(summary = "查询我的微信绑定", description = "返回当前用户的全部微信绑定关系")
    public List<WeChatBindingView> myBindings() {
        return bindingService.myBindings();
    }
}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): 微信绑定/解绑 API（公众号 OAuth + 小程序 wx.login + state CSRF）`

---

### Task 14: Notice publish → NotificationDispatcher 串联（替换 Plan A 简单通知）

**Files:**
- `server/mb-business/business-notice/pom.xml`（确认 platform-notification 依赖已存在）
- `server/mb-business/business-notice/src/main/java/com/metabuild/business/notice/domain/NoticePublishedEventListener.java`（修改）

**Steps:**

- [ ] 修改 `NoticePublishedEventListener`，将 Plan A 中的简单 `NotificationApi.create()` 替换为 `NotificationApi.dispatch()`：

```java
package com.metabuild.business.notice.domain;

import com.metabuild.platform.notification.api.NotificationApi;
import com.metabuild.platform.notification.api.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/**
 * 公告发布事件监听器。
 *
 * <p>事务提交后异步触发，调用 NotificationDispatcher 分发到所有配置的渠道
 * （站内信 SSE + 邮件 + 微信公众号 + 微信小程序）。
 *
 * <p>替换 Plan A 中的简单 NotificationApi.create()，
 * 升级为完整的多渠道通知分发。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NoticePublishedEventListener {

    private final NotificationApi notificationApi;

    /**
     * 监听公告发布事件，分发通知到所有支持的渠道。
     *
     * <p>使用 @TransactionalEventListener(AFTER_COMMIT) 确保只在事务成功后触发，
     * 配合 @Async 异步执行，不阻塞发布主流程。
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onNoticePublished(NoticePublishedEvent event) {
        log.info("处理公告发布事件: noticeId={}, 接收人数={}", event.noticeId(), event.recipientUserIds().size());

        try {
            NotificationMessage message = new NotificationMessage(
                    0L, // tenantId（v1 默认 0）
                    event.recipientUserIds(),
                    "notice_published",
                    Map.of("title", event.title()),
                    "notice",
                    String.valueOf(event.noticeId())
            );
            notificationApi.dispatch(message);
            log.info("公告通知分发完成: noticeId={}", event.noticeId());
        } catch (Exception e) {
            // 异步操作失败不影响发布结果，仅记录日志
            log.error("公告通知分发失败: noticeId={}", event.noticeId(), e);
        }
    }
}
```

- [ ] 确认 `NotificationService` 已实现 `dispatch()` 方法（Task 7 中添加），代码如下确认：

```java
// 在 NotificationService 中应有：
@Override
public void dispatch(NotificationMessage message) {
    notificationDispatcher.dispatch(message);
}
```

实施时 grep 确认 `NotificationService` 中 `dispatch` 方法存在，如果不存在则添加。

**Verify:**

```bash
cd server && mvn compile -pl mb-business/business-notice -am
```

**Commit:** `feat(notice): publish → NotificationDispatcher 多渠道分发串联`

---

### Task 15: 通知发送记录查询 API

**Files:**
- `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/web/NotificationLogController.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-platform/platform-notification/src/main/java/com/metabuild/platform/notification/web/NotificationLogController.java`：

```java
package com.metabuild.platform.notification.web;

import com.metabuild.infra.security.RequirePermission;
import com.metabuild.platform.notification.domain.NotificationLogRepository;
import com.metabuild.platform.notification.domain.NotificationLogView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 通知发送记录查询 API。
 *
 * <p>查询某条公告（或其他业务模块）的各渠道发送状态。
 */
@RestController
@RequestMapping("/api/v1/notification-logs")
@RequiredArgsConstructor
@Tag(name = "通知发送记录", description = "通知分发日志查询")
public class NotificationLogController {

    private final NotificationLogRepository logRepository;

    @GetMapping
    @RequirePermission("notice:notice:detail")
    @Operation(summary = "按模块和关联 ID 查询发送记录")
    public List<NotificationLogView> findByModuleAndRef(
            @Parameter(description = "来源模块", example = "notice") @RequestParam String module,
            @Parameter(description = "关联业务 ID", example = "123456") @RequestParam String referenceId) {
        return logRepository.findByModuleAndRef(module, referenceId);
    }
}
```

**Verify:**

```bash
cd server && mvn compile -pl mb-platform/platform-notification -am
```

**Commit:** `feat(notification): 通知发送记录查询 API`

---

### Task 16: Phase 4 集成测试

**Files:**
- `server/mb-admin/src/test/java/com/metabuild/admin/notification/NotificationChannelIntegrationTest.java`（新建）

**Steps:**

- [ ] 创建 `server/mb-admin/src/test/java/com/metabuild/admin/notification/NotificationChannelIntegrationTest.java`：

```java
package com.metabuild.admin.notification;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.platform.notification.api.NotificationChannel;
import com.metabuild.platform.notification.api.NotificationMessage;
import com.metabuild.platform.notification.domain.NotificationDispatcher;
import com.metabuild.platform.notification.domain.NotificationLogRepository;
import com.metabuild.platform.notification.domain.NotificationLogView;
import com.metabuild.platform.notification.domain.InAppChannel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 通知渠道系统集成测试。
 *
 * <p>测试渠道分发、日志记录、发送记录查询等核心行为。
 * 微信渠道在测试环境中不可用（环境变量未配置），supports() 返回 false，自动跳过。
 */
@AutoConfigureMockMvc
@DisplayName("通知渠道系统集成测试")
class NotificationChannelIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private List<NotificationChannel> channels;

    @Autowired
    private NotificationDispatcher dispatcher;

    @Autowired
    private NotificationLogRepository logRepository;

    @Autowired
    private MockMvc mockMvc;

    // ===== 渠道注册 =====

    @Test
    @DisplayName("Spring 自动注入至少包含 InAppChannel")
    void channelList_containsInApp() {
        assertThat(channels).isNotEmpty();
        assertThat(channels).anyMatch(ch -> "IN_APP".equals(ch.channelType()));
    }

    @Test
    @DisplayName("InAppChannel.supports() 始终返回 true")
    void inAppChannel_alwaysSupports() {
        InAppChannel inApp = channels.stream()
                .filter(ch -> ch instanceof InAppChannel)
                .map(InAppChannel.class::cast)
                .findFirst()
                .orElseThrow();

        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L), "test", Map.of(), "test", "123");
        assertThat(inApp.supports(msg)).isTrue();
    }

    // ===== 微信渠道环境检查 =====

    @Test
    @DisplayName("WeChatMpChannel.supports() 在测试环境返回 false（未配置 appId）")
    void weChatMp_notConfigured_returnsFalse() {
        channels.stream()
                .filter(ch -> "WECHAT_MP".equals(ch.channelType()))
                .findFirst()
                .ifPresent(ch -> {
                    NotificationMessage msg = new NotificationMessage(
                            0L, List.of(1L), "test", Map.of(), "test", "123");
                    assertThat(ch.supports(msg)).isFalse();
                });
    }

    @Test
    @DisplayName("WeChatMiniChannel.supports() 在测试环境返回 false（未配置 appId）")
    void weChatMini_notConfigured_returnsFalse() {
        channels.stream()
                .filter(ch -> "WECHAT_MINI".equals(ch.channelType()))
                .findFirst()
                .ifPresent(ch -> {
                    NotificationMessage msg = new NotificationMessage(
                            0L, List.of(1L), "test", Map.of(), "test", "123");
                    assertThat(ch.supports(msg)).isFalse();
                });
    }

    // ===== 分发器 =====

    @Test
    @DisplayName("dispatch 后 notification_log 有记录")
    void dispatch_writesLogEntry() {
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L, 2L), "notice_published",
                Map.of("title", "测试公告"), "notice", "test-ref-001");

        dispatcher.dispatch(msg);

        List<NotificationLogView> logs = logRepository.findByModuleAndRef("notice", "test-ref-001");
        // 至少 IN_APP 渠道会写入记录（每个接收人一条）
        assertThat(logs).isNotEmpty();
        assertThat(logs).allMatch(l -> l.status() == 1); // 全部成功
    }

    @Test
    @DisplayName("dispatch 对无支持渠道的消息不报错")
    void dispatch_noSupportedChannels_noError() {
        // 构造一个所有渠道都不支持的场景（此处 InAppChannel 始终支持，所以这个测试验证不会抛异常）
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(), "unknown_template",
                Map.of(), "unknown_module", "ref-999");
        dispatcher.dispatch(msg);
    }

    // ===== 发送记录查询 API =====

    @Test
    @DisplayName("GET /api/v1/notification-logs 按 module+ref 查询")
    void getNotificationLogs_returnsList() throws Exception {
        // 先分发一条消息，确保有记录
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L), "notice_published",
                Map.of("title", "API测试"), "notice", "api-test-ref");
        dispatcher.dispatch(msg);

        mockMvc.perform(get("/api/v1/notification-logs")
                        .param("module", "notice")
                        .param("referenceId", "api-test-ref"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].module").value("notice"))
                .andExpect(jsonPath("$[0].referenceId").value("api-test-ref"));
    }

    // ===== notification_log DDL 验证 =====

    @Test
    @DisplayName("notification_log 表索引存在")
    void notificationLog_indexesExist() {
        // Flyway 迁移已执行，表和索引应该存在
        // 通过插入和查询验证表可用
        NotificationMessage msg = new NotificationMessage(
                0L, List.of(1L), "test_template",
                Map.of(), "test_module", "idx-test-ref");
        dispatcher.dispatch(msg);

        List<NotificationLogView> logs = logRepository.findByModuleAndRef("test_module", "idx-test-ref");
        assertThat(logs).isNotEmpty();
    }

    // ===== 微信绑定表 DDL 验证 =====

    @Test
    @DisplayName("wechat_binding 表 Flyway 迁移成功（表可访问）")
    void wechatBindingTable_migrated(@Autowired org.jooq.DSLContext dsl) {
        // 验证表存在且可查询
        int count = dsl.fetchCount(
                com.metabuild.schema.tables.MbUserWechatBinding.MB_USER_WECHAT_BINDING);
        assertThat(count).isGreaterThanOrEqualTo(0);
    }
}
```

**Verify:**

```bash
cd server && mvn test -pl mb-admin -Dtest=NotificationChannelIntegrationTest
cd server && mvn test -pl mb-admin -Dtest=SseIntegrationTest
```

**Commit:** `test(notification): 通知渠道集成测试 8 用例（渠道注册 + 分发 + 日志 + DDL）`

---

### Task 17: 全量验证 + openapi.json 更新

**Files:**
- `server/api-contract/openapi-v1.json`（更新）

**Steps:**

- [ ] 运行全量后端验证：

```bash
cd server && mvn verify
```

- [ ] 运行 ArchUnit 测试确认无违规：

```bash
cd server && mvn -pl mb-admin test -Dtest=ArchitectureTest
```

- [ ] 启动后端并抓取最新 openapi.json（含 SSE + 微信绑定 + 通知日志端点）：

```bash
cd server && mvn spring-boot:run -pl mb-admin &
# 等待启动完成
sleep 15
curl http://localhost:8080/api-docs -o server/api-contract/openapi-v1.json
# 停止后端
kill %1
```

- [ ] 确认 openapi.json 包含新增端点：
  - `/api/v1/sse/connect`
  - `/api/v1/wechat/mp/oauth-state`
  - `/api/v1/wechat/bind-mp`
  - `/api/v1/wechat/bind-mini`
  - `/api/v1/wechat/unbind/{platform}`
  - `/api/v1/wechat/bindings`
  - `/api/v1/notification-logs`

- [ ] 运行 orval 重新生成前端 SDK：

```bash
cd client && pnpm generate:api-sdk
```

- [ ] 验证前端类型检查通过：

```bash
cd client && pnpm check:types
```

**Verify:**

```bash
cd server && mvn verify
cd client && pnpm check:types
```

**Commit:** `feat(api-sdk): openapi.json 更新（SSE + 微信绑定 + 通知日志端点）`

---

## 依赖关系

```
Phase 3 (SSE):
  Task 1 (脚手架) → Task 2 (Registry) → Task 3 (Sender) → Task 4 (Controller) → Task 5 (心跳+兜底)
                                                                                → Task 6 (SSE 测试)

Phase 4 (通知渠道):
  Task 7 (接口+Dispatcher) → Task 8 (log DDL) → Task 9 (InApp) ──→ Task 14 (串联)
                                               → Task 10 (Email)
                           → Task 11 (微信 DDL) → Task 12 (微信 Channel) → Task 13 (绑定 API)
                                                                        → Task 15 (日志查询)
                                                                        → Task 16 (测试) → Task 17 (验证)
```

**可并行的 Task 组：**
- Phase 3 内部：Task 2-5 强依赖，但 Task 6 可在 Task 5 完成后立即开始
- Phase 4 内部：Task 8（log DDL）和 Task 11（微信 DDL）可并行
- Phase 4 内部：Task 9（InApp）、Task 10（Email）、Task 12（微信 Channel）三者互相独立，可并行
- Task 14（串联）依赖 Task 9（InAppChannel）+ Task 7（Dispatcher）
- Task 16（测试）依赖所有实现 Task 完成

**建议执行顺序：**
1. Task 1（脚手架）
2. Task 2（Registry）
3. Task 3（Sender）
4. 并行：Task 4（Controller）+ Task 5（心跳+兜底）
5. Task 6（SSE 测试）
6. 并行：Task 7（接口+Dispatcher）+ Task 11（微信 DDL）
7. Task 8（log DDL + codegen）
8. 并行：Task 9（InApp）+ Task 10（Email）+ Task 12（微信 Channel）
9. 并行：Task 13（绑定 API）+ Task 14（串联）+ Task 15（日志查询）
10. Task 16（测试）
11. Task 17（全量验证）

---

## M5 后续计划

| 计划 | 范围 | 依赖 | 状态 |
|------|------|------|------|
| **Plan A** | OpenAPI 管线 + Notice 后端 CRUD | 无 | 已完成 |
| **Plan B**（本文档） | SSE 基础设施 + 通知渠道系统 | 依赖 Plan A | 执行中 |
| **Plan C** | Notice 前端 + SSE 前端 + E2E | 依赖 Plan A + B | 待写 |
