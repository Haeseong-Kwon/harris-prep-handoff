import { expect, test, type Page } from '@playwright/test';
import { MOCK_ENDPOINT } from '../../playwright.config';

const LIVE = 'http://localhost:4402';

async function fillValid(page: Page) {
  await page.fill('#consult-name', '김보호');
  await page.fill('#consult-phone', '010-1234-5678');
  await page.selectOption('#consult-grade', '5');
  await page.check('input[name="consentPrivacy"]');
  await page.check('input[name="consentGuardian"]');
}

test.describe('before a consult endpoint is configured', () => {
  test('submission stays disabled and nothing is sent', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && posts.push(r.url()));
    await page.goto('/contact');
    const submit = page.locator('[data-submit]');
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText('카카오톡 채널 상담 예약 · 연결 대기');
    await expect(page.locator('.review')).toBeVisible();

    await fillValid(page);
    await page.locator('#consult-name').press('Enter');
    await expect(page.locator('[data-done]')).toBeHidden();
    expect(posts).toEqual([]);
    expect(page.url()).not.toContain('guardianName');
  });
});

test.describe('with a consult endpoint', () => {
  test('validates required fields and consents without sending', async ({ page }) => {
    let calls = 0;
    await page.route(MOCK_ENDPOINT, (route) => {
      calls += 1;
      return route.fulfill({ status: 201 });
    });
    await page.goto(`${LIVE}/contact`);
    await expect(page.locator('.review')).toHaveCount(0);

    await page.click('[data-submit]');
    await expect(page.locator('#consult-name-error')).toHaveText('보호자 성함을 입력해 주세요.');
    await expect(page.locator('#consult-phone-error')).not.toBeEmpty();
    await expect(page.locator('#consult-grade-error')).not.toBeEmpty();
    await expect(page.locator('#consult-privacy-error')).not.toBeEmpty();
    await expect(page.locator('#consult-guardian-error')).not.toBeEmpty();
    await expect(page.locator('#consult-name')).toBeFocused();
    await expect(page.locator('#consult-name')).toHaveAttribute('aria-invalid', '');

    await fillValid(page);
    await page.uncheck('input[name="consentGuardian"]');
    await page.click('[data-submit]');
    await expect(page.locator('#consult-guardian-error')).toHaveText('법정대리인 동의가 필요합니다.');
    await expect(page.locator('#consult-name-error')).toBeEmpty();
    expect(calls).toBe(0);
  });

  test('shows completion only after a successful server response', async ({ page }) => {
    let body: Record<string, unknown> = {};
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route(MOCK_ENDPOINT, async (route) => {
      body = route.request().postDataJSON();
      await gate;
      await route.fulfill({ status: 201 });
    });
    await page.goto(`${LIVE}/contact`);
    await fillValid(page);
    await page.fill('#consult-message', '희망 시기 문의');
    await page.click('[data-submit]');

    await expect(page.locator('[data-submit]')).toHaveText('접수 중…');
    await expect(page.locator('[data-submit]')).toBeDisabled();
    await expect(page.locator('[data-done]')).toBeHidden();
    release();

    await expect(page.locator('[data-done]')).toBeVisible();
    await expect(page.locator('[data-consult]')).toBeHidden();
    expect(body).toMatchObject({
      guardianName: '김보호',
      phone: '01012345678',
      grade: '5',
      message: '희망 시기 문의',
      consents: { privacy: true, guardian: true, marketing: false },
    });
    expect(body.submissionId).toEqual(expect.any(String));
    expect(page.url()).not.toContain('01012345678');
  });

  test('keeps input and allows retry with the same submission id after a failure', async ({ page }) => {
    const ids: unknown[] = [];
    let fail = true;
    await page.route(MOCK_ENDPOINT, (route) => {
      ids.push(route.request().postDataJSON().submissionId);
      return route.fulfill({ status: fail ? 500 : 201 });
    });
    await page.goto(`${LIVE}/contact`);
    await fillValid(page);
    await page.click('[data-submit]');

    await expect(page.locator('[data-status]')).toContainText('입력하신 내용은 그대로 남아 있습니다');
    await expect(page.locator('#consult-name')).toHaveValue('김보호');
    await expect(page.locator('input[name="consentGuardian"]')).toBeChecked();
    await expect(page.locator('[data-submit]')).toHaveText('다시 시도하기');

    fail = false;
    await page.click('[data-submit]');
    await expect(page.locator('[data-done]')).toBeVisible();
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  test('reports a network failure without losing input', async ({ page }) => {
    await page.route(MOCK_ENDPOINT, (route) => route.abort('internetdisconnected'));
    await page.goto(`${LIVE}/contact`);
    await fillValid(page);
    await page.click('[data-submit]');
    await expect(page.locator('[data-status]')).toContainText('네트워크 연결을 확인한 뒤');
    await expect(page.locator('#consult-phone')).toHaveValue('010-1234-5678');
  });
});
