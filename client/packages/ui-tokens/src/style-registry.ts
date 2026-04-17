/**
 * Style Registry —— 运行期可扩展的 style 注册表。
 *
 * P0 重构：从硬编码 union + readonly 数组，改为 Map + registerStyle API。
 * - 使用者在自己包里 `registerStyle({...})` 即可新增 style，无需修改 ui-tokens 源码
 * - 保留数组风格的兼容 API（iterator / length / map），避免破坏 check-theme-integrity、
 *   app-shell 等现有消费代码
 */

export type StyleId = string;

export interface StyleMeta {
  readonly id: StyleId;
  readonly displayName: string;
  readonly description: string;
  readonly color: string;
  readonly cssFile: string;
}

class StyleRegistry implements Iterable<StyleMeta> {
  private readonly store = new Map<string, StyleMeta>();

  /**
   * 注册一个 style。返回注销函数，HMR / 测试中可以调用。
   * 重复 id 会覆盖；disposer 只撤销自己注册的版本，不影响后来的覆盖注册。
   */
  register(meta: StyleMeta): () => void {
    const prev = this.store.get(meta.id);
    this.store.set(meta.id, meta);
    return () => {
      if (this.store.get(meta.id) === meta) {
        if (prev) this.store.set(meta.id, prev);
        else this.store.delete(meta.id);
      }
    };
  }

  get(id: string): StyleMeta | undefined {
    return this.store.get(id);
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  getAll(): StyleMeta[] {
    return Array.from(this.store.values());
  }

  getAllIds(): string[] {
    return Array.from(this.store.keys());
  }

  /** 数组长度兼容（旧代码 .length） */
  get length(): number {
    return this.store.size;
  }

  /** 数组 map 兼容（旧代码 .map(...)） */
  map<T>(fn: (meta: StyleMeta, index: number) => T): T[] {
    return this.getAll().map(fn);
  }

  /** 数组 find 兼容（旧代码 .find(...)） */
  find(fn: (meta: StyleMeta, index: number) => boolean): StyleMeta | undefined {
    return this.getAll().find(fn);
  }

  /** 数组 filter 兼容 */
  filter(fn: (meta: StyleMeta, index: number) => boolean): StyleMeta[] {
    return this.getAll().filter(fn);
  }

  /** 数组 some 兼容 */
  some(fn: (meta: StyleMeta, index: number) => boolean): boolean {
    return this.getAll().some(fn);
  }

  /** for...of 兼容 */
  [Symbol.iterator](): IterableIterator<StyleMeta> {
    return this.store.values();
  }
}

export { StyleRegistry };

export const styleRegistry = new StyleRegistry();

// 默认注册 classic style
styleRegistry.register({
  id: 'classic',
  displayName: '经典',
  description: '中性基调，适合作为管理后台默认风格',
  color: '#0f172a',
  cssFile: './tokens/semantic-classic.css',
});

// 注册 feishu style
styleRegistry.register({
  id: 'feishu',
  displayName: '飞书',
  description: '对标飞书管理后台的品牌主题（扁平 + 浅蓝激活）',
  color: '#3370ff',
  cssFile: './tokens/semantic-feishu.css',
});

/**
 * 公开 API：注册一个新 style。
 * 使用方应在应用启动时（router 初始化前）调用，以便 StyleSwitcher 能读到。
 */
export function registerStyle(meta: StyleMeta): () => void {
  return styleRegistry.register(meta);
}
