import { describe, expect, it } from 'vitest';
import { ContactMessageSchema } from './contact-message';

describe('ContactMessageSchema', () => {
  it('accepts empty honeypot company field', () => {
    const r = ContactMessageSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hi',
      message: 'Body',
      company: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-empty honeypot', () => {
    const r = ContactMessageSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      subject: 'Hi',
      message: 'Body',
      company: 'Evil Corp',
    });
    expect(r.success).toBe(false);
  });
});
