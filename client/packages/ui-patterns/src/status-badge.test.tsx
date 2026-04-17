import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  describe('默认 label fallback', () => {
    it('tone=active 默认显示 "正常"', () => {
      render(<StatusBadge tone="active" />);
      expect(screen.getByText('正常')).toBeDefined();
    });

    it('tone=pending 默认显示 "待激活"', () => {
      render(<StatusBadge tone="pending" />);
      expect(screen.getByText('待激活')).toBeDefined();
    });

    it('tone=disabled 默认显示 "停用"', () => {
      render(<StatusBadge tone="disabled" />);
      expect(screen.getByText('停用')).toBeDefined();
    });

    it('tone=low 默认显示 "低"', () => {
      render(<StatusBadge tone="low" />);
      expect(screen.getByText('低')).toBeDefined();
    });

    it('tone=medium 默认显示 "中"', () => {
      render(<StatusBadge tone="medium" />);
      expect(screen.getByText('中')).toBeDefined();
    });

    it('tone=high 默认显示 "高"', () => {
      render(<StatusBadge tone="high" />);
      expect(screen.getByText('高')).toBeDefined();
    });

    it('tone=neutral 默认显示 "-"', () => {
      render(<StatusBadge tone="neutral" />);
      expect(screen.getByText('-')).toBeDefined();
    });
  });

  describe('label prop 优先级', () => {
    it('传入 label 时优先显示 label，不用默认文案', () => {
      render(<StatusBadge tone="active" label="Enabled" />);
      expect(screen.getByText('Enabled')).toBeDefined();
      expect(screen.queryByText('正常')).toBeNull();
    });

    it('传入空字符串 label 时显示空字符串', () => {
      const { container } = render(<StatusBadge tone="active" label="" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.textContent).toBe('');
    });
  });

  describe('variant 映射（通过 data-variant 属性验证）', () => {
    it('tone=active 使用 success-soft variant', () => {
      const { container } = render(<StatusBadge tone="active" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.getAttribute('data-variant')).toBe('success-soft');
    });

    it('tone=pending 使用 warning-soft variant', () => {
      const { container } = render(<StatusBadge tone="pending" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.getAttribute('data-variant')).toBe('warning-soft');
    });

    it('tone=disabled 使用 destructive-soft variant', () => {
      const { container } = render(<StatusBadge tone="disabled" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.getAttribute('data-variant')).toBe('destructive-soft');
    });

    it('tone=low 使用 secondary variant', () => {
      const { container } = render(<StatusBadge tone="low" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.getAttribute('data-variant')).toBe('secondary');
    });

    it('tone=neutral 使用 secondary variant', () => {
      const { container } = render(<StatusBadge tone="neutral" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.getAttribute('data-variant')).toBe('secondary');
    });
  });

  describe('className 叠加', () => {
    it('传入 className 时正确合并到 Badge 上', () => {
      const { container } = render(<StatusBadge tone="active" className="my-custom-class" />);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).toContain('my-custom-class');
    });

    it('内置样式类存在（px-2.5 包含在 className 中）', () => {
      const { container } = render(<StatusBadge tone="active" />);
      const badge = container.querySelector('[data-slot="badge"]');
      // px-2.5 应该在 className 中
      expect(badge?.className).toContain('px-2.5');
    });
  });
});
