import { describe, expect, it, vi } from 'vitest';
import {
  nextConcernMessage,
  normalizePhone,
  submitConsult,
  toPayload,
  validateConsult,
  type ConsultInput,
} from '../../src/lib/consult';

const valid: ConsultInput = {
  guardianName: ' 김보호 ',
  phone: '010-1234-5678',
  grade: '5',
  message: ' 희망 시기 문의 ',
  consentPrivacy: true,
  consentGuardian: true,
  consentMarketing: false,
};

describe('validateConsult', () => {
  it('returns no errors for a complete input', () => {
    expect(validateConsult(valid)).toEqual({});
  });

  it('requires name, phone, grade and both required consents', () => {
    const errors = validateConsult({
      ...valid,
      guardianName: '  ',
      phone: '',
      grade: '',
      consentPrivacy: false,
      consentGuardian: false,
    });
    expect(Object.keys(errors).sort()).toEqual(['consentGuardian', 'consentPrivacy', 'grade', 'guardianName', 'phone']);
  });

  it('does not require marketing consent', () => {
    expect(validateConsult({ ...valid, consentMarketing: false })).toEqual({});
  });

  it.each(['02-123-4567', '010-12-345', '0101234567890', 'abc'])('rejects non-mobile phone %s', (phone) => {
    expect(validateConsult({ ...valid, phone }).phone).toBeDefined();
  });

  it.each(['01012345678', '010 1234 5678', '011-123-4567'])('accepts mobile phone %s', (phone) => {
    expect(validateConsult({ ...valid, phone }).phone).toBeUndefined();
  });

  it('rejects grades outside 4~6', () => {
    expect(validateConsult({ ...valid, grade: '3' }).grade).toBeDefined();
  });

  it('limits name and message length', () => {
    const errors = validateConsult({ ...valid, guardianName: 'ㄱ'.repeat(31), message: 'ㄱ'.repeat(501) });
    expect(errors.guardianName).toBeDefined();
    expect(errors.message).toBeDefined();
  });
});

describe('toPayload', () => {
  it('trims fields, normalizes phone and carries the submission id', () => {
    expect(toPayload(valid, 'id-1')).toEqual({
      submissionId: 'id-1',
      guardianName: '김보호',
      phone: '01012345678',
      grade: '5',
      message: '희망 시기 문의',
      consents: { privacy: true, guardian: true, marketing: false },
    });
  });

  it('refuses to build a payload without consent', () => {
    expect(() => toPayload({ ...valid, consentGuardian: false }, 'id')).toThrow();
  });
});

describe('submitConsult', () => {
  const payload = toPayload(valid, 'id-1');

  it('posts JSON with an idempotency key and reports success on 2xx', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await expect(submitConsult('https://x.test/c', payload, fetcher)).resolves.toEqual({ ok: true });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://x.test/c');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('id-1');
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('reports server failure on non-2xx', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(submitConsult('https://x.test/c', payload, fetcher)).resolves.toEqual({ ok: false, reason: 'server' });
  });

  it('reports network failure when fetch rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('offline'));
    await expect(submitConsult('https://x.test/c', payload, fetcher)).resolves.toEqual({ ok: false, reason: 'network' });
  });
});

describe('nextConcernMessage', () => {
  it('fills an empty field', () => {
    expect(nextConcernMessage('', null, 'A')).toBe('A');
  });

  it('replaces its own previous autofill', () => {
    expect(nextConcernMessage('A', 'A', 'B')).toBe('B');
  });

  it('keeps text the user edited', () => {
    expect(nextConcernMessage('A 그리고 비용', 'A', 'B')).toBeNull();
  });
});

describe('normalizePhone', () => {
  it('strips spaces and hyphens', () => {
    expect(normalizePhone(' 010-1234 5678 ')).toBe('01012345678');
  });
});
