// L1 @mb/ui-tokens — 设计令牌包
// M1: 导出 token 常量（供 TypeScript 引用）
// M2+: 导出 style registry 与 token 常量

/**
 * 54 个语义 token 的名称常量——方便 TypeScript 代码引用。
 */
export const TOKEN_NAMES = {
  // Colors (33)
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
  colorSidebar: '--color-sidebar',
  colorSidebarForeground: '--color-sidebar-foreground',
  colorSidebarPrimary: '--color-sidebar-primary',
  colorSidebarPrimaryForeground: '--color-sidebar-primary-foreground',
  colorSidebarAccent: '--color-sidebar-accent',
  colorSidebarAccentForeground: '--color-sidebar-accent-foreground',
  colorSidebarBorder: '--color-sidebar-border',
  colorSidebarRing: '--color-sidebar-ring',
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

export const TOTAL_TOKENS = 54;

export { styleRegistry, type StyleId, type StyleMeta } from './style-registry';
