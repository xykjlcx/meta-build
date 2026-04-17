import type { ComponentType, ReactNode } from 'react';
import type { CurrentUser } from '../auth';
import type { MenuNode } from '../menu';

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
}

export interface LayoutPresetDef {
  id: string;
  name: string;
  component: ComponentType<ShellLayoutProps>;
}
