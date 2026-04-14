import { Button } from '@mb/ui-primitives';
import { useMenu, type MenuNode } from '../menu';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

/**
 * 水平顶部导航栏（用于 TopLayout）。
 * 只渲染第一级菜单项（DIRECTORY / MENU，排除 BUTTON）。
 *
 * 注意：后端 MenuView 没有 path 字段，路由映射由前端路由树定义。
 * 一级菜单通常是 DIRECTORY 类型，具体导航逻辑待 M3 路由树对接时完善。
 */
export function TopNav() {
  const { data } = useMenu();

  return (
    <header className="flex h-[var(--size-header-height)] shrink-0 items-center border-b bg-background px-4">
      {/* 左侧：品牌 */}
      <span className="mr-6 text-sm font-semibold">Meta Build</span>

      {/* 一级菜单 */}
      <nav className="flex flex-1 items-center gap-1">
        {data?.tree
          .filter((node: MenuNode) => node.menuType !== 'BUTTON')
          .map((node: MenuNode) => (
            <Button key={node.id} variant="ghost" size="sm">
              {node.name}
            </Button>
          ))}
      </nav>

      {/* 右侧工具栏 */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
