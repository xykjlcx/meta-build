import { ALL_APP_PERMISSIONS, type AppPermission } from '@mb/api-sdk';
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

interface DeptRecord {
  id: number;
  parentId: number | null;
  name: string;
  leaderUserId: number | null;
  status: number;
  sortOrder: number;
  createdAt: string;
  children: DeptRecord[];
}

interface RoleRecord {
  id: number;
  name: string;
  code: string;
  dataScope: string | null;
  remark: string | null;
  status: number;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

interface UserRecord {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  deptId: number | null;
  status: number;
  mustChangePassword: boolean;
  passwordUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MenuRecord {
  id: number;
  parentId: number | null;
  name: string;
  permissionCode: string | null;
  menuType: string;
  icon: string | null;
  sortOrder: number | null;
  visible: boolean | null;
  children: MenuRecord[];
}

interface NotificationLogRecord {
  id: number;
  channelType: string;
  recipientId: number;
  templateCode: string;
  module: string;
  referenceId: string;
  status: number;
  errorMessage?: string;
  sentAt: string;
  createdAt: string;
}

interface MockSessionUser {
  userId: number;
  username: string;
  deptId: number | null;
  permissions: AppPermission[];
  roles: string[];
  isAdmin: boolean;
}

interface MockSession {
  accessToken: string;
  refreshToken: string;
  user: MockSessionUser;
}

const MOCK_SSE_CHANNEL = 'mb-mock-sse';
const MOCK_TIMESTAMP = '2026-04-15T14:30:00+08:00';

const mockDeptTree: DeptRecord[] = [
  {
    id: 10,
    parentId: null,
    name: '总部',
    leaderUserId: 1,
    status: 1,
    sortOrder: 1,
    createdAt: '2026-04-01T09:00:00+08:00',
    children: [
      {
        id: 11,
        parentId: 10,
        name: '产品研发中心',
        leaderUserId: 1,
        status: 1,
        sortOrder: 1,
        createdAt: '2026-04-01T09:00:00+08:00',
        children: [],
      },
      {
        id: 12,
        parentId: 10,
        name: '市场增长部',
        leaderUserId: 2,
        status: 1,
        sortOrder: 2,
        createdAt: '2026-04-01T09:00:00+08:00',
        children: [],
      },
      {
        id: 13,
        parentId: 10,
        name: '客户成功部',
        leaderUserId: 3,
        status: 1,
        sortOrder: 3,
        createdAt: '2026-04-01T09:00:00+08:00',
        children: [],
      },
    ],
  },
];

const mockRoles: RoleRecord[] = [
  {
    id: 101,
    name: '系统管理员',
    code: 'ADMIN',
    dataScope: 'ALL',
    remark: '系统管理权限',
    status: 1,
    sortOrder: 1,
    createdAt: '2026-04-01T09:00:00+08:00',
    updatedAt: '2026-04-01T09:00:00+08:00',
  },
  {
    id: 102,
    name: '运营经理',
    code: 'OPS_MANAGER',
    dataScope: 'DEPT',
    remark: '运营团队',
    status: 1,
    sortOrder: 2,
    createdAt: '2026-04-01T09:00:00+08:00',
    updatedAt: '2026-04-01T09:00:00+08:00',
  },
  {
    id: 103,
    name: '内容编辑',
    code: 'CONTENT_EDITOR',
    dataScope: 'SELF',
    remark: '公告内容维护',
    status: 1,
    sortOrder: 3,
    createdAt: '2026-04-01T09:00:00+08:00',
    updatedAt: '2026-04-01T09:00:00+08:00',
  },
];

const mockUsers: UserRecord[] = Array.from({ length: 25 }, (_, index) => {
  const id = index + 1;
  const baseName = id === 1 ? 'admin' : id === 2 ? 'alice' : id === 3 ? 'bob' : `user-${id}`;
  const nickname = id === 1 ? '系统管理员' : id === 2 ? 'Alice' : id === 3 ? 'Bob' : `user-${id}`;
  const deptId = id <= 10 ? 11 : id <= 18 ? 12 : 13;

  return {
    id,
    username: baseName,
    email: `${baseName}@meta.build`,
    phone: `1380000${String(id).padStart(4, '0')}`,
    nickname,
    avatar: null,
    deptId,
    status: 1,
    mustChangePassword: false,
    passwordUpdatedAt: '2026-04-10T09:00:00+08:00',
    createdAt: '2026-04-01T09:00:00+08:00',
    updatedAt: '2026-04-15T09:00:00+08:00',
  };
});

const initialUserRoleMap: Record<number, number[]> = Object.fromEntries(
  mockUsers.map((user) => {
    if (user.id === 1) {
      return [user.id, [101]];
    }
    if (user.id <= 12) {
      return [user.id, [102]];
    }
    return [user.id, [103]];
  }),
);

// ── ProblemDetail 工厂 ──
function problemJson(status: number, title: string, detail: string) {
  return HttpResponse.json(
    { type: 'about:blank', status, title, detail },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate<T>(items: T[], page: number, size: number) {
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const start = (currentPage - 1) * size;

  return {
    content: items.slice(start, start + size),
    totalElements,
    totalPages,
    page: currentPage,
    size,
  };
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneRelationMap(map: Record<number, number[]>): Record<number, number[]> {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [Number(key), [...value]]),
  ) as Record<number, number[]>;
}

function findTreeNode<T extends { id: number; children: T[] }>(
  nodes: T[],
  id: number,
): T | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findTreeNode(node.children, id);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function insertTreeNode<T extends { id: number; children: T[]; parentId: number | null }>(
  nodes: T[],
  parentId: number | null,
  nextNode: T,
): boolean {
  if (parentId === null) {
    nodes.push(nextNode);
    return true;
  }

  const parent = findTreeNode(nodes, parentId);
  if (!parent) {
    return false;
  }

  parent.children.push(nextNode);
  return true;
}

function removeTreeNode<T extends { id: number; children: T[] }>(nodes: T[], id: number): boolean {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) {
    nodes.splice(index, 1);
    return true;
  }

  return nodes.some((node) => removeTreeNode(node.children, id));
}

function collectTreeIds<T extends { id: number; children: T[] }>(nodes: T[]): number[] {
  return nodes.flatMap((node) => [node.id, ...collectTreeIds(node.children)]);
}

function createInitialRoleMenuMap(): Record<number, number[]> {
  return {
    101: [2, 20, 21, 22, 23, 24, 3, 40, 41, 42, 30, 31],
    102: [2, 20, 21, 3, 40, 41, 30],
    103: [30],
  };
}

function toRecipient(user: UserRecord, readAt?: string): NoticeRecipient {
  return {
    userId: user.id,
    username: user.nickname ?? user.username,
    ...(readAt ? { readAt } : {}),
  };
}

function buildRecipientsFromUsers(users: UserRecord[], readCount = 0) {
  return users.map((user, index) =>
    toRecipient(
      user,
      index < readCount ? `2026-04-15T10:${String(index).padStart(2, '0')}:00+08:00` : undefined,
    ),
  );
}

function buildNotificationLogs(notice: NoticeRecord): NotificationLogRecord[] {
  if (notice.status !== 1 || notice.recipients.length === 0) {
    return [];
  }

  return notice.recipients.slice(0, 8).map((recipient, index) => ({
    id: notice.id * 100 + index + 1,
    channelType: index % 3 === 0 ? 'IN_APP' : index % 3 === 1 ? 'WECHAT_MP' : 'EMAIL',
    recipientId: recipient.userId,
    templateCode: 'notice.publish',
    module: 'notice',
    referenceId: String(notice.id),
    status: index % 5 === 4 ? 2 : 1,
    ...(index % 5 === 4 ? { errorMessage: '模拟发送失败' } : {}),
    sentAt: `2026-04-15T15:${String(index).padStart(2, '0')}:00+08:00`,
    createdAt: `2026-04-15T15:${String(index).padStart(2, '0')}:00+08:00`,
  }));
}

function createRecipients(targets: NoticeTarget[]): NoticeRecipient[] {
  if (targets.some((target) => target.targetType === 'ALL')) {
    return buildRecipientsFromUsers(userStore);
  }

  const recipients = targets.flatMap((target) => {
    if (target.targetType === 'DEPT') {
      return userStore
        .filter((user) => user.deptId === target.targetId)
        .map((user) => toRecipient(user));
    }

    if (target.targetType === 'ROLE') {
      return userStore
        .filter((user) => userRoleMap[user.id]?.includes(target.targetId ?? -1))
        .map((user) => toRecipient(user));
    }

    if (target.targetType === 'USER') {
      const user = userStore.find((candidate) => candidate.id === target.targetId);
      return user ? [toRecipient(user)] : [];
    }

    return [];
  });

  return recipients;
}

function createInitialNotices(): NoticeRecord[] {
  const publishedRecipients = buildRecipientsFromUsers(mockUsers, 12);
  const featureRecipients = buildRecipientsFromUsers(mockUsers, 18);
  const seededNotices = Array.from({ length: 21 }, (_, index) => {
    const id = index + 4;
    const status = index % 3;

    return {
      id,
      title: `批量导入回执 #${id}`,
      content: `<p>这是第 ${id} 条种子公告，用于分页和筛选验证。</p>`,
      status,
      pinned: id % 5 === 0,
      startTime: `2026-04-${String((id % 9) + 10).padStart(2, '0')}T09:00:00+08:00`,
      endTime: `2026-04-${String((id % 9) + 18).padStart(2, '0')}T18:00:00+08:00`,
      createdByName: 'admin',
      createdAt: `2026-04-${String((id % 9) + 10).padStart(2, '0')}T08:00:00+08:00`,
      updatedAt: `2026-04-${String((id % 9) + 10).padStart(2, '0')}T09:00:00+08:00`,
      version: 1,
      read: status === 1 && id % 2 === 0,
      readCount: status === 1 ? 6 : 0,
      recipientCount: status === 1 ? mockUsers.length : 0,
      attachments: [],
      targets: status === 1 ? [{ targetType: 'ALL', targetId: null }] : [],
      recipients: status === 1 ? buildRecipientsFromUsers(mockUsers, 6) : [],
    } satisfies NoticeRecord;
  });

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
      recipientCount: publishedRecipients.length,
      attachments: [
        { fileId: 101, sortOrder: 1 },
        { fileId: 102, sortOrder: 2 },
      ],
      targets: [{ targetType: 'ALL', targetId: null }],
      recipients: publishedRecipients,
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
      recipientCount: featureRecipients.length,
      attachments: [],
      targets: [{ targetType: 'ALL', targetId: null }],
      recipients: featureRecipients,
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
    ...seededNotices,
  ];
}

let noticeStore = createInitialNotices();
let notificationLogStore = Object.fromEntries(
  noticeStore.map((notice) => [notice.id, buildNotificationLogs(notice)]),
);
let deptStore = deepClone(mockDeptTree);
let roleStore = deepClone(mockRoles);
let userStore = deepClone(mockUsers);
let userRoleMap = cloneRelationMap(initialUserRoleMap);
let roleMenuMap = createInitialRoleMenuMap();
let menuStore = createInitialMenuTree();
let nextNoticeId = 100;
let nextFileId = 500;
let nextDeptId = 100;
let nextRoleId = 1000;
let nextUserId = 1000;
let nextMenuId = 1000;
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
  notificationLogStore = Object.fromEntries(
    noticeStore.map((notice) => [notice.id, buildNotificationLogs(notice)]),
  );
  deptStore = deepClone(mockDeptTree);
  roleStore = deepClone(mockRoles);
  userStore = deepClone(mockUsers);
  userRoleMap = cloneRelationMap(initialUserRoleMap);
  roleMenuMap = createInitialRoleMenuMap();
  menuStore = createInitialMenuTree();
  nextNoticeId = 100;
  nextFileId = 500;
  nextDeptId = 100;
  nextRoleId = 1000;
  nextUserId = 1000;
  nextMenuId = 1000;
}

