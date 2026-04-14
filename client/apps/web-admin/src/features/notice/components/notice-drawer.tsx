import {
  getDetailQueryKey,
  getList4QueryKey,
  getUnreadCountQueryKey,
  useCreate3,
  useDetail,
  usePublish,
  useUpdate2,
} from '@mb/api-sdk/generated/endpoints/公告管理/公告管理';
import type { NoticeDetailView, NoticeTarget } from '@mb/api-sdk/generated/models';
import { NxDrawer, NxFormField } from '@mb/ui-patterns';
import { Checkbox, Input, Label } from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ZodSchema } from 'zod';
import { type NoticeFormValues, noticeFormSchema } from '../schemas';
import { FileUploadField } from './file-upload-field';
import { TargetSelector } from './target-selector';
import { TipTapField } from './tiptap-field';

interface NoticeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = 新增模式，number = 编辑模式 */
  noticeId: number | null;
  onSuccess: () => void;
}

export function NoticeDrawer({ open, onOpenChange, noticeId, onSuccess }: NoticeDrawerProps) {
  const { t } = useTranslation('notice');
  const queryClient = useQueryClient();
  const isEditing = noticeId !== null;

  // 查询详情（编辑模式）— 非编辑模式传 0 但 enabled=false 不会发请求
  const detailId = noticeId ?? 0;
  const { data: detailResponse } = useDetail(detailId, {
    query: { queryKey: getDetailQueryKey(detailId), enabled: isEditing && open },
  });

  // orval 生成的响应结构：{ data: NoticeDetailView, status: 200, headers }
  const detail: NoticeDetailView | undefined = (
    detailResponse as { data?: NoticeDetailView } | undefined
  )?.data;

  const createMutation = useCreate3();
  const updateMutation = useUpdate2();
  const publishMutation = usePublish();

  // 发布目标选择器
  const [targetSelectorOpen, setTargetSelectorOpen] = useState(false);
  const [pendingPublishId, setPendingPublishId] = useState<number | null>(null);

  // 默认值（编辑模式从详情填充）
  const defaultValues: NoticeFormValues =
    isEditing && detail
      ? {
          title: detail.title ?? '',
          content: detail.content ?? '',
          pinned: detail.pinned ?? false,
          startTime: detail.startTime ?? '',
          endTime: detail.endTime ?? '',
          attachmentFileIds: detail.attachments?.map((a) => a.fileId ?? 0).filter(Boolean) ?? [],
        }
      : {
          title: '',
          content: '',
          pinned: false,
          startTime: '',
          endTime: '',
          attachmentFileIds: [],
        };

  // 表单提交
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
        onSuccess();
      } catch {
        // 错误由 HttpClient 全局拦截器处理
      }
    },
    [isEditing, noticeId, detail, createMutation, updateMutation, onSuccess, t],
  );

  // 发布确认 → 目标选择
  const handlePublishConfirm = useCallback(
    (targets: NoticeTarget[]) => {
      if (!pendingPublishId) return;
      publishMutation.mutate(
        { id: pendingPublishId, data: { targets } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getList4QueryKey() });
            queryClient.invalidateQueries({ queryKey: getUnreadCountQueryKey() });
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

  return (
    <>
      <NxDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={isEditing ? t('action.edit') : t('action.create')}
        schema={noticeFormSchema as unknown as ZodSchema<NoticeFormValues>}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel={t('action.save')}
        cancelLabel={t('action.cancel')}
        closeLabel={t('action.cancel')}
        dirtyConfirmText={t('confirm.dirtyClose')}
      >
        <NoticeFormFields />
      </NxDrawer>

      <TargetSelector
        open={targetSelectorOpen}
        onOpenChange={setTargetSelectorOpen}
        onConfirm={handlePublishConfirm}
      />
    </>
  );
}

/**
 * 内部表单字段 — 在 NxDrawer 的 FormProvider 内使用。
 */
function NoticeFormFields() {
  const { t } = useTranslation('notice');
  const { control } = useFormContext();

  return (
    <>
      <NxFormField name="title" label={t('form.title')} required>
        <Input placeholder={t('form.title')} />
      </NxFormField>

      <div className="space-y-2">
        <Label>{t('form.content')}</Label>
        <TipTapField name="content" control={control} />
      </div>

      <div className="flex items-center gap-2">
        <NxFormField name="pinned" label={t('form.pinned')}>
          <Checkbox />
        </NxFormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NxFormField name="startTime" label={t('form.startTime')}>
          <Input type="datetime-local" />
        </NxFormField>
        <NxFormField name="endTime" label={t('form.endTime')}>
          <Input type="datetime-local" />
        </NxFormField>
      </div>

      <div className="space-y-2">
        <Label>{t('form.attachments')}</Label>
        <FileUploadField name="attachmentFileIds" control={control} />
      </div>
    </>
  );
}
