import bcrypt from 'bcrypt';

/**
 * Service for handling password hashing and verification
 */
class PasswordService {
  private readonly SALT_ROUNDS = 10;
  private readonly MIN_PASSWORD_LENGTH = 8;

  /**
   * Hash a plain text password using bcrypt
   * @param plainPassword - The plain text password to hash
   * @returns Promise resolving to the hashed password
   * @throws Error if hashing fails
   */
  async hashPassword(plainPassword: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
      return hash;
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a plain text password with a stored hash
   * @param plainPassword - The plain text password to verify
   * @param hash - The stored password hash
   * @returns Promise resolving to true if password matches, false otherwise
   * @throws Error if comparison fails
   */
  async comparePassword(plainPassword: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hash);
      return isMatch;
    } catch (error) {
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Validate password strength
   * @param password - The password to validate
   * @returns Object with valid flag and optional error message
   */
  validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < this.MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        message: `Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`
      };
    }

    return { valid: true };
  }
}

export default new PasswordService();
