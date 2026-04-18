import { zodResolver } from '@hookform/resolvers/zod';
import {
  type NoticeDetailVo,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
} from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarClock, Megaphone, Paperclip, Pin } from 'lucide-react';
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

  const detail: NoticeDetailVo | undefined = detailResponse;

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

  const persistNotice = useCallback(
    async (values: NoticeFormValues) => {
      if (isEditing && noticeId) {
        await updateMutation.mutateAsync({
          id: noticeId,
          data: {
            ...values,
            version: detail?.version ?? 0,
          },
        });
        return noticeId;
      }

      const created = await createMutation.mutateAsync({ data: values });
      return created.id ?? null;
    },
    [createMutation, detail?.version, isEditing, noticeId, updateMutation],
  );

  // 表单提交（保存）
  const handleSubmit = useCallback(
    async (values: NoticeFormValues) => {
      try {
        await persistNotice(values);
        toast.success(t(isEditing ? 'action.edit' : 'action.create'));
        onOpenChange(false);
        onSuccess();
      } catch {
        // 错误由 HttpClient 全局拦截器处理
      }
    },
    [isEditing, onOpenChange, onSuccess, persistNotice, t],
  );

  // 存为草稿 — 与保存逻辑相同（后端草稿状态由默认值控制）
  const handleSaveDraft = useCallback(
    async (values: NoticeFormValues) => {
      try {
        await persistNotice(values);
        toast.success(t('dialog.saveDraft'));
        onOpenChange(false);
        onSuccess();
      } catch {
        // 错误由 HttpClient 全局拦截器处理
      }
    },
    [onOpenChange, onSuccess, persistNotice, t],
  );

  const handleSaveAndPublish = useCallback(
    async (values: NoticeFormValues) => {
      try {
        const savedNoticeId = await persistNotice(values);
        if (!savedNoticeId) {
          return;
        }

        setPendingPublishId(savedNoticeId);
        setTargetSelectorOpen(true);
      } catch {
        // 错误由 HttpClient 全局拦截器处理
      }
    },
    [persistNotice],
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
            queryClient.invalidateQueries({ queryKey: noticeQueryKeys.detail(pendingPublishId) });
            toast.success(t('action.publish'));
            setTargetSelectorOpen(false);
            setPendingPublishId(null);
            onOpenChange(false);
            onSuccess();
          },
        },
      );
    },
    [onOpenChange, onSuccess, pendingPublishId, publishMutation, queryClient, t],
  );

  const isSaving =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent
          className="h-[calc(100vh-2rem)] max-w-[min(1380px,calc(100vw-2rem))] flex flex-col gap-0 overflow-hidden rounded-[1.25rem] p-0"
          showCloseButton={false}
        >
          <DialogHeader className="border-b bg-background/96 px-8 py-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-3">
                <Button variant="ghost" size="icon" className="mt-0.5 size-9" onClick={handleClose}>
                  <span className="sr-only">{t('action.cancel')}</span>
                  <ArrowLeft className="size-4" />
                </Button>
                <div className="space-y-1 text-left">
                  <DialogTitle className="text-[1.5rem] font-semibold tracking-[-0.02em]">
                    {isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {t('dialog.subtitle')}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={methods.handleSubmit(handleSaveDraft)}
                >
                  {t('dialog.saveDraft')}
                </Button>
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={methods.handleSubmit(handleSaveAndPublish)}
                >
                  {t('dialog.saveAndPublish')}
                </Button>
                <Button disabled={isSaving} onClick={methods.handleSubmit(handleSubmit)}>
                  {t('action.save')}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Body: 左侧表单 + 右侧设置面板 */}
          <FormProvider {...methods}>
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px] overflow-hidden">
              {/* 左侧主表单区 */}
              <div className="overflow-y-auto bg-background px-8 py-7">
                <NoticeMainFields />
              </div>

              {/* 右侧设置面板 */}
              <div className="overflow-y-auto border-l bg-muted/25 px-6 py-7">
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
        onOpenChange={(nextOpen) => {
          setTargetSelectorOpen(nextOpen);
          if (!nextOpen) {
            setPendingPublishId(null);
          }
        }}
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card px-6 py-6 shadow-xs">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <Megaphone className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{t('dialog.mainSection')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('dialog.mainSectionDesc')}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="notice-title">
              {t('form.title')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="notice-title"
              placeholder={t('form.titlePlaceholder')}
              className="h-11 text-base"
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>{t('form.content')}</Label>
              <span className="text-xs text-muted-foreground">{t('editor.modeHint')}</span>
            </div>
            <TipTapField name="content" control={control as never} />
          </div>
        </div>
      </section>
    </div>
  );
}

/** 右侧设置字段：置顶 + 生效/失效时间 + 附件 */
function NoticeSideFields() {
  const { t } = useTranslation('notice');
  const { register, control } = useFormContext<NoticeFormValues>();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card px-5 py-5 shadow-xs">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <CalendarClock className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{t('dialog.publishSettings')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('dialog.settingsSectionDesc')}</p>
          </div>
        </div>

        <Controller
          name="pinned"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
              <Checkbox id="notice-pinned" checked={field.value} onCheckedChange={field.onChange} />
              <Label
                htmlFor="notice-pinned"
                className="flex flex-1 items-center justify-between text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Pin className="size-4 text-muted-foreground" />
                  {t('form.pinned')}
                </span>
                <span className="text-xs text-muted-foreground">{t('dialog.pinHint')}</span>
              </Label>
            </div>
          )}
        />

        <Separator className="my-5" />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('form.startTime')}</Label>
            <Input type="datetime-local" className="h-10 text-sm" {...register('startTime')} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('form.endTime')}</Label>
            <Input type="datetime-local" className="h-10 text-sm" {...register('endTime')} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card px-5 py-5 shadow-xs">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
            <Paperclip className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{t('form.attachments')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dialog.attachmentSectionDesc')}
            </p>
          </div>
        </div>

        <FileUploadField name="attachmentFileIds" control={control as never} />
      </section>
    </div>
  );
}
