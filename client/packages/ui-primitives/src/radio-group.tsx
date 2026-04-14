import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from './lib/utils';

/** RadioGroup 组件属性 */
export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 单选按钮组容器 */
function RadioGroup({ className, ref, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      ref={ref}
      {...props}
    />
  );
}

/** RadioGroupItem 组件属性 */
export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLButtonElement>;
}

/** 单选按钮选项 */
function RadioGroupItem({ className, ref, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-2.5 w-2.5"
        >
          <circle cx="12" cy="12" r="12" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
