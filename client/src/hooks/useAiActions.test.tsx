import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type ReactNode } from 'react';
import api from '../services/api';
import { useAIAction, useAIDocumentSummary } from './useAiActions';

// Mock api
vi.mock('../services/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAIAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully summarize text', async () => {
    const mockResponse = { data: { result: 'Summarized text' } };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIAction(), {
      wrapper: createWrapper(),
    });

    const onSuccess = vi.fn();

    result.current.mutate(
      { action: 'summarize', text: 'Long text here' },
      { onSuccess },
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(api.post).toHaveBeenCalledWith('/ai/summarize', {
      text: 'Long text here',
      tone: undefined,
    });
    expect(onSuccess).toHaveBeenCalledWith(
      'Summarized text',
      { action: 'summarize', text: 'Long text here' },
      undefined,
      expect.anything(),
    );
  });

  it('should successfully rewrite text with tone', async () => {
    const mockResponse = { data: { result: 'Rewritten text' } };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIAction(), {
      wrapper: createWrapper(),
    });

    const onSuccess = vi.fn();

    result.current.mutate(
      { action: 'rewrite', text: 'Original text', tone: 'casual' },
      { onSuccess },
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(api.post).toHaveBeenCalledWith('/ai/rewrite', {
      text: 'Original text',
      tone: 'casual',
    });
    expect(onSuccess).toHaveBeenCalledWith(
      'Rewritten text',
      { action: 'rewrite', text: 'Original text', tone: 'casual' },
      undefined,
      expect.anything(),
    );
  });

  it('should successfully expand text', async () => {
    const mockResponse = { data: { result: 'Expanded text' } };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIAction(), {
      wrapper: createWrapper(),
    });

    const onSuccess = vi.fn();

    result.current.mutate(
      { action: 'expand', text: 'Short text' },
      { onSuccess },
    );

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(api.post).toHaveBeenCalledWith('/ai/expand', {
      text: 'Short text',
      tone: undefined,
    });
    expect(onSuccess).toHaveBeenCalledWith(
      'Expanded text',
      { action: 'expand', text: 'Short text' },
      undefined,
      expect.anything(),
    );
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    vi.mocked(api.post).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAIAction(), {
      wrapper: createWrapper(),
    });

    const onError = vi.fn();

    result.current.mutate({ action: 'summarize', text: 'Text' }, { onError });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith(
      mockError,
      { action: 'summarize', text: 'Text' },
      undefined,
      expect.anything(),
    );
  });

  it('should set isPending to true while request is in progress', async () => {
    const mockResponse = { data: { result: 'Result' } };
    vi.mocked(api.post).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100)),
    );

    const { result } = renderHook(() => useAIAction(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ action: 'summarize', text: 'Text' });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useAIDocumentSummary', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch summary when enabled and text provided', async () => {
      const mockData = {
        summary: 'Document summary here',
        insights: ['Key point 1', 'Key point 2'],
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockData });

      const { result } = renderHook(
        () => useAIDocumentSummary('doc123', 'sample document text', true),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(api.post).toHaveBeenCalledWith('/ai/document-summary', {
        text: 'sample document text',
        documentId: 'doc123',
      });
    });

    it('should not fetch when enabled is false', () => {
      const { result } = renderHook(
        () => useAIDocumentSummary('doc123', 'sample text', false),
        { wrapper: createWrapper() },
      );

      expect(result.current.isFetching).toBe(false);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should not fetch when text is empty', () => {
      const { result } = renderHook(
        () => useAIDocumentSummary('doc123', '', true),
        { wrapper: createWrapper() },
      );

      expect(result.current.isFetching).toBe(false);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should not fetch when text is whitespace only', () => {
      const { result } = renderHook(
        () => useAIDocumentSummary('doc123', '   ', true),
        { wrapper: createWrapper() },
      );

      expect(result.current.isFetching).toBe(false);
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to generate summary');
      vi.mocked(api.post).mockRejectedValue(mockError);

      const { result } = renderHook(
        () => useAIDocumentSummary('doc123', 'sample text', true),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should cache results per documentId', async () => {
      const mockData = { summary: 'Test summary', insights: [] };
      vi.mocked(api.post).mockResolvedValue({ data: mockData });

      // Create QueryClient shared by both hooks
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // First hook call
      const { result: result1 } = renderHook(
        () => useAIDocumentSummary('doc456', 'text', true),
        { wrapper },
      );

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));
      expect(api.post).toHaveBeenCalledTimes(1);

      // Second hook call with same documentId & wrapper
      const { result: result2 } = renderHook(
        () => useAIDocumentSummary('doc456', 'text', true),
        { wrapper },
      );

      await waitFor(() => expect(result2.current.isSuccess).toBe(true));
      expect(api.post).toHaveBeenCalledTimes(1); // Only first hook call, then cached
      expect(result2.current.data).toEqual(mockData);
    });

    it('should NOT share cache between different documentIds', async () => {
      const mockData1 = { summary: 'Doc 1', insights: [] };
      const mockData2 = { summary: 'Doc 2', insights: [] };

      vi.mocked(api.post)
        .mockResolvedValueOnce({ data: mockData1 })
        .mockResolvedValueOnce({ data: mockData2 });

      // Shared QueryClient
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // First hook call
      const { result: result1 } = renderHook(
        () => useAIDocumentSummary('doc1', 'text', true),
        { wrapper },
      );

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Second hook call with different documentId but same wrapper
      const { result: result2 } = renderHook(
        () => useAIDocumentSummary('doc2', 'text', true),
        { wrapper },
      );

      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      expect(api.post).toHaveBeenCalledTimes(2);
      expect(result1.current.data).toEqual(mockData1);
      expect(result2.current.data).toEqual(mockData2);
    });

    it('should show loading state during fetch', async () => {
      const mockData = { summary: 'Test', insights: [] };
      vi.mocked(api.post).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockData }), 100),
          ),
      );

      const { result } = renderHook(
        () => useAIDocumentSummary('doc123', 'text', true),
        { wrapper: createWrapper() },
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});
