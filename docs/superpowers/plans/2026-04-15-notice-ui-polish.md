# Notice UI 打磨实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Notice 通知公告三个页面（列表/编辑/详情）从"功能可用"升级为"视觉完善"，对标飞书管理后台的成熟度。

**Architecture:** 仅改 L5 页面层（`web-admin/src/features/notice/`），不改 L3 组件。用 L2 原子组件（Card, Badge, Dialog, DropdownMenu, Breadcrumb, Select, Input, Separator, Tabs）重新组合页面布局。NxTable 和 NxBar 继续使用，NxFilter 和 NxDrawer 被替换。

**Tech Stack:** React 19 + shadcn/ui v4 (L2) + TanStack Table + TanStack Query + React Hook Form + Zod + TipTap + lucide-react + react-i18next

**Spec:** `docs/superpowers/specs/2026-04-15-notice-ui-polish-design.md`

---

## Task 1: i18n 补充 + 状态 Badge 颜色修正

**Files:**
- Modify: `client/apps/web-admin/src/i18n/zh-CN/notice.json`
- Modify: `client/apps/web-admin/src/i18n/en-US/notice.json`
- Modify: `client/apps/web-admin/src/features/notice/components/notice-status-badge.tsx`

**Steps:**

- [ ] 在 `zh-CN/notice.json` 顶层追加以下 key（不删除现有 key）：

```json
{
  "breadcrumb": {
    "system": "系统管理",
    "notice": "通知公告"
  },
  "list": {
    "subtitle": "管理系统通知和公告",
    "readRate": "已读率"
  },
  "filter": {
    "searchPlaceholder": "搜索公告标题...",
    "priority": "优先级",
    "allStatus": "全部状态",
    "allPriority": "全部优先级"
  },
  "priority": {
    "normal": "普通",
    "high": "紧急",
    "urgent": "特急"
  },
  "pagination": {
    "selected": "已选 {{selected}} 条，共 {{total}} 条",
    "total": "共 {{total}} 条",
    "perPage": "每页",
    "pageInfo": "第 {{page}} 页，共 {{pages}} 页"
  },
  "detail": {
    "back": "返回列表",
    "publishedBy": "发布人",
    "publishedAt": "发布时间",
    "createdBy": "创建人",
    "createdAt": "创建时间"
  },
  "dialog": {
    "createTitle": "新建公告",
    "editTitle": "编辑公告",
    "saveDraft": "存为草稿",
    "saveAndPublish": "保存并发布",
    "publishSettings": "发布设置"
  }
}
```

- [ ] 在 `en-US/notice.json` 追加对应英文 key：

```json
{
  "breadcrumb": {
    "system": "System",
    "notice": "Notices"
  },
  "list": {
    "subtitle": "Manage system notices and announcements",
    "readRate": "Read Rate"
  },
  "filter": {
    "searchPlaceholder": "Search notices...",
    "priority": "Priority",
    "allStatus": "All Status",
    "allPriority": "All Priority"
  },
  "priority": {
    "normal": "Normal",
    "high": "High",
    "urgent": "Urgent"
  },
  "pagination": {
    "selected": "{{selected}} of {{total}} selected",
    "total": "{{total}} total",
    "perPage": "Per page",
    "pageInfo": "Page {{page}} of {{pages}}"
  },
  "detail": {
    "back": "Back to list",
    "publishedBy": "Published by",
    "publishedAt": "Published at",
    "createdBy": "Created by",
    "createdAt": "Created at"
  },
  "dialog": {
    "createTitle": "New Notice",
    "editTitle": "Edit Notice",
    "saveDraft": "Save as Draft",
    "saveAndPublish": "Save & Publish",
    "publishSettings": "Publish Settings"
  }
}
```

> 注意：这些 key 要追加合并到现有 JSON 中，不要覆盖已有 key。用 deep merge 或手动插入到对应位置。

- [ ] 修改 `notice-status-badge.tsx`，确保 Badge variant 颜色映射正确：