function cloneNotice(notice: NoticeRecord) {
  return JSON.parse(JSON.stringify(notice)) as NoticeRecord;
}

function createMockSessionUser(username: string): MockSessionUser {
  if (username === 'notice-manager-no-publish') {
    const permissions = ALL_APP_PERMISSIONS.filter(
      (permission) => permission !== 'notice:notice:publish',
    );

    return {
      userId: 7,
      username,
      deptId: 1,
      permissions,
      roles: ['notice-manager'],
      isAdmin: true,
    };
  }

  if (username === 'notice-auditor') {
    const permissions = ALL_APP_PERMISSIONS.filter(
      (permission) => permission !== 'notification:notification:list',
    );

    return {
      userId: 9,
      username,
      deptId: 11,
      permissions,
      roles: ['notice-auditor'],
      isAdmin: false,
    };
  }

  if (username === 'dept-marketing') {
    return {
      userId: 15,
      username,
      deptId: 12,
      permissions: ['notice:notice:list', 'notice:notice:detail'],
      roles: ['dept-marketing'],
      isAdmin: false,
    };
  }

  if (username === 'dept-product') {
    return {
      userId: 4,
      username,
      deptId: 11,
      permissions: ['notice:notice:list', 'notice:notice:detail'],
      roles: ['dept-product'],
      isAdmin: false,
    };
  }

  return {
    userId: 1,
    username,
    deptId: 1,
    permissions: [...ALL_APP_PERMISSIONS],
    roles: ['admin'],
    isAdmin: true,
  };
}

