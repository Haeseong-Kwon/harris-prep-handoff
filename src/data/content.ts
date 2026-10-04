// 페이지 확장 콘텐츠. 원칙: docs/handoff-website/CONTENT-CHECKLIST.md의 "확정" 항목과
// COPY.md 원문만 사실로 쓴다. 미확정 항목은 질문·체크리스트 형태로만 노출하고 답을 지어내지 않는다.

export interface Point {
  title: string;
  body: string;
}

/** 메뉴 사이드바: 페이지별 한 줄 설명 (COPY.md 페이지 리드 문장 기반) */
export const menuDescriptions: Record<string, string> = {
  '/program': '과정의 차이와 준비부터 귀국까지의 흐름',
  '/school': '입스위치 그래머 스쿨과 학교생활 참고 사진',
  '/care': '현지 상주 코칭과 주간 리포트, 돌봄 범위',
  '/about': '브랜드와 운영진, 첫 과정 기록, 현지 파트너',
  '/guide': '예정 비용과 납부 구조, 자주 묻는 질문',
};

/** 홈: 학교생활이 체험과 다른 점 (비교표 확정 항목) */
export const whySchoolLife: Point[] = [
  { title: '현지 학교 학생과 같은 교실', body: '캠프 참가자나 어학 과정 수강생이 아니라, 현지 학교 학생과 함께 정규 수업에 앉습니다.' },
  { title: '교복·시간표·과제가 같습니다', body: '활동 일정이 아닌 학교 시간표를 따릅니다. 학교 텀 기준 최대 10주 동안 정규 학기에 참여합니다.' },
  { title: '부모 동행 없이, 소식은 가까이', body: '현지에서는 상주 코칭으로, 한국에서는 주간 리포트로 학교생활을 전합니다.' },
];

/** 홈: 진행 흐름 요약 (Journey 8단계 중 확정 순서) */
export const howItWorks: Point[] = [
  { title: '상담', body: '학년·희망 시기·참가 목적을 상담합니다.' },
  { title: '선발 인터뷰', body: '소수 선발제로 운영합니다. 인터뷰 방식은 확인 후 안내합니다.' },
  { title: '출국 준비', body: '비자·출국 준비 범위와 일정은 확인 후 안내합니다.' },
  { title: '학교생활', body: '학교 텀 기준 최대 10주, 현지 학생과 같은 정규 수업에 참여합니다.' },
];

/** 프로그램: 한눈에 보기 (모두 확정 항목) */
export const programFacts: [string, string][] = [
  ['대상', '초등 4~6학년 대상 상담'],
  ['학교', 'Ipswich Grammar School · 호주 퀸즐랜드주'],
  ['기간', '학교 텀 기준 최대 10주'],
  ['수업', '정규 수업 편입 · 교복·시간표·과제 동일'],
  ['동행', '부모 동행 없이 진행'],
  ['케어', '현지 상주 코칭 · 주간 리포트'],
  ['선발', '소수 선발제'],
];

/** 학교: 현지 학생과 같은 것 (확정) */
export const sameAsLocal: Point[] = [
  { title: '교복', body: '현지 학생과 같은 교복을 입고 등교합니다.' },
  { title: '시간표', body: '별도 활동 일정이 아닌 학교 시간표를 따릅니다.' },
  { title: '과제', body: '정규 수업의 과제를 현지 학생과 같이 수행합니다.' },
  { title: '교실', body: '현지 학교 학생과 같은 정규 수업에 참여합니다.' },
];

/** 학교: 확인 중인 학교 정보 (CONTENT-CHECKLIST 미확정) */
export const schoolPending: string[] = [
  '대상 학년·성별·참가 자격',
  '학교 평가·기록 제공 범위',
  '학교 공식 확인 자료',
  '학교별 특장점 및 추가 학교 정보',
];

/** 현지 케어: 떨어져 있는 동안의 흐름 */
export const careFlow: (Point & { pending?: boolean })[] = [
  { title: '출국 전', body: '숙소·야간 돌봄·긴급 연락 범위를 신청 전에 함께 검토합니다.' },
  { title: '현지에서', body: '현지 상주 코칭으로 낯선 학교생활 적응을 돕습니다.' },
  { title: '매주', body: '주간 리포트로 현지 학교생활을 부모에게 전합니다.' },
  { title: '귀국', body: '귀국 인솔·인계 절차는 확인 후 안내합니다.', pending: true },
];

