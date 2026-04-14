export type ThemeId = 'default' | 'dark' | 'compact';

export interface ThemeMeta {
  readonly id: ThemeId;
  readonly displayName: string;
  readonly description: string;
  readonly cssFile: string;
}

export const themeRegistry: readonly ThemeMeta[] = [
  {
    id: 'default',
    displayName: '默认',
    description: '中性基调，适合大部分场景',
    cssFile: './themes/default.css',
  },
  {
    id: 'dark',
    displayName: '暗色',
    description: '深色背景，适合长时间工作',
    cssFile: './themes/dark.css',
  },
  {
    id: 'compact',
    displayName: '高密度',
    description: '紧凑布局，适合数据密集场景',
    cssFile: './themes/compact.css',
  },
] as const;
