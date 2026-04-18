/**
 * 九宫格"系统级切换"占位数据（Q9：v1 前端硬编码）。
 * 导出为 `SystemItem[]`，由 web-admin 注入 ShellLayoutProps.systems。
 * 类型 `SystemItem` 从 @mb/app-shell 引入。
 */
import type { SystemItem } from '@mb/app-shell';

export const SYSTEMS: SystemItem[] = [
  {
    key: 'admin',
    labelKey: 'system.admin',
    icon: 'layout-dashboard',
    current: true,
    disabled: false,
  },
  { key: 'finance', labelKey: 'system.finance', icon: 'wallet', current: false, disabled: true },
  { key: 'crm', labelKey: 'system.crm', icon: 'users-round', current: false, disabled: true },
  {
    key: 'logistics',
    labelKey: 'system.logistics',
    icon: 'package',
    current: false,
    disabled: true,
  },
  {
    key: 'analytics',
    labelKey: 'system.analytics',
    icon: 'bar-chart-3',
    current: false,
    disabled: true,
  },
  {
    key: 'knowledge',
    labelKey: 'system.knowledge',
    icon: 'book-open',
    current: false,
    disabled: true,
  },
  {
    key: 'workflow',
    labelKey: 'system.workflow',
    icon: 'git-branch',
    current: false,
    disabled: true,
  },
  {
    key: 'messaging',
    labelKey: 'system.messaging',
    icon: 'message-square',
    current: false,
    disabled: true,
  },
  { key: 'more', labelKey: 'system.more', icon: 'more-horizontal', current: false, disabled: true },
];
