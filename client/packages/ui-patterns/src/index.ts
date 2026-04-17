// L3 @mb/ui-patterns — 业务组件包

// 三态容器
export { NxLoading, type NxLoadingProps } from './nx-loading';

// 批量操作栏
export { NxBar, type NxBarProps } from './nx-bar';

// 页面标题栏
export { PageHeader, type PageHeaderProps } from './page-header';

// 数据表格（TanStack Table 封装）
export { NxTable, type NxTableProps, type NxTablePagination } from './nx-table';

// 表单（React Hook Form + Zod 封装）
export { NxForm, NxFormField, type NxFormProps, type NxFormFieldProps } from './nx-form';

// 筛选栏
export {
  NxFilter,
  NxFilterField,
  type NxFilterProps,
  type NxFilterFieldProps,
  type NxFilterValue,
} from './nx-filter';

// 抽屉表单
export { NxDrawer, type NxDrawerProps } from './nx-drawer';

// 异步下拉选择
export {
  ApiSelect,
  type ApiSelectProps,
  type ApiSelectOption,
  type ApiSelectFetchParams,
  type ApiSelectFetchResult,
} from './api-select';

// 树组件
export { NxTree, type NxTreeProps, type NxTreeNode } from './nx-tree';

// 状态徽章
export { StatusBadge, type StatusBadgeProps, type StatusTone } from './status-badge';

// 搜索输入框
export { SearchInput, type SearchInputProps } from './search-input';
