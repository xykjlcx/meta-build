import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@mb/ui-primitives';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  类型定义                                                            */
/* ------------------------------------------------------------------ */

export interface ApiSelectOption<TValue = string> {
  value: TValue;
  label: ReactNode;
  /** 用于搜索匹配（cmdk 内部过滤已禁用，仅作为 CommandItem 的 value） */
  searchText?: string;
  disabled?: boolean;
}

export interface ApiSelectFetchParams {
  keyword: string;
  page: number;
  size: number;
}

export interface ApiSelectFetchResult<TValue = string> {
  options: ApiSelectOption<TValue>[];
  totalElements: number;
}

export interface ApiSelectProps<TValue = string> {
  value: TValue | null;
  onChange: (next: TValue | null) => void;
  fetcher: (params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult<TValue>>;
  placeholder?: ReactNode;
  /** 加载中文案（必填，L3 零 i18n） */
  loadingText: ReactNode;
  /** 空结果文案（必填，L3 零 i18n） */
  emptyText: ReactNode;
  /** 每页条数，默认 20 */
  size?: number;
  /** 搜索防抖毫秒数，默认 300 */
  debounceMs?: number;
  /** 预留缓存 key */
  cacheKey?: string;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  内部 hooks                                                         */
/* ------------------------------------------------------------------ */

/** 简易 debounce hook */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/*  ApiSelect 组件                                                     */
/* ------------------------------------------------------------------ */

function ApiSelect<TValue = string>({
  value,
  onChange,
  fetcher,
  placeholder,
  loadingText,
  emptyText,
  size = 20,
  debounceMs = 300,
  disabled,
}: ApiSelectProps<TValue>) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ApiSelectOption<TValue>[]>([]);

  const debouncedKeyword = useDebouncedValue(keyword, debounceMs);

  // 用 ref 跟踪最新的请求，丢弃过期响应
  const fetchIdRef = useRef(0);

  // 用 ref 存最新 fetcher，避免箭头函数引用变化导致无限循环
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // debounced 关键词变化或弹窗打开时，调用 fetcher
  useEffect(() => {
    if (!open) return;

    const currentId = ++fetchIdRef.current;
    setLoading(true);

    fetcherRef.current({ keyword: debouncedKeyword, page: 1, size })
      .then((result) => {
        // 丢弃过期响应
        if (currentId !== fetchIdRef.current) return;
        setOptions(result.options);
      })
      .catch(() => {
        if (currentId !== fetchIdRef.current) return;
        setOptions([]);
      })
      .finally(() => {
        if (currentId !== fetchIdRef.current) return;
        setLoading(false);
      });
  }, [open, debouncedKeyword, size]);

  // 弹窗关闭时重置搜索
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setKeyword('');
    }
  }, []);

  // 选中项的 label
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        {/* Combobox 语义：button + role=combobox，WAI-ARIA 标准模式 */}
        <button
          type="button"
          // biome-ignore lint/a11y/useSemanticElements: Combobox 需要搜索过滤能力，原生 select 不支持
          role="combobox"
          aria-controls="api-select-listbox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {selectedLabel ??
            (placeholder ? <span className="text-muted-foreground">{placeholder}</span> : null)}
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {/* shouldFilter={false} 禁用 cmdk 的客户端过滤，搜索由远程 fetcher 处理 */}
        <Command shouldFilter={false}>
          <CommandInput value={keyword} onValueChange={setKeyword} />
          <CommandList id="api-select-listbox">
            {/* loading 状态 */}
            {loading && (
              <div className="py-6 text-center text-sm" data-testid="api-select-loading">
                {loadingText}
              </div>
            )}
            {/* 空结果（非 loading 时） */}
            {!loading && options.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
            {/* 选项列表 */}
            {!loading && options.length > 0 && (
              <CommandGroup>
                {options.map((option) => {
                  const itemValue = option.searchText ?? String(option.value);
                  return (
                    <CommandItem
                      key={String(option.value)}
                      value={itemValue}
                      disabled={option.disabled}
                      onSelect={() => {
                        onChange(option.value === value ? null : option.value);
                        setOpen(false);
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ApiSelect };
