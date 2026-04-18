import { styleRegistry } from '@mb/ui-tokens';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StyleProvider, normalizeStyleId } from '../style-provider';
import { useStyle } from '../use-style';

// 测试用宿主组件：渲染 styleId 到 DOM 方便断言
function TestHost({ onMount }: { onMount?: (ctx: ReturnType<typeof useStyle>) => void }) {
  const ctx = useStyle();
  useEffect(() => {
    onMount?.(ctx);
  }, [ctx, onMount]);
  return <div data-testid="style-id">{ctx.styleId}</div>;
}

function renderWithProvider(
  defaultStyle?: string,
  defaultColorMode?: 'light' | 'dark',
): { getStyleId: () => string } {
  render(
    <StyleProvider defaultStyle={defaultStyle as never} defaultColorMode={defaultColorMode}>
      <TestHost />
    </StyleProvider>,
  );
  return {
    getStyleId: () => screen.getByTestId('style-id').textContent ?? '',
  };
}

beforeEach(() => {
  // 每个测试前清空 localStorage 和 DOM 上的 data 属性
  localStorage.clear();
  delete document.documentElement.dataset.themeStyle;
  delete document.documentElement.dataset.themeColorMode;
  delete document.body.dataset.themeScale;
  delete document.body.dataset.themeRadius;
  delete document.body.dataset.themeContentLayout;
  delete document.body.dataset.themeSidebarMode;
});

afterEach(() => {
  // 额外清理一次，防止测试间泄漏
  localStorage.clear();
  delete document.documentElement.dataset.themeStyle;
  delete document.documentElement.dataset.themeColorMode;
});

describe('StyleProvider 归一化', () => {
  it('defaultStyle 非法值归一化到 claude-warm（Plan A 默认）', () => {
    const { getStyleId } = renderWithProvider('non-existent');
    expect(getStyleId()).toBe('claude-warm');
    // DOM 上的 data-theme-style 也应同步
    expect(document.documentElement.dataset.themeStyle).toBe('claude-warm');
  });

  it('defaultStyle 合法值 lark-console 直接生效', () => {
    const { getStyleId } = renderWithProvider('lark-console');
    expect(getStyleId()).toBe('lark-console');
    expect(document.documentElement.dataset.themeStyle).toBe('lark-console');
  });

  it('defaultStyle 合法值 classic 直接生效（保留 classic 作为 check:theme 基准）', () => {
    const { getStyleId } = renderWithProvider('classic');
    expect(getStyleId()).toBe('classic');
    expect(document.documentElement.dataset.themeStyle).toBe('classic');
  });

  it('setStyle 合法值 lark-console 生效，hook 状态和 DOM 同步', async () => {
    let capturedCtx: ReturnType<typeof useStyle> | null = null;

    function TestCapture() {
      const ctx = useStyle();
      capturedCtx = ctx;
      return <div data-testid="style-id">{ctx.styleId}</div>;
    }

    render(
      <StyleProvider>
        <TestCapture />
      </StyleProvider>,
    );

    // Provider 内部默认值已切到 claude-warm
    expect(screen.getByTestId('style-id').textContent).toBe('claude-warm');

    await act(async () => {
      capturedCtx?.setStyle('lark-console');
    });

    expect(screen.getByTestId('style-id').textContent).toBe('lark-console');
    expect(document.documentElement.dataset.themeStyle).toBe('lark-console');
  });

  it('setStyle 非法值归一化到 claude-warm，不抛异常', async () => {
    let capturedCtx: ReturnType<typeof useStyle> | null = null;

    function TestCapture() {
      const ctx = useStyle();
      capturedCtx = ctx;
      return <div data-testid="style-id">{ctx.styleId}</div>;
    }

    render(
      <StyleProvider defaultStyle={'lark-console' as never}>
        <TestCapture />
      </StyleProvider>,
    );

    expect(screen.getByTestId('style-id').textContent).toBe('lark-console');

    await act(async () => {
      // biome-ignore lint: 测试非法值归一化
      capturedCtx!.setStyle('xyz' as never);
    });

    expect(screen.getByTestId('style-id').textContent).toBe('claude-warm');
    expect(document.documentElement.dataset.themeStyle).toBe('claude-warm');
  });

  it('localStorage 非法值 mount 时归一化到 claude-warm', () => {
    localStorage.setItem('mb_style', 'hacked');
    const { getStyleId } = renderWithProvider();
    // readStateFromStorage 检查 isStyleId，非法值返回 null，走到 fallback
    expect(getStyleId()).toBe('claude-warm');
    expect(document.documentElement.dataset.themeStyle).toBe('claude-warm');
  });

  it('localStorage 合法值 lark-console mount 时恢复', () => {
    localStorage.setItem('mb_style', 'lark-console');
    const { getStyleId } = renderWithProvider();
    expect(getStyleId()).toBe('lark-console');
    expect(document.documentElement.dataset.themeStyle).toBe('lark-console');
  });
});