function createMockSession(username: string): MockSession {
  return {
    accessToken: `mock-access-token::${username}`,
    refreshToken: `mock-refresh-token::${username}`,
    user: createMockSessionUser(username),
  };
}

function resolveSessionUserFromToken(rawToken: string | null) {
  const token = rawToken?.replace(/^Bearer\s+/u, '') ?? null;
  const username = token?.split('::')[1] ?? 'admin';
  return createMockSessionUser(username);
}

function broadcastMockSseEvent(event: string, data: unknown) {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }

  const channel = new BroadcastChannel(MOCK_SSE_CHANNEL);
  channel.postMessage({
    type: 'event',
    event,
    data,
  });
  channel.close();
}

function noticeMatchesUser(user: MockSessionUser, notice: NoticeRecord) {
  if (user.isAdmin) {
    return true;
  }

  if (notice.createdByName === user.username) {
    return true;
  }

  if (notice.status !== 1) {
    return false;
  }

  if (notice.targets.length === 0) {
    return false;
  }

  const roleIds = new Set(
    Object.entries(userRoleMap)
      .filter(([userId]) => Number(userId) === user.userId)
      .flatMap(([, ids]) => ids),
  );

  return notice.targets.some((target) => {
    if (target.targetType === 'ALL') {
      return true;
    }
    if (target.targetType === 'DEPT') {
      return target.targetId === user.deptId;
    }
    if (target.targetType === 'ROLE') {
      return target.targetId !== null && roleIds.has(target.targetId);
    }
    if (target.targetType === 'USER') {
      return target.targetId === user.userId;
    }
    return false;
  });
}

