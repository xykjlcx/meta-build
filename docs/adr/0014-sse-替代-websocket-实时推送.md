# ADR-0014: SSE 替代 WebSocket 作为 v1 实时推送方案

## 状态

已采纳（2026-04-14）

## 背景

v1 需要实时推送能力（踢人下线、权限变更推送、公告发布通知、系统广播）。M1 脚手架预留了 `infra-websocket` 空壳模块。原计划 v1.5 实施 WebSocket + STOMP。

在 M5 设计 Notice 模块时重新评估：v1 的实时需求全部是**服务端→客户端单向推送**，不需要双向通信。

## 决策

**v1 使用 SSE（Server-Sent Events）替代 WebSocket + STOMP**，在 `infra-sse` 新模块中实现。`infra-websocket` 空壳保留，v1.5 按需启用。

## 理由

| 维度 | SSE | WebSocket + STOMP |
|------|-----|-------------------|
| 认证 | 标准 HTTP Authorization header，与 api-sdk 完全一致 | 需要 STOMP 握手认证，额外实现 |
| 依赖 | `SseEmitter`（Spring MVC 原生），零额外依赖 | spring-boot-starter-websocket + SockJS + STOMP |
| 前端体积 | `@microsoft/fetch-event-source`（3KB gzipped） | SockJS client + @stomp/stompjs（~30KB） |
| 通信模式 | 服务端→客户端单向（v1 完全匹配） | 双向通信（v1 不需要） |
| 部署 | 标准 HTTP，Nginx/CDN 天然支持 | 需要 Nginx WebSocket 代理配置 |
| 多实例扩展 | v1.5 升级为 Redis Pub/Sub 广播 | 同样需要 Redis/消息队列 |

## 后果

- `infra-sse` 模块新增：连接管理、心跳、单播/广播、踢人下线
- 前端 `@mb/app-shell/sse` 子模块：`useSseConnection()` + `useSseSubscription()`
- `infra-websocket` 空壳不删除，v1.5 如需双向通信再启用
- v1 的四个实时能力（踢人下线/权限变更/公告发布/系统广播）全部通过 SSE 实现
