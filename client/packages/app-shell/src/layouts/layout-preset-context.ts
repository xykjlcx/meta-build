import { createContext } from 'react';

export interface LayoutPresetContextValue {
  presetId: string;
  setPreset: (presetId: string) => void;
}

export const LayoutPresetContext = createContext<LayoutPresetContextValue | null>(null);
