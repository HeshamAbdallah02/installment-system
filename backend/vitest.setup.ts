// Set up test environment variables before any imports
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.JWT_EXPIRATION = '8h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
