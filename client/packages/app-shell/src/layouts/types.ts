import type { ComponentType, ReactNode } from 'react';
import type { CurrentUser } from '../auth';
import type { MenuNode } from '../menu';

export interface ShellLayoutProps {
  children: ReactNode;
  menuTree: MenuNode[];
  currentUser: CurrentUser;
  notificationSlot?: ReactNode;
}

export interface LayoutPresetDef {
  id: string;
  name: string;
  component: ComponentType<ShellLayoutProps>;
}