/** 현지 케어: 상담에서 꼭 확인할 질문 (CONTENT-CHECKLIST 미확정 항목을 질문으로) */
export const careQuestions: string[] = [
  '숙소·식사·통학은 어떻게 운영되나요?',
  '코칭 담당자는 누구이며, 근무 시간과 야간 돌봄은 어떻게 되나요?',
  '아프거나 다쳤을 때 비상 연락·의료기관·보험은 어떻게 연결되나요?',
  '보호자에게는 언제, 어떤 방식으로 알리나요?',
  '주간 리포트는 어떤 양식으로, 무슨 요일에, 어느 채널로 받나요?',
];

/** 브랜드 소개: 모브랜드 → 학교 연계 과정 구조 */
export const brandStructure: (Point & { label: string })[] = [
  { label: 'TALKPIC', title: '집에서 시작하는 영어', body: '톡픽의 영어교육 경험이 HARRIS PREP의 출발점입니다.' },
  { label: 'HARRIS PREP', title: '세계의 교실에서 이어가는 영어', body: '익힌 영어를, 영어만 쓰는 교실에서 사용하는 별도 학교 연계 과정입니다.' },
];

/** 브랜드 소개: 정보 공개 원칙 (DEVELOPER-SPEC·SPEC의 브랜드·카피 고정 규칙) */
export const principles: Point[] = [
  { title: '확인된 사실만 안내합니다', body: '학교·기간·수업 방식처럼 확정된 정보만 사실로 표기합니다.' },
  { title: '확인 중인 정보는 숨기지 않습니다', body: '아직 정해지지 않은 항목은 ‘자료 대기’로 표시하고, 확정되는 대로 공개합니다.' },
  { title: '성과와 후기는 증빙 후 공개합니다', body: '귀국 후 성과와 후기는 증빙과 학생·보호자 공개 동의를 확인한 뒤 사용합니다.' },
  { title: '합격이나 성과를 약속하지 않습니다', body: '특정 학교 합격이나 입시 성과를 약속하지 않으며, 참가 시기가 적절한지 함께 상담합니다.' },
];

/** 비용·FAQ: 납부 흐름 (확정 + 대기) */
export const paymentFlow: (Point & { pending?: boolean })[] = [
  { title: '상담', body: '최종 총액·포함 항목·동행 여부를 상담 시 안내합니다.' },
  { title: '예약금', body: '350만 원. 총액 포함 여부와 납부 시점은 확인 후 안내합니다.' },
  { title: '학비 납부', body: '분할납부가 가능합니다. 납부 일정은 확인 후 안내합니다.' },
  { title: '별도 비용', body: '마스터클래스와 항공료는 별도입니다.' },
];

/** 비용·FAQ: 신청 전 확인할 비용 항목 */
export const costQuestions: string[] = [
  '예약금이 총액에 포함되나요?',
  '숙소·식사·보험·비자 비용은 포함인가요, 별도인가요?',
  '출국 전후 취소 시 환불 규정은 어떻게 되나요?',
  '선발에서 탈락하면 예약금은 어떻게 처리되나요?',
];

/** FAQ 분류 (guide 필터). 항목별 분류는 site.ts faqs[].category */
export const faqCategories = [
  { id: 'join', label: '참가·선발' },
  { id: 'life', label: '생활·안전' },
  { id: 'admin', label: '학교·행정' },
  { id: 'cost', label: '비용·환불' },
] as const;


/** 상담: 진행 방식 */
export const consultFlow: Point[] = [
  { title: '상담 신청', body: '아래 양식, 전화 또는 이메일로 남겨주세요.' },
  { title: '일정 안내', body: '남겨주신 연락처로 상담 일정을 안내드립니다.' },
  { title: '상담', body: '참가 가능 시기와 준비 조건, 돌봄 범위와 비용을 함께 확인합니다.' },
];

/** 상담: 준비하면 좋은 것 */
export const consultPrep: string[] = [
  '자녀 학년과 지금의 영어 사용 경험',
  '희망 출국 시기와 재학 중인 학교의 일정',
  '부모 동행 없이 지내는 것에 대한 아이의 생각',
  '비용·환불·돌봄 범위 중 꼭 확인하고 싶은 질문',
];

/** 홈: FAQ 미리보기 (faqs 인덱스) */
export const homeFaqIndexes = [0, 1, 4] as const;
