import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { GlobalErrorPage, GlobalNotFoundPage } from '@mb/app-shell';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: ({ error }) => (
    <GlobalErrorPage error={error instanceof Error ? error : null} />
  ),
  notFoundComponent: () => <GlobalNotFoundPage />,
});
