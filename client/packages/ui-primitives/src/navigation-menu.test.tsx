import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './navigation-menu';

describe('NavigationMenu', () => {
  it('应该渲染导航菜单', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">首页</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByText('首页')).toBeDefined();
  });

  it('应该渲染多个菜单项', () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">首页</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/about">关于</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByText('首页')).toBeDefined();
    expect(screen.getByText('关于')).toBeDefined();
  });

  it('应该合并自定义 className', () => {
    const { container } = render(
      <NavigationMenu className="custom-nav">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">首页</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    const nav = container.firstChild as HTMLElement;
    expect(nav.className).toContain('custom-nav');
  });
});
