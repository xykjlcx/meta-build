// L4 @mb/app-shell — 应用壳包

// i18n
export {
  i18n,
  I18nProvider,
  registerResource,
  useLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
} from './i18n';

// theme
export { StyleProvider, useStyle } from './theme';

// auth
export {
  useCurrentUser,
  toCurrentUser,
  useAuth,
  getAccessToken,
  requireAuth,
  ForbiddenError,
  ANONYMOUS,
  type CurrentUser,
  type RequireAuthOptions,
} from './auth';

// data
export { createQueryClient } from './data';

// menu
export { useMenu, type MenuNode, type UserMenuPayload } from './menu';

// layouts
export {
  BasicLayout,
  LayoutResolver,
  LayoutPresetProvider,
  layoutRegistry,
  useLayoutPreset,
} from './layouts';

// components
export { BreadcrumbNav, type BreadcrumbEntry } from './components/breadcrumb-nav';
export { ThemeCustomizer } from './components/theme-customizer';
export {
  NotificationBadge,
  type NotificationBadgeProps,
} from './components/notification-badge';

// error
export { GlobalErrorBoundary, GlobalErrorPage, GlobalNotFoundPage } from './error';

// feedback
export { ToastContainer, DialogContainer } from './feedback';

// sse
export { useSseConnection, useSseSubscription, sseEventBus } from './sse';
