import { InsetLayout } from '../presets/inset';
import { ModuleSwitcherLayout } from '../presets/module-switcher';
import type { LayoutPresetDef } from './types';

class LayoutRegistry {
  private readonly presets = new Map<string, LayoutPresetDef>();
  private readonly defaultId: string;

  constructor(defaultId: string, presets: LayoutPresetDef[]) {
    this.defaultId = defaultId;
    for (const preset of presets) {
      this.presets.set(preset.id, preset);
    }
  }

  private requirePreset(id: string): LayoutPresetDef {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Unknown layout preset: ${id}`);
    }
    return preset;
  }

  get(id: string | null | undefined): LayoutPresetDef {
    if (id && this.presets.has(id)) {
      return this.requirePreset(id);
    }
    return this.requirePreset(this.defaultId);
  }

  list(): LayoutPresetDef[] {
    return [...this.presets.values()];
  }

  getDefaultId(): string {
    return this.defaultId;
  }

  has(id: string | null | undefined): boolean {
    return id != null && this.presets.has(id);
  }
}

export const layoutRegistry = new LayoutRegistry('inset', [
  { id: 'inset', name: 'layout.inset', component: InsetLayout },
  {
    id: 'module-switcher',
    name: 'layout.moduleSwitcher',
    component: ModuleSwitcherLayout,
  },
]);
