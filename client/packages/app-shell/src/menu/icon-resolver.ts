import {
  Bell,
  FileText,
  Folder,
  LayoutGrid,
  Link as LinkIcon,
  Settings,
  Users,
} from 'lucide-react';
import type { ElementType } from 'react';

// 后端 icon 字符串 → Lucide React 组件
// 后端 mb_iam_menu.icon 列的可选值映射到前端图标
const ICON_MAP: Record<string, ElementType> = {
  settings: Settings,
  users: Users,
  bell: Bell,
  link: LinkIcon,
  folder: Folder,
  'file-text': FileText,
  'layout-grid': LayoutGrid,
};

const FALLBACK_ICON: ElementType = FileText;

/**
 * 将后端 icon 字符串解析为 Lucide React 组件。
 * 未匹配时返回 FileText 作为 fallback。
 */
export function resolveMenuIcon(iconName: string | null): ElementType {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  return FALLBACK_ICON;
}
