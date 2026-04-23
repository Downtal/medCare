import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dang-nhap');
  });

  test('should show validation errors when fields are empty', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Vui lòng nhập email hoặc số điện thoại')).toBeVisible();
    await expect(page.locator('text=Vui lòng nhập mật khẩu')).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // The component shows error from API
    await expect(page.locator('text=Tài khoản hoặc mật khẩu không chính xác.')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.click('text=Đăng ký');
    await expect(page).toHaveURL(/\/dang-ky/);
  });

  test('should login successfully with mocked credentials', async ({ page }) => {
    // Mock the session check
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Test User', email: 'test@example.com' },
          expires: '2030-01-01T00:00:00.000Z',
        }),
      });
    });

    // Mock the login POST
    await page.route('**/api/auth/callback/credentials*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'http://127.0.0.1:3000/' }),
      });
    });

    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to home
    await expect(page).toHaveURL('http://127.0.0.1:3000/');
  });
});
