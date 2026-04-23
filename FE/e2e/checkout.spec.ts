import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));

    // Setup cart in localStorage
    await page.goto('http://127.0.0.1:3000/');
    await page.evaluate(() => {
      const cartState = {
        state: {
          items: [
            {
              medicineId: 1,
              name: 'Panadol Extra',
              slug: 'panadol-extra',
              imageUrl: '/panadol.jpg',
              quantity: 2,
              unit: 'Hộp',
              unitPrice: 35000,
              totalPrice: 70000,
            }
          ],
          totalAmount: 70000,
        },
        version: 0
      };
      localStorage.setItem('medcare-cart-storage', JSON.stringify(cartState));
    });
  });

  async function loginAndGoToCheckout(page) {
    // Mock session API
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { 
            name: 'Test User', 
            email: 'test@example.com',
            accessToken: 'fake-access-token',
            userId: 1
          },
          expires: '2030-01-01T00:00:00.000Z',
        }),
      });
    });

    await page.goto('http://127.0.0.1:3000/dang-nhap');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://127.0.0.1:3000/');
  }

  test('should complete checkout with COD', async ({ page }) => {
    await loginAndGoToCheckout(page);

    await page.route('**/users/profiles/me/addresses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            receiverName: 'Test User',
            receiverPhone: '0987654321',
            fullAddress: '123 Test St',
            city: 'Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            isDefault: true
          }
        ]),
      });
    });

    await page.goto('http://127.0.0.1:3000/thanh-toan?ids=1');
    await expect(page.locator('text=123 Test St').first()).toBeVisible();
    await page.click('text=Thanh toán tiền mặt khi nhận hàng >> nth=0');

    await page.route('**/orders/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1001 }),
      });
    });

    await page.click('text=XÁC NHẬN ĐẶT HÀNG >> nth=0');
    await expect(page).toHaveURL(/\/xac-nhan-don-hang\?id=1001/);
    await expect(page.locator('text=Đặt hàng thành công').first()).toBeVisible();
  });

  test('should show error when required fields are missing', async ({ page }) => {
    await loginAndGoToCheckout(page);

    await page.route('**/users/profiles/me/addresses', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('http://127.0.0.1:3000/thanh-toan?ids=1');
    const orderBtn = page.locator('text=XÁC NHẬN ĐẶT HÀNG').first();
    await expect(orderBtn).toBeDisabled();
    await expect(page.locator('text=Chưa có địa chỉ nhận hàng').first()).toBeVisible();
  });
});
