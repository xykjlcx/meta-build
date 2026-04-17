import { ALL_APP_PERMISSIONS } from '@mb/api-sdk';
import { http, HttpResponse } from 'msw';

interface NoticeRecipient {
  userId: number;
  username: string;
  readAt?: string;
}

interface NoticeAttachment {
  fileId: number;
  sortOrder: number;
}

interface NoticeTarget {
  targetType: string;
  targetId: number | null;
}

interface NoticeRecord {
  id: number;
  title: string;
  content: string;
  status: number;
  pinned: boolean;
  startTime?: string;
  endTime?: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  read: boolean;
  readCount: number;
  recipientCount: number;
  attachments: NoticeAttachment[];
  targets: NoticeTarget[];
  recipients: NoticeRecipient[];
}

// ── ProblemDetail 工厂 ──
function problemJson(status: number, title: string, detail: string) {
  return HttpResponse.json(
    { type: 'about:blank', status, title, detail },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function createInitialNotices(): NoticeRecord[] {
  return [
    {
      id: 1,
      title: '系统维护通知',
      content:
        '<p>定于 2026 年 4 月 16 日 02:00 - 06:00 进行系统维护。届时系统将暂停服务，请提前做好准备。</p><p>维护内容：数据库升级、安全补丁更新。</p>',
      status: 1,
      pinned: true,
      startTime: '2026-04-15T10:00:00+08:00',
      endTime: '2026-04-30T23:59:59+08:00',
      createdByName: 'admin',
      createdAt: '2026-04-15T09:00:00+08:00',
      updatedAt: '2026-04-15T10:00:00+08:00',
      version: 1,
      read: false,
      readCount: 12,
      recipientCount: 20,
      attachments: [
        { fileId: 101, sortOrder: 1 },
        { fileId: 102, sortOrder: 2 },
      ],
      targets: [{ targetType: 'ALL', targetId: null }],
      recipients: [
        { userId: 1, username: 'admin', readAt: '2026-04-15T10:05:00+08:00' },
        { userId: 2, username: 'alice' },
      ],
    },
    {
      id: 2,
      title: '新功能上线公告',
      content: '<p>新版订单中心已上线，请大家尽快熟悉。</p>',
      status: 1,
      pinned: false,
      startTime: '2026-04-14T15:30:00+08:00',
      endTime: '2026-04-28T23:59:59+08:00',
      createdByName: 'admin',
      createdAt: '2026-04-14T14:00:00+08:00',
      updatedAt: '2026-04-14T15:30:00+08:00',
      version: 1,
      read: true,
      readCount: 18,
      recipientCount: 20,
      attachments: [],
      targets: [{ targetType: 'ALL', targetId: null }],
      recipients: [{ userId: 1, username: 'admin', readAt: '2026-04-14T16:00:00+08:00' }],
    },
    {
      id: 3,
      title: '周末值班安排（草稿）',
      content: '<p>本周末值班安排待确认。</p>',
      status: 0,
      pinned: false,
      createdByName: 'admin',
      createdAt: '2026-04-15T08:00:00+08:00',
      updatedAt: '2026-04-15T08:00:00+08:00',
      version: 1,
      read: false,
      readCount: 0,
      recipientCount: 0,
      attachments: [],
      targets: [],
      recipients: [],
    },
  ];
}

let noticeStore = createInitialNotices();
let nextNoticeId = 100;
let nextFileId = 500;
let wechatBindings = [
  {
    id: 1,
    platform: 'MP',
    appId: 'mock-mp-app-id',
    openId: 'mock-open-id',
    nickname: 'Meta Build Bot',
    avatarUrl: '',
    boundAt: '2026-04-15T10:00:00+08:00',
  },
];

function resetMockState() {
  noticeStore = createInitialNotices();
  nextNoticeId = 100;
  nextFileId = 500;
}

function cloneNotice(notice: NoticeRecord) {
  return JSON.parse(JSON.stringify(notice)) as NoticeRecord;
}

function toNoticeListItem(notice: NoticeRecord) {
  return {
    id: notice.id,
    title: notice.title,
    status: notice.status,
    pinned: notice.pinned,
    startTime: notice.startTime,
    endTime: notice.endTime,
    createdByName: notice.createdByName,
    createdAt: notice.createdAt,
    updatedAt: notice.updatedAt,
    read: notice.read,
    readCount: notice.readCount,
    recipientCount: notice.recipientCount,
  };
}

function findNotice(id: number) {
  return noticeStore.find((notice) => notice.id === id);
}

function createRecipients(targets: NoticeTarget[]): NoticeRecipient[] {
  if (targets.some((target) => target.targetType === 'ALL')) {
    return [
      { userId: 1, username: 'admin' },
      { userId: 2, username: 'alice' },
      { userId: 3, username: 'bob' },
    ];
  }

  return targets.map((target, index) => ({
    userId: target.targetId ?? index + 10,
    username: `user-${target.targetId ?? index + 10}`,
  }));
}

function withUpdatedTimestamp(notice: NoticeRecord) {
  notice.updatedAt = '2026-04-15T14:30:00+08:00';
  notice.version += 1;
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
        ],
      },
      {
        id: 30,
        parentId: 1,
        name: '通知公告',
        permissionCode: 'notice:notice:list',
        menuType: 'MENU' as const,
        icon: 'bell',
        sortOrder: 2,
        visible: true,
        children: [],
      },
      {
        id: 31,
        parentId: 1,
        name: '微信绑定',
        permissionCode: null,
        menuType: 'MENU' as const,
        icon: 'link',
        sortOrder: 3,
        visible: true,
        children: [],
      },
      // ── 以下为临时 mock 数据，用于演示飞书 sidebar 父子菜单效果（2026-04-18）──
      {
        id: 40,
        parentId: 1,
        name: '组织架构',
        permissionCode: null,
        menuType: 'DIRECTORY' as const,
        icon: 'folder',
        sortOrder: 4,
        visible: true,
        children: [
          {
            id: 41,
            parentId: 40,
            name: '部门管理',
            permissionCode: null,
            menuType: 'MENU' as const,
            icon: null,
            sortOrder: 1,
            visible: true,
            children: [],
          },
          {
            id: 42,
            parentId: 40,
            name: '角色管理',
            permissionCode: null,
            menuType: 'MENU' as const,
            icon: null,
            sortOrder: 2,
            visible: true,
            children: [],
          },
          {
            id: 43,
            parentId: 40,
            name: '岗位管理',
            permissionCode: null,
            menuType: 'MENU' as const,
            icon: null,
            sortOrder: 3,
            visible: true,
            children: [],
          },
        ],
      },
      {
        id: 50,
        parentId: 1,
        name: '系统设置',
        permissionCode: null,
        menuType: 'DIRECTORY' as const,
        icon: 'layout-grid',
        sortOrder: 5,
        visible: true,
        children: [
          {
            id: 51,
            parentId: 50,
            name: '参数配置',
            permissionCode: null,
            menuType: 'MENU' as const,
            icon: null,
            sortOrder: 1,
            visible: true,
            children: [],
          },
          {
            id: 52,
            parentId: 50,
            name: '字典管理',
            permissionCode: null,
            menuType: 'MENU' as const,
            icon: null,
            sortOrder: 2,
            visible: true,
            children: [],
          },
          {
            id: 53,
            parentId: 50,
            name: '操作日志',
            permissionCode: null,
            menuType: 'MENU' as const,
            icon: null,
            sortOrder: 3,
            visible: true,
            children: [],
          },
        ],
      },
    ],
  },
];

