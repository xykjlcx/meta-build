# M1 脚手架实施计划

> **说明**：这是历史执行计划，不是当前真相。计划中的代码片段、目录结构、命名和完成度必须以当前仓库实际文件重新校验。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从空仓库构建 meta-build 完整的 M1 脚手架，使得 `git clone → docker compose up -d → scripts/dev.sh` 能跑起来并看到登录页。

**Architecture:** 后端 6 层 Maven multi-module（mb-common → mb-schema → mb-infra → mb-platform → mb-business → mb-admin），前端 5 层 pnpm workspace（ui-tokens → ui-primitives → ui-patterns → app-shell → web-admin）。后端使用 Spring Boot 3.5.x + jOOQ + PostgreSQL 16 + Flyway；前端使用 React 19 + TypeScript strict + Vite + Tailwind CSS v4。

**Tech Stack:** JDK 21, Spring Boot 3.5.x, jOOQ 3.19+, PostgreSQL 16, Flyway 10+, Redis, ArchUnit, Testcontainers, React 19, TypeScript 5.6+, Vite 5.4+, Tailwind CSS v4, Biome, pnpm 9.12+

**Parallelism:** Phase 2（后端 Task 2-12）和 Phase 3（前端 Task 13-14）可以完全并行执行。

---

## Phase 1: 基础设施

### Task 1: 项目根目录 + Docker 基础设施

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`（根目录）
- Create: `scripts/dev.sh`
- Modify: `.gitignore`

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: mb-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-metabuild}
      POSTGRES_USER: ${POSTGRES_USER:-metabuild}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-metabuild}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-metabuild}"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mb-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pg-data:
  redis-data:
```

- [ ] **Step 2: 创建根目录 .env.example**

```bash
# .env.example
# Docker Compose 配置
POSTGRES_DB=metabuild
POSTGRES_USER=metabuild
POSTGRES_PASSWORD=metabuild
POSTGRES_PORT=5432
REDIS_PORT=6379
```

- [ ] **Step 3: 创建 scripts/dev.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== meta-build dev startup ==="

# 检查 Docker 服务
if ! docker compose -f "$ROOT_DIR/docker-compose.yml" ps --status running | grep -q postgres; then
    echo "⚠ PostgreSQL 未运行，正在启动 Docker 服务..."
    docker compose -f "$ROOT_DIR/docker-compose.yml" up -d
    echo "等待 PostgreSQL 就绪..."
    sleep 3
fi

# 启动后端
echo "启动 Spring Boot 应用..."
cd "$ROOT_DIR/server"
mvn spring-boot:run -pl mb-admin -Dspring-boot.run.profiles=dev
```

- [ ] **Step 4: 更新 .gitignore**

在现有 `.gitignore` 末尾追加（如果不存在则创建）：

```gitignore
# IDE
.idea/
*.iml
.vscode/
.DS_Store

# Java
target/
*.class
*.jar
*.war

# Node
node_modules/
dist/
.pnpm-store/

# Environment
.env
.env.local
.env.*.local

# Docker
pg-data/
redis-data/

# OS
Thumbs.db

# Logs
*.log
```

- [ ] **Step 5: 验证 Docker 基础设施**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build && docker compose up -d && docker compose ps`
Expected: postgres 和 redis 都显示 running (healthy)

- [ ] **Step 6: 停止 Docker 并提交**

```bash
docker compose down
git add docker-compose.yml .env.example scripts/dev.sh .gitignore
git commit -m "feat: M1 Docker 基础设施 + 开发启动脚本

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2: 后端脚手架

### Task 2: 后端根 POM（版本 BOM）

**Files:**
- Create: `server/pom.xml`

- [ ] **Step 1: 创建 server/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.3</version>
        <relativePath/>
    </parent>

    <groupId>com.metabuild</groupId>
    <artifactId>meta-build</artifactId>
    <version>${revision}</version>
    <packaging>pom</packaging>
    <name>meta-build</name>
    <description>AI 时代的可定制全栈技术底座</description>

    <modules>
        <module>mb-common</module>
        <module>mb-schema</module>
        <module>mb-infra</module>
        <module>mb-platform</module>
        <module>mb-business</module>
        <module>mb-admin</module>
    </modules>

    <properties>
        <revision>0.1.0-SNAPSHOT</revision>
        <java.version>21</java.version>

        <!-- 第三方版本（Spring Boot BOM 未管理的） -->
        <sa-token.version>1.39.0</sa-token.version>
        <archunit.version>1.3.0</archunit.version>
        <testcontainers.version>1.20.4</testcontainers.version>
        <logstash-logback.version>8.0</logstash-logback.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <!-- 内部模块 -->
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>mb-common</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>mb-schema</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-jooq</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-async</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-observability</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-security</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-cache</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-exception</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-i18n</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-rate-limit</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-websocket</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-captcha</artifactId>
                <version>${revision}</version>
            </dependency>
            <dependency>
                <groupId>com.metabuild</groupId>
                <artifactId>infra-archunit</artifactId>
                <version>${revision}</version>
            </dependency>

            <!-- Testcontainers BOM -->
            <dependency>
                <groupId>org.testcontainers</groupId>
                <artifactId>testcontainers-bom</artifactId>
                <version>${testcontainers.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- ArchUnit -->
            <dependency>
                <groupId>com.tngtech.archunit</groupId>
                <artifactId>archunit-junit5</artifactId>
                <version>${archunit.version}</version>
            </dependency>

            <!-- Logstash Logback Encoder -->
            <dependency>
                <groupId>net.logstash.logback</groupId>
                <artifactId>logstash-logback-encoder</artifactId>
                <version>${logstash-logback.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

- [ ] **Step 2: 验证根 POM 结构正确**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn help:effective-pom -N 2>&1 | head -5`
Expected: 显示 effective POM 头部（此时子模块尚未创建，可能报 warning 但不影响）

- [ ] **Step 3: 提交**

```bash
git add server/pom.xml
git commit -m "feat: M1 后端根 POM + 版本 BOM

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: mb-common 模块（零 Spring 工具层）

**Files:**
- Create: `server/mb-common/pom.xml`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/CurrentUser.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/AuthFacade.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/DataScope.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/DataScopeType.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/CurrentUserInfo.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/SessionData.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/security/LoginResult.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/MetaBuildException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/BusinessException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/NotFoundException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/UnauthorizedException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/ForbiddenException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/ConflictException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/exception/SystemException.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/id/SnowflakeIdGenerator.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/dto/PageQuery.java`
- Create: `server/mb-common/src/main/java/com/metabuild/common/dto/PageResult.java`

- [ ] **Step 1: 创建 mb-common/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-common</artifactId>
    <name>mb-common</name>
    <description>零 Spring 依赖的公共工具层</description>

    <!-- 注意：此模块不能有任何 Spring / jOOQ / JJWT 依赖 -->
    <dependencies>
        <dependency>
            <groupId>org.jetbrains</groupId>
            <artifactId>annotations</artifactId>
            <version>26.0.1</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 security 接口包**

`CurrentUser.java`:
```java
package com.metabuild.common.security;

import java.util.Set;

/**
 * 当前登录用户抽象——业务层读取用户信息的唯一入口。
 * 实现由 infra-security 提供（SaTokenCurrentUser），业务层零感知认证框架。
 */
public interface CurrentUser {
    boolean isAuthenticated();
    Long userId();
    String username();
    Long deptId();
    long tenantId();
    Set<String> permissions();
    boolean hasPermission(String code);
    boolean hasAllPermissions(String... codes);
    boolean hasAnyPermission(String... codes);
    DataScopeType dataScopeType();
    Set<Long> dataScopeDeptIds();
    boolean isSystem();
    Long userIdOrSystem();
    CurrentUserInfo snapshot();
}
```

`AuthFacade.java`:
```java
package com.metabuild.common.security;

/**
 * 认证操作门面——业务层执行登录/登出的唯一入口。
 * 实现由 infra-security 提供，业务层零感知 Sa-Token。
 */
public interface AuthFacade {
    LoginResult doLogin(Long userId, SessionData sessionData);
    LoginResult refresh(String refreshToken);
    void logout();
    void kickoutAll(Long userId);
}
```

