import { describe, it, expect } from 'vitest';
import { memberRegistrationSchema } from '@/lib/validation';

describe('memberRegistrationSchema', () => {
  it('accepts a valid registration', () => {
    const result = memberRegistrationSchema.safeParse({
      name: '  Amina   ',
      email: '  AMINA@Example.COM ',
      password: 'hunter2secure'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Amina');
      expect(result.data.email).toBe('amina@example.com');
    }
  });

  it('rejects a name that is too short', () => {
    expect(
      memberRegistrationSchema.safeParse({ name: 'A', email: 'a@b.co', password: 'longenough1' }).success
    ).toBe(false);
  });

  it('rejects an invalid email', () => {
    expect(
      memberRegistrationSchema.safeParse({ name: 'Amina', email: 'not-an-email', password: 'longenough1' })
        .success
    ).toBe(false);
  });

  it('rejects a password shorter than 8', () => {
    expect(
      memberRegistrationSchema.safeParse({ name: 'Amina', email: 'a@b.co', password: 'short11' }).success
    ).toBe(false);
  });
});