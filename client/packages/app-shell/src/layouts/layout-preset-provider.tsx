import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutPresetContext, type LayoutPresetContextValue } from './layout-preset-context';
import { layoutRegistry } from './registry-core';

const STORAGE_KEY = 'mb_layout_preset';

function loadPresetId(): string {
  if (typeof window === 'undefined') {
    return layoutRegistry.getDefaultId();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && layoutRegistry.has(stored)) {
      return stored;
    }
  } catch {
    // ignore localStorage 读取失败
  }

  return layoutRegistry.getDefaultId();
}

export function LayoutPresetProvider({ children }: { children: ReactNode }) {
  const [presetId, setPresetId] = useState<string>(loadPresetId);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, presetId);
    } catch {
      // ignore localStorage 写失败
    }
  }, [presetId]);

  const value = useMemo<LayoutPresetContextValue>(
    () => ({
      presetId,
      setPreset: (nextId) => {
        setPresetId(layoutRegistry.get(nextId).id);
      },
    }),
    [presetId],
  );

  return <LayoutPresetContext.Provider value={value}>{children}</LayoutPresetContext.Provider>;
}
