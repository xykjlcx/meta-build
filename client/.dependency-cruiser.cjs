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
      name: 'features-no-api-sdk-auth',
      severity: 'error',
      comment: 'MUST NOT #4: features/** 禁止直接导入 authApi',
      from: { path: '^apps/web-admin/src/features' },
      to: { path: '.*api-sdk.*auth' },
    },
    {
      name: 'l3-no-forbidden-deps',
      severity: 'error',
      comment: 'L3 隔离：禁止导入路由/查询/i18n',
      from: { path: '^packages/ui-patterns/src' },
      to: { path: '@tanstack/react-query|@tanstack/react-router|i18next|react-i18next' },
    },
    {
      name: 'l5-no-direct-sse-internals',
      severity: 'error',
      comment: 'L5 features 不能直接导入 @microsoft/fetch-event-source，必须通过 @mb/app-shell/sse',
      from: { path: '^apps/web-admin/src/features' },
      to: { path: '@microsoft/fetch-event-source' },
    },
    {
      name: 'l5-no-direct-event-bus',
      severity: 'error',
      comment: 'L5 features 不能直接导入 sseEventBus，必须通过 useSseSubscription hook',
      from: { path: '^apps/web-admin/src/features' },
      to: { path: 'app-shell/src/sse/event-bus' },
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
