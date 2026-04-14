import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, loadTheme, type ThemeId } from '@mb/ui-tokens';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, defaultTheme = 'default' }: { children: ReactNode; defaultTheme?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(() => loadTheme() ?? defaultTheme);

  const setTheme = useCallback((next: ThemeId) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
