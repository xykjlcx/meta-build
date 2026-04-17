import { use } from 'react';
import { LayoutPresetContext } from './layout-preset-context';

export function useLayoutPreset() {
  const ctx = use(LayoutPresetContext);
  if (!ctx) {
    throw new Error('useLayoutPreset must be used within LayoutPresetProvider');
  }
  return ctx;
}
