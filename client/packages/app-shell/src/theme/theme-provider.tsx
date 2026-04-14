import { type ThemeId, applyTheme, loadTheme } from '@mb/ui-tokens';
import { type ReactNode, createContext, useCallback, useMemo, useState } from 'react';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  defaultTheme = 'default',
}: { children: ReactNode; defaultTheme?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(() => loadTheme() ?? defaultTheme);

  const setTheme = useCallback((next: ThemeId) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
