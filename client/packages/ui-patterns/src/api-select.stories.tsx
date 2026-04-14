import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ApiSelect } from './api-select';
import type { ApiSelectFetchParams, ApiSelectFetchResult } from './api-select';

/* ------------------------------------------------------------------ */
/*  Mock 数据                                                          */
/* ------------------------------------------------------------------ */

const allOptions = [
  { value: '1', label: 'Alice Johnson' },
  { value: '2', label: 'Bob Smith' },
  { value: '3', label: 'Charlie Brown' },
  { value: '4', label: 'Diana Prince' },
  { value: '5', label: 'Edward Norton' },
];

/** 模拟远程搜索 */
function mockFetcher(params: ApiSelectFetchParams): Promise<ApiSelectFetchResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = params.keyword
        ? allOptions.filter((o) =>
            (o.label as string).toLowerCase().includes(params.keyword.toLowerCase()),
          )
        : allOptions;
      resolve({ options: filtered, totalElements: filtered.length });
    }, 500);
  });
}

/** 永不 resolve 的 fetcher（模拟 loading） */
function loadingFetcher(): Promise<ApiSelectFetchResult> {
  return new Promise(() => {});
}

/** 立即返回空结果的 fetcher */
function emptyFetcher(): Promise<ApiSelectFetchResult> {
  return Promise.resolve({ options: [], totalElements: 0 });
}

/* ------------------------------------------------------------------ */
/*  Story 包装器（管理 value 状态）                                       */
/* ------------------------------------------------------------------ */

function ApiSelectWrapper({
  fetcher,
  ...props
}: Omit<React.ComponentProps<typeof ApiSelect>, 'value' | 'onChange'> & {
  fetcher: (params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult>;
}) {
  const [value, setValue] = useState<string | null>(null);
  return <ApiSelect value={value} onChange={setValue} fetcher={fetcher} {...props} />;
}

/* ------------------------------------------------------------------ */
/*  Meta                                                               */
/* ------------------------------------------------------------------ */

const meta = {
  title: 'Patterns/ApiSelect',
  component: ApiSelect,
  args: {
    value: null as unknown,
    onChange: () => {},
    fetcher: mockFetcher,
    placeholder: 'Select...',
    loadingText: 'Loading...',
    emptyText: 'No results found',
  },
} satisfies Meta<typeof ApiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/*  Stories                                                            */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  render: () => (
    <ApiSelectWrapper
      fetcher={mockFetcher}
      placeholder="Select a user..."
      loadingText="Loading..."
      emptyText="No results found"
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <ApiSelectWrapper
      fetcher={loadingFetcher}
      placeholder="Select a user..."
      loadingText="Loading..."
      emptyText="No results found"
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <ApiSelectWrapper
      fetcher={emptyFetcher}
      placeholder="Select a user..."
      loadingText="Loading..."
      emptyText="No results found"
    />
  ),
};