当前文件内容约 24 行。将 variant 映射改为：
- `DRAFT (0)` → `variant="secondary"`（灰色）
- `PUBLISHED (1)` → `variant="default"` + `className="bg-green-100 text-green-800 hover:bg-green-100"`（绿色，因为 L2 Badge 没有 success variant）
- `REVOKED (2)` → `variant="destructive"`（红色）

```tsx
import { Badge } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';
import { NOTICE_STATUS, type NoticeStatusValue } from '../constants';

const STATUS_CONFIG: Record<NoticeStatusValue, { variant: 'secondary' | 'default' | 'destructive'; className?: string; labelKey: string }> = {
  [NOTICE_STATUS.DRAFT]: { variant: 'secondary', labelKey: 'status.draft' },
  [NOTICE_STATUS.PUBLISHED]: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200', labelKey: 'status.published' },
  [NOTICE_STATUS.REVOKED]: { variant: 'destructive', labelKey: 'status.revoked' },
};

export function NoticeStatusBadge({ status }: { status: NoticeStatusValue }) {
  const { t } = useTranslation('notice');
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[NOTICE_STATUS.DRAFT];
  return (
    <Badge variant={config.variant} className={config.className}>
      {t(config.labelKey)}
    </Badge>
  );
}
```

- [ ] 验证：

```bash
cd client && pnpm check:i18n && pnpm check:types
```

- [ ] Commit:

```bash
git add client/apps/web-admin/src/i18n/ client/apps/web-admin/src/features/notice/components/notice-status-badge.tsx
git commit -m "feat(notice): i18n 补充 + 状态 Badge 颜色修正"
```

---

## Task 2: 列表页重写（筛选面板式 + Card 表格 + 行操作 DropdownMenu + 新分页）

**Files:**
- Rewrite: `client/apps/web-admin/src/features/notice/pages/notice-list-page.tsx`

这是最大的 Task，完整重写 540 行列表页。核心变化：
1. 去掉 NxFilter，改为 L2 组件横排即时筛选（debounce 搜索）
2. Card 包裹表格 + 分页
3. 行操作从图标平铺改为"主操作文字 + ⋯ DropdownMenu"
4. 分页栏升级（每页条数选择 + 选中统计）
5. 新增面包屑 + 页面 Header（标题+副标题+操作按钮）
6. 已读率进度条
7. 未读行蓝色左边框

**Steps:**

- [ ] 重写 `notice-list-page.tsx`。完整替换文件内容。

关键改动说明（agent 实现时参考）：

**imports 变化：**
- 去掉：`NxFilter`, `NxFilterField` from `@mb/ui-patterns`
- 新增：`Card, CardContent`, `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger`, `Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator`, `Separator` from `@mb/ui-primitives`
- 新增：`MoreHorizontal, Search` from `lucide-react`
- 新增：`useRef` from `react`（debounce 用）
- 保留：`NxTable, NxBar` from `@mb/ui-patterns`

**筛选区替换逻辑：**
```tsx
// 去掉 NxFilter 包裹，改为直接 flex 布局
<div className="flex items-center gap-3 flex-wrap">
  {/* 搜索框 — 带搜索图标前缀 */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder={t('filter.searchPlaceholder')}
      className="w-64 pl-9"
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
    />
  </div>
  
  {/* 状态下拉 — onChange 即时筛选 */}
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-36">
      <SelectValue placeholder={t('filter.allStatus')} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">{t('filter.allStatus')}</SelectItem>
      <SelectItem value="0">{t('status.draft')}</SelectItem>
      <SelectItem value="1">{t('status.published')}</SelectItem>
      <SelectItem value="2">{t('status.revoked')}</SelectItem>
    </SelectContent>
  </Select>
  
  {/* 重置按钮 */}
  <Button variant="link" size="sm" onClick={handleReset}>
    {t('filter.reset')}
  </Button>
</div>
```

