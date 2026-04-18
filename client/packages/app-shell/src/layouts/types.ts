import type { ComponentType, ReactNode } from 'react';
import type { CurrentUser } from '../auth';
import type { MenuNode } from '../menu';
import type { MenuHrefResolver } from '../menu/menu-utils';

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
