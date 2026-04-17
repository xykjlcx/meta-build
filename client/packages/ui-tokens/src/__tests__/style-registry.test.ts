import { beforeEach, describe, expect, it } from 'vitest';
import { StyleRegistry } from '../style-registry';
import type { StyleMeta } from '../style-registry';

/** 构造最小 StyleMeta stub */
function makeMeta(id: string): StyleMeta {
  return { id, displayName: id, description: '', color: '#000', cssFile: '' };
}

describe('StyleRegistry 版本栈语义', () => {
  let reg: StyleRegistry;

  beforeEach(() => {
    reg = new StyleRegistry();
  });

  it('单次注册 + dispose → delete', () => {
    const a = makeMeta('a');
    const disposeA = reg.register(a);
    expect(reg.has('a')).toBe(true);

    disposeA();
    expect(reg.has('a')).toBe(false);
  });

  it('覆盖注册 + dispose 最新 → 恢复 prev', () => {
    const a1 = makeMeta('x');
    const a2 = { ...makeMeta('x'), displayName: 'x-v2' };
    reg.register(a1);
    const disposeA2 = reg.register(a2);

    expect(reg.get('x')?.displayName).toBe('x-v2');
    disposeA2();
    expect(reg.get('x')?.displayName).toBe('x');
  });

  it('A→B→C 乱序 dispose B 再 dispose C → 最终只剩 A', () => {
    const a = makeMeta('y');
    const b = { ...makeMeta('y'), displayName: 'y-b' };
    const c = { ...makeMeta('y'), displayName: 'y-c' };

    reg.register(a);
    const disposeB = reg.register(b);
    const disposeC = reg.register(c);

    // 当前是 C
    expect(reg.get('y')?.displayName).toBe('y-c');

    // 乱序：先 dispose B
    disposeB();
    // C 仍然是栈顶
    expect(reg.get('y')?.displayName).toBe('y-c');

    // 再 dispose C → 恢复到 A（B 已经从栈中被移除）
    disposeC();
    expect(reg.get('y')?.displayName).toBe('y');
  });

  it('正序 dispose A→B→C 后全部清空', () => {
    const a = makeMeta('z');
    const b = { ...makeMeta('z'), displayName: 'z-b' };
    const c = { ...makeMeta('z'), displayName: 'z-c' };

    const disposeA = reg.register(a);
    const disposeB = reg.register(b);
    const disposeC = reg.register(c);

    disposeC();
    expect(reg.get('z')?.displayName).toBe('z-b');

    disposeB();
    expect(reg.get('z')?.displayName).toBe('z');

    disposeA();
    expect(reg.has('z')).toBe(false);
  });

  it('重复调用同一个 disposer 不崩，不产生副作用', () => {
    const a = makeMeta('w');
    const b = { ...makeMeta('w'), displayName: 'w-b' };

    reg.register(a);
    const disposeB = reg.register(b);

    disposeB();
    expect(reg.get('w')?.displayName).toBe('w');

    // 再次调用，不应崩溃也不应修改状态
    expect(() => disposeB()).not.toThrow();
    expect(reg.get('w')?.displayName).toBe('w');
  });
});
