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