`DataScope.java`:
```java
package com.metabuild.common.security;

import java.util.Set;

/**
 * 数据权限范围值对象。
 */
public record DataScope(
    DataScopeType type,
    Set<Long> deptIds
) {}
```

`DataScopeType.java`:
```java
package com.metabuild.common.security;

/**
 * 数据权限类型枚举。
 */
public enum DataScopeType {
    /** 全部数据 */
    ALL,
    /** 本部门及子部门 */
    DEPT_AND_CHILDREN,
    /** 仅本部门 */
    DEPT_ONLY,
    /** 仅本人 */
    SELF_ONLY
}
```

`CurrentUserInfo.java`:
```java
package com.metabuild.common.security;

import java.util.Set;

/**
 * CurrentUser 的可序列化快照 DTO。
 */
public record CurrentUserInfo(
    Long userId,
    String username,
    Long deptId,
    long tenantId,
    Set<String> permissions,
    DataScopeType dataScopeType,
    Set<Long> dataScopeDeptIds
) {}
```

`SessionData.java`:
```java
package com.metabuild.common.security;

/**
 * 登录时写入 session 的数据。
 */
public record SessionData(
    Long userId,
    String username,
    Long tenantId,
    DataScope dataScope,
    boolean mustChangePassword
) {}
```

`LoginResult.java`:
```java
package com.metabuild.common.security;

/**
 * 登录成功返回值。
 */
public record LoginResult(
    String accessToken,
    String refreshToken,
    Long expiresInSeconds,
    CurrentUserInfo user
) {}
```

- [ ] **Step 3: 创建异常体系**

`MetaBuildException.java`:
```java
package com.metabuild.common.exception;

/**
 * 全局异常基类。httpStatus 用 int 而非 Spring HttpStatus，保持 mb-common 零 Spring 依赖。
 */
public abstract class MetaBuildException extends RuntimeException {

    private final String code;
    private final int httpStatus;
    private final Object[] args;

    protected MetaBuildException(String code, int httpStatus, Object... args) {
        super(code);
        this.code = code;
        this.httpStatus = httpStatus;
        this.args = args;
    }

    public String getCode() { return code; }
    public int getHttpStatus() { return httpStatus; }
    public Object[] getArgs() { return args; }
}
```

`BusinessException.java`:
```java
package com.metabuild.common.exception;

/**
 * 4xx 业务异常基类。
 */
public class BusinessException extends MetaBuildException {
    public BusinessException(String code, int httpStatus, Object... args) {
        super(code, httpStatus, args);
    }
}
```

`NotFoundException.java`:
```java
package com.metabuild.common.exception;

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, Object... args) {
        super(code, 404, args);
    }
}
```

`UnauthorizedException.java`:
```java
package com.metabuild.common.exception;

public class UnauthorizedException extends BusinessException {
    public UnauthorizedException(String code, Object... args) {
        super(code, 401, args);
    }
}
```

`ForbiddenException.java`:
```java
package com.metabuild.common.exception;

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String code, Object... args) {
        super(code, 403, args);
    }
}
```

`ConflictException.java`:
```java
package com.metabuild.common.exception;

public class ConflictException extends BusinessException {
    public ConflictException(String code, Object... args) {
        super(code, 409, args);
    }
}
```

`SystemException.java`:
```java
package com.metabuild.common.exception;

/**
 * 5xx 系统异常。
 */
public class SystemException extends MetaBuildException {
    public SystemException(String code, Object... args) {
        super(code, 500, args);
    }
}
```

- [ ] **Step 4: 创建 SnowflakeIdGenerator**

```java
package com.metabuild.common.id;

/**
 * Snowflake ID 生成器（借用自 nxboot）。
 * 41bit 时间戳 + 10bit workerId(5+5) + 12bit 序列号。
 */
public class SnowflakeIdGenerator {

    private static final long EPOCH = 1704067200000L; // 2024-01-01 00:00:00 UTC
    private static final long WORKER_ID_BITS = 5L;
    private static final long DATACENTER_ID_BITS = 5L;
    private static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS);
    private static final long MAX_DATACENTER_ID = ~(-1L << DATACENTER_ID_BITS);
    private static final long SEQUENCE_BITS = 12L;
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS;
    private static final long SEQUENCE_MASK = ~(-1L << SEQUENCE_BITS);

    private final long workerId;
    private final long datacenterId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public SnowflakeIdGenerator(long workerId, long datacenterId) {
        if (workerId > MAX_WORKER_ID || workerId < 0) {
            throw new IllegalArgumentException("workerId 不能大于 " + MAX_WORKER_ID + " 或小于 0");
        }
        if (datacenterId > MAX_DATACENTER_ID || datacenterId < 0) {
            throw new IllegalArgumentException("datacenterId 不能大于 " + MAX_DATACENTER_ID + " 或小于 0");
        }
        this.workerId = workerId;
        this.datacenterId = datacenterId;
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨，拒绝生成 ID，回拨时间: " + (lastTimestamp - timestamp) + "ms");
        }
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & SEQUENCE_MASK;
            if (sequence == 0) {
                timestamp = waitNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }
        lastTimestamp = timestamp;
        return ((timestamp - EPOCH) << TIMESTAMP_SHIFT)
                | (datacenterId << DATACENTER_ID_SHIFT)
                | (workerId << WORKER_ID_SHIFT)
                | sequence;
    }

    private long waitNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis();
        }
        return timestamp;
    }
}
```

- [ ] **Step 5: 创建分页 DTO**

`PageQuery.java`:
```java
package com.metabuild.common.dto;

import java.util.List;
import org.jetbrains.annotations.Nullable;

/**
 * 分页查询参数。page 从 1 开始。
 */
public record PageQuery(
    int page,
    int size,
    @Nullable List<String> sort
) {
    public int offset() {
        return (page - 1) * size;
    }
}
```

`PageResult.java`:
```java
package com.metabuild.common.dto;

import java.util.List;

/**
 * 分页结果。
 */
public record PageResult<T>(
    List<T> content,
    long totalElements,
    int totalPages,
    int page,
    int size
) {
    public boolean hasNext() { return page < totalPages; }
    public boolean hasPrevious() { return page > 1; }

    public static <T> PageResult<T> of(List<T> content, long total, PageQuery query) {
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / query.size());
        return new PageResult<>(content, total, totalPages, query.page(), query.size());
    }
}
```

- [ ] **Step 6: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-common`
Expected: BUILD SUCCESS

- [ ] **Step 7: 提交**

```bash
git add server/mb-common/
git commit -m "feat: M1 mb-common 模块（安全接口 + 异常体系 + ID 生成器 + 分页 DTO）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: mb-schema 模块 + Flyway V1

**Files:**
- Create: `server/mb-schema/pom.xml`
- Create: `server/mb-schema/src/main/resources/db/migration/V20260601_001__iam_user.sql`

