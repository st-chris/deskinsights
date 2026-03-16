import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import errorHandler from './errorHandler';
import * as loggerModule from './logger';

vi.mock('./logger');

const mockLogger = vi.mocked(loggerModule.default);

const makeAxiosError = (
  status: number,
  data: object,
  message = 'Request failed',
) => {
  const error = new axios.AxiosError(
    message,
    String(status),
    undefined,
    undefined,
    {
      status,
      data,
      headers: {},
      statusText: '',
      config: { headers: axios.AxiosHeaders.from({}) },
    },
  );
  return error;
};

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('extracts message from response.data.message', () => {
      const error = makeAxiosError(404, { message: 'Not found' });
      const result = errorHandler.handleApiError(error);

      expect(result.message).toBe('Not found');
      expect(result.code).toBe('HTTP_404');
      expect(result.originalError).toBe(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('falls back to response.data.error', () => {
      const error = makeAxiosError(500, { error: 'Server error' });
      const result = errorHandler.handleApiError(error);
      expect(result.message).toBe('Server error');
    });

    it('falls back to error.message', () => {
      const error = makeAxiosError(0, {}, 'Network Error');
      const result = errorHandler.handleApiError(error);
      expect(result.message).toBe('Network Error');
    });

    it('handles non-axios error', () => {
      const result = errorHandler.handleApiError(new Error('Unknown'));
      expect(result.message).toBe('An unexpected error occurred');
    });
  });

  describe('handleComponentError', () => {
    it('returns component error with correct code', () => {
      const error = new Error('Render failed');
      const result = errorHandler.handleComponentError(error);

      expect(result.message).toBe(
        'Something went wrong. Please refresh the page.',
      );
      expect(result.code).toBe('COMPONENT_ERROR');
      expect(result.originalError).toBe(error);
    });
  });

  describe('handle', () => {
    it('handles axios error with context', () => {
      const error = makeAxiosError(400, { message: 'Validation failed' });
      const result = errorHandler.handle(error, 'UserService');

      expect(result.message).toBe('Validation failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in UserService:',
        error,
      );
    });

    it('handles standard Error', () => {
      const result = errorHandler.handle(new Error('Something broke'));
      expect(result.message).toBe('Something broke');
      expect(result.code).toBe('APPLICATION_ERROR');
    });

    it('handles unknown type', () => {
      const result = errorHandler.handle('weird error');
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getUserMessage', () => {
    it('returns message from Error', () => {
      expect(errorHandler.getUserMessage(new Error('Oops'))).toBe('Oops');
    });

    it('returns fallback for null', () => {
      expect(errorHandler.getUserMessage(null)).toBe(
        'An unexpected error occurred',
      );
    });
  });
});