搜索框用 debounce：
```tsx
const [keyword, setKeyword] = useState('');
const debouncedKeyword = useDebounced(keyword, 300);

// 自定义 hook 在组件顶部定义
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

查询参数使用 `debouncedKeyword` 而非 `filter.keyword`。

**表格 Card 包裹：**
```tsx
<Card>
  <CardContent className="p-0">
    <NxTable ... className="[&_thead_tr]:bg-muted/50" />
    {/* 分页栏 */}
    <div className="flex items-center justify-between border-t px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {selectedIds.length > 0
          ? t('pagination.selected', { selected: selectedIds.length, total: totalElements })
          : t('pagination.total', { total: totalElements })}
      </span>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('pagination.perPage')}</span>
        <Select value={String(pagination.size)} onValueChange={(v) => setPagination(p => ({...p, size: Number(v), page: 1}))}>
          <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">
          {t('pagination.pageInfo', { page: pagination.page, pages: totalPages || 1 })}
        </span>
        <Button variant="outline" size="icon" className="size-8" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>
          ‹
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={pagination.page >= totalPages} onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>
          ›
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

注意：NxTable 的内置分页不再使用（不传 `pagination` 和 `onPaginationChange`），分页完全由外部 Card 底部栏控制。或者继续传 pagination 给 NxTable 但隐藏其内置分页（看 NxTable 是否支持）。如果 NxTable 在有 pagination props 时强制渲染分页，则不传 pagination，改为手动在 data 外控制。

**行操作列重写：**
```tsx
{
  id: 'actions',
  header: () => <span className="sr-only">{t('common:actions', { defaultValue: '操作' })}</span>,
  cell: ({ row }) => {
    const notice = row.original;
    const status = notice.status as NoticeStatusValue;
    return (
      <div className="flex items-center justify-end gap-1">
        {/* 主操作：草稿→编辑，其他→详情 */}
        {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:update') ? (
          <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => handleEdit(notice.id ?? 0)}>
            {t('action.edit')}
          </Button>
        ) : (
          <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => navigate({ to: '/notices/$id', params: { id: String(notice.id) } })}>
            {t('detail.title')}
          </Button>
        )}
        
        {/* ⋯ 下拉次要操作 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* 草稿：发布/复制/删除 */}
            {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:publish') && (
              <DropdownMenuItem onClick={() => setConfirmAction({ type: 'publish', id: notice.id ?? 0 })}>
                <Send className="mr-2 size-4" />{t('action.publish')}
              </DropdownMenuItem>
            )}
            {(status === NOTICE_STATUS.PUBLISHED || status === NOTICE_STATUS.REVOKED) && user.hasPermission('notice:notice:create') && (
              <DropdownMenuItem onClick={() => handleDuplicate(notice.id ?? 0)}>
                <Copy className="mr-2 size-4" />{t('action.duplicate')}
              </DropdownMenuItem>
            )}
            {status === NOTICE_STATUS.PUBLISHED && user.hasPermission('notice:notice:publish') && (
              <DropdownMenuItem onClick={() => setConfirmAction({ type: 'revoke', id: notice.id ?? 0 })}>
                <Undo2 className="mr-2 size-4" />{t('action.revoke')}
              </DropdownMenuItem>
            )}
            {(status === NOTICE_STATUS.DRAFT || status === NOTICE_STATUS.REVOKED) && user.hasPermission('notice:notice:delete') && (
              <DropdownMenuItem className="text-destructive" onClick={() => setConfirmAction({ type: 'delete', id: notice.id ?? 0 })}>
                <Trash2 className="mr-2 size-4" />{t('action.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}
```

**已读率列：**
```tsx
{
  id: 'readRate',
  header: t('list.readRate'),
  cell: ({ row }) => {
    const notice = row.original;
    const readCount = notice.readCount ?? 0;
    const total = notice.recipientCount ?? 0;
    if (total === 0) return <span className="text-muted-foreground">—</span>;
    const pct = Math.round((readCount / total) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
    );
  },
}
```