- [ ] **Step 1: 创建 mb-schema/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-schema</artifactId>
    <name>mb-schema</name>
    <description>数据库契约层：Flyway SQL + jOOQ 生成代码（ADR-0004）</description>

    <!-- 零 mb-* 依赖，仅 jOOQ runtime -->
    <dependencies>
        <dependency>
            <groupId>org.jooq</groupId>
            <artifactId>jooq</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- 把 jooq-generated 加入编译源码路径 -->
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>build-helper-maven-plugin</artifactId>
                <executions>
                    <execution>
                        <id>add-jooq-source</id>
                        <phase>generate-sources</phase>
                        <goals><goal>add-source</goal></goals>
                        <configuration>
                            <sources>
                                <source>${project.basedir}/src/main/jooq-generated</source>
                            </sources>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

    <profiles>
        <!-- jOOQ 代码生成 profile：mvn -Pcodegen generate-sources -pl mb-schema -->
        <profile>
            <id>codegen</id>
            <build>
                <plugins>
                    <plugin>
                        <groupId>org.flywaydb</groupId>
                        <artifactId>flyway-maven-plugin</artifactId>
                        <executions>
                            <execution>
                                <id>flyway-migrate</id>
                                <phase>generate-sources</phase>
                                <goals><goal>migrate</goal></goals>
                            </execution>
                        </executions>
                        <configuration>
                            <url>jdbc:tc:postgresql:16:///metabuild?TC_DAEMON=true</url>
                            <user>test</user>
                            <password>test</password>
                            <locations>
                                <location>filesystem:${project.basedir}/src/main/resources/db/migration</location>
                            </locations>
                        </configuration>
                        <dependencies>
                            <dependency>
                                <groupId>org.flywaydb</groupId>
                                <artifactId>flyway-database-postgresql</artifactId>
                                <version>${flyway.version}</version>
                            </dependency>
                            <dependency>
                                <groupId>org.testcontainers</groupId>
                                <artifactId>postgresql</artifactId>
                                <version>${testcontainers.version}</version>
                            </dependency>
                        </dependencies>
                    </plugin>

                    <plugin>
                        <groupId>org.jooq</groupId>
                        <artifactId>jooq-codegen-maven</artifactId>
                        <executions>
                            <execution>
                                <id>jooq-codegen</id>
                                <phase>generate-sources</phase>
                                <goals><goal>generate</goal></goals>
                            </execution>
                        </executions>
                        <configuration>
                            <jdbc>
                                <url>jdbc:tc:postgresql:16:///metabuild?TC_DAEMON=true</url>
                                <user>test</user>
                                <password>test</password>
                            </jdbc>
                            <generator>
                                <database>
                                    <name>org.jooq.meta.postgres.PostgresDatabase</name>
                                    <includes>mb_.*</includes>
                                    <excludes>flyway_schema_history</excludes>
                                    <inputSchema>public</inputSchema>
                                </database>
                                <generate>
                                    <records>true</records>
                                    <pojos>false</pojos>
                                    <daos>false</daos>
                                </generate>
                                <target>
                                    <packageName>com.metabuild.schema</packageName>
                                    <directory>${project.basedir}/src/main/jooq-generated</directory>
                                </target>
                            </generator>
                        </configuration>
                        <dependencies>
                            <dependency>
                                <groupId>org.postgresql</groupId>
                                <artifactId>postgresql</artifactId>
                                <version>${postgresql.version}</version>
                            </dependency>
                            <dependency>
                                <groupId>org.testcontainers</groupId>
                                <artifactId>postgresql</artifactId>
                                <version>${testcontainers.version}</version>
                            </dependency>
                        </dependencies>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
</project>
```

- [ ] **Step 2: 创建第一个 Flyway 迁移脚本**

`V20260601_001__iam_user.sql`:
```sql
-- M1: 用户表（平台 IAM 核心表）
-- 命名规范：V<yyyymmdd>_<nnn>__<module>_<table>.sql（ADR-0008）
-- 表前缀：mb_（ADR-0009）

