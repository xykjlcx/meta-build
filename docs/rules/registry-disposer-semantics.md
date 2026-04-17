---
title: 注册表 disposer 必须用版本栈语义
type: pitfall
triggers: [registry, disposer, register, dispose, 注册表, 覆盖注册, 乱序, StyleRegistry, LayoutRegistry, HMR]
scope: [前端]
---

# 注册表 disposer 必须用版本栈语义

## 规则

`register()` 返回的 disposer 必须只撤销"自己注册的那个版本"，不能误删后来的覆盖。实现方式：每个 id 维护一个注册历史栈（history stack），disposer 通过引用相等从栈里移除自己，store 始终使用栈顶版本。简单的 `delete(id)` 或"当前值仍是自己才删"方案在乱序 dispose 场景下均不正确。

## Why

### 第一级错误：简单 delete

最直觉的 disposer 实现：

```typescript
// 错误 ✗ — 误删后来的覆盖注册
function register(id: string, value: T): () => void {
  store.set(id, value);
  return () => store.delete(id);  // 如果之后有人覆盖了同一个 id，这里会把那个覆盖也删掉
}
```

场景：A 注册 `id='foo'`，B 覆盖注册 `id='foo'`，A 的 disposer 执行 → `foo` 从 store 消失，B 的注册被误删。

### 第二级错误：prev + 当前值检查

第一级错误被发现后的"修复"：

```typescript
// 仍然错误 ✗ — 乱序 dispose 有幽灵状态
function register(id: string, value: T): () => void {
  const prev = store.get(id);
  store.set(id, value);
  return () => {
    if (store.get(id) === value) {
      // 只有当前值还是自己才操作
      prev ? store.set(id, prev) : store.delete(id);
    }
    // 否则静默跳过
  };
}
```

乱序场景：
1. A 注册 foo → store: `A`，A 持有 prev=undefined
2. B 覆盖 foo → store: `B`，B 持有 prev=A
3. C 覆盖 foo → store: `C`，C 持有 prev=B
4. **dispose B**（B 当前值不是自己，静默跳过）
5. **dispose C** → 当前值是 C，恢复 prev=B → store: `B`（幽灵状态，B 实际已被 dispose）

### 正确实现：版本栈

```typescript
// 正确 ✓ — 每个 id 维护历史栈
const stacks = new Map<string, Array<{ value: T; token: symbol }>>();

function register(id: string, value: T): () => void {
  const token = Symbol();  // 引用相等的身份标记
  const stack = stacks.get(id) ?? [];
  stack.push({ value, token });
  stacks.set(id, stack);
  syncStore(id, stack);  // store 使用栈顶

  return () => {
    const s = stacks.get(id);
    if (!s) return;
    const idx = s.findIndex(entry => entry.token === token);
    if (idx === -1) return;
    s.splice(idx, 1);  // 从栈里移除自己（无论在哪个位置）
    if (s.length === 0) {
      stacks.delete(id);
      store.delete(id);
    } else {
      syncStore(id, s);  // 栈顶更新
    }
  };
}
```

乱序 dispose 验证（继续上面的 A/B/C 场景）：
- dispose B → 从栈里移除 B，栈变为 `[A, C]`，store 使用 C（栈顶）
- dispose C → 从栈里移除 C，栈变为 `[A]`，store 使用 A
- dispose A → 栈清空，store 删除 foo

任意顺序 dispose，最终状态总是正确的。

**具体事件**：2026-04-17 Codex 对抗审查发现 `StyleRegistry` 和 `LayoutRegistry` 均存在"简单 delete"型 disposer 误删同名覆盖的 bug，commit `e4558b16` 做了第一级修复。同日红蓝对抗发现"prev + 当前值检查"仍有乱序场景幽灵状态，在 `registry-core.ts` 升级为栈式实现。

## How to apply

**设计新 registry 时**：

- 默认假设"会发生乱序 dispose"（HMR 模块重载、React StrictMode 双挂载、测试 cleanup 乱序均可触发）
- 不要设计"最后注册的获胜"（last-write-wins）语义，除非有充分理由并在 JSDoc 中标注
- disposer 闭包必须捕获唯一身份标记（Symbol 或 WeakRef），通过引用相等判断身份，不能靠值相等

**单元测试必须覆盖的场景**：

```typescript
it('乱序 dispose 不产生幽灵状态', () => {
  const disposeA = registry.register('foo', 'A');
  const disposeB = registry.register('foo', 'B');
  const disposeC = registry.register('foo', 'C');

  expect(registry.get('foo')).toBe('C');  // 栈顶

  disposeB();
  expect(registry.get('foo')).toBe('C');  // C 仍在

  disposeC();
  expect(registry.get('foo')).toBe('A');  // 回退到 A

  disposeA();
  expect(registry.get('foo')).toBeUndefined();  // 清空
});
```

**参考实现**：

- `client/packages/ui-tokens/src/styles/style-registry.ts`
- `client/packages/app-shell/src/layouts/registry-core.ts`

commit `e4558b16`（第一级修复）→ 当日栈式升级。
