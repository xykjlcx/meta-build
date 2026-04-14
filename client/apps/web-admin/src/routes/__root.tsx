import { GlobalErrorPage, GlobalNotFoundPage } from '@mb/app-shell';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: ({ error }) => <GlobalErrorPage error={error instanceof Error ? error : null} />,
  notFoundComponent: () => <GlobalNotFoundPage />,
});
