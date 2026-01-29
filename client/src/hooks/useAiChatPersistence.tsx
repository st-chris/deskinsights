import { useState, useEffect } from 'react';
import logger from '../services/logger';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export const useAiChatPersistence = (documentId: string) => {
  const storageKey = `ai-chat-${documentId}`;

  // Initialize from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error('UseAIChatPersistence.InitLocalStorage', error);
      return [];
    }
  });

  // Save to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      logger.error('UseAIChatPersistence.SaveLocalStorage', error);
    }
  }, [messages, storageKey]);

  // Load fresh messages when documentId changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch (error) {
      logger.error('UseAIChatPersistence.LoadLocalStorage', error);
      setMessages([]);
    }
  }, [storageKey]);

  return [messages, setMessages] as const;
};