describe('ThemeScale localStorage migration', () => {
  it("migrates legacy 'xs' to 'compact'", () => {
    // 需要一个合法 styleId 才会走 readStateFromStorage 的非 null 分支
    localStorage.setItem('mb_style', 'claude-warm');
    localStorage.setItem('mb_scale', 'xs');
    render(
      <StyleProvider>
        <div />
      </StyleProvider>,
    );
    expect(localStorage.getItem('mb_scale')).toBe('compact');
    expect(document.body.dataset.themeScale).toBe('compact');
  });

  it("migrates legacy 'lg' to 'comfortable'", () => {
    localStorage.setItem('mb_style', 'claude-warm');
    localStorage.setItem('mb_scale', 'lg');
    render(
      <StyleProvider>
        <div />
      </StyleProvider>,
    );
    expect(localStorage.getItem('mb_scale')).toBe('comfortable');
    expect(document.body.dataset.themeScale).toBe('comfortable');
  });

  it('falls back to default on invalid value', () => {
    localStorage.setItem('mb_style', 'claude-warm');
    localStorage.setItem('mb_scale', 'whatever');
    render(
      <StyleProvider>
        <div />
      </StyleProvider>,
    );
    expect(document.body.dataset.themeScale).toBeUndefined();
  });

  it('removes data-theme-scale attr when switching back to default', async () => {
    localStorage.setItem('mb_style', 'claude-warm');
    localStorage.setItem('mb_scale', 'compact');

    let capturedCtx: ReturnType<typeof useStyle> | null = null;
    function TestCapture() {
      const ctx = useStyle();
      capturedCtx = ctx;
      return <div />;
    }

    render(
      <StyleProvider>
        <TestCapture />
      </StyleProvider>,
    );

    expect(document.body.dataset.themeScale).toBe('compact');

    await act(async () => {
      capturedCtx?.setScale('default');
    });

    expect(document.body.dataset.themeScale).toBeUndefined();
  });
});

describe('claude-warm style registration', () => {
  it('registers claude-warm with correct cssFile path', () => {
    const meta = styleRegistry.get('claude-warm');
    expect(meta).toBeDefined();
    expect(meta?.cssFile).toBe('./tokens/semantic-claude-warm.css');
    expect(meta?.id).toBe('claude-warm');
    expect(meta?.color).toBe('#d97a3f');
  });

  it('normalizeStyleId 非法 id 回落到 claude-warm（Plan A 默认兜底）', () => {
    // 直接单测 normalizeStyleId export
    expect(normalizeStyleId('non-existent-style')).toBe('claude-warm');
    expect(normalizeStyleId('')).toBe('claude-warm');
    // 合法 id 原样返回
    expect(normalizeStyleId('classic')).toBe('classic');
    expect(normalizeStyleId('lark-console')).toBe('lark-console');
    expect(normalizeStyleId('claude-warm')).toBe('claude-warm');
  });
});
