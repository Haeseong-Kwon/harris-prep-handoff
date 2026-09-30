// 상담 신청 폼 검증·전송. SPEC.md "상담 구현 계약" 기준.
// 자녀 실명·생년월일은 받지 않는다. 개인정보는 URL·콘솔·분석 이벤트에 넣지 않는다.

export const GRADES = ['4', '5', '6'] as const;
export type Grade = (typeof GRADES)[number];

export const LIMITS = { name: 30, message: 500 } as const;

export interface ConsultInput {
  guardianName: string;
  phone: string;
  grade: string;
  message: string;
  consentPrivacy: boolean;
  consentGuardian: boolean;
  consentMarketing: boolean;
}

export type ConsultField = 'guardianName' | 'phone' | 'grade' | 'message' | 'consentPrivacy' | 'consentGuardian';
export type ConsultErrors = Partial<Record<ConsultField, string>>;

export interface ConsultPayload {
  submissionId: string;
  guardianName: string;
  phone: string;
  grade: Grade;
  message: string;
  consents: { privacy: true; guardian: true; marketing: boolean };
}

const MOBILE_PHONE = /^01[016789]\d{7,8}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

export function validateConsult(input: ConsultInput): ConsultErrors {
  const errors: ConsultErrors = {};
  const name = input.guardianName.trim();

  if (!name) errors.guardianName = '보호자 성함을 입력해 주세요.';
  else if (name.length > LIMITS.name) errors.guardianName = `성함은 ${LIMITS.name}자 이내로 입력해 주세요.`;

  if (!input.phone.trim()) errors.phone = '연락처를 입력해 주세요.';
  else if (!MOBILE_PHONE.test(normalizePhone(input.phone))) errors.phone = '휴대전화 번호 형식(010-0000-0000)으로 입력해 주세요.';

  if (!GRADES.includes(input.grade as Grade)) errors.grade = '자녀 학년을 선택해 주세요.';

  if (input.message.trim().length > LIMITS.message) errors.message = `상담 내용은 ${LIMITS.message}자 이내로 입력해 주세요.`;

  if (!input.consentPrivacy) errors.consentPrivacy = '개인정보 수집·이용 동의가 필요합니다.';
  if (!input.consentGuardian) errors.consentGuardian = '법정대리인 동의가 필요합니다.';

  return errors;
}

/** 검증을 통과한 입력만 전송 형태로 바꾼다. 동의 없이 전송하지 않는다. */
export function toPayload(input: ConsultInput, submissionId: string): ConsultPayload {
  if (Object.keys(validateConsult(input)).length > 0) throw new Error('invalid consult input');
  return {
    submissionId,
    guardianName: input.guardianName.trim(),
    phone: normalizePhone(input.phone),
    grade: input.grade as Grade,
    message: input.message.trim(),
    consents: { privacy: true, guardian: true, marketing: input.consentMarketing },
  };
}

export type SubmitResult = { ok: true } | { ok: false; reason: 'network' | 'server' };

/**
 * 서버 성공 응답(2xx) 이후에만 ok. submissionId를 멱등 키로 함께 보내
 * 재시도 시 서버가 중복 접수를 걸러낼 수 있게 한다.
 */
export async function submitConsult(
  endpoint: string,
  payload: ConsultPayload,
  fetcher: typeof fetch = fetch,
): Promise<SubmitResult> {
  try {
    const res = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.submissionId },
      body: JSON.stringify(payload),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    return res.ok ? { ok: true } : { ok: false, reason: 'server' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * 진단 카드 선택을 상담 내용에 반영할지 결정한다.
 * 사용자가 직접 입력·편집한 내용은 덮어쓰지 않는다 (SPEC 진단 4항).
 */
export function nextConcernMessage(current: string, lastAutofill: string | null, concernText: string): string | null {
  const untouched = current.trim() === '' || current === lastAutofill;
  return untouched ? concernText : null;
}
