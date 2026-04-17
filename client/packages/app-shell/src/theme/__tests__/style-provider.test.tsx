import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StyleProvider } from '../style-provider';
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
    <StyleProvider
      // biome-ignore lint: 测试需要传入非法值
      defaultStyle={defaultStyle as never}
      defaultColorMode={defaultColorMode}
    >
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
  it('defaultStyle 非法值归一化到 classic', () => {
    const { getStyleId } = renderWithProvider('non-existent');
    expect(getStyleId()).toBe('classic');
    // DOM 上的 data-theme-style 也应同步
    expect(document.documentElement.dataset.themeStyle).toBe('classic');
  });

  it('defaultStyle 合法值 feishu 直接生效', () => {
    const { getStyleId } = renderWithProvider('feishu');
    expect(getStyleId()).toBe('feishu');
    expect(document.documentElement.dataset.themeStyle).toBe('feishu');
  });

  it('setStyle 合法值 feishu 生效，hook 状态和 DOM 同步', async () => {
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

    expect(screen.getByTestId('style-id').textContent).toBe('classic');

    await act(async () => {
      capturedCtx!.setStyle('feishu');
    });

    expect(screen.getByTestId('style-id').textContent).toBe('feishu');
    expect(document.documentElement.dataset.themeStyle).toBe('feishu');
  });

  it('setStyle 非法值归一化到 classic，不抛异常', async () => {
    let capturedCtx: ReturnType<typeof useStyle> | null = null;

    function TestCapture() {
      const ctx = useStyle();
      capturedCtx = ctx;
      return <div data-testid="style-id">{ctx.styleId}</div>;
    }

    render(
      <StyleProvider defaultStyle={'feishu' as never}>
        <TestCapture />
      </StyleProvider>,
    );

    expect(screen.getByTestId('style-id').textContent).toBe('feishu');

    await act(async () => {
      // biome-ignore lint: 测试非法值归一化
      capturedCtx!.setStyle('xyz' as never);
    });

    expect(screen.getByTestId('style-id').textContent).toBe('classic');
    expect(document.documentElement.dataset.themeStyle).toBe('classic');
  });

  it('localStorage 非法值 mount 时归一化到 classic', () => {
    localStorage.setItem('mb_style', 'hacked');
    const { getStyleId } = renderWithProvider();
    // readStateFromStorage 检查 isStyleId，非法值返回 null，走到 fallback
    expect(getStyleId()).toBe('classic');
    expect(document.documentElement.dataset.themeStyle).toBe('classic');
  });

  it('localStorage 合法值 feishu mount 时恢复', () => {
    localStorage.setItem('mb_style', 'feishu');
    const { getStyleId } = renderWithProvider();
    expect(getStyleId()).toBe('feishu');
    expect(document.documentElement.dataset.themeStyle).toBe('feishu');
  });
});
