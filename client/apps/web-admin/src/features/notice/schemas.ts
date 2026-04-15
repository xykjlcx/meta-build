import { z } from 'zod';

export const noticeFormSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多 200 字'),
  content: z.string().max(500000, '内容过长').default(''),
  pinned: z.boolean().default(false),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
  attachmentFileIds: z.array(z.number()).max(10, '附件不能超过 10 个').default([]),
});

export type NoticeFormValues = z.infer<typeof noticeFormSchema>;
