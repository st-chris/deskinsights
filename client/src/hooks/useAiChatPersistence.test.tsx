import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAiChatPersistence, type ChatMessage } from './useAiChatPersistence';

describe('useAiChatPersistence', () => {
  let localStorageMock: Storage;
  let store: Record<string, string>;

  beforeEach(() => {
    // Create fresh localStorage mock for each test
    store = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      key: vi.fn(),
      length: 0,
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    vi.clearAllMocks();
  });

  it('should initialize with empty array when localStorage is empty', () => {
    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    expect(result.current[0]).toEqual([]);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('ai-chat-doc123');
  });

  it('should initialize with saved messages from localStorage', () => {
    const savedMessages: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'ai', content: 'Hi there!' },
    ];

    localStorageMock.setItem('ai-chat-doc123', JSON.stringify(savedMessages));

    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    expect(result.current[0]).toEqual(savedMessages);
  });

  it('should save messages to localStorage when updated', () => {
    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    const newMessages: ChatMessage[] = [
      { role: 'user', content: 'Test question' },
      { role: 'ai', content: 'Test answer' },
    ];

    act(() => {
      result.current[1](newMessages);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ai-chat-doc123',
      JSON.stringify(newMessages),
    );
  });

  it('should load different messages for different documentIds', () => {
    const doc1Messages: ChatMessage[] = [
      { role: 'user', content: 'Doc 1 question' },
    ];
    const doc2Messages: ChatMessage[] = [
      { role: 'user', content: 'Doc 2 question' },
    ];

    localStorageMock.setItem('ai-chat-doc1', JSON.stringify(doc1Messages));
    localStorageMock.setItem('ai-chat-doc2', JSON.stringify(doc2Messages));

    const { result: result1 } = renderHook(() => useAiChatPersistence('doc1'));
    const { result: result2 } = renderHook(() => useAiChatPersistence('doc2'));

    expect(result1.current[0]).toEqual(doc1Messages);
    expect(result2.current[0]).toEqual(doc2Messages);
  });

  it('should handle localStorage errors gracefully on init', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    vi.mocked(localStorageMock.getItem).mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    expect(result.current[0]).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle localStorage errors gracefully on save', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    vi.mocked(localStorageMock.setItem).mockImplementation(() => {
      throw new Error('localStorage quota exceeded');
    });

    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    const newMessages: ChatMessage[] = [{ role: 'user', content: 'Test' }];

    act(() => {
      result.current[1](newMessages);
    });

    // Should not crash, just log error
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result.current[0]).toEqual(newMessages); // State still updates

    consoleErrorSpy.mockRestore();
  });

  it('should handle invalid JSON in localStorage', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    localStorageMock.setItem('ai-chat-doc123', 'invalid JSON{{{');

    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    expect(result.current[0]).toEqual([]); // Fallback to empty array
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should persist multiple messages across updates', () => {
    const { result } = renderHook(() => useAiChatPersistence('doc123'));

    // Add first message
    act(() => {
      result.current[1]([{ role: 'user', content: 'Question 1' }]);
    });

    // Add second message
    act(() => {
      result.current[1]((prev) => [
        ...prev,
        { role: 'ai', content: 'Answer 1' },
      ]);
    });

    // Add third message
    act(() => {
      result.current[1]((prev) => [
        ...prev,
        { role: 'user', content: 'Question 2' },
      ]);
    });

    expect(result.current[0]).toHaveLength(3);
    expect(result.current[0]).toEqual([
      { role: 'user', content: 'Question 1' },
      { role: 'ai', content: 'Answer 1' },
      { role: 'user', content: 'Question 2' },
    ]);

    // Verify saved to localStorage
    const saved = localStorageMock.getItem('ai-chat-doc123');
    expect(JSON.parse(saved!)).toEqual(result.current[0]);
  });
});
