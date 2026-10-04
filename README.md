# HARRIS PREP 웹사이트

톡픽의 호주 사립학교 단기유학 브랜드 HARRIS PREP 사이트. 운영 주체 (주)톡픽글로벌.
팀원의 7페이지 웹사이트 시안(`docs/handoff-website/`, 2026-10-02)을 Astro 정적 사이트로 구현했다.
`docs/handoff/`는 그 이전의 단일 랜딩 시안이며 참고용으로만 보관한다.

## 실행

```sh
mise run setup      # pnpm install + Playwright Chromium
mise run dev        # http://localhost:4321
mise run check      # 타입 체크 + 단위 테스트
mise run ci         # 타입 체크 + 단위 테스트 + E2E
pnpm build          # dist/ 정적 산출물
```

## 페이지

| 경로 | 구성 (DEVELOPER-SPEC 정보 구조) |
|---|---|
| `/` | HomeHero(+핵심 사실 4개) · ExploreLinks · 학교 소개 · 모브랜드 소개 |
| `/program` | ComparisonTable · Journey(준비/학교생활/귀국 구분) · ConcernDiagnosis |
| `/school` | SchoolProfile · SchoolGallery(협업사 참고 사진) |
| `/care` | CareBlocks (확정 운영 / 확인 중인 운영 범위 구분) |
| `/about` | 운영진 · 1기 기록 · PartnerCard(이 페이지 하단 한 곳만) |
| `/guide` | 비용·납부 · FAQ 8개 |
| `/contact` | 연락처 · ConsultationForm (`?concern=0..3`으로 진단 결과 수신) |
| `/privacy` | 개인정보 처리방침 슬롯 ([자료 대기]) |

모든 페이지는 PageTitle → 본문 → PageCta(상담 띠) 순서이며, 공개 전까지 `noindex`다 (`src/layouts/Base.astro`).
카피는 `src/data/site.ts` 한 곳에 있다 (원문: `docs/handoff-website/COPY.md`).

## 디자인 시스템

`src/styles/tokens.css` — 시안의 디자인 토큰을 그대로 옮겼다.

- 색: 남색 `#0C2340` / 하늘색 `#B8D4E8` / 파생 면 `#EDF4F8` / 보조 글자 `#506477`. 면은 흰색·남색·옅은 하늘색만 쓰고, 카드를 반복하기보다 구분선과 여백으로 계층을 만든다
- 본문 16px·행간 1.75, 메뉴·레이블 14px, 출처 12px, 제목은 clamp
- 본문 최대 폭 1200px, 헤더 1280px, 좌우 여백 40px(모바일 25px), 분기점 1000px·760px
- 시안 대비 다듬은 점: sticky 헤더, 메뉴 hover 밑줄·현재 메뉴 표시, 아이콘 토글 모바일 메뉴, 버튼·링크 화살표 모션(reduced-motion이면 끔), 여정 3구간 묶음, 확정/미확정 케어 구분, 연락처 2열 상담 레이아웃, Pretendard 서체
- 협업사 로고 원본은 투명 영역이 검정으로 저장되어 있어 흰 배경에서 읽히지 않는다. `public/assets/jc-partner-logo.png`는 검정을 투명으로 복원한 사본이고, 원본은 `docs/handoff-website/assets/`에 그대로 있다

## 운영 설정 (환경변수)

`.env.example` 참고. 둘 다 비어 있으면 시안과 같은 "접수 연결 대기" 상태로 빌드된다.

| 변수 | 비었을 때 | 설정했을 때 |
|---|---|---|
| `PUBLIC_CONSULT_ENDPOINT` | 제출 비활성, 상단 검토 배너 표시, 전송 없음 | 폼 검증 후 JSON POST, 서버 2xx 이후에만 완료 표시 |
| `PUBLIC_KAKAO_CHANNEL_URL` | 상담 페이지에 "채널 연결 대기" 표시 | 상담 페이지 연락처에 카카오톡 채널 링크 |

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

- `tests/unit/` (Vitest): 폼 검증, 전송 payload, 성공·실패 처리, `?concern=` 파라미터 검증
- `tests/e2e/` (Playwright, 모바일 Pixel 7 + 데스크톱 Chrome): 8개 페이지 h1·중복 ID·이미지, 메뉴 현재 표시, 모바일 메뉴 토글·Escape, 진단 단일 선택과 상담 페이지 전달, 범위 밖 쿼리 무시, FAQ 동시 펼침, 파트너 노출 위치, 320~1440px 가로 넘침, reduced-motion, axe WCAG 2.1 AA, 404, 접수 연결 전/후 상담 흐름
- E2E는 두 빌드(`dist-e2e-pending`, `dist-e2e-live`)를 만들어 `scripts/serve-static.mjs`로 띄운다. Astro 7의 `astro preview`는 머신당 하나만 뜨는 데몬이라 두 개를 동시에 띄울 수 없다. endpoint 요청은 `page.route`로 가로채므로 실제로 외부에 나가지 않는다.

## 공개 전 남은 일

- `docs/handoff-website/CONTENT-CHECKLIST.md`·`SOURCE-REVIEW.md`의 미확정 항목 (특히 운영 법인 표기 차이). 화면에는 `[자료 대기]`로 남아 있고, 거짓 정보로 채우지 않는다.
- 접수 endpoint, 카카오톡 채널 URL, 개인정보 정책 전문, 사업자 표기
- 공개 검수 후 `noindex` 제거
- 호스팅 결정 후 보안 헤더 설정 (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`). 외부 리소스는 Pretendard CDN(jsDelivr) 하나다.
- 실기기 검수: 가상 키보드, 200% 글자 확대, 뒤로가기

## 참고 자료

- `docs/handoff-website/`: 현재 기준 웹사이트 시안 원본 (7개 HTML, DEVELOPER-SPEC, COPY, SOURCE-REVIEW, 사진 권한 `assets/credits.json`)
- `docs/handoff/`: 이전 단일 랜딩 시안 (상담 구현 계약 `SPEC.md`는 여전히 유효)