**未读行蓝色左边框：** 在 NxTable 的 `onRowClick` 附近，通过 `className` 传给 NxTable（如果支持行 className），或通过 column cell 第一列加一个视觉指示器。最简单的方式是在标题列的 cell 里加一个 `before:` 伪元素，或在标题前加一个小圆点。

**面包屑 + Header：**
```tsx
<div className="space-y-4">
  {/* 面包屑 */}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="#">{t('breadcrumb.system')}</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>{t('breadcrumb.notice')}</BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
  
  {/* 标题区 */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
    </div>
    <div className="flex items-center gap-2">
      {/* 导出 + 新建按钮，保持现有逻辑 */}
    </div>
  </div>
  
  {/* 筛选区 */}
  ...
  
  {/* Card 包裹表格+分页 */}
  ...
</div>
```

**Drawer → Dialog 引用更新：** 列表页中 `<NoticeDrawer>` 引用改为新的 `<NoticeDialog>`（Task 3 创建）。

- [ ] 验证：

```bash
cd client && pnpm check:types && pnpm build
```

- [ ] Commit:

```bash
git add client/apps/web-admin/src/features/notice/pages/notice-list-page.tsx
git commit -m "feat(notice): 列表页 UI 重写（筛选面板式 + Card 表格 + DropdownMenu 行操作）"
```

---

## Task 3: 编辑弹窗重写（NxDrawer → 全屏 Dialog 双栏布局）

**Files:**
- Create: `client/apps/web-admin/src/features/notice/components/notice-dialog.tsx`（替代 notice-drawer.tsx）
- Delete: `client/apps/web-admin/src/features/notice/components/notice-drawer.tsx`（Task 2 已不再引用）

**Steps:**

- [ ] 创建 `notice-dialog.tsx`。

核心结构：
```tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Checkbox, Dialog, DialogContent, DialogTitle,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Separator,
} from '@mb/ui-primitives';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
// ... 其他 imports 同 notice-drawer.tsx

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noticeId: number | null;
  onSuccess: () => void;
}

export function NoticeDialog({ open, onOpenChange, noticeId, onSuccess }: NoticeDialogProps) {
  const { t } = useTranslation('notice');
  const isEditing = noticeId !== null;
  
  // 查询详情、mutations 逻辑 — 从 notice-drawer.tsx 复制
  // ...
  
  const methods = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues,
  });
  
  // 脏检查
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const handleClose = useCallback(() => {
    if (methods.formState.isDirty) {
      setShowDirtyConfirm(true);
    } else {
      onOpenChange(false);
    }
  }, [methods.formState.isDirty, onOpenChange]);
  
  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft className="size-4" />
              </Button>
              <DialogTitle className="text-lg font-semibold">
                {isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={methods.handleSubmit(handleSaveDraft)}>
                {t('dialog.saveDraft')}
              </Button>
              <Button onClick={methods.handleSubmit(handleSubmit)}>
                {t('action.save')}
              </Button>
            </div>
          </div>
          
          {/* Body: 左侧表单 + 右侧设置面板 */}
          <FormProvider {...methods}>
            <form className="flex flex-1 overflow-hidden">
              {/* 左侧主表单区 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <NoticeMainFields />
              </div>
              
              {/* 右侧设置面板 */}
              <div className="w-64 border-l bg-muted/30 p-6 space-y-4 overflow-y-auto">
                <h3 className="font-semibold text-sm">{t('dialog.publishSettings')}</h3>
                <NoticeSideFields />
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      
      {/* 脏检查确认 */}
      <AlertDialog open={showDirtyConfirm} onOpenChange={setShowDirtyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm.dirtyCloseTitle', { defaultValue: '放弃编辑？' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirm.dirtyClose')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { methods.reset(); onOpenChange(false); setShowDirtyConfirm(false); }}>
              {t('confirm.confirmDiscard', { defaultValue: '确认放弃' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 目标选择器 */}
      <TargetSelector ... />
    </>
  );
}

/** 左侧主表单字段：标题 + 富文本 + 附件 */
function NoticeMainFields() {
  const { t } = useTranslation('notice');
  const { control, register, formState: { errors } } = useFormContext<NoticeFormValues>();
  
  return (
    <>
      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {t('form.title')} <span className="text-destructive">*</span>
        </Label>
        <Input id="title" placeholder={t('form.title')} {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      
      {/* 富文本 */}
      <div className="space-y-2">
        <Label>{t('form.content')}</Label>
        <TipTapField name="content" control={control} />
      </div>
      
      {/* 附件 */}
      <div className="space-y-2">
        <Label>{t('form.attachments')}</Label>
        <FileUploadField name="attachmentFileIds" control={control} />
      </div>
    </>
  );
}

/** 右侧设置字段：优先级 + 置顶 + 时间 + 发布目标 */
function NoticeSideFields() {
  const { t } = useTranslation('notice');
  const { register, control } = useFormContext<NoticeFormValues>();
  
  return (
    <>
      {/* 置顶 */}
      <div className="flex items-center gap-2">
        <Checkbox id="pinned" {...register('pinned')} />
        <Label htmlFor="pinned" className="text-sm">{t('form.pinned')}</Label>
      </div>
      
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
```

