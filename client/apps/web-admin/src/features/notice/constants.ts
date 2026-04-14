/** 公告状态枚举 — 与后端 NoticeStatus 对齐 */
export const NOTICE_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  REVOKED: 2,
} as const;

export type NoticeStatusValue = (typeof NOTICE_STATUS)[keyof typeof NOTICE_STATUS];

/** 通知目标类型 — 与后端 TargetType 对齐 */
export const TARGET_TYPE = {
  ALL: 'ALL',
  DEPT: 'DEPT',
  ROLE: 'ROLE',
  USER: 'USER',
} as const;

/** 附件约束 */
export const ATTACHMENT_MAX_COUNT = 10;
export const ATTACHMENT_MAX_SIZE_MB = 20;
export const ATTACHMENT_ALLOWED_EXTENSIONS = [
  'jpg',
  'png',
  'gif',
  'webp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
] as const;

/** 列表每页条数选项 */
export const PAGE_SIZE = 20;
