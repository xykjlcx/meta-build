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
