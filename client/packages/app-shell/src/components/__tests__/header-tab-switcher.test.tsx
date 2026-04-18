import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import type { MenuNode } from '../../menu';
import { HeaderTabSwitcher } from '../header-tab-switcher';

const mkNode = (id: number, name: string): MenuNode => ({
  id,
  parentId: null,
  name,
  permissionCode: null,
  menuType: 'DIRECTORY',
  icon: null,
  sortOrder: id,
  visible: true,
  children: [],
});

function renderWithI18n(ui: ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('HeaderTabSwitcher', () => {
  it('renders all top-level modules as tabs when count <= maxTabs', () => {
    const menu = [mkNode(1, '组织管理'), mkNode(2, '内容'), mkNode(3, '产品设置')];
    renderWithI18n(
      <HeaderTabSwitcher
        menuTree={menu}
        activeModuleId={1}
        onModuleChange={() => {}}
        maxTabs={5}
      />,
    );
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '内容' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '产品设置' })).toBeInTheDocument();
  });

  it('renders overflow menu when count > maxTabs', () => {
    const menu = [
      mkNode(1, '模块 1'),
      mkNode(2, '模块 2'),
      mkNode(3, '模块 3'),
      mkNode(4, '模块 4'),
      mkNode(5, '模块 5'),
      mkNode(6, '模块 6'),
      mkNode(7, '模块 7'),
    ];
    renderWithI18n(
      <HeaderTabSwitcher
        menuTree={menu}
        activeModuleId={1}
        onModuleChange={() => {}}
        maxTabs={5}
      />,
    );
    // 前 4 个显示为 tab（maxTabs - 1），第 5 位开始合并进"更多"下拉
    expect(screen.getByRole('tab', { name: '模块 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '模块 4' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '模块 5' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more|更多/i })).toBeInTheDocument();
  });

  it('calls onModuleChange when a tab is clicked', () => {
    const onModuleChange = vi.fn();
    const menu = [mkNode(1, 'A'), mkNode(2, 'B')];
    renderWithI18n(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={1} onModuleChange={onModuleChange} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onModuleChange).toHaveBeenCalledWith(2);
  });

  it('marks active tab with aria-selected', () => {
    const menu = [mkNode(1, 'A'), mkNode(2, 'B')];
    renderWithI18n(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={2} onModuleChange={() => {}} />,
    );
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'false');
  });

  it('supports keyboard navigation with ArrowLeft/ArrowRight', () => {
    const onModuleChange = vi.fn();
    const menu = [mkNode(1, 'A'), mkNode(2, 'B'), mkNode(3, 'C')];
    renderWithI18n(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={2} onModuleChange={onModuleChange} />,
    );
    const activeTab = screen.getByRole('tab', { name: 'B' });
    activeTab.focus();
    fireEvent.keyDown(activeTab, { key: 'ArrowRight' });
    expect(onModuleChange).toHaveBeenCalledWith(3);
    fireEvent.keyDown(activeTab, { key: 'ArrowLeft' });
    expect(onModuleChange).toHaveBeenCalledWith(1);
  });

  it('has tablist role on container', () => {
    const menu = [mkNode(1, 'A')];
    renderWithI18n(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={1} onModuleChange={() => {}} />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
