import { zodResolver } from '@hookform/resolvers/zod';
import {
  type NoticeDetailView,
  type NoticeTarget,
  noticeQueryKeys,
  useCreateNotice,
  useNoticeDetail,
  usePublishNotice,
  useUpdateNotice,
} from '@mb/api-sdk';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Label,
  Separator,
} from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { type NoticeFormValues, noticeFormSchema } from '../schemas';
import { FileUploadField } from './file-upload-field';
import { TargetSelector } from './target-selector';
import { TipTapField } from './tiptap-field';

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = 新增模式，number = 编辑模式 */
  noticeId: number | null;
  onSuccess: () => void;
}

const EMPTY_FORM: NoticeFormValues = {
  title: '',
  content: '',
  pinned: false,
  startTime: '',
  endTime: '',
  attachmentFileIds: [],
};

export function NoticeDialog({ open, onOpenChange, noticeId, onSuccess }: NoticeDialogProps) {
  const { t } = useTranslation('notice');
  const queryClient = useQueryClient();
  const isEditing = noticeId !== null;

  // 查询详情（编辑模式）— 非编辑模式传 0 但 enabled=false 不会发请求
  const detailId = noticeId ?? 0;
  const { data: detailResponse } = useNoticeDetail(detailId, {
    query: { queryKey: noticeQueryKeys.detail(detailId), enabled: isEditing && open },
  });

  const detail: NoticeDetailView | undefined = detailResponse;

  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();
  const publishMutation = usePublishNotice();

  // 发布目标选择器
  const [targetSelectorOpen, setTargetSelectorOpen] = useState(false);
  const [pendingPublishId, setPendingPublishId] = useState<number | null>(null);

  // 表单
  const methods = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // 编辑模式下 detail 加载后同步到表单
  useEffect(() => {
    if (isEditing && detail && open) {
      methods.reset({
        title: detail.title ?? '',
        content: detail.content ?? '',
        pinned: detail.pinned ?? false,
        startTime: detail.startTime ?? '',
        endTime: detail.endTime ?? '',
        attachmentFileIds: detail.attachments?.map((a) => a.fileId ?? 0).filter(Boolean) ?? [],
      });
    }
  }, [isEditing, detail, open, methods]);

  // 打开弹窗时重置表单（新增模式）
  useEffect(() => {
    if (open && !isEditing) {
      methods.reset(EMPTY_FORM);
    }
  }, [open, isEditing, methods]);

  // 脏检查
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const handleClose = useCallback(() => {
    if (methods.formState.isDirty) {
      setShowDirtyConfirm(true);
    } else {
      onOpenChange(false);
    }
  }, [methods.formState.isDirty, onOpenChange]);

  // 表单提交（保存）
  const handleSubmit = useCallback(
    async (values: NoticeFormValues) => {
      try {
        if (isEditing && noticeId) {
          await updateMutation.mutateAsync({
            id: noticeId,
            data: {
              ...values,
              version: detail?.version ?? 0,
            },
          });
          toast.success(t('action.edit'));
        } else {
          await createMutation.mutateAsync({ data: values });
          toast.success(t('action.create'));
        }
        onOpenChange(false);
        onSuccess();
      } catch {
        // 错误由 HttpClient 全局拦截器处理
      }
    },
    [isEditing, noticeId, detail, createMutation, updateMutation, onOpenChange, onSuccess, t],
  );

  // 存为草稿 — 与保存逻辑相同（后端草稿状态由默认值控制）
  const handleSaveDraft = useCallback(
    async (values: NoticeFormValues) => {
      try {
        if (isEditing && noticeId) {
          await updateMutation.mutateAsync({
            id: noticeId,
            data: {
              ...values,
              version: detail?.version ?? 0,
            },
          });
          toast.success(t('dialog.saveDraft'));
        } else {
          await createMutation.mutateAsync({ data: values });
          toast.success(t('dialog.saveDraft'));
        }
        onOpenChange(false);
        onSuccess();
      } catch {
        // 错误由 HttpClient 全局拦截器处理
      }
    },
    [isEditing, noticeId, detail, createMutation, updateMutation, onOpenChange, onSuccess, t],
  );

  // 发布确认 → 目标选择
  const handlePublishConfirm = useCallback(
    (targets: NoticeTarget[]) => {
      if (!pendingPublishId) return;
      publishMutation.mutate(
        { id: pendingPublishId, data: { targets } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
            queryClient.invalidateQueries({ queryKey: noticeQueryKeys.unreadCount() });
            toast.success(t('action.publish'));
            onSuccess();
          },
        },
      );
    },
    [pendingPublishId, publishMutation, queryClient, onSuccess, t],
  );

  // 预留：保存并发布按钮触发
  void setPendingPublishId;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent
          className="max-w-5xl h-[90vh] flex flex-col gap-0 p-0"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="size-8" onClick={handleClose}>
                <ArrowLeft className="size-4" />
              </Button>
              <DialogTitle className="text-lg font-semibold">
                {isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={methods.handleSubmit(handleSaveDraft)}
              >
                {t('dialog.saveDraft')}
              </Button>
              <Button disabled={isSaving} onClick={methods.handleSubmit(handleSubmit)}>
                {t('action.save')}
              </Button>
            </div>
          </div>

          {/* Body: 左侧表单 + 右侧设置面板 */}
          <FormProvider {...methods}>
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧主表单区 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <NoticeMainFields />
              </div>

              {/* 右侧设置面板 */}
              <div className="w-64 border-l bg-muted/30 p-6 space-y-4 overflow-y-auto">
                <h3 className="font-semibold text-sm">{t('dialog.publishSettings')}</h3>
                <NoticeSideFields />
              </div>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* 脏检查确认 */}
      <AlertDialog open={showDirtyConfirm} onOpenChange={setShowDirtyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('confirm.dirtyCloseTitle', { defaultValue: '放弃编辑？' })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('confirm.dirtyClose')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                methods.reset();
                onOpenChange(false);
                setShowDirtyConfirm(false);
              }}
            >
              {t('confirm.confirmDiscard', { defaultValue: '确认放弃' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 目标选择器 */}
      <TargetSelector
        open={targetSelectorOpen}
        onOpenChange={setTargetSelectorOpen}
        onConfirm={handlePublishConfirm}
      />
    </>
  );
}

