import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NxLoading } from './nx-loading';

const defaultTexts = {
  loadingText: 'Loading...',
  errorText: 'Something went wrong',
  emptyText: 'No data',
  retryLabel: 'Retry',
};

describe('NxLoading', () => {
  it('正常渲染 children（无 loading/error/empty）', () => {
    render(
      <NxLoading {...defaultTexts}>
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('loading + skeleton 渲染 loadingText', () => {
    render(
      <NxLoading {...defaultTexts} loading variant="skeleton">
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('loading + spinner 渲染 loadingText', () => {
    render(
      <NxLoading {...defaultTexts} loading variant="spinner">
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('loading + skeleton-table 渲染 loadingText', () => {
    render(
      <NxLoading {...defaultTexts} loading variant="skeleton-table" rows={3}>
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('loading + skeleton-detail 渲染 loadingText', () => {
    render(
      <NxLoading {...defaultTexts} loading variant="skeleton-detail" rows={4}>
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('error 状态渲染 errorText + retry 按钮', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <NxLoading
        {...defaultTexts}
        error={new Error('fail')}
        onRetry={onRetry}
      >
        <p>content</p>
      </NxLoading>,
    );

    // 显示错误文案
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();

    // 点击重试
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    await user.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('error 状态无 onRetry 时不渲染重试按钮', () => {
    render(
      <NxLoading {...defaultTexts} error={new Error('fail')}>
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('empty 状态渲染 emptyText', () => {
    render(
      <NxLoading {...defaultTexts} empty>
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('优先级测试：error + loading + empty 同时为 true → 显示 error', () => {
    render(
      <NxLoading
        {...defaultTexts}
        error={new Error('fail')}
        loading
        empty
        onRetry={() => {}}
      >
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  it('优先级测试：loading + empty 同时为 true → 显示 loading', () => {
    render(
      <NxLoading {...defaultTexts} loading empty>
        <p>content</p>
      </NxLoading>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });
});
