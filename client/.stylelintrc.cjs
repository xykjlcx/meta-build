/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['**/storybook-static/**', '**/dist/**'],
  rules: {
    // 扁平命名：--<group>-<name>
    'custom-property-pattern': [
      '^[a-z]+(-[a-z0-9]+)*$',
      {
        message: (name) =>
          `CSS 变量 "${name}" 必须使用扁平命名 --<group>-<name>（见 02-ui-tokens-theme.md §4）`,
      },
    ],
    // 禁止硬编码颜色值
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'background-color', 'border-color', 'fill', 'stroke'],
      {
        ignoreValues: ['transparent', 'inherit', 'currentColor', 'none', '/^var\\(--/'],
        message: '禁止硬编码颜色值，请使用 CSS 变量 var(--color-xxx)',
      },
    ],
    // Tailwind v4 兼容：允许 oklch 小数格式和字符串 @import
    'color-function-notation': null,
    'lightness-notation': null,
    'hue-degree-notation': null,
    'alpha-value-notation': null,
    'import-notation': null,
    // Tailwind v4 的 @theme / @source / @import "tailwindcss" 是合法的
    // @source 用于声明 monorepo workspace 的 content 路径(见 apps/web-admin/src/styles.css)
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['theme', 'tailwind', 'source', 'custom-variant'] },
    ],
    // Tailwind v4 的 @import 可以出现在 @custom-variant 之后
    'no-invalid-position-at-import-rule': null,
    // @theme 块内按分组用空行分隔，不报错
    'custom-property-empty-line-before': null,
  },
  overrides: [
    {
      files: ['**/themes/*.css', '**/tailwind-theme.css'],
      rules: {
        // 主题定义文件允许硬编码颜色（这里是 token 源定义）
        'scale-unlimited/declaration-strict-value': null,
        // 主题文件的 --color-* 通配不符合 pattern，但是 Tailwind v4 语法
        'custom-property-pattern': null,
      },
    },
  ],
};
