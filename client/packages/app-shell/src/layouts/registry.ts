/**
 * Layout Registry 的 side-effect 入口。
 *
 * 职责：导入具体 preset 组件，完成默认注册，然后全量 re-export registry-core。
 *
 * 读侧消费者（ThemeCustomizer / LayoutResolver / LayoutPresetProvider 等）
 * 应改为从 registry-core 导入，以避免 registry → preset → ThemeCustomizer → registry 的循环。
 * 本文件由应用入口（app-shell index / main.tsx）导入一次，保证默认 preset 在运行时生效。
 */
import { InsetLayout } from '../presets/inset';
import { MixLayout } from '../presets/mix';
import { layoutRegistry } from './registry-core';

// 默认 preset 注册（应用启动时执行一次）
layoutRegistry.register({
  id: 'inset',
  name: 'layout.inset',
  description: 'layout.insetDesc',
  component: InsetLayout,
  // Inset 布局支持内容宽度和侧栏模式两个 Customizer 维度
  supportedDimensions: ['contentLayout', 'sidebarMode'],
});

layoutRegistry.register({
  id: 'mix',
  name: 'layout.mix',
  description: 'layout.mixDesc',
  component: MixLayout,
  // Mix 布局有自己的一级 tab + 二级 sidebar，暂不消费这两个 Customizer 维度
  supportedDimensions: [],
});

// 全量 re-export，保持对旧 import path 的向后兼容
export { layoutRegistry, registerLayout } from './registry-core';