注意事项：
- `Dialog` from L2 的 `DialogContent` 要支持自定义尺寸。确认 `className="max-w-5xl h-[90vh]"` 能覆盖默认的 max-width
- React Hook Form 需要手动 `useForm` + `FormProvider`（不再用 NxDrawer 自带的 form 管理）
- `defaultValues` 需要在 `open` 和 `detail` 变化时通过 `useEffect` + `methods.reset(defaultValues)` 同步
- Checkbox 和 RHF 的集成：用 `Controller` 包裹 Checkbox

- [ ] 删除旧文件 `notice-drawer.tsx`

- [ ] 验证：

```bash
cd client && pnpm check:types && pnpm build
```

- [ ] Commit:

```bash
git add client/apps/web-admin/src/features/notice/components/
git commit -m "feat(notice): 编辑弹窗重写（全屏 Dialog + 双栏布局）"
```

---

## Task 4: 详情页重构（Card 包裹 + 元信息区 + Header 优化）

**Files:**
- Rewrite: `client/apps/web-admin/src/features/notice/pages/notice-detail-page.tsx`

**Steps:**

- [ ] 重写 `notice-detail-page.tsx`。

核心布局变化：

```tsx
return (
  <div className="space-y-6">
    {/* Header：返回 + 标题 + 操作按钮 */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/notices' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold">{t('detail.title')}</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* 根据状态显示不同按钮 — 保持现有逻辑 */}
      </div>
    </div>
    
    {/* 内容 Card */}
    <Card>
      <CardContent className="p-6">
        {/* 元信息区 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {notice.pinned && <Pin className="size-4 text-amber-500" />}
            <h2 className="text-xl font-semibold">{notice.title}</h2>
            <NoticeStatusBadge status={notice.status as NoticeStatusValue} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {notice.publishedBy && (
              <span>{t('detail.publishedBy')}: {notice.publishedBy}</span>
            )}
            {notice.publishedAt && (
              <span>{t('detail.publishedAt')}: {new Date(notice.publishedAt).toLocaleString()}</span>
            )}
            {!notice.publishedBy && notice.createdBy && (
              <span>{t('detail.createdBy')}: {notice.createdBy}</span>
            )}
          </div>
        </div>
        
        <Separator className="mb-6" />
        
        {/* 富文本内容 */}
        <div
          className="prose prose-sm max-w-none"
          // biome-ignore lint: 已用 DOMPurify 净化
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(notice.content ?? '') }}
        />
        
        {/* 附件列表 */}
        {notice.attachments && notice.attachments.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('form.attachments')}</h3>
              <div className="flex flex-wrap gap-2">
                {notice.attachments.map((att) => (
                  <Button
                    key={att.fileId}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(att.fileId, att.fileName)}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    {att.fileName}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    
    {/* Tab 区：接收人 + 发送记录 */}
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="recipients">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-2">
            <TabsTrigger value="recipients">{t('detail.recipientsTab')}</TabsTrigger>
            <TabsTrigger value="log">{t('detail.logTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="recipients" className="p-4">
            <RecipientsTab noticeId={noticeId} />
          </TabsContent>
          <TabsContent value="log" className="p-4">
            <NotificationLogTab noticeId={noticeId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
);
```

