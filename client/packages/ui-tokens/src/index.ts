// L1 @mb/ui-tokens — 设计令牌包
// M1: 导出 token 常量（供 TypeScript 引用）
// M2+: 导出 style registry 与 token 常量

/**
 * 70 个语义 token 的名称常量——方便 TypeScript 代码引用。
 *
 * ADR-0020 扩展：新增 16 个 token 以支撑 lark-console 这类"完整管理后台风"
 * style。新增分 5 类：
 *   - Color 层级（2）：placeholder / icon-foreground
 *   - Color 强化（2）：border-strong / panel
 *   - Color 软色（4）：primary-hover / success-soft / warning-soft / destructive-soft
 *   - Color sidebar hover（1）
 *   - Size 控件 3 档（3）：control-height-sm/md/lg
 *   - Shadow 三类（3）：floating / modal / selected
 *   - Motion 生产力 easing（1）
 */
export const TOKEN_NAMES = {
  // Colors (42)
  colorBackground: '--color-background',
  colorForeground: '--color-foreground',
  colorPrimary: '--color-primary',
  colorPrimaryForeground: '--color-primary-foreground',
  colorPrimaryHover: '--color-primary-hover',
  colorSecondary: '--color-secondary',
  colorSecondaryForeground: '--color-secondary-foreground',
  colorMuted: '--color-muted',
  colorMutedForeground: '--color-muted-foreground',
  colorAccent: '--color-accent',
  colorAccentForeground: '--color-accent-foreground',
  colorDestructive: '--color-destructive',
  colorDestructiveForeground: '--color-destructive-foreground',
  colorDestructiveSoft: '--color-destructive-soft',
  colorSuccess: '--color-success',
  colorSuccessForeground: '--color-success-foreground',
  colorSuccessSoft: '--color-success-soft',
  colorWarning: '--color-warning',
  colorWarningForeground: '--color-warning-foreground',
  colorWarningSoft: '--color-warning-soft',
  colorInfo: '--color-info',
  colorInfoForeground: '--color-info-foreground',
  colorCard: '--color-card',
  colorCardForeground: '--color-card-foreground',
  colorPopover: '--color-popover',
  colorPopoverForeground: '--color-popover-foreground',
  colorPanel: '--color-panel',
  colorPlaceholder: '--color-placeholder',
  colorIconForeground: '--color-icon-foreground',
  colorBorder: '--color-border',
  colorBorderStrong: '--color-border-strong',
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
  colorSidebarHover: '--color-sidebar-hover',
  // Radius (4)
  radiusSm: '--radius-sm',
  radiusMd: '--radius-md',
  radiusLg: '--radius-lg',
  radiusXl: '--radius-xl',
  // Sizes (8)
  sizeControlHeight: '--size-control-height',
  sizeControlHeightSm: '--size-control-height-sm',
  sizeControlHeightMd: '--size-control-height-md',
  sizeControlHeightLg: '--size-control-height-lg',
  sizeHeaderHeight: '--size-header-height',
  sizeSidebarWidth: '--size-sidebar-width',
  sizeSidebarWidthCollapsed: '--size-sidebar-width-collapsed',
  sizeContentMaxWidth: '--size-content-max-width',
  // Shadows (7)
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',
  shadowFloating: '--shadow-floating',
  shadowModal: '--shadow-modal',
  shadowSelected: '--shadow-selected',
  // Motion (6)
  durationFast: '--duration-fast',
  durationNormal: '--duration-normal',
  durationSlow: '--duration-slow',
  easingIn: '--easing-in',
  easingOut: '--easing-out',
  easingProductive: '--easing-productive',
  // Fonts (3)
  fontSans: '--font-sans',
  fontMono: '--font-mono',
  fontHeading: '--font-heading',
} as const;

export const TOTAL_TOKENS = 70;

export {
  StyleRegistry,
  styleRegistry,
  type StyleId,
  type StyleMeta,
} from './style-registry';
