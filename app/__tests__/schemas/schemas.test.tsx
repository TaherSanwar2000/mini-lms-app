import { loginSchema, registerSchema } from '../../../src/schemas';

describe('loginSchema', () => {
  it('should pass with valid credentials', () => {
    const result = loginSchema.safeParse({ username: 'john_doe', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('should fail with username too short', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: 'secret123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('username');
    }
  });

  it('should fail with invalid username characters', () => {
    const result = loginSchema.safeParse({ username: 'john doe', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('should fail with empty password', () => {
    const result = loginSchema.safeParse({ username: 'validuser', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validData = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'Secret123!',
    confirmPassword: 'Secret123!',
  };

  it('should pass with valid data', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail when passwords do not match', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPass1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirmPassword');
    }
  });

  it('should fail with invalid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should fail with password missing uppercase', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'secret123!',
      confirmPassword: 'secret123!',
    });
    expect(result.success).toBe(false);
  });

  it('should fail with password missing number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'SecretPass!',
      confirmPassword: 'SecretPass!',
    });
    expect(result.success).toBe(false);
  });

  it('should fail with password missing special character', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'SecretPass123',
      confirmPassword: 'SecretPass123',
    });
    expect(result.success).toBe(false);
  });
});