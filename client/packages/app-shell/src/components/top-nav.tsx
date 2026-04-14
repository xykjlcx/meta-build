import { useNavigate } from '@tanstack/react-router';
import { Button } from '@mb/ui-primitives';
import { useMenu } from '../menu';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

/**
 * 水平顶部导航栏（用于 TopLayout）。
 * 只渲染第一级菜单项。
 */
export function TopNav() {
  const { data } = useMenu();
  const navigate = useNavigate();

  return (
    <header className="flex h-[var(--size-header-height)] shrink-0 items-center border-b bg-background px-4">
      {/* 左侧：品牌 */}
      <span className="mr-6 text-sm font-semibold">Meta Build</span>

      {/* 一级菜单 */}
      <nav className="flex flex-1 items-center gap-1">
        {data?.tree
          .filter((node) => node.kind !== 'button')
          .map((node) => (
            <Button
              key={node.id}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (node.path) navigate({ to: node.path });
              }}
            >
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