function isNoticeReadByUser(user: MockSessionUser, notice: NoticeRecord) {
  if (user.isAdmin) {
    return notice.read;
  }

  const recipient = notice.recipients.find((candidate) => candidate.userId === user.userId);
  return Boolean(recipient?.readAt);
}

function toNoticeListItemForUser(user: MockSessionUser, notice: NoticeRecord) {
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
    read: isNoticeReadByUser(user, notice),
    readCount: notice.readCount,
    recipientCount: notice.recipientCount,
  };
}

function hydrateNoticeForUser(user: MockSessionUser, notice: NoticeRecord) {
  const cloned = cloneNotice(notice);
  cloned.read = isNoticeReadByUser(user, notice);
  return cloned;
}

function applyNoticePublish(notice: NoticeRecord, targets: NoticeTarget[]) {
  const recipients = createRecipients(targets);
  notice.status = 1;
  notice.targets = targets;
  notice.recipients = recipients;
  notice.recipientCount = recipients.length;
  notice.readCount = recipients.filter((recipient) => recipient.readAt).length;
  withUpdatedTimestamp(notice);
  notificationLogStore[notice.id] = buildNotificationLogs(notice);
  broadcastMockSseEvent('notice-published', {
    id: notice.id,
    title: notice.title,
    targets,
  });
}

function findNotice(id: number) {
  return noticeStore.find((notice) => notice.id === id);
}

function withUpdatedTimestamp(notice: NoticeRecord) {
  notice.updatedAt = MOCK_TIMESTAMP;
  notice.version += 1;
}

