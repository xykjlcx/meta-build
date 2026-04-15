import { customInstance } from '@mb/api-sdk/mutator/custom-instance';
import { Button } from '@mb/ui-primitives';
import { Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useCallback, useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ATTACHMENT_ALLOWED_EXTENSIONS,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_MAX_SIZE_MB,
} from '../constants';

interface FileItem {
  fileId: number;
  fileName: string;
}

interface FileUploadFieldProps {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: RHF Control 泛型需要 any
  control: Control<any>;
}

/**
 * 文件上传字段 — 桥接 React Hook Form。
 *
 * 调用 platform-file API 上传，获取 fileId 列表写入表单。
 * 支持多文件上传、删除、格式白名单校验。
 */
export function FileUploadField({ name, control }: FileUploadFieldProps) {
  const { t } = useTranslation('notice');
  const { field } = useController({ name, control });
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const currentFileIds: number[] = field.value ?? [];

  const handleFileChange = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 文件上传包含格式/大小/数量多重校验
    async (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (!selected?.length) return;

      // 数量校验
      if (currentFileIds.length + selected.length > ATTACHMENT_MAX_COUNT) {
        toast.error(t('error.attachmentLimitExceeded', { max: ATTACHMENT_MAX_COUNT }));
        return;
      }

      setUploading(true);
      const newFiles: FileItem[] = [];
      const newFileIds: number[] = [...currentFileIds];

      for (const file of Array.from(selected)) {
        // 格式校验
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (
          !ATTACHMENT_ALLOWED_EXTENSIONS.includes(
            ext as (typeof ATTACHMENT_ALLOWED_EXTENSIONS)[number],
          )
        ) {
          toast.error(`${file.name}: ${t('upload.unsupportedFormat')}`);
          continue;
        }

        // 大小校验
        if (file.size > ATTACHMENT_MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name}: ${t('upload.fileTooLarge', { max: ATTACHMENT_MAX_SIZE_MB })}`);
          continue;
        }

        try {
          // 上传到 platform-file API
          const formData = new FormData();
          formData.append('file', file);
          const result = await customInstance<{ data: { fileId: number; fileName: string } }>(
            '/api/v1/files/upload',
            { method: 'POST', body: formData },
          );
          const uploaded = result.data;
          newFiles.push({ fileId: uploaded.fileId, fileName: uploaded.fileName ?? file.name });
          newFileIds.push(uploaded.fileId);
        } catch {
          toast.error(`${file.name}: ${t('upload.uploadFailed')}`);
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
      field.onChange(newFileIds);
      setUploading(false);

      // 重置 input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [currentFileIds, field, t],
  );

  const handleRemove = useCallback(
    (fileId: number) => {
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      field.onChange(currentFileIds.filter((id) => id !== fileId));
    },
    [currentFileIds, field],
  );

  const acceptExtensions = ATTACHMENT_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || currentFileIds.length >= ATTACHMENT_MAX_COUNT}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-1 size-4" />
          {uploading ? t('upload.uploading') : t('form.attachments')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentFileIds.length}/{ATTACHMENT_MAX_COUNT}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept={acceptExtensions}
        onChange={handleFileChange}
      />

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.fileId} className="flex items-center gap-2 text-sm">
              <span className="truncate">{f.fileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(f.fileId)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
