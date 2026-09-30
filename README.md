# HARRIS PREP 웹사이트

톡픽의 호주 사립학교 단기유학 브랜드 HARRIS PREP 사이트. 운영 주체 (주)톡픽글로벌.
디자인 전달 패키지(`docs/handoff/`)의 랜딩 시안과 디자인 규칙을 Astro 정적 사이트로 확장 구현했다.

## 실행

```sh
mise run setup      # pnpm install + Playwright Chromium
mise run dev        # http://localhost:4321
mise run check      # 타입 체크 + 단위 테스트
mise run ci         # 타입 체크 + 단위 테스트 + E2E
pnpm build          # dist/ 정적 산출물
```

## 페이지

| 경로 | 구성 |
|---|---|
| `/` | 시안 12개 섹션 전체 (Hero → 진단 → 비교 → 여정 → 학교 → 돌봄 → 운영자 → 1기 → 파트너 → 비용 → FAQ → 상담) |
| `/program` | 비교 · 여정 · 학교 · 과정 FAQ · 상담 |
| `/care` | 돌봄 · 운영자 · 1기 · 파트너 · 돌봄 FAQ · 상담 |
| `/cost` | 비용 · 비용/환불/선발 FAQ · 상담 |
| `/faq` | FAQ 8개 · 상담 |
| `/privacy` | 개인정보 처리방침 슬롯 ([자료 대기]) |

섹션은 `src/components/`의 컴포넌트 하나씩이며 페이지 간에 재사용한다. 카피는 `src/data/site.ts` 한 곳에 있다 (원문: `docs/handoff/COPY.md`).

## 디자인 시스템

`src/styles/tokens.css`에 토큰으로 정리했다. 시안 CSS의 누적 오버라이드는 최종 레이어 기준으로 통합했다.

- 색: 기본 `#0C2340`, 포인트 `#2463EB` 하나. 흰 배경 / 중립(`--color-muted`) / 틴트 / 남색 강조 구간으로 흐름을 구분
- 제목 26~48px(`clamp`), 본문 15px, 보조 최소 11px, 터치 영역 최소 44px
- 사진 라운드 18px, 카드 12~16px
- 모바일 480px 이하 기준 시안을 유지하고, 데스크톱(960px+)은 히어로 2열·진단 4열·돌봄 3열로 확장. 콘텐츠 최대 폭 1080px
- 보조 텍스트 색은 연한 배경 위에서 WCAG AA를 맞추려고 시안보다 조금 진하게 조정 (`--color-text-3`)

## 운영 설정 (환경변수)

`.env.example` 참고. 둘 다 비어 있으면 시안과 같은 "접수 연결 대기" 상태로 빌드된다.

| 변수 | 비었을 때 | 설정했을 때 |
|---|---|---|
| `PUBLIC_CONSULT_ENDPOINT` | 제출 비활성, 상단 검토 배너 표시, 전송 없음 | 폼 검증 후 JSON POST, 서버 2xx 이후에만 완료 표시 |
| `PUBLIC_KAKAO_CHANNEL_URL` | 하단 고정바 버튼은 "상담 신청"(상담 섹션 이동) | "카카오톡 상담" 외부 링크 + 상담 섹션 연락처에 추가 |

### 상담 접수 endpoint 계약

```http
POST {PUBLIC_CONSULT_ENDPOINT}
Content-Type: application/json
Idempotency-Key: <submissionId>

{
  "submissionId": "uuid — 페이지당 1개, 재시도해도 동일",
  "guardianName": "보호자 성함 (≤30자)",
  "phone": "01012345678 (하이픈 제거된 휴대전화)",
  "grade": "4" | "5" | "6",
  "message": "상담 내용 (≤500자, 선택)",
  "consents": { "privacy": true, "guardian": true, "marketing": false }
}
```

- 2xx면 완료, 그 외 상태나 네트워크 오류면 입력을 그대로 둔 채 재시도를 안내한다.
- 서버에서 처리할 것: 같은 필드 규칙으로 재검증, `submissionId` 기준 중복 제거, rate limit, 사이트 origin만 허용하는 CORS, 보유·삭제 정책. 쿠키를 보내지 않으므로(`credentials: omit`) CSRF 토큰은 필요 없다.
- 개인정보는 URL·콘솔·분석 이벤트에 남기지 않는다. 폼은 `method="post"`이고, JS가 없으면 제출 버튼이 비활성 상태로 남는다.
- 숨김 필드 `company`(봇 차단용)가 채워진 요청은 클라이언트에서 버린다.

## 테스트

- `tests/unit/` (Vitest): 폼 검증, 전송 payload, 성공·실패 처리, 진단 문구 자동 입력 규칙
- `tests/e2e/` (Playwright, 모바일 Pixel 7 + 데스크톱 Chrome): 12개 섹션, 진단 단일 선택과 aria 상태, 입력 덮어쓰기 방지, 앵커가 sticky 헤더에 가리지 않는지, FAQ 여러 개 동시 펼침, 320~1440px 가로 넘침 없음, 모바일 고정바(푸터·폼 겹침), reduced-motion, axe WCAG 2.1 AA, 404, 접수 연결 전/후 두 빌드의 상담 흐름
- E2E는 두 빌드(`dist-e2e-pending`, `dist-e2e-live`)를 만들어 `scripts/serve-static.mjs`로 띄운다. Astro 7의 `astro preview`는 머신당 하나만 뜨는 데몬이라 두 개를 동시에 띄울 수 없다. endpoint 요청은 `page.route`로 가로채므로 실제로 외부에 나가지 않는다.

## 공개 전 남은 일

- `docs/handoff/CONTENT-CHECKLIST.md`의 미확정 항목. 화면에는 `[자료 대기]`로 남아 있고, 거짓 정보로 채우지 않는다.
- 접수 endpoint, 카카오톡 채널 URL, 개인정보 정책 전문, 사업자 표기
- 호스팅 결정 후 보안 헤더 설정 (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`). 외부 리소스는 Pretendard CDN(jsDelivr) 하나다.
- 실기기 검수: iOS safe-area, 가상 키보드, 200% 확대

## 참고 자료

`docs/handoff/`에 원본 전달 패키지를 그대로 보관한다 (`index.html` 시안, `SPEC.md`, `COPY.md`, 사진 출처 `credits.json`).
