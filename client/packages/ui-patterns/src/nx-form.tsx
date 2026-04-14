import {
  type ReactNode,
  type ReactElement,
  cloneElement,
  isValidElement,
} from 'react';
import type {
  FieldValues,
  DefaultValues,
  SubmitHandler,
  FieldPath,
} from 'react-hook-form';
import type { ZodSchema } from 'zod';
import {
  useForm,
  useFormContext,
  useController,
  FormProvider,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Label, cn } from '@mb/ui-primitives';

// ---------------------------------------------------------------------------
// NxForm
// ---------------------------------------------------------------------------

export interface NxFormProps<TFormValues extends FieldValues> {
  schema: ZodSchema<TFormValues>;
  defaultValues?: DefaultValues<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  children: ReactNode;
  /** 提交按钮文案 — 必传，零默认文案 */
  submitLabel: ReactNode;
  cancelLabel?: ReactNode;
  onCancel?: () => void;
  /** 提交中禁用按钮 */
  loading?: boolean;
  className?: string;
}

export function NxForm<TFormValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel,
  cancelLabel,
  onCancel,
  loading = false,
  className,
}: NxFormProps<TFormValues>) {
  const methods = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={cn('space-y-6', className)}
        noValidate
      >
        {/* 表单字段区域 */}
        <div className="space-y-4">{children}</div>

        {/* 底部按钮区域 */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {submitLabel}
          </Button>
          {onCancel && cancelLabel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// NxFormField
// ---------------------------------------------------------------------------

export interface NxFormFieldProps<TFormValues extends FieldValues = FieldValues> {
  name: FieldPath<TFormValues>;
  label: ReactNode;
  description?: ReactNode;
  /** 接受 L2 Input / Select / Checkbox 等 */
  children: ReactElement;
  /** 仅视觉星号，验证由 schema 决定 */
  required?: boolean;
}

export function NxFormField<TFormValues extends FieldValues = FieldValues>({
  name,
  label,
  description,
  children,
  required = false,
}: NxFormFieldProps<TFormValues>) {
  const { control } = useFormContext<TFormValues>();
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control });

  // 为子元素注入受控属性
  const child = isValidElement(children)
    ? cloneElement(children, {
        ...(children.props as Record<string, unknown>),
        value: value ?? '',
        onChange,
        onBlur,
        ref,
        'aria-invalid': !!error,
      } as Record<string, unknown>)
    : children;

  return (
    <div className="space-y-2" data-slot="form-field">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {child}
      {error?.message && (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
