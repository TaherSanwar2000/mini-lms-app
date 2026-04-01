import { loginSchema, registerSchema } from '../../../src/schemas/index';

describe('loginSchema', () => {
  const valid = { username: 'john_doe', password: 'secret123' };

  it('passes with valid credentials', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it('passes with minimum length username (3 chars)', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'abc' }).success).toBe(true);
  });

  it('fails with username shorter than 3 characters', () => {
    const result = loginSchema.safeParse({ ...valid, username: 'ab' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('at least 3');
  });

  it('fails with username longer than 30 characters', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'a'.repeat(31) }).success).toBe(false);
  });

  it('fails with username containing spaces', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'john doe' }).success).toBe(false);
  });

  it('fails with username containing special chars like @ or -', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'john@doe' }).success).toBe(false);
    expect(loginSchema.safeParse({ ...valid, username: 'john-doe' }).success).toBe(false);
  });

  it('passes with underscores and numbers in username', () => {
    expect(loginSchema.safeParse({ ...valid, username: 'john_doe_99' }).success).toBe(true);
  });

  it('fails with password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ ...valid, password: 'ab1' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('at least 6');
  });

  it('fails with password longer than 100 characters', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'a'.repeat(101) }).success).toBe(false);
  });

  it('fails with empty username or password', () => {
    expect(loginSchema.safeParse({ username: '', password: 'pass123' }).success).toBe(false);
    expect(loginSchema.safeParse({ username: 'user', password: '' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'Secret123!',
    confirmPassword: 'Secret123!',
  };

  it('passes with fully valid data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('fails with username shorter than 3 characters', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(false);
  });

  it('fails with invalid email formats', () => {
    ['notanemail', 'missing@', '@nodomain.com'].forEach((email) => {
      expect(registerSchema.safeParse({ ...valid, email }).success).toBe(false);
    });
  });

  it('passes with various valid email formats', () => {
    ['user@example.com', 'user+tag@domain.co.uk'].forEach((email) => {
      expect(registerSchema.safeParse({ ...valid, email }).success).toBe(true);
    });
  });

  it('fails with password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Sec1!', confirmPassword: 'Sec1!' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('at least 8');
  });

  it('fails when password has no uppercase letter', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'secret123!', confirmPassword: 'secret123!' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes('uppercase'))).toBe(true);
  });

  it('fails when password has no number', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'SecretPass!', confirmPassword: 'SecretPass!' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes('number'))).toBe(true);
  });

  it('fails when password has no special character', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'SecretPass1', confirmPassword: 'SecretPass1' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes('special'))).toBe(true);
  });

  it('fails when passwords do not match', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'DifferentPass1!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('confirmPassword');
      expect(issue?.message).toBe('Passwords do not match');
    }
  });

  it('reports multiple field errors at once', () => {
    const result = registerSchema.safeParse({ username: 'x', email: 'bad', password: 'weak', confirmPassword: 'diff' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeGreaterThan(1);
  });
});
