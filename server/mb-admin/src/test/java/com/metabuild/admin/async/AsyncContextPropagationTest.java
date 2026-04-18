package com.metabuild.admin.async;

import cn.dev33.satoken.stp.StpUtil;
import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.common.security.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 异步线程上下文传递集成测试：验证 @Async 子线程能继承父线程的 Sa-Token 登录态 + MDC。
 */
@Import(AsyncContextPropagationTest.TestAsyncService.class)
class AsyncContextPropagationTest extends BaseIntegrationTest {

    private static final long TEST_USER_ID = 99001L;

    @Autowired
    private TestAsyncService asyncService;

    @Autowired
    private CurrentUser currentUser;

    @AfterEach
    void tearDown() {
        // 清理测试中设置的 request 上下文 + 登录态
        try {
            if (StpUtil.isLogin()) {
                StpUtil.logout();
            }
        } catch (Exception ignored) {
        }
        RequestContextHolder.resetRequestAttributes();
        MDC.clear();
    }

    @Test
    void async_should_inherit_sa_token_login_context_from_parent_thread() throws Exception {
        // 准备父线程的 web 上下文（@RequestScope bean + Sa-Token 需要）
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

        // 父线程执行 Sa-Token 登录
        StpUtil.login(TEST_USER_ID);
        MDC.put("traceId", "trace-async-001");

        // 父线程能读到
        assertThat(currentUser.userId()).isEqualTo(TEST_USER_ID);
        assertThat(MDC.get("traceId")).as("父线程 MDC 已设置").isEqualTo("trace-async-001");

        // 触发 @Async，在子线程中读取上下文
        CompletableFuture<AsyncResult> future = asyncService.captureContext();
        AsyncResult result = future.get(5, TimeUnit.SECONDS);

        // 断言：子线程读到的 userId 与父线程一致
        assertThat(result.threadName()).startsWith("mb-async-");
        assertThat(result.userId()).isEqualTo(TEST_USER_ID);
        assertThat(result.traceId()).isEqualTo("trace-async-001");
    }

    @Test
    void async_must_isolate_login_state_across_thread_pool_reuse() throws Exception {
        // 连续两次异步任务，父线程登录不同用户，验证子线程复用时不泄漏上一轮登录态

        MockHttpServletRequest request1 = new MockHttpServletRequest();
        MockHttpServletResponse response1 = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request1, response1));

        final long userIdA = 10086L;
        final long userIdB = 20086L;

        // 第一轮：父线程登录 A → 派发异步任务 1
        StpUtil.login(userIdA);
        MDC.put("traceId", "trace-round-A");
        CompletableFuture<AsyncResult> taskA = asyncService.captureContext();

        // 父线程立即登出 A 并切换到 B（模拟复用同一 web 请求链路前 logout + re-login）
        StpUtil.logout();
        MDC.clear();

        MockHttpServletRequest request2 = new MockHttpServletRequest();
        MockHttpServletResponse response2 = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request2, response2));
        StpUtil.login(userIdB);
        MDC.put("traceId", "trace-round-B");
        CompletableFuture<AsyncResult> taskB = asyncService.captureContext();

        AsyncResult resultA = taskA.get(5, TimeUnit.SECONDS);
        AsyncResult resultB = taskB.get(5, TimeUnit.SECONDS);

        assertThat(resultA.userId()).as("任务 1 子线程读到的应是派发时的 A").isEqualTo(userIdA);
        assertThat(resultA.traceId()).isEqualTo("trace-round-A");
        assertThat(resultB.userId()).as("任务 2 子线程读到的应是派发时的 B，不应泄漏 A").isEqualTo(userIdB);
        assertThat(resultB.traceId()).isEqualTo("trace-round-B");
    }

    @Test
    void async_without_parent_login_should_not_throw() throws Exception {
        // 父线程无任何上下文（无 request、无登录）
        CompletableFuture<AsyncResult> future = asyncService.captureContextSafely();
        AsyncResult result = future.get(5, TimeUnit.SECONDS);

        // 不应抛异常；未登录状态
        assertThat(result.threadName()).startsWith("mb-async-");
        assertThat(result.userId()).isNull();
    }

    record AsyncResult(String threadName, Long userId, String traceId) {}

    @Component
    static class TestAsyncService {

        private final CurrentUser currentUser;

        TestAsyncService(CurrentUser currentUser) {
            this.currentUser = currentUser;
        }

        @Async
        public CompletableFuture<AsyncResult> captureContext() {
            Long userId = currentUser.userId();
            String traceId = MDC.get("traceId");
            return CompletableFuture.completedFuture(
                new AsyncResult(Thread.currentThread().getName(), userId, traceId)
            );
        }

        @Async
        public CompletableFuture<AsyncResult> captureContextSafely() {
            Long userId = null;
            try {
                if (StpUtil.isLogin()) {
                    userId = currentUser.userId();
                }
            } catch (Exception ignored) {
                // 未登录
            }
            return CompletableFuture.completedFuture(
                new AsyncResult(Thread.currentThread().getName(), userId, MDC.get("traceId"))
            );
        }
    }
}
