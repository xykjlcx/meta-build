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
