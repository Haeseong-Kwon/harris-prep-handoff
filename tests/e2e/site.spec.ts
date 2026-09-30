import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/program', '/care', '/cost', '/faq', '/privacy'];
const SECTION_IDS = ['diagnosis', 'compare', 'journey', 'school', 'care', 'people', 'cohort', 'partner', 'cost', 'faq', 'consult'];

test('home renders hero plus all 11 numbered sections in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/배운 영어를 써보는 곳/);
  const ids = await page.locator('main > section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(SECTION_IDS);
  await expect(page.locator('#diagnosis [data-concern]')).toHaveCount(4);
  await expect(page.locator('#faq details')).toHaveCount(8);
  await expect(page.locator('#journey li')).toHaveCount(8);
});

test('every page has one h1, no duplicate ids, and images with alt that load', async ({ page, request }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('h1'), path).toHaveCount(1);
    const dupes = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(dupes, path).toEqual([]);
    const imgs = await page.locator('img').evaluateAll((els) => els.map((i) => ({ src: (i as HTMLImageElement).src, alt: i.getAttribute('alt') })));
    for (const img of imgs) {
      expect(img.alt, img.src).toBeTruthy();
      expect((await request.get(img.src)).ok(), img.src).toBe(true);
    }
  }
});

test('J&C appears only in the partner section', async ({ page }) => {
  await page.goto('/');
  const outside = await page.evaluate(() => {
    const partner = document.getElementById('partner');
    return [...document.body.querySelectorAll('*')]
      .filter((el) => !partner?.contains(el) && el.children.length === 0)
      .some((el) => el.textContent?.includes('J&C'));
  });
  expect(outside).toBe(false);
});

test('price is always marked as planned', async ({ page }) => {
  await page.goto('/cost');
  await expect(page.locator('#cost .price')).toHaveText(/3,900만 원\s*\(예정\)/);
});

test.describe('concern diagnosis', () => {
  test('is single-select, updates answer and CTA, and sends no request', async ({ page }) => {
    await page.goto('/');
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.method()));
    const cards = page.locator('[data-concern]');
    await expect(page.locator('[data-answer]')).toBeHidden();

    await cards.nth(1).click();
    await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-fit-cta]')).toHaveText('현지 돌봄 범위 확인하기');

    await cards.nth(3).click();
    await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await expect(cards.nth(3)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-answer-text]')).toContainText('특정 학교 합격이나 입시 성과를 약속하지 않으며');
    await expect(page.locator('[data-fit-cta]')).toHaveText('참가 시기 상담하기');
    expect(requests.filter((m) => m !== 'GET')).toEqual([]);
  });

  test('prefills the message but never overwrites user edits', async ({ page }) => {
    await page.goto('/');
    const message = page.locator('#consult-message');
    await page.locator('[data-concern="0"]').click();
    await expect(message).toHaveValue('학원은 다니는데, 말할 때는 멈춰요.');
    await page.locator('[data-concern="2"]').click();
    await expect(message).toHaveValue('캠프 이후, 무엇이 남았는지 모르겠어요.');

    await message.fill('비용도 궁금합니다');
    await page.locator('[data-concern="3"]').click();
    await expect(message).toHaveValue('비용도 궁금합니다');
  });

  test('fit CTA moves to the consultation section below the sticky header', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-concern="0"]').click();
    await page.locator('[data-fit-cta]').click();
    await expect(page).toHaveURL(/#consult$/);
    const heading = page.locator('#consult-title');
    await expect(heading).toBeInViewport();
    const [headerBottom, headingTop] = await Promise.all([
      page.locator('header.bar').evaluate((e) => e.getBoundingClientRect().bottom),
      heading.evaluate((e) => e.getBoundingClientRect().top),
    ]);
    expect(headingTop).toBeGreaterThanOrEqual(headerBottom);
  });
});

test('FAQ items can be open at the same time', async ({ page }) => {
  await page.goto('/faq');
  const items = page.locator('#faq details');
  await items.nth(0).locator('summary').click();
  await items.nth(4).locator('summary').click();
  await expect(items.nth(0)).toHaveAttribute('open', '');
  await expect(items.nth(4)).toHaveAttribute('open', '');
});

test('topic pages show only their FAQ subset', async ({ page }) => {
  await page.goto('/cost');
  await expect(page.locator('#faq details')).toHaveCount(3);
  await page.goto('/care');
  await expect(page.locator('#faq details')).toHaveCount(2);
});

test('header nav marks the current page', async ({ page }) => {
  await page.goto('/program');
  await expect(page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '과정 안내' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('pages without a consult section link to the home consult section', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('header.bar .reserve')).toHaveAttribute('href', '/#consult');
});

for (const width of [320, 375, 390, 480, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}

test.describe('mobile contact bar', () => {
  test('is fixed on mobile, does not cover the footer, and hides over the consult form', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    // 상담 섹션이 없는 페이지에서는 끝까지 스크롤해도 바가 보이므로 푸터 겹침을 확인할 수 있다.
    await page.goto('/privacy');
    const bar = page.locator('[data-contact-bar]');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveCSS('position', 'fixed');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(bar).toBeVisible();
    const [barTop, footerBottom] = await Promise.all([
      bar.evaluate((e) => e.getBoundingClientRect().top),
      page.locator('footer').evaluate((e) => e.getBoundingClientRect().bottom),
    ]);
    expect(footerBottom).toBeLessThanOrEqual(barTop + 1);

    await page.goto('/');
    await expect(bar).toBeVisible();
    await page.locator('#consult-name').scrollIntoViewIfNeeded();
    await expect(bar).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeVisible();
  });

  test('is hidden on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/');
    await expect(page.locator('[data-contact-bar]')).toBeHidden();
  });
});

test('smooth scroll is disabled under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
});

test('pages have no automatically detectable accessibility violations', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      path,
    ).toEqual([]);
  }
});

test('unknown routes render the 404 page', async ({ page }) => {
  const res = await page.goto('/nope');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('페이지를 찾을 수 없습니다.');
});
