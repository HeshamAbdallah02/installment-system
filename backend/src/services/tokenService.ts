import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.types';

/**
 * Service for handling JWT token generation and verification
 */
class TokenService {
  private readonly SECRET_KEY: string;
  private readonly EXPIRATION: string;

  constructor() {
    this.SECRET_KEY = process.env.JWT_SECRET || '';
    this.EXPIRATION = process.env.JWT_EXPIRATION || '8h';

    if (!this.SECRET_KEY) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
  }

  /**
   * Generate a JWT token with user payload
   * @param payload - User information to encode in the token (without iat and exp)
   * @returns Signed JWT token string
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(payload, this.SECRET_KEY, {
        expiresIn: this.EXPIRATION,
      } as jwt.SignOptions);
      return token;
    } catch (error) {
      throw new Error('Failed to generate token');
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token - The JWT token to verify
   * @returns Decoded JWT payload if valid, null if invalid or expired
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.SECRET_KEY) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return null;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return null;
      }
      return null;
    }
  }

  /**
   * Decode a JWT token without verification (for debugging purposes)
   * @param token - The JWT token to decode
   * @returns Decoded JWT payload or null if decoding fails
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export default new TokenService();
