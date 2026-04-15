import { ALL_APP_PERMISSIONS } from '@mb/api-sdk';
import { http, HttpResponse } from 'msw';

// ── ProblemDetail 工厂 ──
function problemJson(status: number, title: string, detail: string) {
  return HttpResponse.json(
    { type: 'about:blank', status, title, detail },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

// ── 多层菜单树（含 BUTTON + visible:false） ──
const menuTree = [
  {
    id: 1,
    parentId: null,
    name: '系统管理',
    permissionCode: null,
    menuType: 'DIRECTORY' as const,
    icon: 'settings',
    sortOrder: 1,
    visible: true,
    children: [
      {
        id: 2,
        parentId: 1,
        name: '用户管理',
        permissionCode: 'iam:user:list',
        menuType: 'MENU' as const,
        icon: 'users',
        sortOrder: 1,
        visible: true,
        children: [
          // BUTTON 类型：页面内操作按钮权限
          {
            id: 20,
            parentId: 2,
            name: '新增用户',
            permissionCode: 'iam:user:create',
            menuType: 'BUTTON' as const,
            icon: null,
            sortOrder: 1,
            visible: true,
            children: [],
          },
          {
            id: 21,
            parentId: 2,
            name: '编辑用户',
            permissionCode: 'iam:user:update',
            menuType: 'BUTTON' as const,
            icon: null,
            sortOrder: 2,
            visible: true,
            children: [],
          },
          {
            id: 22,
            parentId: 2,
            name: '删除用户',
            permissionCode: 'iam:user:delete',
            menuType: 'BUTTON' as const,
            icon: null,
            sortOrder: 3,
            visible: true,
            children: [],
          },
        ],
      },
      {
        id: 3,
        parentId: 1,
        name: '角色管理',
        permissionCode: 'iam:role:list',
        menuType: 'MENU' as const,
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
        menuType: 'MENU' as const,
        icon: 'menu',
        sortOrder: 3,
        visible: true,
        children: [],
      },
      // visible: false — 隐藏菜单（仍可通过路由访问，但不在侧边栏显示）
      {
        id: 5,
        parentId: 1,
        name: '用户详情',
        permissionCode: 'iam:user:detail',
        menuType: 'MENU' as const,
        icon: null,
        sortOrder: 4,
        visible: false,
        children: [],
      },
    ],
  },
];

export const handlers = [
  // ── 登录 ──
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };

    // 错误场景：用户名 'error' → 401
    if (body.username === 'error') {
      return problemJson(401, 'Unauthorized', '用户名或密码错误');
    }
    // 错误场景：用户名 'locked' → 423
    if (body.username === 'locked') {
      return problemJson(423, 'Locked', '账户已被锁定，请 30 分钟后重试');
    }

    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresInSeconds: 7200,
      user: {
        userId: 1,
        username: body.username,
        deptId: 1,
        permissions: ALL_APP_PERMISSIONS,
      },
    });
  }),

  // ── 登出 ──
  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),

  // ── 刷新 token ──
  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    // 错误场景：过期的 refresh token
    if (body.refreshToken === 'expired-refresh-token') {
      return problemJson(401, 'Unauthorized', 'Refresh token 已过期');
    }

    return HttpResponse.json({
      accessToken: 'mock-refreshed-access-token',
      refreshToken: 'mock-refreshed-refresh-token',
      expiresInSeconds: 7200,
      user: {
        userId: 1,
        username: 'admin',
        deptId: 1,
        permissions: ALL_APP_PERMISSIONS,
      },
    });
  }),

  // ── 当前用户信息 ──
  http.get('/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return problemJson(401, 'Unauthorized', '未提供认证凭据');
    return HttpResponse.json({
      userId: 1,
      username: 'admin',
      deptId: 1,
      permissions: ALL_APP_PERMISSIONS,
      roles: ['admin'],
      isAdmin: true,
    });
  }),

  // ── 当前用户菜单+权限 ──
  http.get('/api/v1/menus/current-user', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return problemJson(401, 'Unauthorized', '未提供认证凭据');

    // 错误场景：X-Mock-Forbidden header → 403
    if (request.headers.get('X-Mock-Forbidden')) {
      return problemJson(403, 'Forbidden', '无权限访问');
    }

    return HttpResponse.json({
      tree: menuTree,
      permissions: ALL_APP_PERMISSIONS,
    });
  }),

  // ── 菜单树（管理页面用）──
  http.get('/api/v1/menus', () => HttpResponse.json(menuTree)),

  // ── 通知公告（mock 数据，防止 MSW 模式下穿透到后端 401） ──
  http.get('/api/v1/notices/unread-count', () => HttpResponse.json({ count: 3 })),

  http.get('/api/v1/notices', () =>
    HttpResponse.json({
      content: [
        {
          id: 1,
          title: '系统维护通知',
          status: 'PUBLISHED',
          priority: 'HIGH',
          pinned: true,
          publishedBy: 'admin',
          publishedAt: '2026-04-15T10:00:00+08:00',
          readCount: 12,
          totalCount: 20,
          read: false,
        },
        {
          id: 2,
          title: '新功能上线公告',
          status: 'PUBLISHED',
          priority: 'NORMAL',
          pinned: false,
          publishedBy: 'admin',
          publishedAt: '2026-04-14T15:30:00+08:00',
          readCount: 18,
          totalCount: 20,
          read: true,
        },
        {
          id: 3,
          title: '周末值班安排（草稿）',
          status: 'DRAFT',
          priority: 'NORMAL',
          pinned: false,
          createdBy: 'admin',
          createdAt: '2026-04-15T08:00:00+08:00',
          readCount: 0,
          totalCount: 0,
          read: false,
        },
      ],
      totalElements: 3,
      totalPages: 1,
      number: 0,
      size: 10,
    }),
  ),

  http.get('/api/v1/notices/:id', ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      title: '系统维护通知',
      content: '<p>定于 2026 年 4 月 16 日 02:00 - 06:00 进行系统维护。</p>',
      status: 'PUBLISHED',
      priority: 'HIGH',
      pinned: true,
      targetType: 'ALL',
      publishedBy: 'admin',
      publishedAt: '2026-04-15T10:00:00+08:00',
      createdBy: 'admin',
      createdAt: '2026-04-15T09:00:00+08:00',
      readCount: 12,
      totalCount: 20,
      read: true,
      attachments: [],
    }),
  ),
];