export const handlers = [
  // ── 登录 ──
  http.post('/api/v1/auth/login', async ({ request }) => {
    resetMockState();
    const body = (await request.json()) as { username: string; password: string };

    if (body.username === 'error') {
      return problemJson(401, 'Unauthorized', '用户名或密码错误');
    }
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

  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };
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

  // ── 菜单 ──
  http.get('/api/v1/menus/current-user', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return problemJson(401, 'Unauthorized', '未提供认证凭据');
    return HttpResponse.json({
      tree: menuTree,
      permissions: ALL_APP_PERMISSIONS,
    });
  }),

  http.get('/api/v1/menus', () => HttpResponse.json(menuTree)),

  // ── Notice 查询 ──
  http.get('/api/v1/notices/unread-count', () =>
    HttpResponse.json({
      count: noticeStore.filter((notice) => notice.status === 1 && !notice.read).length,
    }),
  ),

  http.get('/api/v1/notices', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();

    const filtered = noticeStore.filter((notice) => {
      if (status !== null && String(notice.status) !== status) {
        return false;
      }
      if (keyword && !notice.title.toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });

    return HttpResponse.json({
      content: filtered.map(toNoticeListItem),
      totalElements: filtered.length,
      totalPages: 1,
      page: 1,
      size: 10,
    });
  }),

  http.get(
    '/api/v1/notices/export',
    () =>
      new HttpResponse('mock excel content', {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="notices.xlsx"',
        },
      }),
  ),

  http.get('/api/v1/notices/:id', ({ params }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    return HttpResponse.json(cloneNotice(notice));
  }),

  http.get('/api/v1/notices/:id/recipients', ({ params }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    return HttpResponse.json({
      content: notice.recipients,
      totalElements: notice.recipients.length,
      totalPages: 1,
      page: 1,
      size: 20,
    });
  }),

  // ── Notice 变更 ──
  http.post('/api/v1/notices', async ({ request }) => {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      pinned?: boolean;
      startTime?: string;
      endTime?: string;
    };

    const notice: NoticeRecord = {
      id: nextNoticeId++,
      title: body.title ?? '未命名公告',
      content: body.content ?? '',
      status: 0,
      pinned: body.pinned ?? false,
      startTime: body.startTime,
      endTime: body.endTime,
      createdByName: 'admin',
      createdAt: '2026-04-15T14:00:00+08:00',
      updatedAt: '2026-04-15T14:00:00+08:00',
      version: 1,
      read: false,
      readCount: 0,
      recipientCount: 0,
      attachments: [],
      targets: [],
      recipients: [],
    };

    noticeStore = [notice, ...noticeStore];
    return HttpResponse.json(cloneNotice(notice), { status: 201 });
  }),

  http.put('/api/v1/notices/:id', async ({ params, request }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    const body = (await request.json()) as {
      title?: string;
      content?: string;
      pinned?: boolean;
      startTime?: string;
      endTime?: string;
    };

    notice.title = body.title ?? notice.title;
    notice.content = body.content ?? notice.content;
    notice.pinned = body.pinned ?? notice.pinned;
    notice.startTime = body.startTime ?? notice.startTime;
    notice.endTime = body.endTime ?? notice.endTime;
    withUpdatedTimestamp(notice);

    return HttpResponse.json(cloneNotice(notice));
  }),

  http.delete('/api/v1/notices/batch', async ({ request }) => {
    const body = (await request.json()) as { ids?: number[] };
    const ids = new Set(body.ids ?? []);
    const before = noticeStore.length;
    noticeStore = noticeStore.filter((notice) => !ids.has(notice.id));
    const success = before - noticeStore.length;
    return HttpResponse.json({ success, skipped: (body.ids ?? []).length - success });
  }),

  http.delete('/api/v1/notices/:id', ({ params }) => {
    const noticeId = Number(params.id);
    noticeStore = noticeStore.filter((notice) => notice.id !== noticeId);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/notices/:id/publish', async ({ params, request }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    const body = (await request.json()) as { targets?: NoticeTarget[] };
    const targets = body.targets ?? [{ targetType: 'ALL', targetId: null }];
    const recipients = createRecipients(targets);

    notice.status = 1;
    notice.targets = targets;
    notice.recipients = recipients;
    notice.recipientCount = recipients.length;
    notice.readCount = recipients.filter((recipient) => recipient.readAt).length;
    withUpdatedTimestamp(notice);

    return HttpResponse.json(cloneNotice(notice));
  }),

  http.post('/api/v1/notices/:id/revoke', ({ params }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    notice.status = 2;
    withUpdatedTimestamp(notice);
    return HttpResponse.json(cloneNotice(notice));
  }),

  http.post('/api/v1/notices/:id/duplicate', ({ params }) => {
    const source = findNotice(Number(params.id));
    if (!source) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    const duplicate = cloneNotice(source);
    duplicate.id = nextNoticeId++;
    duplicate.status = 0;
    duplicate.read = false;
    duplicate.readCount = 0;
    duplicate.recipientCount = 0;
    duplicate.recipients = [];
    duplicate.targets = [];
    duplicate.createdAt = '2026-04-15T14:10:00+08:00';
    duplicate.updatedAt = '2026-04-15T14:10:00+08:00';
    duplicate.version = 1;
    noticeStore = [duplicate, ...noticeStore];

    return HttpResponse.json(cloneNotice(duplicate), { status: 201 });
  }),

  http.post('/api/v1/notices/batch-publish', async ({ request }) => {
    const body = (await request.json()) as { ids?: number[] };
    let success = 0;
    let skipped = 0;

    for (const id of body.ids ?? []) {
      const notice = findNotice(id);
      if (!notice || notice.status !== 0) {
        skipped++;
        continue;
      }

      notice.status = 1;
      notice.targets = [{ targetType: 'ALL', targetId: null }];
      notice.recipients = createRecipients(notice.targets);
      notice.recipientCount = notice.recipients.length;
      notice.readCount = 0;
      withUpdatedTimestamp(notice);
      success++;
    }

    return HttpResponse.json({ success, skipped });
  }),

  http.put('/api/v1/notices/:id/read', ({ params }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    if (!notice.read) {
      notice.read = true;
      if (notice.recipientCount > 0 && notice.readCount < notice.recipientCount) {
        notice.readCount += 1;
      }
    }

    if (notice.recipients[0] && !notice.recipients[0].readAt) {
      notice.recipients[0].readAt = '2026-04-15T14:20:00+08:00';
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ── 文件 ──
  http.post('/api/v1/files/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    return HttpResponse.json(
      {
        id: nextFileId++,
        originalName: file?.name ?? 'mock-file.txt',
        filePath: `/mock/${file?.name ?? 'mock-file.txt'}`,
        fileSize: file?.size ?? 0,
        contentType: file?.type ?? 'application/octet-stream',
        sha256: 'mock-sha256',
        createdAt: '2026-04-15T14:00:00+08:00',
      },
      { status: 201 },
    );
  }),

  http.get(
    '/api/v1/files/:id/download',
    ({ params }) =>
      new HttpResponse(`mock file ${params.id}`, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="file-${params.id}.txt"`,
        },
      }),
  ),

  // ── 微信绑定 ──
  http.get('/api/v1/wechat/bindings', () => HttpResponse.json(wechatBindings)),
  http.get('/api/v1/wechat/mp/oauth-state', () => HttpResponse.json({ state: 'mock-oauth-state' })),
  http.delete('/api/v1/wechat/unbind/:platform', ({ params }) => {
    wechatBindings = wechatBindings.filter((binding) => binding.platform !== params.platform);
    return new HttpResponse(null, { status: 204 });
  }),
];
