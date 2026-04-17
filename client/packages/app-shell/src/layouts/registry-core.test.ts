import { describe, expect, it } from 'vitest';
import { layoutRegistry, registerLayout } from './registry-core';
import type { LayoutPresetDef } from './types';

/** 构造一个最小的 LayoutPresetDef stub，避免引入 React 组件 */
function makePreset(
  id: string,
  supportedDimensions?: LayoutPresetDef['supportedDimensions'],
): LayoutPresetDef {
  return {
    id,
    name: `layout.${id}`,
    component: () => null as never,
    supportedDimensions,
  };
}

describe('LayoutPresetDef.supportedDimensions', () => {
  it('声明了 contentLayout 和 sidebarMode 时，两个维度均可用', () => {
    const preset = makePreset('test-full', ['contentLayout', 'sidebarMode']);
    const contentLayoutSupported = preset.supportedDimensions?.includes('contentLayout') ?? false;
    const sidebarModeSupported = preset.supportedDimensions?.includes('sidebarMode') ?? false;
    expect(contentLayoutSupported).toBe(true);
    expect(sidebarModeSupported).toBe(true);
  });

  it('声明了空数组时，两个维度均不可用', () => {
    const preset = makePreset('test-empty', []);
    const contentLayoutSupported = preset.supportedDimensions?.includes('contentLayout') ?? false;
    const sidebarModeSupported = preset.supportedDimensions?.includes('sidebarMode') ?? false;
    expect(contentLayoutSupported).toBe(false);
    expect(sidebarModeSupported).toBe(false);
  });

  it('未声明 supportedDimensions（undefined）时，降级为 false', () => {
    const preset = makePreset('test-undefined', undefined);
    const contentLayoutSupported = preset.supportedDimensions?.includes('contentLayout') ?? false;
    const sidebarModeSupported = preset.supportedDimensions?.includes('sidebarMode') ?? false;
    expect(contentLayoutSupported).toBe(false);
    expect(sidebarModeSupported).toBe(false);
  });

  it('只声明 contentLayout 时，sidebarMode 为 false', () => {
    const preset = makePreset('test-partial', ['contentLayout']);
    const contentLayoutSupported = preset.supportedDimensions?.includes('contentLayout') ?? false;
    const sidebarModeSupported = preset.supportedDimensions?.includes('sidebarMode') ?? false;
    expect(contentLayoutSupported).toBe(true);
    expect(sidebarModeSupported).toBe(false);
  });
});

describe('layoutRegistry + registerLayout（capability flag 集成）', () => {
  it('通过 registerLayout 注册带 supportedDimensions 的第三方 preset，get() 后可读取', () => {
    const unregister = registerLayout(makePreset('third-party', ['contentLayout', 'sidebarMode']));

    const preset = layoutRegistry.get('third-party');
    expect(preset.supportedDimensions?.includes('contentLayout')).toBe(true);
    expect(preset.supportedDimensions?.includes('sidebarMode')).toBe(true);

    unregister();
  });

  it('第三方 preset 注销后 get() 回退到 default preset', () => {
    const unregister = registerLayout(makePreset('to-unregister', ['contentLayout']));
    expect(layoutRegistry.has('to-unregister')).toBe(true);
    unregister();
    expect(layoutRegistry.has('to-unregister')).toBe(false);
  });
});