/** 左侧主表单字段：标题 + 富文本 + 附件 */
function NoticeMainFields() {
  const { t } = useTranslation('notice');
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<NoticeFormValues>();

  return (
    <>
      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="notice-title">
          {t('form.title')} <span className="text-destructive">*</span>
        </Label>
        <Input id="notice-title" placeholder={t('form.title')} {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      {/* 富文本 */}
      <div className="space-y-2">
        <Label>{t('form.content')}</Label>
        <TipTapField name="content" control={control as never} />
      </div>

      {/* 附件 */}
      <div className="space-y-2">
        <Label>{t('form.attachments')}</Label>
        <FileUploadField name="attachmentFileIds" control={control as never} />
      </div>
    </>
  );
}

/** 右侧设置字段：置顶 + 生效/失效时间 */
function NoticeSideFields() {
  const { t } = useTranslation('notice');
  const { register, control } = useFormContext<NoticeFormValues>();

  return (
    <>
      {/* 置顶 — Radix Checkbox 需要 Controller 桥接 */}
      <Controller
        name="pinned"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox id="notice-pinned" checked={field.value} onCheckedChange={field.onChange} />
            <Label htmlFor="notice-pinned" className="text-sm">
              {t('form.pinned')}
            </Label>
          </div>
        )}
      />

      <Separator />

      {/* 生效时间 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('form.startTime')}</Label>
        <Input type="datetime-local" className="h-9 text-sm" {...register('startTime')} />
      </div>

      {/* 失效时间 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('form.endTime')}</Label>
        <Input type="datetime-local" className="h-9 text-sm" {...register('endTime')} />
      </div>
    </>
  );
}
