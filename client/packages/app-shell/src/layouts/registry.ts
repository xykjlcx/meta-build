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

  /** 注册一个新的布局预设，重复 id 会覆盖，返回 unregister 函数 */
  register(preset: LayoutPresetDef): () => void {
    this.presets.set(preset.id, preset);
    return () => {
      this.unregister(preset.id);
    };
  }

  unregister(id: string): void {
    this.presets.delete(id);
  }

  getAllIds(): string[] {
    return Array.from(this.presets.keys());
  }
}

export const layoutRegistry = new LayoutRegistry('inset', [
  {
    id: 'inset',
    name: 'layout.inset',
    description: 'layout.insetDesc',
    component: InsetLayout,
  },
  {
    id: 'module-switcher',
    name: 'layout.moduleSwitcher',
    description: 'layout.module-switcherDesc',
    component: ModuleSwitcherLayout,
  },
]);

/**
 * 公开 API：注册一个新布局预设。
 * 使用方应在应用启动时（router 初始化前）调用。
 */
export function registerLayout(preset: LayoutPresetDef): () => void {
  return layoutRegistry.register(preset);
}