// ── 多层菜单树（P2：User / Role / Dept / Menu + Notice + WeChat） ──
function createInitialMenuTree(): MenuRecord[] {
  return [
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
            {
              id: 23,
              parentId: 2,
              name: '重置密码',
              permissionCode: 'iam:user:resetPassword',
              menuType: 'BUTTON' as const,
              icon: null,
              sortOrder: 4,
              visible: true,
              children: [],
            },
            {
              id: 24,
              parentId: 2,
              name: '分配角色',
              permissionCode: 'iam:user:assignRole',
              menuType: 'BUTTON' as const,
              icon: null,
              sortOrder: 5,
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
          id: 40,
          parentId: 1,
          name: '组织架构',
          permissionCode: null,
          menuType: 'DIRECTORY' as const,
          icon: 'folder-tree',
          sortOrder: 3,
          visible: true,
          children: [
            {
              id: 41,
              parentId: 40,
              name: '部门管理',
              permissionCode: 'iam:dept:list',
              menuType: 'MENU' as const,
              icon: 'building-2',
              sortOrder: 1,
              visible: true,
              children: [],
            },
            {
              id: 42,
              parentId: 40,
              name: '菜单管理',
              permissionCode: 'iam:menu:list',
              menuType: 'MENU' as const,
              icon: 'layout-grid',
              sortOrder: 2,
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
          icon: 'settings-2',
          sortOrder: 4,
          visible: true,
          children: [
            {
              id: 51,
              parentId: 50,
              name: '权限矩阵',
              permissionCode: null,
              menuType: 'MENU' as const,
              icon: 'shield-check',
              sortOrder: 1,
              visible: true,
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 60,
      parentId: null,
      name: '消息中心',
      permissionCode: null,
      menuType: 'DIRECTORY' as const,
      icon: 'bell',
      sortOrder: 2,
      visible: true,
      children: [
        {
          id: 30,
          parentId: 60,
          name: '通知公告',
          permissionCode: 'notice:notice:list',
          menuType: 'MENU' as const,
          icon: 'bell',
          sortOrder: 1,
          visible: true,
          children: [],
        },
        {
          id: 31,
          parentId: 60,
          name: '微信绑定',
          permissionCode: null,
          menuType: 'MENU' as const,
          icon: 'link',
          sortOrder: 2,
          visible: true,
          children: [],
        },
        {
          id: 32,
          parentId: 60,
          name: '渠道总览',
          permissionCode: null,
          menuType: 'MENU' as const,
          icon: 'send',
          sortOrder: 3,
          visible: true,
          children: [],
        },
      ],
    },
  ];
}

function findUser(id: number) {
  return userStore.find((user) => user.id === id);
}

function findRole(id: number) {
  return roleStore.find((role) => role.id === id);
}

function findDept(id: number) {
  return findTreeNode(deptStore, id);
}

function findMenu(id: number) {
  return findTreeNode(menuStore, id);
}

function sortTreeByOrder<T extends { sortOrder: number | null; children: T[] }>(nodes: T[]) {
  nodes.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  for (const node of nodes) {
    sortTreeByOrder(node.children);
  }
}

function collectExistingMenuIds() {
  return new Set(collectTreeIds(menuStore));
}

function filterMenuTreeForPermissions(nodes: MenuRecord[], permissions: Set<string>): MenuRecord[] {
  return nodes.flatMap((node) => {
    const children = filterMenuTreeForPermissions(node.children, permissions);
    const allowedSelf = !node.permissionCode || permissions.has(node.permissionCode);
    const keepNode =
      node.menuType === 'DIRECTORY' ? children.length > 0 || allowedSelf : allowedSelf;

    if (!keepNode) {
      return [];
    }

    return [{ ...node, children }];
  });
}

export const handlers = [
  http.get('/api/testing/mock-ready', () => HttpResponse.json({ ok: true })),

  // ── 登录 ──
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    const preserveState = body.password.endsWith('#keep');
    if (!preserveState) {
      resetMockState();
    }

    if (body.username === 'error') {
      return problemJson(401, 'Unauthorized', '用户名或密码错误');
    }
    if (body.username === 'locked') {
      return problemJson(423, 'Locked', '账户已被锁定，请 30 分钟后重试');
    }

    const session = createMockSession(body.username);

    return HttpResponse.json({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresInSeconds: 7200,
      user: {
        userId: session.user.userId,
        username: session.user.username,
        deptId: session.user.deptId,
        permissions: session.user.permissions,
      },
    });
  }),

  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };
    if (body.refreshToken === 'expired-refresh-token') {
      return problemJson(401, 'Unauthorized', 'Refresh token 已过期');
    }

    const session = createMockSession(body.refreshToken.split('::')[1] ?? 'admin');

    return HttpResponse.json({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresInSeconds: 7200,
      user: {
        userId: session.user.userId,
        username: session.user.username,
        deptId: session.user.deptId,
        permissions: session.user.permissions,
      },
    });
  }),

  http.get('/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return problemJson(401, 'Unauthorized', '未提供认证凭据');
    const currentSessionUser = resolveSessionUserFromToken(auth);
    return HttpResponse.json({
      userId: currentSessionUser.userId,
      username: currentSessionUser.username,
      deptId: currentSessionUser.deptId,
      permissions: currentSessionUser.permissions,
      roles: currentSessionUser.roles,
      isAdmin: currentSessionUser.isAdmin,
    });
  }),

  // ── 菜单 ──
  http.get('/api/v1/menus/current-user', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return problemJson(401, 'Unauthorized', '未提供认证凭据');
    const currentSessionUser = resolveSessionUserFromToken(auth);
    const permissions = new Set(currentSessionUser.permissions);
    return HttpResponse.json({
      tree: filterMenuTreeForPermissions(menuStore, permissions),
      permissions: currentSessionUser.permissions,
    });
  }),

  http.get('/api/v1/menus', () => HttpResponse.json(menuStore)),

  http.get('/api/v1/menus/:id', ({ params }) => {
    const menu = findMenu(Number(params.id));
    if (!menu) {
      return problemJson(404, 'Not Found', '菜单不存在');
    }
    return HttpResponse.json(menu);
  }),

  http.post('/api/v1/menus', async ({ request }) => {
    const body = (await request.json()) as {
      parentId?: number;
      name?: string;
      permissionCode?: string | null;
      menuType?: string;
      icon?: string | null;
      sortOrder?: number;
      visible?: boolean;
    };

    const parentId = body.parentId ?? null;
    if (parentId !== null && !findMenu(parentId)) {
      return problemJson(400, 'Bad Request', '父级菜单不存在');
    }

    const nextMenu = {
      id: nextMenuId++,
      parentId,
      name: body.name?.trim() || `新菜单-${String(nextMenuId)}`,
      permissionCode: body.permissionCode?.trim() || null,
      menuType: body.menuType?.trim() || 'MENU',
      icon: body.icon?.trim() || null,
      sortOrder: body.sortOrder ?? 1,
      visible: body.visible ?? true,
      children: [],
    };

    insertTreeNode(menuStore, parentId, nextMenu);
    sortTreeByOrder(menuStore);
    return HttpResponse.json(nextMenu, { status: 201 });
  }),

  http.delete('/api/v1/menus/:id', ({ params }) => {
    const menuId = Number(params.id);
    const menu = findMenu(menuId);
    if (!menu) {
      return problemJson(404, 'Not Found', '菜单不存在');
    }

    const deletedIds = new Set(collectTreeIds([menu]));
    removeTreeNode(menuStore, menuId);
    roleMenuMap = Object.fromEntries(
      Object.entries(roleMenuMap).map(([roleId, menuIds]) => [
        Number(roleId),
        menuIds.filter((id) => !deletedIds.has(id)),
      ]),
    );
    return new HttpResponse(null, { status: 204 });
  }),

  // ── 目标选择基础数据 ──
  http.get('/api/v1/depts', () => HttpResponse.json(deptStore)),

  http.get('/api/v1/depts/:id', ({ params }) => {
    const dept = findDept(Number(params.id));
    if (!dept) {
      return problemJson(404, 'Not Found', '部门不存在');
    }
    return HttpResponse.json(dept);
  }),

  http.post('/api/v1/depts', async ({ request }) => {
    const body = (await request.json()) as {
      parentId?: number;
      name?: string;
      leaderUserId?: number;
      sortOrder?: number;
    };

    const parentId = body.parentId ?? null;
    if (parentId !== null && !findDept(parentId)) {
      return problemJson(400, 'Bad Request', '父级部门不存在');
    }

    const nextDept = {
      id: nextDeptId++,
      parentId,
      name: body.name?.trim() || `新部门-${String(nextDeptId)}`,
      leaderUserId: body.leaderUserId ?? null,
      status: 1,
      sortOrder: body.sortOrder ?? 1,
      createdAt: MOCK_TIMESTAMP,
      children: [],
    };

    insertTreeNode(deptStore, parentId, nextDept);
    sortTreeByOrder(deptStore);
    return HttpResponse.json(nextDept, { status: 201 });
  }),

  http.delete('/api/v1/depts/:id', ({ params }) => {
    const deptId = Number(params.id);
    if (!findDept(deptId)) {
      return problemJson(404, 'Not Found', '部门不存在');
    }

    removeTreeNode(deptStore, deptId);
    userStore = userStore.map((user) =>
      user.deptId === deptId ? { ...user, deptId: null, updatedAt: MOCK_TIMESTAMP } : user,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/v1/roles', ({ request }) => {
    const url = new URL(request.url);
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const size = parsePositiveInteger(url.searchParams.get('size'), 20);

    return HttpResponse.json(paginate(roleStore, page, size));
  }),

  http.get('/api/v1/roles/:id', ({ params }) => {
    const role = findRole(Number(params.id));
    if (!role) {
      return problemJson(404, 'Not Found', '角色不存在');
    }
    return HttpResponse.json(role);
  }),

  http.post('/api/v1/roles', async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      code?: string;
      dataScope?: string | null;
      remark?: string | null;
      sortOrder?: number;
    };

    const nextRole = {
      id: nextRoleId++,
      name: body.name?.trim() || `新角色-${String(nextRoleId)}`,
      code: body.code?.trim() || `ROLE_${String(nextRoleId)}`,
      dataScope: body.dataScope?.trim() || 'SELF',
      remark: body.remark?.trim() || null,
      status: 1,
      sortOrder: body.sortOrder ?? roleStore.length + 1,
      createdAt: MOCK_TIMESTAMP,
      updatedAt: MOCK_TIMESTAMP,
    };

    roleStore.push(nextRole);
    roleStore.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
    return HttpResponse.json(nextRole, { status: 201 });
  }),

  http.put('/api/v1/roles/:id', async ({ params, request }) => {
    const role = findRole(Number(params.id));
    if (!role) {
      return problemJson(404, 'Not Found', '角色不存在');
    }

    const body = (await request.json()) as {
      name?: string;
      dataScope?: string | null;
      remark?: string | null;
      status?: number;
      sortOrder?: number;
    };

    Object.assign(role, {
      name: body.name?.trim() || role.name,
      dataScope: body.dataScope?.trim() || role.dataScope,
      remark: body.remark?.trim() || null,
      status: body.status ?? role.status,
      sortOrder: body.sortOrder ?? role.sortOrder,
      updatedAt: MOCK_TIMESTAMP,
    });
    roleStore.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
    return HttpResponse.json(role);
  }),

  http.delete('/api/v1/roles/:id', ({ params }) => {
    const roleId = Number(params.id);
    if (!findRole(roleId)) {
      return problemJson(404, 'Not Found', '角色不存在');
    }

    roleStore = roleStore.filter((role) => role.id !== roleId);
    delete roleMenuMap[roleId];
    userRoleMap = Object.fromEntries(
      Object.entries(userRoleMap).map(([userId, roleIds]) => [
        Number(userId),
        roleIds.filter((id) => id !== roleId),
      ]),
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('/api/v1/roles/:id/menus', async ({ params, request }) => {
    const roleId = Number(params.id);
    if (!findRole(roleId)) {
      return problemJson(404, 'Not Found', '角色不存在');
    }

    const body = (await request.json()) as number[];
    const existingMenuIds = collectExistingMenuIds();
    roleMenuMap[roleId] = (body ?? []).filter((id) => existingMenuIds.has(id));
    return new HttpResponse(null, { status: 200 });
  }),

  http.get('/api/v1/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const size = parsePositiveInteger(url.searchParams.get('size'), 20);

    return HttpResponse.json(paginate(userStore, page, size));
  }),

  http.get('/api/v1/users/:id', ({ params }) => {
    const user = findUser(Number(params.id));
    if (!user) {
      return problemJson(404, 'Not Found', '用户不存在');
    }
    return HttpResponse.json(user);
  }),

  http.post('/api/v1/users', async ({ request }) => {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      email?: string;
      phone?: string;
      nickname?: string;
      deptId?: number;
    };

    const username = body.username?.trim();
    if (!username) {
      return problemJson(400, 'Bad Request', '用户名不能为空');
    }

    const nextUser = {
      id: nextUserId++,
      username,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      nickname: body.nickname?.trim() || null,
      avatar: null,
      deptId: body.deptId ?? null,
      status: 1,
      mustChangePassword: true,
      passwordUpdatedAt: null,
      createdAt: MOCK_TIMESTAMP,
      updatedAt: MOCK_TIMESTAMP,
    };

    userStore.unshift(nextUser);
    userRoleMap[nextUser.id] = [];
    return HttpResponse.json(nextUser, { status: 201 });
  }),

  http.put('/api/v1/users/:id', async ({ params, request }) => {
    const user = findUser(Number(params.id));
    if (!user) {
      return problemJson(404, 'Not Found', '用户不存在');
    }

    const body = (await request.json()) as {
      email?: string;
      phone?: string;
      nickname?: string;
      avatar?: string;
      deptId?: number;
      status?: number;
    };

    Object.assign(user, {
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      nickname: body.nickname?.trim() || null,
      avatar: body.avatar?.trim() || null,
      deptId: body.deptId ?? null,
      status: body.status ?? user.status,
      updatedAt: MOCK_TIMESTAMP,
    });
    return HttpResponse.json(user);
  }),

  http.delete('/api/v1/users/:id', ({ params }) => {
    const userId = Number(params.id);
    if (!findUser(userId)) {
      return problemJson(404, 'Not Found', '用户不存在');
    }

    userStore = userStore.filter((user) => user.id !== userId);
    delete userRoleMap[userId];
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('/api/v1/users/:id/roles', async ({ params, request }) => {
    const userId = Number(params.id);
    if (!findUser(userId)) {
      return problemJson(404, 'Not Found', '用户不存在');
    }

    const body = (await request.json()) as { roleIds?: number[] };
    const existingRoleIds = new Set(roleStore.map((role) => role.id));
    userRoleMap[userId] = (body.roleIds ?? []).filter((id) => existingRoleIds.has(id));
    return new HttpResponse(null, { status: 200 });
  }),

  http.post('/api/v1/users/:id/reset-password', ({ params }) => {
    const user = findUser(Number(params.id));
    if (!user) {
      return problemJson(404, 'Not Found', '用户不存在');
    }

    user.mustChangePassword = true;
    user.passwordUpdatedAt = MOCK_TIMESTAMP;
    user.updatedAt = MOCK_TIMESTAMP;
    return new HttpResponse(null, { status: 200 });
  }),

  http.get('/api/v1/notification-logs', ({ request }) => {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const referenceId = Number(url.searchParams.get('referenceId'));
    if (module !== 'notice' || !Number.isFinite(referenceId)) {
      return HttpResponse.json([]);
    }

    return HttpResponse.json(notificationLogStore[referenceId] ?? []);
  }),

  // ── Notice 查询 ──
  http.get('/api/v1/notices/unread-count', ({ request }) => {
    const currentSessionUser = resolveSessionUserFromToken(request.headers.get('Authorization'));
    return HttpResponse.json({
      count: noticeStore.filter(
        (notice) =>
          notice.status === 1 &&
          !isNoticeReadByUser(currentSessionUser, notice) &&
          noticeMatchesUser(currentSessionUser, notice),
      ).length,
    });
  }),

  http.get('/api/v1/notices', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const startTimeFrom = url.searchParams.get('startTimeFrom');
    const startTimeTo = url.searchParams.get('startTimeTo');
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const size = parsePositiveInteger(url.searchParams.get('size'), 20);
    const currentSessionUser = resolveSessionUserFromToken(request.headers.get('Authorization'));

    const filtered = noticeStore.filter((notice) => {
      if (!noticeMatchesUser(currentSessionUser, notice)) {
        return false;
      }
      if (status !== null && String(notice.status) !== status) {
        return false;
      }
      if (keyword && !notice.title.toLowerCase().includes(keyword)) {
        return false;
      }
      if (startTimeFrom && notice.startTime && notice.startTime < startTimeFrom) {
        return false;
      }
      if (startTimeTo && notice.startTime && notice.startTime > startTimeTo) {
        return false;
      }
      return true;
    });

    return HttpResponse.json(
      paginate(
        filtered.map((notice) => toNoticeListItemForUser(currentSessionUser, notice)),
        page,
        size,
      ),
    );
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

  http.get('/api/v1/notices/:id', ({ params, request }) => {
    const notice = findNotice(Number(params.id));
    const currentSessionUser = resolveSessionUserFromToken(request.headers.get('Authorization'));
    if (!notice || !noticeMatchesUser(currentSessionUser, notice)) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    return HttpResponse.json(hydrateNoticeForUser(currentSessionUser, notice));
  }),

  http.get('/api/v1/notices/:id/recipients', ({ params, request }) => {
    const notice = findNotice(Number(params.id));
    const currentSessionUser = resolveSessionUserFromToken(request.headers.get('Authorization'));
    if (!notice || !noticeMatchesUser(currentSessionUser, notice)) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    const url = new URL(request.url);
    const page = parsePositiveInteger(url.searchParams.get('page'), 1);
    const size = parsePositiveInteger(url.searchParams.get('size'), 20);
    const readStatus = url.searchParams.get('readStatus');
    const recipients = notice.recipients.filter((recipient) => {
      if (readStatus === 'READ') {
        return Boolean(recipient.readAt);
      }
      if (readStatus === 'UNREAD') {
        return !recipient.readAt;
      }
      return true;
    });

    return HttpResponse.json(paginate(recipients, page, size));
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
    notificationLogStore[notice.id] = [];
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
    for (const id of ids) {
      delete notificationLogStore[id];
    }
    const success = before - noticeStore.length;
    return HttpResponse.json({ success, skipped: (body.ids ?? []).length - success });
  }),

  http.delete('/api/v1/notices/:id', ({ params }) => {
    const noticeId = Number(params.id);
    noticeStore = noticeStore.filter((notice) => notice.id !== noticeId);
    delete notificationLogStore[noticeId];
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/notices/:id/publish', async ({ params, request }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    const body = (await request.json()) as { targets?: NoticeTarget[] };
    applyNoticePublish(notice, body.targets ?? [{ targetType: 'ALL', targetId: null }]);

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
    notificationLogStore[duplicate.id] = [];

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

      applyNoticePublish(notice, [{ targetType: 'ALL', targetId: null }]);
      success++;
    }

    return HttpResponse.json({ success, skipped });
  }),

  http.put('/api/v1/notices/:id/read', ({ params, request }) => {
    const notice = findNotice(Number(params.id));
    if (!notice) {
      return problemJson(404, 'Not Found', '公告不存在');
    }

    const currentSessionUser = resolveSessionUserFromToken(request.headers.get('Authorization'));

    if (currentSessionUser.isAdmin && !notice.read) {
      notice.read = true;
      if (notice.recipientCount > 0 && notice.readCount < notice.recipientCount) {
        notice.readCount += 1;
      }
    }

    const recipient = notice.recipients.find(
      (candidate) => candidate.userId === currentSessionUser.userId,
    );
    if (recipient && !recipient.readAt) {
      recipient.readAt = '2026-04-15T14:20:00+08:00';
      if (notice.readCount < notice.recipientCount) {
        notice.readCount += 1;
      }
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
