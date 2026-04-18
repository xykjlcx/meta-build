import { type Page, expect, test } from '@playwright/test';

const STYLES = ['classic', 'lark-console', 'claude-warm'] as const;
const PRESETS = ['inset', 'mix', 'claude-classic', 'claude-inset', 'claude-rail'] as const;
const COLOR_MODES = ['light', 'dark'] as const;

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('用户名').fill('admin');
  await page.getByLabel('密码').fill('admin123');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL('**/dashboard');
}

for (const style of STYLES) {
  for (const preset of PRESETS) {
    for (const mode of COLOR_MODES) {
      test(`${style} × ${preset} × ${mode}`, async ({ page }) => {
        // 先登录一次进入 dashboard，拿到 token 后再注入 style/preset/colorMode
        await login(page);
        await page.evaluate(
          ([s, p, m]) => {
            localStorage.setItem('mb_style', s);
            localStorage.setItem('mb_layout_preset', p);
            localStorage.setItem('mb_color_mode', m);
          },
          [style, preset, mode],
        );
        await page.reload();
        // 等 claude-warm 注册 + preset 注册完成（Vite HMR / dynamic import 稳定化）
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`${style}-${preset}-${mode}.png`, {
          maxDiffPixels: 300,
          fullPage: false,
        });
      });
    }
  }
}
