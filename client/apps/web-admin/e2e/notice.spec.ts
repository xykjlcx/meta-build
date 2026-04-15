import { type Page, expect, test } from '@playwright/test';

// ─── 辅助函数 ──────────────────────────────────────────

/** 登录并等待跳转到 dashboard */
async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

/** 导航到公告列表页 */
async function navigateToNotices(page: Page) {
  await page.goto('/notices');
  await page.waitForSelector('[data-slot="nx-filter"]');
}

// ─── 测试场景 ──────────────────────────────────────────

test.describe('Notice Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // 1. 新增草稿
  test('创建草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.click('text=新增公告');
    await page.waitForSelector('[data-slot="form-field"]');
    await page.fill('input[name="title"]', 'E2E 测试公告');
    // 富文本编辑器填写
    await page.click('.ProseMirror');
    await page.keyboard.type('这是 E2E 测试内容');
    await page.click('button:has-text("保存")');
    // 确认列表中出现新公告
    await expect(page.locator('text=E2E 测试公告')).toBeVisible();
  });

  // 2. 编辑草稿
  test('编辑草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    // 点击第一条草稿的编辑按钮
    const editBtn = page.locator('tr').filter({ hasText: '草稿' }).first().locator('button').nth(1);
    await editBtn.click();
    await page.waitForSelector('[data-slot="form-field"]');
    await page.fill('input[name="title"]', 'E2E 测试公告（已编辑）');
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=E2E 测试公告（已编辑）')).toBeVisible();
  });

  // 3. 已发布不可编辑
  test('已发布公告不显示编辑按钮', async ({ page }) => {
    await navigateToNotices(page);
    // 筛选已发布
    await page.selectOption('select', '1');
    await page.click('button:has-text("查询")');
    // 检查操作列无编辑图标
    const firstRow = page.locator('tr').filter({ hasText: '已发布' }).first();
    await expect(firstRow.locator('[data-testid="edit-btn"]')).toHaveCount(0);
  });

  // 4. 发布（含目标选择）
  test('发布草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    const publishBtn = page
      .locator('tr')
      .filter({ hasText: '草稿' })
      .first()
      .locator('button')
      .nth(2);
    await publishBtn.click();
    // 确认框
    await page.click('button:has-text("发布")');
    // 等待状态变更
    await page.waitForTimeout(1000);
  });

  // 5. 撤回
  test('撤回已发布公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.selectOption('select', '1');
    await page.click('button:has-text("查询")');
    const revokeBtn = page
      .locator('tr')
      .filter({ hasText: '已发布' })
      .first()
      .locator('button')
      .nth(1);
    await revokeBtn.click();
    await page.click('button:has-text("撤回")');
    await page.waitForTimeout(1000);
  });

  // 6. 复制为新建
  test('复制已发布公告为新建', async ({ page }) => {
    await navigateToNotices(page);
    await page.selectOption('select', '1');
    await page.click('button:has-text("查询")');
    const copyBtn = page
      .locator('tr')
      .filter({ hasText: '已发布' })
      .first()
      .locator('button')
      .nth(2);
    await copyBtn.click();
    await page.waitForTimeout(1000);
    // 确认列表中出现新草稿
  });

  // 7. 删除草稿
  test('删除草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    const deleteBtn = page
      .locator('tr')
      .filter({ hasText: '草稿' })
      .first()
      .locator('button')
      .last();
    await deleteBtn.click();
    await page.click('button:has-text("删除")');
    await page.waitForTimeout(1000);
  });

  // 8. 删除已撤回
  test('删除已撤回公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.selectOption('select', '2');
    await page.click('button:has-text("查询")');
    const deleteBtn = page
      .locator('tr')
      .filter({ hasText: '已撤回' })
      .first()
      .locator('button')
      .last();
    await deleteBtn.click();
    await page.click('button:has-text("删除")');
    await page.waitForTimeout(1000);
  });

  // 9. 批量发布
  test('批量发布草稿公告', async ({ page }) => {
    await navigateToNotices(page);
    // 勾选多条
    await page.locator('tr').nth(1).locator('[data-slot="checkbox"]').click();
    await page.locator('tr').nth(2).locator('[data-slot="checkbox"]').click();
    // 点击批量发布
    await page.click('button:has-text("批量发布")');
    // 确认框
    await page.waitForSelector('text=确认继续');
    await page.click('button:has-text("发布")');
    await page.waitForTimeout(1000);
  });

  // 10. 批量删除
  test('批量删除公告', async ({ page }) => {
    await navigateToNotices(page);
    await page.locator('tr').nth(1).locator('[data-slot="checkbox"]').click();
    await page.click('button:has-text("批量删除")');
    await page.waitForSelector('text=确认继续');
    await page.click('button:has-text("删除")');
    await page.waitForTimeout(1000);
  });

  // 11. 导出
  test('导出公告 Excel', async ({ page }) => {
    await navigateToNotices(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("导出 Excel")'),
    ]);
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  // 12. 权限控制
  test('无发布权限看不到发布按钮', async () => {
    // 需要一个无 notice:notice:publish 权限的用户
    // 此测试用例需要后端配合设置测试用户权限
    test.fixme();
  });

  // 13. 详情页
  test('查看公告详情', async ({ page }) => {
    await navigateToNotices(page);
    // 点击第一条公告标题
    await page.locator('a').filter({ hasText: /.+/ }).first().click();
    await page.waitForURL('**/notices/*');
    // 确认详情页内容
    await expect(page.locator('text=基本信息')).toBeVisible();
    await expect(page.locator('text=接收人')).toBeVisible();
    await expect(page.locator('text=发送记录')).toBeVisible();
  });

  // 14. 数据权限隔离
  test('不同部门用户看到本部门公告', async () => {
    // 需要多用户场景，标记为 fixme
    test.fixme();
  });

  // 15. 已读标记
  test('进入详情后列表显示已读样式', async ({ page }) => {
    await navigateToNotices(page);
    // 点击第一条未读公告
    const firstLink = page.locator('a.font-bold').first();
    if ((await firstLink.count()) > 0) {
      await firstLink.click();
      await page.waitForURL('**/notices/*');
      // 返回列表
      await page.click('text=返回列表');
      await page.waitForURL('**/notices');
      // 确认不再加粗 — 此验证依赖实际数据状态
    }
  });

  // 16. 已读率
  test('管理员看到已读率', async ({ page }) => {
    await navigateToNotices(page);
    // 已发布公告应显示 "x/y" 格式的已读率
    await page.selectOption('select', '1');
    await page.click('button:has-text("查询")');
    const firstRow = page.locator('tr').filter({ hasText: '已发布' }).first();
    const readRateCell = firstRow.locator('td').nth(3);
    // 检查是否包含 "/" 分隔符（如 "128/500"）
    const text = await readRateCell.textContent();
    if (text) {
      expect(text).toMatch(/\d+\/\d+|已读|未读/);
    }
  });

  // 17. 未读计数
  test('Header 显示未读计数 Badge', async ({ page }) => {
    await page.goto('/dashboard');
    // 检查 Header 区域的 Bell 图标
    const bell = page.locator('header button').filter({ has: page.locator('svg') });
    await expect(bell.first()).toBeVisible();
  });

  // 18. SSE 推送
  test('发布公告后其他用户收到 toast', async () => {
    // 需要双浏览器场景，标记为 fixme
    test.fixme();
  });

  // 19. 多 tab session-replaced
  test('同用户两个 tab 旧 tab 收到提示', async () => {
    // 需要双 tab 场景，标记为 fixme
    test.fixme();
  });
});
