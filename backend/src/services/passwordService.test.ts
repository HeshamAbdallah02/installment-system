import { describe, it, expect } from 'vitest';
import passwordService from './passwordService';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should generate a valid bcrypt hash', async () => {
      const plainPassword = 'testPassword123';
      const hash = await passwordService.hashPassword(plainPassword);

      // Bcrypt hashes start with $2b$ and are 60 characters long
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(hash.length).toBe(60);
    });

    it('should generate different hashes for the same password', async () => {
      const plainPassword = 'testPassword123';
      const hash1 = await passwordService.hashPassword(plainPassword);
      const hash2 = await passwordService.hashPassword(plainPassword);

      // Due to salt, hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'correctPassword123';
      const hash = await passwordService.hashPassword(plainPassword);

      const isMatch = await passwordService.comparePassword(plainPassword, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'correctPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await passwordService.hashPassword(plainPassword);

      const isMatch = await passwordService.comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const plainPassword = 'correctPassword123';
      const hash = await passwordService.hashPassword(plainPassword);

      const isMatch = await passwordService.comparePassword('', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate password with minimum length', async () => {
      const validPassword = 'password123';

      const result = passwordService.validatePasswordStrength(validPassword);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject password shorter than minimum length', async () => {
      const shortPassword = 'pass';

      const result = passwordService.validatePasswordStrength(shortPassword);

      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('at least 8 characters');
    });

    it('should reject empty password', async () => {
      const emptyPassword = '';

      const result = passwordService.validatePasswordStrength(emptyPassword);

      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should accept password exactly at minimum length', async () => {
      const minLengthPassword = '12345678';

      const result = passwordService.validatePasswordStrength(minLengthPassword);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });
});
