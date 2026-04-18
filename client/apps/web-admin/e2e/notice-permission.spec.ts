import { expect, test } from '@playwright/test';

async function loginAsNoticeAuditor(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel('用户名').fill('notice-auditor');
  await page.getByLabel('密码').fill('admin123');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL('**/dashboard');
}

test('缺少通知查询权限时详情页不显示发送记录标签页', async ({ page }) => {
  await loginAsNoticeAuditor(page);

  const currentUser = await page.evaluate(async () => {
    const token = window.localStorage.getItem('mb_access_token');
    const response = await fetch('/api/v1/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return (await response.json()) as { permissions?: string[] };
  });

  expect(Array.isArray(currentUser.permissions)).toBe(true);
  expect(currentUser.permissions).toContain('notice:notice:detail');
  expect(currentUser.permissions).not.toContain('notification:notification:list');

  await page.goto('/notices/1');
  await page.waitForURL('**/notices/1');
  await expect(page.getByRole('heading', { name: '公告详情' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '接收人' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '发送记录' })).toHaveCount(0);
});
