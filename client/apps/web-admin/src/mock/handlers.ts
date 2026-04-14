import { http, HttpResponse } from 'msw';

export const handlers = [
  // 登录
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
  ),

  // 登出
  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),

  // 当前用户信息
  http.get('/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({
      userId: 1,
      username: 'admin',
      permissions: ['iam.user.list', 'iam.role.list', 'iam.menu.read', 'iam.menu.write'],
      roles: ['admin'],
      isAdmin: true,
    });
  }),

  // 当前用户菜单
  http.get('/api/v1/menu/current', () =>
    HttpResponse.json({
      tree: [
        {
          id: 1,
          parentId: null,
          name: '系统管理',
          icon: 'settings',
          path: null,
          kind: 'directory',
          permissionCode: null,
          isOrphan: false,
          children: [
            {
              id: 2,
              parentId: 1,
              name: '用户管理',
              icon: 'users',
              path: '/settings/users',
              kind: 'menu',
              permissionCode: 'iam.user.list',
              isOrphan: false,
              children: [],
            },
            {
              id: 3,
              parentId: 1,
              name: '角色管理',
              icon: 'shield',
              path: '/settings/roles',
              kind: 'menu',
              permissionCode: 'iam.role.list',
              isOrphan: false,
              children: [],
            },
            {
              id: 4,
              parentId: 1,
              name: '菜单管理',
              icon: 'menu',
              path: '/settings/menu',
              kind: 'menu',
              permissionCode: 'iam.menu.read',
              isOrphan: false,
              children: [],
            },
          ],
        },
      ],
      permissions: ['iam.user.list', 'iam.role.list', 'iam.menu.read', 'iam.menu.write'],
    }),
  ),
];
