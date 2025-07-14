import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://www.yeoshin.co.kr/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/여신티켓/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://www.yeoshin.co.kr/');

  await page.getByRole('link', { name: '마이 마이' }).click();

  // await expect(page.getByText("포인트")).toBeVisible();
});

test('wait 5seconds', async ({ page }) => {
  function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  await page.goto('https://www.yeoshin.co.kr/');

  // await sleep(5);

  throw new Error('This is an error message for testing purposes.');
});
