import { type StyleId, styleRegistry } from '@mb/ui-tokens';
import { type ReactNode, createContext, useEffect, useMemo, useState } from 'react';

export type ColorMode = 'light' | 'dark';
export type ThemeScale = 'default' | 'compact' | 'comfortable';
export type ThemeRadius = 'default' | 'sm' | 'md' | 'lg' | 'xl';
export type ContentLayout = 'default' | 'centered';
export type SidebarMode = 'default' | 'icon';
type LegacyThemeId = 'default' | 'dark' | 'compact';

const LEGACY_THEME_KEY = 'mb-theme';
const STYLE_KEY = 'mb_style';
const COLOR_MODE_KEY = 'mb_color_mode';
const SCALE_KEY = 'mb_scale';
const RADIUS_KEY = 'mb_radius';
const CONTENT_LAYOUT_KEY = 'mb_content_layout';
const SIDEBAR_MODE_KEY = 'mb_sidebar_mode';

function getValidStyleIds(): Set<string> {
  return new Set(styleRegistry.getAllIds());
}
const SCALE_IDS = new Set<ThemeScale>(['default', 'compact', 'comfortable']);
const RADIUS_IDS = new Set<ThemeRadius>(['default', 'sm', 'md', 'lg', 'xl']);
const CONTENT_LAYOUT_IDS = new Set<ContentLayout>(['default', 'centered']);
const SIDEBAR_MODE_IDS = new Set<SidebarMode>(['default', 'icon']);

interface StyleContextValue {
  styleId: StyleId;
  setStyle: (styleId: StyleId) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  scale: ThemeScale;
  setScale: (scale: ThemeScale) => void;
  radius: ThemeRadius;
  setRadius: (radius: ThemeRadius) => void;
  contentLayout: ContentLayout;
  setContentLayout: (contentLayout: ContentLayout) => void;
  sidebarMode: SidebarMode;
  setSidebarMode: (sidebarMode: SidebarMode) => void;
  resetCustomizer: () => void;
}

interface ThemeState {
  styleId: StyleId;
  colorMode: ColorMode;
  scale: ThemeScale;
  radius: ThemeRadius;
  contentLayout: ContentLayout;
  sidebarMode: SidebarMode;
}

export const StyleContext = createContext<StyleContextValue | null>(null);

function isStyleId(value: string | null | undefined): value is StyleId {
  return value != null && getValidStyleIds().has(value);
}

function isThemeScale(value: string | null | undefined): value is ThemeScale {
  return value != null && SCALE_IDS.has(value as ThemeScale);
}

function isThemeRadius(value: string | null | undefined): value is ThemeRadius {
  return value != null && RADIUS_IDS.has(value as ThemeRadius);
}

function isContentLayout(value: string | null | undefined): value is ContentLayout {
  return value != null && CONTENT_LAYOUT_IDS.has(value as ContentLayout);
}

function isSidebarMode(value: string | null | undefined): value is SidebarMode {
  return value != null && SIDEBAR_MODE_IDS.has(value as SidebarMode);
}

/**
 * 将旧版密度值映射到新命名（Plan A Task 8：xs → compact, lg → comfortable）。
 * 只处理字符串级别的迁移，不在这里做合法性校验（交给 isThemeScale）。
 */
function migrateScale(raw: string | null): string | null {
  if (raw === 'xs') return 'compact';
  if (raw === 'lg') return 'comfortable';
  return raw;
}

function mapLegacyThemeToState(theme: LegacyThemeId): ThemeState {
  if (theme === 'dark') {
    return {
      styleId: 'classic',
      colorMode: 'dark',
      scale: 'default',
      radius: 'default',
      contentLayout: 'default',
      sidebarMode: 'default',
    };
  }
  if (theme === 'compact') {
    return {
      styleId: 'classic',
      colorMode: 'light',
      scale: 'compact',
      radius: 'sm',
      contentLayout: 'default',
      sidebarMode: 'default',
    };
  }
  return {
    styleId: 'classic',
    colorMode: 'light',
    scale: 'default',
    radius: 'default',
    contentLayout: 'default',
    sidebarMode: 'default',
  };
}

function createDefaultState(defaultStyle: StyleId, defaultColorMode: ColorMode): ThemeState {
  return {
    styleId: defaultStyle,
    colorMode: defaultColorMode,
    scale: 'default',
    radius: 'default',
    contentLayout: 'default',
    sidebarMode: 'default',
  } satisfies ThemeState;
}

