import { vi, describe, it, expect } from 'vitest';
import { isTokenExpired } from './auth';
import logger from '../services/logger';

vi.mock('../services/logger');

describe('auth utils', () => {
  describe('isTokenExpired', () => {
    const FIXED_NOW = 1697059200000; // Fixed timestamp for consistency

    beforeEach(() => {
      vi.useFakeTimers().setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for empty token', () => {
      expect(isTokenExpired('')).toBe(true);
      expect(isTokenExpired('    ')).toBe(true);
    });

    it('returns true for expired token', () => {
      const expiredToken = createToken(FIXED_NOW - 1000); // 1s before now
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('returns false for valid token', () => {
      const validToken = createToken(FIXED_NOW + 3600000); // 1hr after now
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('returns true and logs error for invalid token format', () => {
      const invalidToken = 'invalid.token.format';
      expect(isTokenExpired(invalidToken)).toBe(true);
      expect(logger.error).toHaveBeenCalledWith(
        'AuthUtils.TokenExpiryCheck',
        expect.any(Error),
      );
    });

    it('returns true and logs error for malformed base64', () => {
      const malformedToken = 'eyJmalNkZmFzZGZhc2RmfQ.invalid';
      expect(isTokenExpired(malformedToken)).toBe(true);
      expect(logger.error).toHaveBeenCalledWith(
        'AuthUtils.TokenExpiryCheck',
        expect.any(Error),
      );
    });
  });
});

// Helper function to create JWT-like token with expiration time
function createToken(exp: number): string {
  const payload = { exp: Math.floor(exp / 1000) };
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
}
