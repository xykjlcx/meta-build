/**
 * Layout Registry 的 side-effect 入口。
 *
 * 职责：导入具体 preset 组件，完成默认注册，然后全量 re-export registry-core。
 *
 * 读侧消费者（ThemeCustomizer / LayoutResolver / LayoutPresetProvider 等）
 * 应改为从 registry-core 导入，以避免 registry → preset → ThemeCustomizer → registry 的循环。
 * 本文件由应用入口（app-shell index / main.tsx）导入一次，保证默认 preset 在运行时生效。
 */
import { ClaudeClassicLayout } from '../presets/claude-classic';
import { ClaudeInsetLayout } from '../presets/claude-inset';
import { ClaudeRailLayout } from '../presets/claude-rail';
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

// Claude Design Plan A：3 个新 preset 对齐 Claude Design 的三种形态
// W7 决策：3 个新 preset 全部 supportedDimensions: []
// Claude Design 的视觉形态差异通过"切 preset"表达（claude-classic/inset/rail 各自独立），
// 不在单个 preset 内部用 sidebarMode / contentLayout 维度来调整。
// 原 inset 的 ['contentLayout', 'sidebarMode'] 保留不动。
layoutRegistry.register({
  id: 'claude-classic',
  name: 'layout.claudeClassic',
  description: 'layout.claudeClassicDesc',
  component: ClaudeClassicLayout,
  supportedDimensions: [],
});

layoutRegistry.register({
  id: 'claude-inset',
  name: 'layout.claudeInset',
  description: 'layout.claudeInsetDesc',
  component: ClaudeInsetLayout,
  supportedDimensions: [],
});

layoutRegistry.register({
  id: 'claude-rail',
  name: 'layout.claudeRail',
  description: 'layout.claudeRailDesc',
  component: ClaudeRailLayout,
  supportedDimensions: [],
});

// 全量 re-export，保持对旧 import path 的向后兼容
export { layoutRegistry, registerLayout } from './registry-core';