function readStateFromStorage(): ThemeState | null {
  const storedStyle = window.localStorage.getItem(STYLE_KEY);
  if (isStyleId(storedStyle)) {
    const storedMode = window.localStorage.getItem(COLOR_MODE_KEY);
    const rawScale = window.localStorage.getItem(SCALE_KEY);
    const migratedScale = migrateScale(rawScale);
    // 如果发生了 legacy → 新命名的迁移，立刻回写 localStorage 防止下次再走迁移路径
    if (migratedScale !== rawScale && migratedScale != null) {
      try {
        window.localStorage.setItem(SCALE_KEY, migratedScale);
      } catch {
        // ignore localStorage 写失败
      }
    }
    const storedRadius = window.localStorage.getItem(RADIUS_KEY);
    const storedContentLayout = window.localStorage.getItem(CONTENT_LAYOUT_KEY);
    const storedSidebarMode = window.localStorage.getItem(SIDEBAR_MODE_KEY);

    return {
      styleId: storedStyle,
      colorMode: storedMode === 'dark' ? 'dark' : 'light',
      scale: isThemeScale(migratedScale) ? migratedScale : 'default',
      radius: isThemeRadius(storedRadius) ? storedRadius : 'default',
      contentLayout: isContentLayout(storedContentLayout) ? storedContentLayout : 'default',
      sidebarMode: isSidebarMode(storedSidebarMode) ? storedSidebarMode : 'default',
    };
  }

  const storedTheme = window.localStorage.getItem(LEGACY_THEME_KEY) as LegacyThemeId | null;
  if (storedTheme === 'default' || storedTheme === 'dark' || storedTheme === 'compact') {
    return mapLegacyThemeToState(storedTheme);
  }

  return null;
}

function readStateFromDom(): ThemeState | null {
  const attrStyle = document.documentElement.dataset.themeStyle;
  if (!isStyleId(attrStyle)) {
    return null;
  }

  const attrMode = document.documentElement.dataset.themeColorMode;
  const rawAttrScale = document.body.dataset.themeScale ?? null;
  const migratedAttrScale = migrateScale(rawAttrScale);
  // 如果 DOM 上残留 legacy 值，立刻改写 dataset 保持 SSR / 刷新瞬间一致
  if (migratedAttrScale !== rawAttrScale && migratedAttrScale != null) {
    document.body.dataset.themeScale = migratedAttrScale;
  }
  const attrRadius = document.body.dataset.themeRadius;
  const attrContentLayout = document.body.dataset.themeContentLayout;
  const attrSidebarMode = document.body.dataset.themeSidebarMode;

  return {
    styleId: attrStyle,
    colorMode: attrMode === 'dark' ? 'dark' : 'light',
    scale: isThemeScale(migratedAttrScale) ? migratedAttrScale : 'default',
    radius: isThemeRadius(attrRadius) ? attrRadius : 'default',
    contentLayout: isContentLayout(attrContentLayout) ? attrContentLayout : 'default',
    sidebarMode: isSidebarMode(attrSidebarMode) ? attrSidebarMode : 'default',
  };
}

function readInitialState(defaultStyle: StyleId, defaultColorMode: ColorMode): ThemeState {
  const fallbackState = createDefaultState(defaultStyle, defaultColorMode);

  if (typeof window === 'undefined') {
    return fallbackState;
  }

  try {
    const storedState = readStateFromStorage();
    if (storedState) {
      return storedState;
    }
  } catch {
    // ignore localStorage 读取失败
  }

  return readStateFromDom() ?? fallbackState;
}

function applyBodyAttrs(body: HTMLElement, state: ThemeState): void {
  if (state.scale !== 'default') {
    body.dataset.themeScale = state.scale;
  } else {
    delete body.dataset.themeScale;
  }

  if (state.radius !== 'default') {
    body.dataset.themeRadius = state.radius;
  } else {
    delete body.dataset.themeRadius;
  }

  if (state.contentLayout !== 'default') {
    body.dataset.themeContentLayout = state.contentLayout;
  } else {
    delete body.dataset.themeContentLayout;
  }

  if (state.sidebarMode !== 'default') {
    body.dataset.themeSidebarMode = state.sidebarMode;
  } else {
    delete body.dataset.themeSidebarMode;
  }
}

