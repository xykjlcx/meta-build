import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { RouterContext } from './routes/__root';

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
  });
}

// 类型注册：让 useNavigate / Link 等获得完整类型推导
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
