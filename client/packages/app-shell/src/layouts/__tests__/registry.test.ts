import { describe, expect, it } from 'vitest';
import { LayoutRegistry } from '../registry-core';
import type { LayoutPresetDef } from '../types';

/** 构造最小 LayoutPresetDef stub */
function makePreset(id: string): LayoutPresetDef {
  return {
    id,
    name: `layout.${id}`,
    component: () => null as never,
  };
}

describe('LayoutRegistry 版本栈语义', () => {
  it('单次注册 + dispose → delete', () => {
    const reg = new LayoutRegistry('default');
    const p = makePreset('a');
    const dispose = reg.register(p);

    expect(reg.has('a')).toBe(true);
    dispose();
    expect(reg.has('a')).toBe(false);
  });

  it('覆盖注册 + dispose 最新 → 恢复 prev', () => {
    const reg = new LayoutRegistry('default');
    const p1 = makePreset('x');
    const p2 = { ...makePreset('x'), name: 'layout.x-v2' };

    reg.register(p1);
    const disposeP2 = reg.register(p2);

    expect(reg.get('x').name).toBe('layout.x-v2');
    disposeP2();
    expect(reg.get('x').name).toBe('layout.x');
  });

  it('A→B→C 乱序 dispose B 再 dispose C → 最终只剩 A', () => {
    const reg = new LayoutRegistry('default');
    const a = makePreset('y');
    const b = { ...makePreset('y'), name: 'layout.y-b' };
    const c = { ...makePreset('y'), name: 'layout.y-c' };

    reg.register(a);
    const disposeB = reg.register(b);
    const disposeC = reg.register(c);

    expect(reg.get('y').name).toBe('layout.y-c');

    // 乱序：先 dispose B
    disposeB();
    expect(reg.get('y').name).toBe('layout.y-c');

    // 再 dispose C → 恢复到 A
    disposeC();
    expect(reg.get('y').name).toBe('layout.y');
  });

  it('正序 dispose A→B→C 后全部清空', () => {
    const reg = new LayoutRegistry('default');
    const a = makePreset('z');
    const b = { ...makePreset('z'), name: 'layout.z-b' };
    const c = { ...makePreset('z'), name: 'layout.z-c' };

    const disposeA = reg.register(a);
    const disposeB = reg.register(b);
    const disposeC = reg.register(c);

    disposeC();
    expect(reg.get('z').name).toBe('layout.z-b');

    disposeB();
    expect(reg.get('z').name).toBe('layout.z');

    disposeA();
    expect(reg.has('z')).toBe(false);
  });

  it('重复调用同一个 disposer 不崩，不产生副作用', () => {
    const reg = new LayoutRegistry('default');
    const a = makePreset('w');
    const b = { ...makePreset('w'), name: 'layout.w-b' };

    reg.register(a);
    const disposeB = reg.register(b);

    disposeB();
    expect(reg.get('w').name).toBe('layout.w');

    // 再次调用，不应崩溃也不应修改状态
    expect(() => disposeB()).not.toThrow();
    expect(reg.get('w').name).toBe('layout.w');
  });
});
