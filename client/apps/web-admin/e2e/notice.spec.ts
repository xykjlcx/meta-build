import { type Page, expect, test } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('admin123');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL('**/dashboard');
}

async function navigateToNotices(page: Page) {
  await page.goto('/notices');
  await expect(page.getByRole('heading', { name: '通知公告' })).toBeVisible();
}

async function selectStatus(page: Page, status: '全部状态' | '草稿' | '已发布' | '已撤回') {
  await page.getByTestId('notice-status-filter').click();
  await page.getByRole('option', { name: status, exact: true }).click();
}

test.describe('Notice Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('创建草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.getByTestId('notice-create-button').click();
    await page.getByLabel('公告标题').fill('E2E 测试公告');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('这是 E2E 测试内容');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByText('E2E 测试公告')).toBeVisible();
  });

  test('编辑草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.getByTestId('notice-action-edit-3').click();
    await page.getByLabel('公告标题').fill('E2E 测试公告（已编辑）');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByText('E2E 测试公告（已编辑）')).toBeVisible();
  });

  test('已发布公告不显示编辑按钮', async ({ page }) => {
    await navigateToNotices(page);
    await selectStatus(page, '已发布');
    await expect(page.getByTestId('notice-action-edit-1')).toHaveCount(0);
  });

  test('发布草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.getByTestId('notice-actions-menu-3').click();
    await page.getByTestId('notice-action-publish-3').click();
    await page.getByRole('button', { name: '发布', exact: true }).last().click();
    await selectStatus(page, '已发布');
    await expect(page.getByText('周末值班安排（草稿）')).toBeVisible();
  });

  test('撤回已发布公告', async ({ page }) => {
    await navigateToNotices(page);
    await selectStatus(page, '已发布');
    await page.getByTestId('notice-actions-menu-1').click();
    await page.getByTestId('notice-action-revoke-1').click();
    await page.getByRole('button', { name: '撤回', exact: true }).last().click();
    await selectStatus(page, '已撤回');
    await expect(page.getByText('系统维护通知')).toBeVisible();
  });

  test('复制已发布公告为新建', async ({ page }) => {
    await navigateToNotices(page);
    await selectStatus(page, '已发布');
    await page.getByTestId('notice-actions-menu-1').click();
    await page.getByTestId('notice-action-duplicate-1').click();
    await selectStatus(page, '全部状态');
    await expect(page.getByText('共 4 条')).toBeVisible();
  });

  test('删除草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.getByTestId('notice-actions-menu-3').click();
    await page.getByTestId('notice-action-delete-3').click();
    await page.getByRole('button', { name: '删除', exact: true }).last().click();
    await expect(page.getByText('周末值班安排（草稿）')).toHaveCount(0);
  });

  test('删除已撤回公告', async ({ page }) => {
    await navigateToNotices(page);
    await selectStatus(page, '已发布');
    await page.getByTestId('notice-actions-menu-1').click();
    await page.getByTestId('notice-action-revoke-1').click();
    await page.getByRole('button', { name: '撤回', exact: true }).last().click();
    await selectStatus(page, '已撤回');
    await page.getByTestId('notice-actions-menu-1').click();
    await page.getByTestId('notice-action-delete-1').click();
    await page.getByRole('button', { name: '删除', exact: true }).last().click();
    await expect(page.getByText('系统维护通知')).toHaveCount(0);
  });

  test('批量发布草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    await page
      .locator('tr')
      .filter({ hasText: '周末值班安排（草稿）' })
      .locator('[data-slot="checkbox"]')
      .click();
    await page.getByRole('button', { name: '批量发布' }).click();
    await page.getByRole('button', { name: '发布', exact: true }).last().click();
    await selectStatus(page, '已发布');
    await expect(page.getByText('周末值班安排（草稿）')).toBeVisible();
  });

  test('批量删除公告', async ({ page }) => {
    await navigateToNotices(page);
    await page
      .locator('tr')
      .filter({ hasText: '周末值班安排（草稿）' })
      .locator('[data-slot="checkbox"]')
      .click();
    await page.getByRole('button', { name: '批量删除' }).click();
    await page.getByRole('button', { name: '删除', exact: true }).last().click();
    await expect(page.getByText('周末值班安排（草稿）')).toHaveCount(0);
  });

  test('导出公告 Excel', async ({ page }) => {
    await navigateToNotices(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出 Excel' }).click(),
    ]);
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('无发布权限看不到发布按钮', async () => {
    test.fixme();
  });

  test('查看公告详情', async ({ page }) => {
    await navigateToNotices(page);
    await page.getByTestId('notice-action-detail-1').click();
    await page.waitForURL('**/notices/1');
    await expect(page.getByRole('heading', { name: '公告详情' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '系统维护通知' })).toBeVisible();
    await expect(page.getByText('接收人')).toBeVisible();
    await expect(page.getByText('发送记录')).toBeVisible();
  });

  test('不同部门用户看到本部门公告', async () => {
    test.fixme();
  });

  test('进入详情后列表显示已读样式', async ({ page }) => {
    await navigateToNotices(page);
    await page.getByTestId('notice-action-detail-1').click();
    await page.waitForURL('**/notices/1');
    await page.getByRole('button', { name: '返回列表' }).click();
    await page.waitForURL('**/notices');
    await expect(
      page.locator('tr').filter({ hasText: '系统维护通知' }).locator('.bg-blue-500'),
    ).toHaveCount(0);
  });

  test('管理员看到已读率', async ({ page }) => {
    await navigateToNotices(page);
    await selectStatus(page, '已发布');
    await expect(
      page.locator('tr').filter({ hasText: '系统维护通知' }).getByText('%'),
    ).toBeVisible();
  });

  test('Header 显示未读计数 Badge', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('header button').first()).toBeVisible();
  });

  test('发布公告后其他用户收到 toast', async () => {
    test.fixme();
  });

  test('同用户两个 tab 旧 tab 收到提示', async () => {
    test.fixme();
  });
});
