import { defineConfig, devices } from '@playwright/test';

// 두 빌드를 띄운다: 접수 연결 전(기본 공개 상태)과 접수 endpoint가 설정된 상태.
// 설정된 빌드의 endpoint는 테스트에서 page.route로 가로채므로 실제 네트워크 요청은 없다.
export const MOCK_ENDPOINT = 'https://consult.test/api/consult';

// 빌드는 캐시 충돌을 피하려고 순차 실행하고, 정적 서버 두 개를 동시에 띄운다.
const serve = [
  'OUT_DIR=dist-e2e-pending pnpm build',
  `PUBLIC_CONSULT_ENDPOINT=${MOCK_ENDPOINT} OUT_DIR=dist-e2e-live pnpm build`,
  '(node scripts/serve-static.mjs dist-e2e-pending 4401 & node scripts/serve-static.mjs dist-e2e-live 4402 & wait)',
].join(' && ');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { trace: 'retain-on-failure' },
  webServer: [
    { command: serve, url: 'http://localhost:4402', reuseExistingServer: !process.env.CI, timeout: 180_000 },
    // 같은 프로세스가 띄운 4401이 준비될 때까지 기다리기만 한다.
    { command: 'tail -f /dev/null', url: 'http://localhost:4401', reuseExistingServer: true, timeout: 180_000 },
  ],
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4401' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4401' } },
  ],
});
