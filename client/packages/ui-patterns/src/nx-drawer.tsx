import { type ReactNode, useState, useCallback } from 'react';
import type { FieldValues, SubmitHandler, DefaultValues } from 'react-hook-form';
import type { ZodSchema } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@mb/ui-primitives';

// ---------------------------------------------------------------------------
// NxDrawer
// ---------------------------------------------------------------------------

export interface NxDrawerProps<TFormValues extends FieldValues = FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  schema?: ZodSchema<TFormValues>;
  defaultValues?: DefaultValues<TFormValues>;
  onSubmit?: SubmitHandler<TFormValues>;
  submitLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** 关闭按钮的 ARIA 标签（无障碍） */
  closeLabel: string;
  /** 脏检查确认文案 — 有值时启用脏检查 */
  dirtyConfirmText?: ReactNode;
  children: ReactNode;
}

export function NxDrawer<TFormValues extends FieldValues = FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  cancelLabel,
  closeLabel,
  dirtyConfirmText,
  children,
}: NxDrawerProps<TFormValues>) {
  // 表单模式：有 schema 时启用
  const isFormMode = !!schema;

  if (isFormMode) {
    return (
      <NxDrawerForm
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        side={side}
        schema={schema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        cancelLabel={cancelLabel}
        closeLabel={closeLabel}
        dirtyConfirmText={dirtyConfirmText}
      >
        {children}
      </NxDrawerForm>
    );
  }

  // 纯展示模式
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side={side} closeLabel={closeLabel}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="flex-1 overflow-auto px-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// 内部：表单模式
// ---------------------------------------------------------------------------

function NxDrawerForm<TFormValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  side,
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  cancelLabel,
  closeLabel,
  dirtyConfirmText,
  children,
}: Omit<NxDrawerProps<TFormValues>, 'schema'> & {
  schema: ZodSchema<TFormValues>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const methods = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { isDirty } = methods.formState;

  // 拦截关闭行为：脏 + 有确认文案 → 弹确认框
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && isDirty && dirtyConfirmText) {
        setConfirmOpen(true);
        return;
      }
      if (!next) {
        methods.reset();
      }
      onOpenChange(next);
    },
    [isDirty, dirtyConfirmText, onOpenChange, methods],
  );

  // 确认放弃 → 重置表单 + 关闭抽屉
  const handleConfirmDiscard = useCallback(() => {
    setConfirmOpen(false);
    methods.reset();
    onOpenChange(false);
  }, [onOpenChange, methods]);

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent side={side} closeLabel={closeLabel}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>

          <FormProvider {...methods}>
            <form
              onSubmit={
                onSubmit
                  ? methods.handleSubmit(onSubmit)
                  : (e) => e.preventDefault()
              }
              className="flex flex-1 flex-col overflow-hidden"
              noValidate
            >
              {/* 内容区域（可滚动） */}
              <div className="flex-1 space-y-4 overflow-auto px-6">{children}</div>

              {/* 底部按钮区域 */}
              <DrawerFooter>
                {cancelLabel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    {cancelLabel}
                  </Button>
                )}
                {submitLabel && <Button type="submit">{submitLabel}</Button>}
              </DrawerFooter>
            </form>
          </FormProvider>
        </DrawerContent>
      </Drawer>

      {/* 脏检查确认对话框 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dirtyConfirmText}</AlertDialogTitle>
            <AlertDialogDescription />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDiscard}>
              {closeLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
