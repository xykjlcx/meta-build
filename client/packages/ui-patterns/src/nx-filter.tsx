import { Button, Label, cn } from '@mb/ui-primitives';
import {
  type FormEvent,
  type ReactElement,
  type ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NxFilterValue = Record<string, unknown>;

export interface NxFilterProps<TFilter extends NxFilterValue> {
  /** 受控值 */
  value: TFilter;
  /** 重置时恢复到的默认值 */
  defaultValue: TFilter;
  /** 同步到 URL 或状态 */
  onChange: (next: TFilter) => void;
  /** 重置按钮文案 — 必传，零默认文案 */
  resetLabel: ReactNode;
  /** 查询按钮文案 — 必传，零默认文案 */
  applyLabel: ReactNode;
  /** NxFilterField 集合 */
  children: ReactNode;
  className?: string;
}

export interface NxFilterFieldProps {
  /** 必须与 value 中的 key 对应 */
  name: string;
  label: ReactNode;
  /** L2 Input / Select 等 */
  children: ReactElement;
}

// ---------------------------------------------------------------------------
// 内部 Context — 让 NxFilterField 读写 draft
// ---------------------------------------------------------------------------

interface FilterContextValue {
  draft: NxFilterValue;
  setField: (name: string, value: unknown) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function useFilterContext() {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error('NxFilterField 必须放在 NxFilter 内部使用');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// NxFilter
// ---------------------------------------------------------------------------

export function NxFilter<TFilter extends NxFilterValue>({
  value,
  defaultValue,
  onChange,
  resetLabel,
  applyLabel,
  children,
  className,
}: NxFilterProps<TFilter>) {
  const [draft, setDraft] = useState<TFilter>({ ...value });

  // 外部 value 变化时同步 draft
  useEffect(() => {
    setDraft({ ...value });
  }, [value]);

  const setField = useCallback((name: string, fieldValue: unknown) => {
    setDraft((prev) => ({ ...prev, [name]: fieldValue }));
  }, []);

  const handleApply = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onChange(draft);
    },
    [draft, onChange],
  );

  const handleReset = useCallback(() => {
    setDraft({ ...defaultValue });
    onChange({ ...defaultValue });
  }, [defaultValue, onChange]);

  return (
    <FilterContext.Provider value={{ draft, setField }}>
      <form
        onSubmit={handleApply}
        className={cn('flex flex-wrap items-end gap-4', className)}
        data-slot="nx-filter"
      >
        {/* 字段区域 */}
        {children}

        {/* 按钮区域 */}
        <div className="flex items-end gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            {resetLabel}
          </Button>
          <Button type="submit">{applyLabel}</Button>
        </div>
      </form>
    </FilterContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// NxFilterField
// ---------------------------------------------------------------------------

export function NxFilterField({ name, label, children }: NxFilterFieldProps) {
  const { draft, setField } = useFilterContext();

  const fieldValue = draft[name] ?? '';

  const child = isValidElement(children)
    ? cloneElement(children, {
        ...(children.props as Record<string, unknown>),
        value: fieldValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement> | unknown) => {
          // 兼容原生 event 和直接值（Select 等组件直接传值）
          const newValue =
            e && typeof e === 'object' && 'target' in e
              ? (e as React.ChangeEvent<HTMLInputElement>).target.value
              : e;
          setField(name, newValue);
        },
      } as Record<string, unknown>)
    : children;

  return (
    <div className="flex flex-col gap-1.5" data-slot="filter-field">
      <Label>{label}</Label>
      {child}
    </div>
  );
}
