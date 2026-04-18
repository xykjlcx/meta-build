/**
 * Style Registry —— 内部 style 注册表。
 *
 * 扩展新 style 的唯一官方方式（见 docs/specs/frontend/02-ui-tokens-theme.md）：
 * 1. 在 packages/ui-tokens/src/tokens/semantic-<id>.css 定义 54 × 2 mode 的 token 覆写
 * 2. 在 packages/ui-tokens/src/styles/index.css 追加 @import
 * 3. 在本文件里 styleRegistry.register({...}) 追加注册
 *
 * 三步必须同步，缺一即为扩展契约断裂（UI 可选但视觉不变）。
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
  /** 版本栈：记录每个 id 的注册历史，支持乱序 dispose */
  private readonly history = new Map<string, StyleMeta[]>();

  /**
   * 注册一个 style。返回注销函数，HMR / 测试中可以调用。
   * 采用版本栈语义：乱序 dispose 时自动从栈中移除该版本，
   * 栈顶始终是当前生效版本，全部 dispose 后自动删除。
   */
  register(meta: StyleMeta): () => void {
    const stack = this.history.get(meta.id) ?? [];
    stack.push(meta);
    this.history.set(meta.id, stack);
    this.store.set(meta.id, meta);
    return () => {
      const s = this.history.get(meta.id);
      if (!s) return;
      const idx = s.lastIndexOf(meta);
      if (idx === -1) return;
      s.splice(idx, 1);
      if (s.length === 0) {
        this.history.delete(meta.id);
        this.store.delete(meta.id);
      } else {
        this.store.set(meta.id, s[s.length - 1] as StyleMeta);
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

// 注册 lark-console style（完整"飞书管理后台"风格，含 shell 骨架配合）
styleRegistry.register({
  id: 'lark-console',
  displayName: '飞书控制台',
  description: '完整对齐飞书管理后台的品牌风格（扁平 + 浅蓝激活 + 精确控件节奏）',
  color: '#3370ff',
  cssFile: './tokens/semantic-lark-console.css',
});

// 注册 claude-warm style（对齐 Anthropic Claude Design，Plan A 默认）
styleRegistry.register({
  id: 'claude-warm',
  displayName: 'Claude 暖色',
  description: '对齐 Anthropic Claude Design 的暖米白 + 暖橙品牌色',
  color: '#d97a3f',
  cssFile: './tokens/semantic-claude-warm.css',
});