保留所有现有逻辑：标记已读、mutations、确认框、目标选择器。只改布局和视觉。

- [ ] 验证：

```bash
cd client && pnpm check:types && pnpm build
```

- [ ] Commit:

```bash
git add client/apps/web-admin/src/features/notice/pages/notice-detail-page.tsx
git commit -m "feat(notice): 详情页 UI 重构（Card 包裹 + 元信息区 + Header）"
```

---

## Task 5: 全量验证 + MSW mock 补全 + 最终提交

**Files:**
- Modify: `client/apps/web-admin/src/mock/handlers.ts`（补充 mock 数据字段）

**Steps:**

- [ ] 补全 MSW mock 数据以匹配新 UI 需要的字段：

```typescript
// GET /api/v1/notices 的响应需要补充字段
{
  content: [
    {
      id: 1,
      title: '系统维护通知',
      status: 1, // PUBLISHED
      priority: 'HIGH',
      pinned: true,
      publishedBy: 'admin',
      publishedAt: '2026-04-15T10:00:00+08:00',
      createdBy: 'admin',
      createdAt: '2026-04-15T09:00:00+08:00',
      readCount: 12,
      recipientCount: 20, // 之前用 totalCount，确认后端字段名
      read: false,
      startTime: '2026-04-15T10:00:00+08:00',
    },
    // ...
  ],
}
```

确保 mock 数据中的字段名与 orval 生成的 `NoticeView` 类型匹配。

- [ ] 运行全量前端质量检查：

```bash
cd client && pnpm check:types && pnpm build && pnpm lint && pnpm check:i18n
```

- [ ] 启动 dev server 视觉验证：

```bash
cd client && pnpm dev
```

打开 http://localhost:5178/notices 验证：
1. 面包屑显示
2. 标题 + 副标题 + 操作按钮
3. 筛选横排（搜索+状态+重置）
4. Card 包裹表格 + 分页栏
5. 行操作（主操作+⋯下拉）
6. 状态 Badge 颜色
7. 已读率进度条
8. 点"新建公告"打开全屏 Dialog
9. 点标题进详情页 → Card 包裹 + 元信息区

- [ ] Commit:

```bash
git add client/
git commit -m "feat(notice): UI 打磨完成 — MSW mock 补全 + 全量验证"
```

---

## 依赖关系

```
Task 1 (i18n + Badge) → Task 2 (列表页) → Task 3 (编辑弹窗) → Task 4 (详情页) → Task 5 (验证)
```

所有 Task 串行执行，因为 Task 2 引用 Task 3 创建的 `NoticeDialog`。

---

## Spec 覆盖度检查

| Spec 要求 | Task |
|-----------|------|
| 面包屑 | Task 2 |
| 标题+副标题+操作按钮 Header | Task 2 |
| 横排即时筛选（debounce） | Task 2 |
| Card 包裹表格+分页 | Task 2 |
| 分页栏（每页条数+选中统计） | Task 2 |
| 行操作 DropdownMenu | Task 2 |
| 已读率进度条 | Task 2 |
| 未读行蓝色左边框 | Task 2 |
| 状态 Badge 颜色 | Task 1 |
| 全屏 Dialog 双栏编辑 | Task 3 |
| 脏检查保留 | Task 3 |
| 详情页 Card 包裹 | Task 4 |
| 详情页元信息区 | Task 4 |
| i18n 双语完整 | Task 1 + Task 5 |
| types/build/lint 通过 | Task 5 |
