import type { LayoutPresetDef } from './types';

/**
 * Layout Registry 核心类 + 单例。
 *
 * 故意不在此文件引入任何具体 preset（InsetLayout / MixLayout 等），
 * 以打破 registry → preset → ThemeCustomizer → registry 的循环依赖。
 *
 * 默认 preset 注册由 registry.ts（side-effect 入口）完成，
 * 应用启动时通过 import '@mb/app-shell/layouts/registry' 触发一次即可。
 */
class LayoutRegistry {
  private readonly presets = new Map<string, LayoutPresetDef>();
  private readonly defaultId: string;

  constructor(defaultId: string) {
    this.defaultId = defaultId;
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

  /** 注册一个新的布局预设，重复 id 会覆盖，返回 unregister 函数；disposer 只撤销自己注册的版本 */
  register(preset: LayoutPresetDef): () => void {
    const prev = this.presets.get(preset.id);
    this.presets.set(preset.id, preset);
    return () => {
      if (this.presets.get(preset.id) === preset) {
        if (prev) this.presets.set(preset.id, prev);
        else this.presets.delete(preset.id);
      }
    };
  }

  unregister(id: string): void {
    this.presets.delete(id);
  }

  getAllIds(): string[] {
    return Array.from(this.presets.keys());
  }
}

export const layoutRegistry = new LayoutRegistry('inset');

/**
 * 公开 API：注册一个新布局预设。
 * 使用方应在应用启动时（router 初始化前）调用。
 */
export function registerLayout(preset: LayoutPresetDef): () => void {
  return layoutRegistry.register(preset);
}
