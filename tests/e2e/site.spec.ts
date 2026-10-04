import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/program', '/school', '/care', '/about', '/guide', '/contact', '/privacy'];
const NAV = [
  ['/program', '프로그램'],
  ['/school', '학교'],
  ['/care', '현지 케어'],
  ['/about', '브랜드 소개'],
  ['/guide', '비용·FAQ'],
] as const;

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

test('pages are noindex until launch', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('header nav links to every section page and marks the current one', async ({ page, isMobile }) => {
  for (const [href, label] of NAV) {
    await page.goto(href);
    const scope = isMobile ? page.locator('#menu-drawer') : page.getByRole('navigation', { name: '주 메뉴' });
    if (isMobile) await page.click('[data-menu-open]');
    const link = scope.getByRole('link', { name: new RegExp(`^(\\d+ )?${label}`) }).first();
    await expect(link).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('sub page heroes show breadcrumb and caption every photo', async ({ page }) => {
  for (const [href, label] of [...NAV, ['/contact', '상담']] as const) {
    await page.goto(href);
    const hero = page.locator('section.hero').first();
    await expect(hero.getByRole('navigation', { name: '현재 위치' }).locator('[aria-current="page"]')).toHaveText(label);
    for (const fig of await hero.locator('figure').all()) {
      await expect(fig.locator('figcaption')).toContainText(/사진/);
    }
  }
});

test('home explore links are real document links', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('#explore-title ~ ul a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(['/program', '/school', '/care']);
});

test('J&C appears only in the about page partner card', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const outside = await page.evaluate(() => {
      const partner = document.getElementById('partner');
      return [...document.body.querySelectorAll('*')]
        .filter((el) => !partner?.contains(el) && el.children.length === 0)
        .some((el) => el.textContent?.includes('J&C'));
    });
    expect(outside, path).toBe(false);
  }
  await page.goto('/about');
  await expect(page.locator('#partner img')).toHaveCSS('width', '160px');
});

test('price is always marked as planned', async ({ page }) => {
  await page.goto('/guide');
  await expect(page.locator('#cost .price')).toHaveText(/3,900만 원\s*\(예정\)/);
});

test('guide FAQ has 8 items that can be open at the same time', async ({ page }) => {
  await page.goto('/guide');
  const items = page.locator('#faq details');
  await expect(items).toHaveCount(8);
  await items.nth(0).locator('summary').click();
  await items.nth(4).locator('summary').click();
  await expect(items.nth(0)).toHaveAttribute('open', '');
  await expect(items.nth(4)).toHaveAttribute('open', '');
});

test('journey has 8 steps grouped before / during / after school', async ({ page }) => {
  await page.goto('/program');
  await expect(page.locator('#journey li')).toHaveCount(8);
  await expect(page.locator('#overview dt')).toHaveCount(7);
  await expect(page.locator('#journey .phase-label')).toHaveText(['출국 전 · 준비', '현지 · 학교생활 최대 10주', '귀국 후']);
});

test.describe('concern diagnosis', () => {
  test('is single-select, updates answer and the tailored contact link, and sends no request', async ({ page }) => {
    await page.goto('/program');
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
    await expect(page.locator('[data-fit-cta]')).toHaveAttribute('href', '/contact?concern=3');
    expect(requests.filter((m) => m !== 'GET')).toEqual([]);
  });

  test('carries the selected concern into the contact form', async ({ page }) => {
    await page.goto('/program');
    await page.locator('[data-concern="0"]').click();
    await page.locator('[data-fit-cta]').click();
    await expect(page).toHaveURL(/\/contact\?concern=0$/);
    await expect(page.locator('#consult-message')).toHaveValue('학원은 다니는데, 말할 때는 멈춰요.');
  });

  test('contact ignores out-of-range or free-text concern params', async ({ page }) => {
    for (const q of ['?concern=9', '?concern=%3Cb%3Ex%3C%2Fb%3E', '?concern=1abc']) {
      await page.goto(`/contact${q}`);
      await expect(page.locator('#consult-message')).toHaveValue('');
    }
  });
});

test.describe('menu drawer', () => {
  test('opens as a modal dialog, closes on Escape and returns focus', async ({ page }) => {
    await page.goto('/school');
    const opener = page.locator('[data-menu-open]');
    const drawer = page.locator('#menu-drawer');
    await expect(drawer).toBeHidden();
    await opener.click();
    await expect(drawer).toBeVisible();
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer.getByRole('link', { name: /학교/ }).first()).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    await expect(opener).toBeFocused();
  });

  test('closes from the close button and navigates from a link', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-menu-open]');
    await page.click('[data-menu-close]');
    await expect(page.locator('#menu-drawer')).toBeHidden();
    await page.click('[data-menu-open]');
    await page.locator('#menu-drawer').getByRole('link', { name: /비용·FAQ/ }).click();
    await expect(page).toHaveURL(/\/guide$/);
  });

  test('inline nav is shown only on wide screens', async ({ page, isMobile }) => {
    await page.goto('/');
    const inline = page.getByRole('navigation', { name: '주 메뉴' });
    if (isMobile) await expect(inline).toBeHidden();
    else await expect(inline).toBeVisible();
  });
});

test('page nav highlights the section in view', async ({ page }) => {
  await page.goto('/guide');
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-page-nav] a[data-target="faq"]')).toHaveAttribute('aria-current', 'location');
  await page.locator('[data-page-nav] a[data-target="cost"]').click();
  await expect(page).toHaveURL(/#cost$/);
});

test('guide FAQ filters by category and expands all visible items', async ({ page }) => {
  await page.goto('/guide');
  const items = page.locator('#faq details');
  await page.click('[data-filter="cost"]');
  await expect(page.locator('[data-filter="cost"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(items.locator('visible=true')).toHaveCount(2);
  await page.click('[data-expand]');
  await expect(page.locator('#faq details[open]')).toHaveCount(2);
  await expect(page.locator('[data-expand]')).toHaveText('모두 접기');
  await page.click('[data-filter="all"]');
  await expect(items.locator('visible=true')).toHaveCount(8);
});

test('home shows a 3-question FAQ preview linking to the full list', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#faq details')).toHaveCount(3);
  await expect(page.locator('#faq a[href="/guide#faq"]')).toBeVisible();
});

test('school photos open in a lightbox with keyboard navigation', async ({ page }) => {
  await page.goto('/school');
  await page.locator('[data-lightbox]').first().click();
  const dialog = page.locator('[data-lightbox-dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-lightbox-count]')).toHaveText('1 / 3');
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('[data-lightbox-count]')).toHaveText('2 / 3');
  await expect(dialog.locator('[data-lightbox-caption]')).toContainText('참고 사진');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('back-to-top appears after scrolling and returns to the top', async ({ page }) => {
  await page.goto('/about');
  const button = page.locator('[data-to-top]');
  await expect(button).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
});

test('anchors are not hidden under the sticky header', async ({ page }) => {
  await page.goto('/program#diagnosis');
  const [headerBottom, headingTop] = await Promise.all([
    page.locator('.site-header').evaluate((e) => e.getBoundingClientRect().bottom),
    page.locator('#diagnosis-title').evaluate((e) => e.getBoundingClientRect().top),
  ]);
  expect(headingTop).toBeGreaterThanOrEqual(headerBottom);
});

for (const width of [320, 390, 760, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}

test('smooth scroll is disabled under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'smooth');
});

test('pages have no automatically detectable accessibility violations', async ({ page }) => {
  // 스크롤 등장 효과(opacity 0)를 끈 상태에서 검사한다.
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
