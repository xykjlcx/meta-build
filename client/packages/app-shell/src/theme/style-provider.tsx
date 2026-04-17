import { type StyleId, styleRegistry } from '@mb/ui-tokens';
import { type ReactNode, createContext, useEffect, useMemo, useState } from 'react';

export type ColorMode = 'light' | 'dark';
export type ThemeScale = 'default' | 'xs' | 'lg';
export type ThemeRadius = 'default' | 'none' | 'sm' | 'md' | 'lg' | 'xl';
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
const SCALE_IDS = new Set<ThemeScale>(['default', 'xs', 'lg']);
const RADIUS_IDS = new Set<ThemeRadius>(['default', 'none', 'sm', 'md', 'lg', 'xl']);
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
      scale: 'xs',
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
    const storedScale = window.localStorage.getItem(SCALE_KEY);
    const storedRadius = window.localStorage.getItem(RADIUS_KEY);
    const storedContentLayout = window.localStorage.getItem(CONTENT_LAYOUT_KEY);
    const storedSidebarMode = window.localStorage.getItem(SIDEBAR_MODE_KEY);

    return {
      styleId: storedStyle,
      colorMode: storedMode === 'dark' ? 'dark' : 'light',
      scale: isThemeScale(storedScale) ? storedScale : 'default',
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
  const attrScale = document.body.dataset.themeScale;
  const attrRadius = document.body.dataset.themeRadius;
  const attrContentLayout = document.body.dataset.themeContentLayout;
  const attrSidebarMode = document.body.dataset.themeSidebarMode;

  return {
    styleId: attrStyle,
    colorMode: attrMode === 'dark' ? 'dark' : 'light',
    scale: isThemeScale(attrScale) ? attrScale : 'default',
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

export function StyleProvider({
  children,
  defaultStyle = 'classic',
  defaultColorMode = 'light',
}: {
  children: ReactNode;
  defaultStyle?: StyleId;
  defaultColorMode?: ColorMode;
}) {
  const defaultState = useMemo(
    () => createDefaultState(defaultStyle, defaultColorMode),
    [defaultColorMode, defaultStyle],
  );
  const [state, setState] = useState<ThemeState>(() =>
    readInitialState(defaultStyle, defaultColorMode),
  );

  useEffect(() => {
    applyState(state);
  }, [state]);

  const styleValue = useMemo<StyleContextValue>(
    () => ({
      styleId: state.styleId,
      setStyle: (styleId) => {
        setState((prev) => ({ ...prev, styleId }));
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