CREATE TABLE mb_iam_user (
    id              BIGINT          PRIMARY KEY,
    tenant_id       BIGINT          NOT NULL DEFAULT 0,
    username        VARCHAR(64)     NOT NULL,
    password_hash   VARCHAR(128)    NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(32),
    nickname        VARCHAR(64),
    avatar          VARCHAR(512),
    dept_id         BIGINT,
    status          SMALLINT        NOT NULL DEFAULT 1,
    owner_dept_id   BIGINT          NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT          NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 同租户用户名唯一
CREATE UNIQUE INDEX uk_iam_user_tenant_username ON mb_iam_user (tenant_id, username);

-- 查询优化索引
CREATE INDEX idx_iam_user_dept ON mb_iam_user (tenant_id, dept_id);
CREATE INDEX idx_iam_user_status ON mb_iam_user (tenant_id, status);

COMMENT ON TABLE mb_iam_user IS '用户表';
COMMENT ON COLUMN mb_iam_user.id IS '用户 ID（Snowflake）';
COMMENT ON COLUMN mb_iam_user.tenant_id IS '租户 ID（v1 固定为 0，v1.5+ 启用多租户）';
COMMENT ON COLUMN mb_iam_user.status IS '状态：1=启用，0=停用';
COMMENT ON COLUMN mb_iam_user.owner_dept_id IS '数据权限归属部门';
```

- [ ] **Step 3: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-schema`
Expected: BUILD SUCCESS（此时无 jOOQ 生成代码，但 pom 结构正确即可编译通过）

- [ ] **Step 4: 提交**

```bash
git add server/mb-schema/
git commit -m "feat: M1 mb-schema 模块 + Flyway V1 用户表迁移

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: mb-infra 父模块 + 全部子模块 pom

**Files:**
- Create: `server/mb-infra/pom.xml`
- Create: `server/mb-infra/infra-security/pom.xml`（占位）
- Create: `server/mb-infra/infra-cache/pom.xml`（占位）
- Create: `server/mb-infra/infra-jooq/pom.xml`
- Create: `server/mb-infra/infra-exception/pom.xml`（占位）
- Create: `server/mb-infra/infra-i18n/pom.xml`（占位）
- Create: `server/mb-infra/infra-async/pom.xml`
- Create: `server/mb-infra/infra-rate-limit/pom.xml`（占位）
- Create: `server/mb-infra/infra-websocket/pom.xml`（占位）
- Create: `server/mb-infra/infra-observability/pom.xml`
- Create: `server/mb-infra/infra-archunit/pom.xml`
- Create: `server/mb-infra/infra-captcha/pom.xml`（占位）

- [ ] **Step 1: 创建 mb-infra/pom.xml（父 pom）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-infra</artifactId>
    <packaging>pom</packaging>
    <name>mb-infra</name>
    <description>基础设施层（11 个子模块）</description>

    <modules>
        <module>infra-security</module>
        <module>infra-cache</module>
        <module>infra-jooq</module>
        <module>infra-exception</module>
        <module>infra-i18n</module>
        <module>infra-async</module>
        <module>infra-rate-limit</module>
        <module>infra-websocket</module>
        <module>infra-observability</module>
        <module>infra-archunit</module>
        <module>infra-captcha</module>
    </modules>

    <!-- 所有 infra 子模块共享 mb-common 依赖 -->
    <dependencies>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>mb-common</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 infra-jooq/pom.xml（M1 有实现）**

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

    <artifactId>infra-jooq</artifactId>
    <name>infra-jooq</name>
    <description>jOOQ 基础设施：JooqHelper + SlowQueryListener + ID 生成器 Bean</description>

    <dependencies>
        <dependency>
            <groupId>org.jooq</groupId>
            <artifactId>jooq</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jooq</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 3: 创建 infra-async/pom.xml（M1 有实现）**

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

    <artifactId>infra-async</artifactId>
    <name>infra-async</name>
    <description>异步线程池配置</description>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 4: 创建 infra-observability/pom.xml（M1 有实现）**

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

    <artifactId>infra-observability</artifactId>
    <name>infra-observability</name>
    <description>可观测性：Actuator + Logback JSON + TraceId</description>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>net.logstash.logback</groupId>
            <artifactId>logstash-logback-encoder</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 5: 创建 infra-archunit/pom.xml（M1 有实现）**

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

    <artifactId>infra-archunit</artifactId>
    <name>infra-archunit</name>
    <description>ArchUnit 规则库</description>

    <dependencies>
        <dependency>
            <groupId>com.tngtech.archunit</groupId>
            <artifactId>archunit-junit5</artifactId>
        </dependency>
        <dependency>
            <groupId>org.jooq</groupId>
            <artifactId>jooq</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 6: 创建 7 个占位模块 pom.xml**

每个占位模块结构相同，仅 artifactId 和 description 不同：

`infra-security/pom.xml`:
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
    <artifactId>infra-security</artifactId>
    <name>infra-security</name>
    <description>Sa-Token 封装 + CurrentUser 实现 + CORS（M4 实现）</description>
</project>
```

`infra-cache/pom.xml`:
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
    <artifactId>infra-cache</artifactId>
    <name>infra-cache</name>
    <description>Redis + CacheEvictSupport（M4 实现）</description>
</project>
```

`infra-exception/pom.xml`:
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
    <artifactId>infra-exception</artifactId>
    <name>infra-exception</name>
    <description>GlobalExceptionHandler + ProblemDetail（M4 实现）</description>
</project>
```

`infra-i18n/pom.xml`:
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
    <artifactId>infra-i18n</artifactId>
    <name>infra-i18n</name>
    <description>MessageSource + LocaleResolver（M4 实现）</description>
</project>
```

`infra-rate-limit/pom.xml`:
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
    <artifactId>infra-rate-limit</artifactId>
    <name>infra-rate-limit</name>
    <description>Bucket4j 限流（M4 实现）</description>
</project>
```

`infra-websocket/pom.xml`:
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
    <artifactId>infra-websocket</artifactId>
    <name>infra-websocket</name>
    <description>WebSocket 支持（v1.5 实现）</description>
</project>
```

`infra-captcha/pom.xml`:
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
    <artifactId>infra-captcha</artifactId>
    <name>infra-captcha</name>
    <description>滑块验证码（M4 实现）</description>
</project>
```

- [ ] **Step 7: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-infra -am`
Expected: BUILD SUCCESS（所有子模块 pom 结构正确）

- [ ] **Step 8: 提交**

```bash
git add server/mb-infra/
git commit -m "feat: M1 mb-infra 父模块 + 11 个子模块 pom 结构

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: infra-jooq 实现

**Files:**
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/JooqHelper.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/SlowQueryListener.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/MbJooqProperties.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/IdGeneratorConfig.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/MbIdProperties.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/JooqAutoConfiguration.java`
- Create: `server/mb-infra/infra-jooq/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

- [ ] **Step 1: 创建 JooqHelper**

```java
package com.metabuild.infra.jooq;

import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.TableField;
import org.jooq.UpdatableRecord;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

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
```

- [ ] **Step 2: 创建 SlowQueryListener**

```java
package com.metabuild.infra.jooq;

import org.jooq.ExecuteContext;
import org.jooq.impl.DefaultExecuteListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 慢查询监听器：超过阈值的 SQL 打 WARN 日志。
 */
public class SlowQueryListener extends DefaultExecuteListener {

    private static final Logger log = LoggerFactory.getLogger(SlowQueryListener.class);

    private final long thresholdMs;

    public SlowQueryListener(long thresholdMs) {
        this.thresholdMs = thresholdMs;
    }

    @Override
    public void executeStart(ExecuteContext ctx) {
        ctx.data("startTime", System.nanoTime());
    }

    @Override
    public void executeEnd(ExecuteContext ctx) {
        Long startTime = (Long) ctx.data("startTime");
        if (startTime == null) return;

        long durationMs = (System.nanoTime() - startTime) / 1_000_000;
        if (durationMs >= thresholdMs) {
            log.warn("慢查询 [{}ms]: {}", durationMs, ctx.query());
        }
    }
}
```

- [ ] **Step 3: 创建配置属性类**

`MbJooqProperties.java`:
```java
package com.metabuild.infra.jooq;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "mb.jooq")
@Validated
public record MbJooqProperties(
    long slowQueryThresholdMs
) {
    public MbJooqProperties {
        if (slowQueryThresholdMs <= 0) {
            slowQueryThresholdMs = 500;
        }
    }
}
```

`MbIdProperties.java`:
```java
package com.metabuild.infra.jooq;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "mb.id")
@Validated
public record MbIdProperties(
    @Min(0) @Max(31) long worker,
    @Min(0) @Max(31) long datacenter
) {}
```

- [ ] **Step 4: 创建 IdGeneratorConfig**

```java
package com.metabuild.infra.jooq;

import com.metabuild.common.id.SnowflakeIdGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IdGeneratorConfig {

    @Bean
    public SnowflakeIdGenerator snowflakeIdGenerator(MbIdProperties idProperties) {
        return new SnowflakeIdGenerator(idProperties.worker(), idProperties.datacenter());
    }
}
```

- [ ] **Step 5: 创建 JooqAutoConfiguration**

```java
package com.metabuild.infra.jooq;

import org.jooq.conf.Settings;
import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.jooq.JooqAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(after = JooqAutoConfiguration.class)
@ConditionalOnClass(DefaultConfiguration.class)
@EnableConfigurationProperties({MbJooqProperties.class, MbIdProperties.class})
public class com.metabuild.infra.jooq.JooqAutoConfiguration {

    @Bean
    public SlowQueryListener slowQueryListener(MbJooqProperties props) {
        return new SlowQueryListener(props.slowQueryThresholdMs());
    }

    @Bean
    public DefaultExecuteListenerProvider slowQueryListenerProvider(SlowQueryListener listener) {
        return new DefaultExecuteListenerProvider(listener);
    }
}
```

注意：上面类名和文件名会冲突，改为 `MbJooqAutoConfiguration`：

```java
package com.metabuild.infra.jooq;

import org.jooq.impl.DefaultConfiguration;
import org.jooq.impl.DefaultExecuteListenerProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.jooq.JooqAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(after = JooqAutoConfiguration.class)
@ConditionalOnClass(DefaultConfiguration.class)
@EnableConfigurationProperties({MbJooqProperties.class, MbIdProperties.class})
public class MbJooqAutoConfiguration {

    @Bean
    public SlowQueryListener slowQueryListener(MbJooqProperties props) {
        return new SlowQueryListener(props.slowQueryThresholdMs());
    }

    @Bean
    public DefaultExecuteListenerProvider slowQueryListenerProvider(SlowQueryListener listener) {
        return new DefaultExecuteListenerProvider(listener);
    }
}
```

- [ ] **Step 6: 创建 AutoConfiguration 注册文件**

`server/mb-infra/infra-jooq/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:
```
com.metabuild.infra.jooq.MbJooqAutoConfiguration
com.metabuild.infra.jooq.IdGeneratorConfig
```

- [ ] **Step 7: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-infra/infra-jooq -am`
Expected: BUILD SUCCESS

- [ ] **Step 8: 提交**

```bash
git add server/mb-infra/infra-jooq/
git commit -m "feat: M1 infra-jooq（JooqHelper + SlowQueryListener + ID 生成器 Bean）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: infra-async 实现

**Files:**
- Create: `server/mb-infra/infra-async/src/main/java/com/metabuild/infra/async/AsyncConfig.java`
- Create: `server/mb-infra/infra-async/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

- [ ] **Step 1: 创建 AsyncConfig**

```java
package com.metabuild.infra.async;

import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步线程池配置：core=4, max=8, queue=200, CallerRunsPolicy。
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    @Bean("mbAsyncExecutor")
    public ThreadPoolTaskExecutor mbAsyncExecutor() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("mb-async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }

    @Override
    public Executor getAsyncExecutor() {
        return mbAsyncExecutor();
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("异步任务异常 [{}]: {}", method.getName(), ex.getMessage(), ex);
    }
}
```

- [ ] **Step 2: 创建 AutoConfiguration 注册文件**

`server/mb-infra/infra-async/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:
```
com.metabuild.infra.async.AsyncConfig
```

- [ ] **Step 3: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-infra/infra-async -am`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add server/mb-infra/infra-async/
git commit -m "feat: M1 infra-async（线程池 4/8/200 + CallerRunsPolicy）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: infra-observability 实现

**Files:**
- Create: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/TraceIdFilter.java`
- Create: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/ObservabilityAutoConfiguration.java`
- Create: `server/mb-infra/infra-observability/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

- [ ] **Step 1: 创建 TraceIdFilter**

```java
package com.metabuild.infra.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 请求链路追踪：从 X-Trace-Id header 读取或自动生成 16 字符 traceId，写入 MDC + 响应头。
 */
public class TraceIdFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String MDC_TRACE_ID = "traceId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put(MDC_TRACE_ID, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

- [ ] **Step 2: 创建 ObservabilityAutoConfiguration**

```java
package com.metabuild.infra.observability;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

@AutoConfiguration
public class ObservabilityAutoConfiguration {

    @Bean
    public FilterRegistrationBean<TraceIdFilter> traceIdFilter() {
        var registration = new FilterRegistrationBean<>(new TraceIdFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/*");
        return registration;
    }
}
```

- [ ] **Step 3: 创建 AutoConfiguration 注册文件**

`server/mb-infra/infra-observability/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:
```
com.metabuild.infra.observability.ObservabilityAutoConfiguration
```

- [ ] **Step 4: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-infra/infra-observability -am`
Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

```bash
git add server/mb-infra/infra-observability/
git commit -m "feat: M1 infra-observability（TraceIdFilter + Actuator 基础配置）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: infra-archunit 实现（3 条 M1 规则）

**Files:**
- Create: `server/mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/JooqIsolationRule.java`
- Create: `server/mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/ModuleBoundaryRule.java`
- Create: `server/mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/DoNotIncludeGeneratedJooq.java`

- [ ] **Step 1: 创建 JooqIsolationRule**

```java
package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import org.jooq.DSLContext;

/**
 * jOOQ 隔离规则：Service/Controller 层禁止持有 DSLContext。
 * jOOQ 操作只允许出现在 Repository 中（domain 子包内的 *Repository 类）。
 */
public final class JooqIsolationRule {

    private JooqIsolationRule() {}

    /**
     * Service 和 Controller 层不得依赖 DSLContext。
     * domain 层内只有 Repository 可以使用 jOOQ。
     */
    public static final ArchRule DOMAIN_MUST_NOT_USE_JOOQ =
        ArchRuleDefinition.noClasses()
            .that().resideInAnyPackage(
                "..domain..",
                "..web.."
            )
            .and().haveSimpleNameNotEndingWith("Repository")
            .should().dependOnClassesThat().areAssignableTo(DSLContext.class)
            .because("jOOQ DSLContext 只允许在 Repository 中使用（防止 SQL 泄漏到 Service/Controller 层）");
}
```

- [ ] **Step 2: 创建 ModuleBoundaryRule**

```java
package com.metabuild.infra.archunit;

import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;

/**
 * 模块边界规则：
 * 1. 跨 platform 模块只能通过 api 子包访问
 * 2. 无循环依赖
 */
public final class ModuleBoundaryRule {

    private ModuleBoundaryRule() {}

    /**
     * platform 模块间只能通过 api 子包交互。
     * 例：platform-iam 的 Service 不能直接 import platform-oplog 的内部实现。
     */
    public static final ArchRule CROSS_PLATFORM_ONLY_VIA_API =
        ArchRuleDefinition.noClasses()
            .that().resideInAnyPackage("com.metabuild.platform.(*).domain..", "com.metabuild.platform.(*).web..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("com.metabuild.platform.(*).domain..", "com.metabuild.platform.(*).web..")
            .andShould().resideOutsideOfPackage("com.metabuild.platform.(*).api..")
            .because("跨 platform 模块交互只能通过 api 子包（DTO/Event/Interface）");

    /**
     * 无循环依赖。
     */
    public static final ArchRule NO_CYCLIC_DEPENDENCIES =
        SlicesRuleDefinition.slices()
            .matching("com.metabuild.(*)..")
            .should().beFreeOfCycles()
            .because("模块间不允许循环依赖");
}
```

- [ ] **Step 3: 创建 DoNotIncludeGeneratedJooq**

```java
package com.metabuild.infra.archunit;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.core.importer.Location;

/**
 * ArchUnit ImportOption：排除 jOOQ 生成代码，避免误报。
 */
public class DoNotIncludeGeneratedJooq implements ImportOption {

    @Override
    public boolean includes(Location location) {
        return !location.contains("/jooq-generated/")
            && !location.contains("/com/metabuild/schema/");
    }
}
```

- [ ] **Step 4: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-infra/infra-archunit -am`
Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

```bash
git add server/mb-infra/infra-archunit/
git commit -m "feat: M1 infra-archunit（3 条启动规则：jOOQ 隔离 + 模块边界 + 无循环依赖）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: mb-platform + mb-business 占位模块

**Files:**
- Create: `server/mb-platform/pom.xml`
- Create: `server/mb-business/pom.xml`

- [ ] **Step 1: 创建 mb-platform/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-platform</artifactId>
    <packaging>pom</packaging>
    <name>mb-platform</name>
    <description>平台业务层（8 个子模块，M4 实现）</description>

    <!-- M4 时添加子模块：platform-iam, platform-oplog, platform-file, ... -->
</project>
```

- [ ] **Step 2: 创建 mb-business/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-business</artifactId>
    <name>mb-business</name>
    <description>使用者扩展位（ADR-0004，v1 为空占位）</description>
</project>
```

- [ ] **Step 3: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-platform,mb-business`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add server/mb-platform/ server/mb-business/
git commit -m "feat: M1 mb-platform + mb-business 占位模块

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: mb-admin 入口 + 全套配置

**Files:**
- Create: `server/mb-admin/pom.xml`
- Create: `server/mb-admin/src/main/java/com/metabuild/admin/MetaBuildApplication.java`
- Create: `server/mb-admin/src/main/java/com/metabuild/admin/config/ClockConfig.java`
- Create: `server/mb-admin/src/main/resources/application.yml`
- Create: `server/mb-admin/src/main/resources/application-dev.yml`
- Create: `server/mb-admin/src/main/resources/application-test.yml`
- Create: `server/mb-admin/src/main/resources/logback-spring.xml`

- [ ] **Step 1: 创建 mb-admin/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>meta-build</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>mb-admin</artifactId>
    <name>mb-admin</name>
    <description>Spring Boot 启动入口 + 集成测试 + ArchUnit 测试</description>

    <dependencies>
        <!-- 内部模块 -->
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>mb-common</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>mb-schema</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-jooq</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-async</artifactId>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-observability</artifactId>
        </dependency>

        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jooq</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.metabuild</groupId>
            <artifactId>infra-archunit</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建 MetaBuildApplication.java**

```java
package com.metabuild.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.metabuild")
public class MetaBuildApplication {

    public static void main(String[] args) {
        SpringApplication.run(MetaBuildApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 ClockConfig.java（ADR-0012）**

```java
package com.metabuild.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * 全局时间策略（ADR-0012）：生产用 UTC Clock，测试可替换为 fixed Clock。
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
```

- [ ] **Step 4: 创建 application.yml**

```yaml
spring:
  application:
    name: meta-build
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  # 数据源
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/metabuild}
    username: ${SPRING_DATASOURCE_USERNAME:metabuild}
    password: ${SPRING_DATASOURCE_PASSWORD:metabuild}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  # Flyway
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false

  # Jackson
  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false

# jOOQ 自定义配置
mb:
  jooq:
    slow-query-threshold-ms: ${MB_JOOQ_SLOW_QUERY_THRESHOLD_MS:500}
  id:
    worker: ${MB_ID_WORKER:0}
    datacenter: ${MB_ID_DATACENTER:0}

# Actuator
management:
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: health,info,metrics,loggers
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
  info:
    env:
      enabled: true

# Server
server:
  port: ${SERVER_PORT:8080}
  servlet:
    context-path: /
```

- [ ] **Step 5: 创建 application-dev.yml**

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/metabuild
    username: metabuild
    password: metabuild

logging:
  level:
    com.metabuild: DEBUG
    org.jooq: DEBUG

management:
  endpoints:
    web:
      exposure:
        include: "*"
```

- [ ] **Step 6: 创建 application-test.yml**

```yaml
# Testcontainers 会通过 @DynamicPropertySource 注入数据源配置
spring:
  flyway:
    clean-disabled: false

logging:
  level:
    com.metabuild: DEBUG
    org.testcontainers: WARN
```

- [ ] **Step 7: 创建 logback-spring.xml**

```xml
<configuration>
    <springProperty scope="context" name="appName" source="spring.application.name"/>

    <!-- Dev 环境：纯文本 -->
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} [traceId=%X{traceId}] - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <!-- Prod/Test 环境：JSON -->
    <springProfile name="prod,test">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <customFields>{"app":"${appName}"}</customFields>
                <includeMdcKeyName>traceId</includeMdcKeyName>
                <includeMdcKeyName>userId</includeMdcKeyName>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

- [ ] **Step 8: 编译验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn compile -pl mb-admin -am`
Expected: BUILD SUCCESS

- [ ] **Step 9: 提交**

```bash
git add server/mb-admin/
git commit -m "feat: M1 mb-admin 入口 + application.yml 全量配置 + logback + Clock Bean

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: 后端测试 + jOOQ 代码生成 + 全量验证

**Files:**
- Create: `server/mb-admin/src/test/java/com/metabuild/admin/SharedPostgresContainer.java`
- Create: `server/mb-admin/src/test/java/com/metabuild/admin/BaseIntegrationTest.java`
- Create: `server/mb-admin/src/test/java/com/metabuild/admin/MetaBuildApplicationTest.java`
- Create: `server/mb-admin/src/test/java/com/metabuild/admin/architecture/ArchitectureTest.java`

- [ ] **Step 1: 创建 SharedPostgresContainer**

```java
package com.metabuild.admin;

import org.testcontainers.containers.PostgreSQLContainer;

/**
 * 共享 PostgreSQL 容器——所有集成测试复用同一个容器实例。
 */
public class SharedPostgresContainer extends PostgreSQLContainer<SharedPostgresContainer> {

    public static final SharedPostgresContainer INSTANCE = new SharedPostgresContainer();

    private SharedPostgresContainer() {
        super("postgres:16-alpine");
        withDatabaseName("metabuild_test");
        withUsername("test");
        withPassword("test");
        withReuse(true);
    }

    @Override
    public void start() {
        if (!isRunning()) {
            super.start();
        }
    }

    @Override
    public void stop() {
        // 不停止，整个测试套件复用
    }
}
```

- [ ] **Step 2: 创建 BaseIntegrationTest**

```java
package com.metabuild.admin;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * 集成测试基类：Testcontainers PostgreSQL + test profile。
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class BaseIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = SharedPostgresContainer.INSTANCE;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

- [ ] **Step 3: 创建 MetaBuildApplicationTest（Context 启动验证）**

```java
package com.metabuild.admin;

import org.junit.jupiter.api.Test;

/**
 * 验证 Spring Context 能成功启动 + Flyway 迁移能成功执行。
 */
class MetaBuildApplicationTest extends BaseIntegrationTest {

    @Test
    void contextLoads() {
        // Spring Context 启动成功 = Flyway 执行成功 + 所有 Bean 注册成功
    }
}
```

- [ ] **Step 4: 创建 ArchitectureTest**

```java
package com.metabuild.admin.architecture;

import com.metabuild.infra.archunit.DoNotIncludeGeneratedJooq;
import com.metabuild.infra.archunit.JooqIsolationRule;
import com.metabuild.infra.archunit.ModuleBoundaryRule;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * ArchUnit 架构测试——M1 启动 3 条规则。
 */
@AnalyzeClasses(
    packages = "com.metabuild",
    importOptions = {
        ImportOption.DoNotIncludeTests.class,
        ImportOption.DoNotIncludeArchives.class,
        DoNotIncludeGeneratedJooq.class
    }
)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domain_must_not_use_jooq =
        JooqIsolationRule.DOMAIN_MUST_NOT_USE_JOOQ;

    @ArchTest
    static final ArchRule cross_platform_only_via_api =
        ModuleBoundaryRule.CROSS_PLATFORM_ONLY_VIA_API;

    @ArchTest
    static final ArchRule no_cyclic_dependencies =
        ModuleBoundaryRule.NO_CYCLIC_DEPENDENCIES;
}
```

- [ ] **Step 5: 运行 jOOQ 代码生成**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn -Pcodegen generate-sources -pl mb-schema`
Expected: jOOQ 代码生成到 `mb-schema/src/main/jooq-generated/com/metabuild/schema/` 目录

注意：此步骤需要 Docker 运行（Testcontainers 需要 Docker daemon）。如果 Docker 未运行，先 `docker compose up -d`。

- [ ] **Step 6: 验证 jOOQ 生成代码存在**

Run: `ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/`
Expected: 看到 `MbIamUser.java` 等生成文件

- [ ] **Step 7: 运行全量后端验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn verify`
Expected: BUILD SUCCESS（编译 + 单元测试 + 集成测试 + ArchUnit 测试全部通过）

- [ ] **Step 8: 提交**

```bash
git add server/mb-admin/src/test/ server/mb-schema/src/main/jooq-generated/
git commit -m "feat: M1 后端测试套件 + jOOQ 代码生成 + mvn verify 全绿

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3: 前端脚手架

### Task 13: 前端工作区 + 全部包骨架 + 质量门禁

**Files:**
- Create: `client/pnpm-workspace.yaml`
- Create: `client/package.json`
- Create: `client/tsconfig.base.json`
- Create: `client/biome.json`
- Create: `client/.dependency-cruiser.cjs`
- Create: `client/.stylelintrc.cjs`
- Create: `client/.env.example`
- Create: `client/packages/ui-tokens/package.json`
- Create: `client/packages/ui-tokens/tsconfig.json`
- Create: `client/packages/ui-tokens/src/index.ts`
- Create: `client/packages/ui-primitives/package.json`
- Create: `client/packages/ui-primitives/tsconfig.json`
- Create: `client/packages/ui-primitives/src/index.ts`
- Create: `client/packages/ui-patterns/package.json`
- Create: `client/packages/ui-patterns/tsconfig.json`
- Create: `client/packages/ui-patterns/src/index.ts`
- Create: `client/packages/app-shell/package.json`
- Create: `client/packages/app-shell/tsconfig.json`
- Create: `client/packages/app-shell/src/index.ts`
- Create: `client/packages/api-sdk/package.json`
- Create: `client/packages/api-sdk/tsconfig.json`
- Create: `client/packages/api-sdk/src/index.ts`
- Create: `client/scripts/check-env-example.ts`

- [ ] **Step 1: 创建 pnpm-workspace.yaml + 根 package.json**

`client/pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`client/package.json`:
```json
{
  "name": "meta-build-client",
  "private": true,
  "scripts": {
    "dev": "pnpm -C apps/web-admin dev",
    "build": "pnpm -r build",
    "lint": "biome check .",
    "lint:css": "stylelint 'packages/**/*.css' 'apps/**/*.css'",
    "check:deps": "depcruise packages apps --config .dependency-cruiser.cjs",
    "check:types": "pnpm -r --parallel tsc --noEmit",
    "check:env": "tsx scripts/check-env-example.ts"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "dependency-cruiser": "^16.0.0",
    "stylelint": "^16.0.0",
    "stylelint-config-standard": "^36.0.0",
    "stylelint-declaration-strict-value": "^1.10.0",
    "typescript": "^5.6.0",
    "tsx": "^4.19.0"
  },
  "packageManager": "pnpm@9.12.0"
}
```

- [ ] **Step 2: 创建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@mb/ui-tokens": ["packages/ui-tokens/src/index.ts"],
      "@mb/ui-tokens/*": ["packages/ui-tokens/src/*"],
      "@mb/ui-primitives": ["packages/ui-primitives/src/index.ts"],
      "@mb/ui-primitives/*": ["packages/ui-primitives/src/*"],
      "@mb/ui-patterns": ["packages/ui-patterns/src/index.ts"],
      "@mb/ui-patterns/*": ["packages/ui-patterns/src/*"],
      "@mb/app-shell": ["packages/app-shell/src/index.ts"],
      "@mb/app-shell/*": ["packages/app-shell/src/*"],
      "@mb/api-sdk": ["packages/api-sdk/src/index.ts"],
      "@mb/api-sdk/*": ["packages/api-sdk/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

- [ ] **Step 3: 创建 biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "error"
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": { "level": "warn", "options": { "maxAllowedComplexity": 15 } }
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "error"
      },
      "suspicious": {
        "noConsole": { "level": "error", "options": { "allow": ["warn", "error"] } }
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all" }
  },
  "files": {
    "ignore": ["node_modules", "dist", "*.css"]
  }
}
```

- [ ] **Step 4: 创建 .dependency-cruiser.cjs**

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'l1-tokens-no-mb-deps',
      severity: 'error',
      comment: 'L1 @mb/ui-tokens 不能依赖任何 @mb/* 包',
      from: { path: '^packages/ui-tokens' },
      to: { path: '^packages/(ui-primitives|ui-patterns|app-shell|api-sdk)' },
    },
    {
      name: 'l2-primitives-only-tokens',
      severity: 'error',
      comment: 'L2 @mb/ui-primitives 只能依赖 @mb/ui-tokens',
      from: { path: '^packages/ui-primitives' },
      to: { path: '^packages/(ui-patterns|app-shell|api-sdk)' },
    },
    {
      name: 'l3-patterns-only-tokens-primitives',
      severity: 'error',
      comment: 'L3 @mb/ui-patterns 只能依赖 L1 + L2',
      from: { path: '^packages/ui-patterns' },
      to: { path: '^packages/(app-shell|api-sdk)' },
    },
    {
      name: 'l4-app-shell-no-l5',
      severity: 'error',
      comment: 'L4 不能依赖 L5',
      from: { path: '^packages/app-shell' },
      to: { path: '^apps' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: '禁止循环依赖',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
```

