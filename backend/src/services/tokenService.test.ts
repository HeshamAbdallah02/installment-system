import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import tokenService from './tokenService';

describe('TokenService', () => {
  describe('generateToken', () => {
    it('should create a valid JWT with correct payload', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      const token = tokenService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct user data in token', () => {
      const payload = {
        userId: 123,
        username: 'johndoe',
        role: 'MANAGER',
        branchId: 5,
      };

      const token = tokenService.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(123);
      expect(decoded.username).toBe('johndoe');
      expect(decoded.role).toBe('MANAGER');
      expect(decoded.branchId).toBe(5);
    });

    it('should include expiration time in token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      const token = tokenService.generateToken(payload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      // Check that expiration is approximately 8 hours from now
      const expirationTime = decoded.exp - decoded.iat;
      const eightHoursInSeconds = 8 * 60 * 60;
      expect(expirationTime).toBe(eightHoursInSeconds);
    });
  });

  describe('verifyToken', () => {
    it('should validate correct token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      const token = tokenService.generateToken(payload);
      const verified = tokenService.verifyToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(1);
      expect(verified?.username).toBe('testuser');
      expect(verified?.role).toBe('SELLER');
    });

    it('should reject expired token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      // Create a token that expires immediately
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '0s',
      });

      // Wait a moment to ensure expiration
      const verified = tokenService.verifyToken(expiredToken);

      expect(verified).toBeNull();
    });

    it('should reject token with invalid signature', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      // Create token with different secret
      const invalidToken = jwt.sign(payload, 'wrong-secret-key', {
        expiresIn: '8h',
      });

      const verified = tokenService.verifyToken(invalidToken);

      expect(verified).toBeNull();
    });

    it('should reject malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      const verified = tokenService.verifyToken(malformedToken);

      expect(verified).toBeNull();
    });

    it('should reject empty token', () => {
      const verified = tokenService.verifyToken('');

      expect(verified).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      const token = tokenService.generateToken(payload);
      const decoded = tokenService.decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(1);
      expect(decoded?.username).toBe('testuser');
    });

    it('should decode expired token', () => {
      const payload = {
        userId: 1,
        username: 'testuser',
        role: 'SELLER',
        branchId: 1,
      };

      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '0s',
      });

      const decoded = tokenService.decodeToken(expiredToken);

      // Decode should work even for expired tokens
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(1);
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt';

      const decoded = tokenService.decodeToken(malformedToken);

      expect(decoded).toBeNull();
    });
  });
});
