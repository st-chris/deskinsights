import axios from 'axios';
import logger from './logger';

export interface AppError {
  message: string;
  code?: string;
  originalError?: unknown;
}

export const errorHandler = {
  // Handle API/Axios errors
  handleApiError: (error: unknown): AppError => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'API request failed';

      logger.error(`API Error (${status}): ${message}`, error);

      return {
        message,
        code: `HTTP_${status}`,
        originalError: error,
      };
    }

    logger.error('API Error:', error);
    return {
      message: 'An unexpected error occurred',
      originalError: error,
    };
  },

  // Handle React component/render errors
  handleComponentError: (error: Error): AppError => {
    logger.error('React component error:', error);
    return {
      message: 'Something went wrong. Please refresh the page.',
      code: 'COMPONENT_ERROR',
      originalError: error,
    };
  },

  // Generic error handler for any error type
  handle: (error: unknown, context?: string): AppError => {
    if (context) {
      logger.error(`Error in ${context}:`, error);
    } else {
      logger.error('Error:', error);
    }

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      return errorHandler.handleApiError(error);
    }

    // Handle standard errors
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'APPLICATION_ERROR',
        originalError: error,
      };
    }

    // Handle unknown error types
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      originalError: error,
    };
  },

  // Extract user-friendly message from any error
  getUserMessage: (error: unknown): string => {
    const appError = errorHandler.handle(error);
    return appError.message;
  },
};

export default errorHandler;
