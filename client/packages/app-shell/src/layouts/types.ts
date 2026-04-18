import type { ComponentType, ReactNode } from 'react';
import type { CurrentUser } from '../auth';
import type { MenuNode } from '../menu';
import type { MenuHrefResolver } from '../menu/menu-utils';

/**
 * 九宫格系统项（sidebar 顶部/底部"系统切换"九宫格的单项）。
 *
 * 类型在 app-shell（L4）定义，具体数据由 web-admin（L5）通过
 * `ShellLayoutProps.systems` 注入，避免 app-shell 跨层引用 L5。
 */
export interface SystemItem {
  /** 唯一 key（用于 React key + 视觉高亮匹配） */
  key: string;
  /** i18n key，例 "system.admin" */
  labelKey: string;
  /** lucide icon 名称，例 "layout-dashboard" */
  icon: string;
  /** 是否当前系统（视觉高亮） */
  current: boolean;
  /** 占位项 disabled（未上线） */
  disabled: boolean;
}

export interface ShellLayoutProps {
  children: ReactNode;
  menuTree: MenuNode[];
  currentUser: CurrentUser;
  /** Header 右上通知区域（已有） */
  notificationSlot?: ReactNode;

  /** Hero 横幅 / 欢迎区（可选，渲染在 Header 下 / 内容区上方） */
  heroSlot?: ReactNode;

  /** Sidebar Header（默认 fallback = 方块 logo + 双行文字 + ChevronsUpDown） */
  sidebarHeaderSlot?: ReactNode;

  /** Sidebar Footer（默认 fallback = Avatar + username + email + 三点 DropdownMenu） */
  sidebarFooterSlot?: ReactNode;

  /** Sidebar Footer 之上的装饰/CTA 位（如 "Upgrade" 卡片；默认不渲染） */
  sidebarAboveFooterSlot?: ReactNode;

  /** 由 L5 注入菜单节点对应的业务路由，L4 只消费不定义。 */
  resolveMenuHref?: MenuHrefResolver;

  /**
   * 九宫格"系统切换"数据，由 L5（web-admin）注入；L4 preset 消费渲染。
   * 未注入时 preset 按需 fallback（例如不渲染九宫格 / 显示空态）。
   */
  systems?: SystemItem[];
}

export interface LayoutPresetDef {
  /** 唯一标识（customizer 下拉的 value） */
  readonly id: string;
  /** 可 i18n 的 name key（例：'layout.inset'）或直接展示名 */
  readonly name: string;
  /** 可 i18n 的描述 key（例：'layout.insetDesc'）；customizer 下拉 description 展示 */
  readonly description?: string;
  readonly component: ComponentType<ShellLayoutProps>;
  /**
   * 该 preset 支持的 Customizer 维度。
   * 未声明的维度在 UI 里 disabled。
   * 第三方通过 registerLayout() 注册时可按需声明。
   */
  readonly supportedDimensions?: ReadonlyArray<'contentLayout' | 'sidebarMode'>;
}
