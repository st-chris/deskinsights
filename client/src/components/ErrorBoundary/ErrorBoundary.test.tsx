import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import * as loggerModule from '../../services/logger';

// Suppress expected error logs
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('../../services/logger');
const mockedLogger = vi.mocked(loggerModule.default).error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('catches errors and shows UI', () => {
    const BrokenComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(mockedLogger).toHaveBeenCalledTimes(2);
  });

  it('shows recovery UI after error', () => {
    const BrokenComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Try Again/i }),
    ).toBeInTheDocument();

    expect(screen.getByText('Error Details (Dev Only)')).toBeInTheDocument();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
});
