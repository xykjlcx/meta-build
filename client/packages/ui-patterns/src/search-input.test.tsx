import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './search-input';

describe('SearchInput', () => {
  describe('基础渲染', () => {
    it('渲染 input 元素', () => {
      render(<SearchInput />);
      const input = screen.getByRole('searchbox');
      expect(input).toBeDefined();
    });

    it('渲染放大镜图标（SVG）', () => {
      const { container } = render(<SearchInput />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('input 类型为 search', () => {
      render(<SearchInput />);
      const input = screen.getByRole('searchbox');
      expect((input as HTMLInputElement).type).toBe('search');
    });

    it('包含 bg-muted 样式类', () => {
      render(<SearchInput />);
      const input = screen.getByRole('searchbox');
      expect(input.className).toContain('bg-muted');
    });
  });

  describe('placeholder 传递', () => {
    it('placeholder 正常渲染', () => {
      render(<SearchInput placeholder="搜索用户..." />);
      const input = screen.getByRole('searchbox');
      expect((input as HTMLInputElement).placeholder).toBe('搜索用户...');
    });
  });

  describe('shortcut 提示', () => {
    it('不传 shortcut 时不渲染快捷键提示', () => {
      const { container } = render(<SearchInput />);
      // 没有快捷键提示 span
      const spans = container.querySelectorAll('span');
      expect(spans.length).toBe(0);
    });

    it('传入 shortcut 时显示快捷键文字', () => {
      render(<SearchInput shortcut="⌘K" />);
      expect(screen.getByText('⌘K')).toBeDefined();
    });

    it('传入 shortcut 时 input 右侧留空（pr-12 class）', () => {
      render(<SearchInput shortcut="⌘K" />);
      const input = screen.getByRole('searchbox');
      expect(input.className).toContain('pr-12');
    });
  });

  describe('事件绑定', () => {
    it('onChange 回调正常触发', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchInput onChange={onChange} />);
      const input = screen.getByRole('searchbox');
      await user.type(input, 'hello');
      expect(onChange).toHaveBeenCalled();
    });

    it('输入内容后 input value 更新', async () => {
      const user = userEvent.setup();
      render(<SearchInput defaultValue="" />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      await user.type(input, 'test');
      expect(input.value).toBe('test');
    });
  });

  describe('className 透传', () => {
    it('传入 className 应用在外层容器上', () => {
      const { container } = render(<SearchInput className="w-64" />);
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain('w-64');
    });

    it('外层容器包含 relative 和 flex', () => {
      const { container } = render(<SearchInput />);
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain('relative');
      expect(wrapper?.className).toContain('flex');
    });
  });

  describe('disabled 状态', () => {
    it('disabled 时 input 不可交互', () => {
      render(<SearchInput disabled />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });
});
