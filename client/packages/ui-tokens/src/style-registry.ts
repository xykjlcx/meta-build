export type StyleId = 'classic';

export interface StyleMeta {
  readonly id: StyleId;
  readonly displayName: string;
  readonly description: string;
  readonly color: string;
  readonly cssFile: string;
}

export const styleRegistry: readonly StyleMeta[] = [
  {
    id: 'classic',
    displayName: '经典',
    description: '中性基调，适合作为管理后台默认风格',
    color: '#0f172a',
    cssFile: './styles/classic.css',
  },
] as const;