function persistState(state: ThemeState): void {
  window.localStorage.setItem(STYLE_KEY, state.styleId);
  if (state.colorMode === 'dark') {
    window.localStorage.setItem(COLOR_MODE_KEY, state.colorMode);
  } else {
    window.localStorage.removeItem(COLOR_MODE_KEY);
  }

  if (state.scale !== 'default') {
    window.localStorage.setItem(SCALE_KEY, state.scale);
  } else {
    window.localStorage.removeItem(SCALE_KEY);
  }

  if (state.radius !== 'default') {
    window.localStorage.setItem(RADIUS_KEY, state.radius);
  } else {
    window.localStorage.removeItem(RADIUS_KEY);
  }

  if (state.contentLayout !== 'default') {
    window.localStorage.setItem(CONTENT_LAYOUT_KEY, state.contentLayout);
  } else {
    window.localStorage.removeItem(CONTENT_LAYOUT_KEY);
  }

  if (state.sidebarMode !== 'default') {
    window.localStorage.setItem(SIDEBAR_MODE_KEY, state.sidebarMode);
  } else {
    window.localStorage.removeItem(SIDEBAR_MODE_KEY);
  }

  // Phase B 起停止写入旧 mb-theme key，只做一次性迁移清理。
  window.localStorage.removeItem(LEGACY_THEME_KEY);
}

function applyState(state: ThemeState): void {
  const root = document.documentElement;
  const body = document.body;
  root.dataset.themeStyle = state.styleId;
  if (state.colorMode === 'dark') {
    root.dataset.themeColorMode = 'dark';
  } else {
    delete root.dataset.themeColorMode;
  }

  applyBodyAttrs(body, state);

  try {
    persistState(state);
  } catch {
    // ignore localStorage 写失败
  }
}

/** 非法 id 归一化：返回合法的 styleId，无效值回落到 'claude-warm'（Plan A 默认） */
export function normalizeStyleId(id: StyleId): StyleId {
  return styleRegistry.has(id) ? id : 'claude-warm';
}

export function StyleProvider({
  children,
  defaultStyle = 'claude-warm',
  defaultColorMode = 'light',
}: {
  children: ReactNode;
  defaultStyle?: StyleId;
  defaultColorMode?: ColorMode;
}) {
  // defaultStyle 如果非法归一化到 'claude-warm'（Plan A 默认兜底）
  const safeDefaultStyle = normalizeStyleId(defaultStyle);
  const defaultState = useMemo(
    () => createDefaultState(safeDefaultStyle, defaultColorMode),
    [defaultColorMode, safeDefaultStyle],
  );
  const [state, setState] = useState<ThemeState>(() =>
    readInitialState(safeDefaultStyle, defaultColorMode),
  );

  useEffect(() => {
    applyState(state);
  }, [state]);

  const styleValue = useMemo<StyleContextValue>(
    () => ({
      styleId: state.styleId,
      setStyle: (styleId) => {
        // 非法 id 归一化到 'claude-warm'（Plan A 默认兜底），防止外部 JS 或 AI 注入无效值（M2 修复 + Plan A 更新）
        setState((prev) => ({ ...prev, styleId: normalizeStyleId(styleId) }));
      },
      colorMode: state.colorMode,
      setColorMode: (colorMode) => {
        setState((prev) => ({ ...prev, colorMode }));
      },
      scale: state.scale,
      setScale: (scale) => {
        setState((prev) => ({ ...prev, scale }));
      },
      radius: state.radius,
      setRadius: (radius) => {
        setState((prev) => ({ ...prev, radius }));
      },
      contentLayout: state.contentLayout,
      setContentLayout: (contentLayout) => {
        setState((prev) => ({ ...prev, contentLayout }));
      },
      sidebarMode: state.sidebarMode,
      setSidebarMode: (sidebarMode) => {
        setState((prev) => ({ ...prev, sidebarMode }));
      },
      resetCustomizer: () => {
        setState(defaultState);
      },
    }),
    [
      defaultState,
      state.colorMode,
      state.contentLayout,
      state.radius,
      state.scale,
      state.sidebarMode,
      state.styleId,
    ],
  );

  return <StyleContext.Provider value={styleValue}>{children}</StyleContext.Provider>;
}