- [ ] **Step 5: 创建 .stylelintrc.cjs**

```javascript
/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'custom-property-pattern': [
      '^[a-z]+(-[a-z0-9]+)*$',
      {
        message: (name) =>
          `CSS 变量 "${name}" 必须使用扁平命名 --<group>-<name>（见 02-ui-tokens-theme.md §4）`,
      },
    ],
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'background-color', 'border-color', 'fill', 'stroke'],
      {
        ignoreValues: ['transparent', 'inherit', 'currentColor', 'none', '/^var\\(--/'],
        message: '禁止硬编码颜色值，请使用 CSS 变量 var(--color-xxx)',
      },
    ],
  },
  overrides: [
    {
      files: ['**/themes/*.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
};
```

- [ ] **Step 6: 创建 .env.example + check 脚本**

`client/.env.example`:
```bash
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

`client/scripts/check-env-example.ts`:
```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_FILE = join(ROOT, '.env.example');

// 递归收集所有 .ts/.tsx 文件
function collectFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') continue;
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, ext));
    } else if (ext.some((e) => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

// 扫描代码中的 import.meta.env.VITE_* 用法
const usedVars = new Set<string>();
const codeFiles = collectFiles(join(ROOT, 'apps'), ['.ts', '.tsx']);
const envRegex = /import\.meta\.env\.(VITE_[A-Z_]+)/g;

for (const file of codeFiles) {
  const content = readFileSync(file, 'utf-8');
  let match: RegExpExecArray | null;
  while ((match = envRegex.exec(content)) !== null) {
    usedVars.add(match[1]);
  }
}

// 读取 .env.example 中声明的变量
const declaredVars = new Set<string>();
const envContent = readFileSync(ENV_FILE, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const key = trimmed.split('=')[0];
    declaredVars.add(key);
  }
}

// 检查未声明的变量
let hasError = false;
for (const v of usedVars) {
  if (!declaredVars.has(v)) {
    console.error(`❌ ${v} 在代码中使用但未在 .env.example 中声明`);
    hasError = true;
  }
}

// 警告未使用的变量
for (const v of declaredVars) {
  if (!usedVars.has(v)) {
    console.warn(`⚠ ${v} 在 .env.example 中声明但代码中未使用`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('✅ .env.example 一致性检查通过');
}
```

- [ ] **Step 7: 创建 6 个包骨架**

`client/packages/ui-tokens/package.json`:
```json
{
  "name": "@mb/ui-tokens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tailwind-theme.css": "./src/tailwind-theme.css",
    "./themes/*": "./src/themes/*"
  }
}
```

`client/packages/ui-tokens/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

`client/packages/ui-tokens/src/index.ts`:
```typescript
// L1 @mb/ui-tokens — 设计令牌包
// M1: 导出 token 常量（供 TypeScript 引用）
// M2: 增加 theme-registry + apply-theme

/**
 * 46 个语义 token 的名称常量——方便 TypeScript 代码引用。
 */
export const TOKEN_NAMES = {
  // Colors (25)
  colorBackground: '--color-background',
  colorForeground: '--color-foreground',
  colorPrimary: '--color-primary',
  colorPrimaryForeground: '--color-primary-foreground',
  colorSecondary: '--color-secondary',
  colorSecondaryForeground: '--color-secondary-foreground',
  colorMuted: '--color-muted',
  colorMutedForeground: '--color-muted-foreground',
  colorAccent: '--color-accent',
  colorAccentForeground: '--color-accent-foreground',
  colorDestructive: '--color-destructive',
  colorDestructiveForeground: '--color-destructive-foreground',
  colorSuccess: '--color-success',
  colorSuccessForeground: '--color-success-foreground',
  colorWarning: '--color-warning',
  colorWarningForeground: '--color-warning-foreground',
  colorInfo: '--color-info',
  colorInfoForeground: '--color-info-foreground',
  colorCard: '--color-card',
  colorCardForeground: '--color-card-foreground',
  colorPopover: '--color-popover',
  colorPopoverForeground: '--color-popover-foreground',
  colorBorder: '--color-border',
  colorInput: '--color-input',
  colorRing: '--color-ring',
  // Radius (4)
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
  radiusXl: '--radius-xl',
  // Sizes (5)
  sizeControlHeight: '--size-control-height',
  sizeHeaderHeight: '--size-header-height',
  sizeSidebarWidth: '--size-sidebar-width',
  sizeSidebarWidthCollapsed: '--size-sidebar-width-collapsed',
  sizeContentMaxWidth: '--size-content-max-width',
  // Shadows (4)
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',
  // Motion (5)
  durationFast: '--duration-fast',
  durationNormal: '--duration-normal',
  durationSlow: '--duration-slow',
  easingIn: '--easing-in',
  easingOut: '--easing-out',
  // Fonts (3)
  fontSans: '--font-sans',
  fontMono: '--font-mono',
  fontHeading: '--font-heading',
} as const;

export const TOTAL_TOKENS = 46;
```

其余 4 个包 + api-sdk 使用相同的骨架结构：

`client/packages/ui-primitives/package.json`:
```json
{
  "name": "@mb/ui-primitives",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@mb/ui-tokens": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`client/packages/ui-primitives/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

`client/packages/ui-primitives/src/index.ts`:
```typescript
// L2 @mb/ui-primitives — 原子组件包（M2 实现）
export {};
```

`client/packages/ui-patterns/package.json`:
```json
{
  "name": "@mb/ui-patterns",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "@mb/ui-primitives": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`client/packages/ui-patterns/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

`client/packages/ui-patterns/src/index.ts`:
```typescript
// L3 @mb/ui-patterns — 业务组件包（M3 实现）
export {};
```

`client/packages/app-shell/package.json`:
```json
{
  "name": "@mb/app-shell",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "@mb/ui-primitives": "workspace:*",
    "@mb/ui-patterns": "workspace:*",
    "@mb/api-sdk": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`client/packages/app-shell/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

`client/packages/app-shell/src/index.ts`:
```typescript
// L4 @mb/app-shell — 应用壳包（M3 实现）
export {};
```

`client/packages/api-sdk/package.json`:
```json
{
  "name": "@mb/api-sdk",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`client/packages/api-sdk/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

`client/packages/api-sdk/src/index.ts`:
```typescript
// @mb/api-sdk — OpenAPI 生成的 TypeScript client（M4 实现）
export {};
```

- [ ] **Step 8: 安装依赖并验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm install`
Expected: 安装成功，无错误

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm check:types`
Expected: 所有包 TypeScript 检查通过

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm lint`
Expected: Biome 检查通过

- [ ] **Step 9: 提交**

```bash
git add client/
git commit -m "feat: M1 前端工作区 + 6 包骨架 + 质量门禁（Biome/stylelint/dep-cruiser）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: 前端 web-admin 应用 + L1 默认主题

**Files:**
- Create: `client/packages/ui-tokens/src/tailwind-theme.css`
- Create: `client/packages/ui-tokens/src/themes/default.css`
- Create: `client/apps/web-admin/package.json`
- Create: `client/apps/web-admin/tsconfig.json`
- Create: `client/apps/web-admin/vite.config.ts`
- Create: `client/apps/web-admin/index.html`
- Create: `client/apps/web-admin/.env.example`
- Create: `client/apps/web-admin/src/main.tsx`
- Create: `client/apps/web-admin/src/styles.css`
- Create: `client/apps/web-admin/src/vite-env.d.ts`

- [ ] **Step 1: 创建 L1 默认主题 CSS**

`client/packages/ui-tokens/src/tailwind-theme.css`:
```css
@import "tailwindcss";

@theme {
  --color-*: initial;

  /* 语义颜色 (25) */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-success: oklch(0.62 0.19 145);
  --color-success-foreground: oklch(0.985 0 0);
  --color-warning: oklch(0.75 0.18 85);
  --color-warning-foreground: oklch(0.205 0 0);
  --color-info: oklch(0.65 0.15 240);
  --color-info-foreground: oklch(0.985 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);

  /* 圆角 (4) */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* 尺寸 (5) */
  --size-control-height: 2.25rem;
  --size-header-height: 3.5rem;
  --size-sidebar-width: 16rem;
  --size-sidebar-width-collapsed: 4rem;
  --size-content-max-width: 80rem;

  /* 阴影 (4) */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* 动效 (5) */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  /* 字体 (3) */
  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

`client/packages/ui-tokens/src/themes/default.css`:
```css
/* 默认主题——M1 唯一主题，M2 增加 dark + compact */
:root {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-success: oklch(0.62 0.19 145);
  --color-success-foreground: oklch(0.985 0 0);
  --color-warning: oklch(0.75 0.18 85);
  --color-warning-foreground: oklch(0.205 0 0);
  --color-info: oklch(0.65 0.15 240);
  --color-info-foreground: oklch(0.985 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  --size-control-height: 2.25rem;
  --size-header-height: 3.5rem;
  --size-sidebar-width: 16rem;
  --size-sidebar-width-collapsed: 4rem;
  --size-content-max-width: 80rem;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

- [ ] **Step 2: 创建 web-admin 应用骨架**

`client/apps/web-admin/package.json`:
```json
{
  "name": "web-admin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

`client/apps/web-admin/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

`client/apps/web-admin/vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

`client/apps/web-admin/index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meta-Build Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`client/apps/web-admin/.env.example`:
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

`client/apps/web-admin/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 3: 创建 main.tsx + styles.css（含 Mock 登录页）**

`client/apps/web-admin/src/styles.css`:
```css
@import "@mb/ui-tokens/tailwind-theme.css";

body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

`client/apps/web-admin/src/main.tsx`:
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

/**
 * M1 Mock 登录页——验证主题系统 + 前端脚手架可用。
 * M3 替换为 TanStack Router + App Shell。
 */
function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-card-foreground">Meta-Build</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="mb-4">
            <label htmlFor="username" className="mb-1 block text-sm text-muted-foreground">
              用户名
            </label>
            <input
              id="username"
              type="text"
              placeholder="请输入用户名"
              className="h-[var(--size-control-height)] w-full rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors duration-[var(--duration-fast)] focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="mb-1 block text-sm text-muted-foreground">
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              className="h-[var(--size-control-height)] w-full rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors duration-[var(--duration-fast)] focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="h-[var(--size-control-height)] w-full rounded-md bg-primary text-primary-foreground transition-opacity duration-[var(--duration-fast)] hover:opacity-90"
          >
            登录
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">M1 Mock — 接口尚未接入</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginPage />
  </StrictMode>,
);
```

- [ ] **Step 4: 安装依赖并验证前端 dev server**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm install`
Expected: 安装成功

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm check:types`
Expected: TypeScript 检查通过

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm dev`（手动验证后 Ctrl+C）
Expected: Vite dev server 启动，浏览器访问 http://localhost:5173 显示登录页

- [ ] **Step 5: 提交**

```bash
git add client/
git commit -m "feat: M1 前端 web-admin 应用 + L1 默认主题（46 token）+ Mock 登录页

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4: CI + 集成验证

### Task 15: CI 工作流（GitHub Actions）

**Files:**
- Create: `.github/workflows/server.yml`
- Create: `.github/workflows/client.yml`

- [ ] **Step 1: 创建 server.yml**

```yaml
name: Server CI

on:
  push:
    paths: ['server/**', '.github/workflows/server.yml']
  pull_request:
    paths: ['server/**']

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: metabuild_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build & Verify
        working-directory: server
        run: mvn -B verify
```

- [ ] **Step 2: 创建 client.yml**

```yaml
name: Client CI

on:
  push:
    paths: ['client/**', '.github/workflows/client.yml']
  pull_request:
    paths: ['client/**']

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
          cache-dependency-path: client/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: client
        run: pnpm install --frozen-lockfile

      - name: TypeScript strict check
        working-directory: client
        run: pnpm check:types

      - name: Biome lint & format
        working-directory: client
        run: pnpm lint

      - name: Env example consistency
        working-directory: client
        run: pnpm check:env
```

- [ ] **Step 3: 提交**

```bash
git add .github/workflows/
git commit -m "feat: M1 CI 工作流（server.yml + client.yml）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: 端到端集成验证

- [ ] **Step 1: 确保 Docker 服务运行**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build && docker compose up -d`
Expected: postgres 和 redis 状态为 healthy

- [ ] **Step 2: 后端完整验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn verify`
Expected: BUILD SUCCESS（编译 + ArchUnit + 集成测试全通过）

- [ ] **Step 3: 后端启动验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/server && mvn spring-boot:run -pl mb-admin -Dspring-boot.run.profiles=dev &`
等待启动后：

Run: `curl -s http://localhost:8080/actuator/health | head -20`
Expected: `{"status":"UP"}`

停止后端: kill 进程

- [ ] **Step 4: 前端完整验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm install && pnpm check:types && pnpm lint && pnpm check:env`
Expected: 全部通过

- [ ] **Step 5: 前端 dev server 验证**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm dev &`
等待启动后验证 http://localhost:5173 可访问

停止 dev server: kill 进程

- [ ] **Step 6: 赋予 dev.sh 执行权限**

Run: `chmod +x /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/scripts/dev.sh`

- [ ] **Step 7: 最终提交（如有遗漏文件）**

```bash
git add -A
git status
# 如果有未提交的修改，提交
git commit -m "chore: M1 集成验证通过 + 遗漏文件补齐

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## 验收标准

全部通过以下检查即为 M1 完成：

| # | 检查项 | 命令 |
|---|--------|------|
| 1 | Docker 基础设施 | `docker compose up -d && docker compose ps` |
| 2 | 后端编译 + 测试 | `cd server && mvn verify` |
| 3 | 后端启动 + /actuator/health | `mvn spring-boot:run -pl mb-admin` → `curl localhost:8080/actuator/health` |
| 4 | ArchUnit 3 规则通过 | 包含在 `mvn verify` 中 |
| 5 | Flyway 迁移成功 | 包含在 Spring Boot 启动中 |
| 6 | jOOQ 生成代码存在 | `ls server/mb-schema/src/main/jooq-generated/com/metabuild/schema/tables/` |
| 7 | 前端类型检查 | `cd client && pnpm check:types` |
| 8 | 前端 Biome 通过 | `cd client && pnpm lint` |
| 9 | 前端 env 一致性 | `cd client && pnpm check:env` |
| 10 | 前端 dev server + 登录页 | `cd client && pnpm dev` → 浏览器访问 localhost:5173 |
