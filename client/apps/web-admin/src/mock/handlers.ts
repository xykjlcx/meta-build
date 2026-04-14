import { http, HttpResponse } from 'msw';

export const handlers = [
  // 登录 — 返回 LoginView 结构
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresInSeconds: 7200,
      user: {
        userId: 1,
        username: 'admin',
        deptId: 1,
        permissions: [
          'iam:user:list',
          'iam:user:detail',
          'iam:user:create',
          'iam:user:update',
          'iam:user:delete',
          'iam:role:list',
          'iam:menu:list',
          'iam:menu:detail',
          'iam:menu:create',
          'iam:menu:delete',
        ],
      },
    }),
  ),

  // 登出
  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),

  // 刷新 token — 返回 LoginView 结构
  http.post('/api/v1/auth/refresh', () =>
    HttpResponse.json({
      accessToken: 'mock-refreshed-access-token',
      refreshToken: 'mock-refreshed-refresh-token',
      expiresInSeconds: 7200,
      user: {
        userId: 1,
        username: 'admin',
        deptId: 1,
        permissions: [
          'iam:user:list',
          'iam:user:detail',
          'iam:user:create',
          'iam:user:update',
          'iam:user:delete',
          'iam:role:list',
          'iam:menu:list',
          'iam:menu:detail',
          'iam:menu:create',
          'iam:menu:delete',
        ],
      },
    }),
  ),

  // 当前用户信息 — GET /auth/me
  http.get('/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({
      userId: 1,
      username: 'admin',
      deptId: 1,
      permissions: [
        'iam:user:list', 'iam:user:detail', 'iam:user:create', 'iam:user:update', 'iam:user:delete',
        'iam:role:list', 'iam:menu:list', 'iam:menu:detail', 'iam:menu:create', 'iam:menu:delete',
      ],
      roles: ['admin'],
      isAdmin: true,
    });
  }),

  // 当前用户菜单+权限 — GET /menus/current-user
  http.get('/api/v1/menus/current-user', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({
      tree: [
      {
        id: 1,
        parentId: null,
        name: '系统管理',
        permissionCode: null,
        menuType: 'DIRECTORY',
        icon: 'settings',
        sortOrder: 1,
        visible: true,
        children: [
          {
            id: 2,
            parentId: 1,
            name: '用户管理',
            permissionCode: 'iam:user:list',
            menuType: 'MENU',
            icon: 'users',
            sortOrder: 1,
            visible: true,
            children: [],
          },
          {
            id: 3,
            parentId: 1,
            name: '角色管理',
            permissionCode: 'iam:role:list',
            menuType: 'MENU',
            icon: 'shield',
            sortOrder: 2,
            visible: true,
            children: [],
          },
          {
            id: 4,
            parentId: 1,
            name: '菜单管理',
            permissionCode: 'iam:menu:list',
            menuType: 'MENU',
            icon: 'menu',
            sortOrder: 3,
            visible: true,
            children: [],
          },
        ],
      },
      ],
      permissions: [
        'iam:user:list', 'iam:user:detail', 'iam:user:create', 'iam:user:update', 'iam:user:delete',
        'iam:role:list', 'iam:menu:list', 'iam:menu:detail', 'iam:menu:create', 'iam:menu:delete',
      ],
    });
  }),

  // 菜单树（管理页面用）— GET /menus
  http.get('/api/v1/menus', () =>
    HttpResponse.json([
      {
        id: 1, parentId: null, name: '系统管理', permissionCode: null,
        menuType: 'DIRECTORY', icon: 'settings', sortOrder: 1, visible: true,
        children: [
          { id: 2, parentId: 1, name: '用户管理', permissionCode: 'iam:user:list', menuType: 'MENU', icon: 'users', sortOrder: 1, visible: true, children: [] },
          { id: 3, parentId: 1, name: '角色管理', permissionCode: 'iam:role:list', menuType: 'MENU', icon: 'shield', sortOrder: 2, visible: true, children: [] },
          { id: 4, parentId: 1, name: '菜单管理', permissionCode: 'iam:menu:list', menuType: 'MENU', icon: 'menu', sortOrder: 3, visible: true, children: [] },
        ],
      },
    ]),
  ),
];
