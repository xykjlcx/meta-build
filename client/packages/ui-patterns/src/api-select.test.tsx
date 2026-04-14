import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiSelectFetchParams, ApiSelectFetchResult } from './api-select';

/* ------------------------------------------------------------------ */
/*  vi.hoisted — 创建在 mock 和测试间共享的 context                      */
/* ------------------------------------------------------------------ */

import { createContext } from 'react';

const PopoverCtx = createContext<{ open: boolean; onOpenChange: (v: boolean) => void }>({
  open: false,
  onOpenChange: (_v: boolean) => {},
});

/* ------------------------------------------------------------------ */
/*  Mock Radix Popover — jsdom 中 Portal + animation 不可靠             */
/* ------------------------------------------------------------------ */

vi.mock('@mb/ui-primitives', async () => {
  const actual = await vi.importActual<typeof import('@mb/ui-primitives')>('@mb/ui-primitives');
  const React = await import('react');

  return {
    ...actual,
    // biome-ignore lint/suspicious/noExplicitAny: 测试 mock 简化类型
    Popover: ({ children, open, onOpenChange, ...props }: any) => {
      return (
        <PopoverCtx.Provider value={{ open: !!open, onOpenChange }}>
          <div data-testid="popover-root" data-open={open} {...props}>
            {children}
          </div>
        </PopoverCtx.Provider>
      );
    },
    // biome-ignore lint/suspicious/noExplicitAny: 测试 mock 简化类型
    PopoverTrigger: ({ children, asChild, disabled, ...props }: any) => {
      const ctx = React.useContext(PopoverCtx);
      const handleClick = () => {
        if (!disabled) {
          ctx.onOpenChange?.(!ctx.open);
        }
      };
      if (asChild && React.isValidElement(children)) {
        // biome-ignore lint/suspicious/noExplicitAny: 测试 mock 简化类型
        return React.cloneElement(children as React.ReactElement<any>, {
          ...props,
          disabled,
          onClick: handleClick,
        });
      }
      return (
        <div {...props} onClick={handleClick}>
          {children}
        </div>
      );
    },
    // biome-ignore lint/suspicious/noExplicitAny: 测试 mock 简化类型
    PopoverContent: ({ children, ...props }: any) => {
      const ctx = React.useContext(PopoverCtx);
      if (!ctx.open) return null;
      return (
        <div data-testid="popover-content" {...props}>
          {children}
        </div>
      );
    },
  };
});

/* ------------------------------------------------------------------ */
/*  延迟导入（mock 注册后）                                              */
/* ------------------------------------------------------------------ */

const { ApiSelect } = await import('./api-select');

/* ------------------------------------------------------------------ */
/*  测试辅助                                                            */
/* ------------------------------------------------------------------ */

const mockOptions = [
  { value: '1', label: 'Alice' },
  { value: '2', label: 'Bob' },
  { value: '3', label: 'Charlie' },
];

function createMockFetcher(
  result: ApiSelectFetchResult = { options: mockOptions, totalElements: 3 },
) {
  return vi.fn<(params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult>>(() =>
    Promise.resolve(result),
  );
}

/** 获取 trigger 按钮 */
function getTriggerButton(): HTMLButtonElement {
  return document.querySelector('button[role="combobox"]') as HTMLButtonElement;
}

/* ------------------------------------------------------------------ */
/*  清理                                                                */
/* ------------------------------------------------------------------ */

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ */
/*  测试用例                                                            */
/* ------------------------------------------------------------------ */

describe('ApiSelect', () => {
  it('打开弹窗后调用 fetcher 加载选项', async () => {
    const user = userEvent.setup();
    const fetcher = createMockFetcher();

    render(
      <ApiSelect
        value={null}
        onChange={() => {}}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
      />,
    );

    await user.click(getTriggerButton());

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith({ keyword: '', page: 1, size: 20 });
    });

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('选择选项触发 onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const fetcher = createMockFetcher();

    render(
      <ApiSelect
        value={null}
        onChange={onChange}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
      />,
    );

    await user.click(getTriggerButton());

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Alice'));

    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('loading 状态显示 loadingText', async () => {
    const user = userEvent.setup();

    // fetcher 永不 resolve，保持 loading 状态
    const fetcher = vi.fn<(params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult>>(
      () => new Promise(() => {}),
    );

    render(
      <ApiSelect
        value={null}
        onChange={() => {}}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
      />,
    );

    await user.click(getTriggerButton());

    await waitFor(() => {
      expect(screen.getByTestId('api-select-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('空结果显示 emptyText', async () => {
    const user = userEvent.setup();
    const fetcher = createMockFetcher({ options: [], totalElements: 0 });

    render(
      <ApiSelect
        value={null}
        onChange={() => {}}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
      />,
    );

    await user.click(getTriggerButton());

    await waitFor(() => {
      expect(screen.getByText('No results')).toBeInTheDocument();
    });
  });

  it('再次选择已选中项时清除值（onChange(null)）', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const fetcher = createMockFetcher();

    render(
      <ApiSelect
        value="1"
        onChange={onChange}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
      />,
    );

    await user.click(getTriggerButton());

    // trigger button 和 option 都含 "Alice" 文本，用 role=option 精确选中列表项
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Alice/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('option', { name: /Alice/ }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disabled 状态下按钮不可点击', () => {
    const fetcher = createMockFetcher();

    render(
      <ApiSelect
        value={null}
        onChange={() => {}}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
        disabled
      />,
    );

    expect(getTriggerButton()).toBeDisabled();
  });

  it('搜索关键词变化触发 fetcher（debounce 后）', async () => {
    // 使用短 debounce + real timers（cmdk 内部也用 setTimeout，fake timers 会干扰）
    const user = userEvent.setup();
    const fetcher = createMockFetcher();

    render(
      <ApiSelect
        value={null}
        onChange={() => {}}
        fetcher={fetcher}
        loadingText="Loading..."
        emptyText="No results"
        debounceMs={50}
      />,
    );

    await user.click(getTriggerButton());

    // 等待初始加载
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith({ keyword: '', page: 1, size: 20 });
    });

    // 输入搜索关键词
    const searchInput = document.querySelector('[data-slot="command-input"]') as HTMLInputElement;
    await user.type(searchInput, 'ali');

    // 等 debounce 完成后的新请求
    await waitFor(
      () => {
        expect(fetcher).toHaveBeenCalledWith({ keyword: 'ali', page: 1, size: 20 });
      },
      { timeout: 3000 },
    );
  });
});
