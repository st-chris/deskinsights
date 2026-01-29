import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface AIActionParams {
  action: 'summarize' | 'rewrite' | 'expand' | 'chat' | 'document-summary';
  text: string;
  tone?: string;
  query?: string; // For chat action
  documentId?: string; // Optional for document-specific actions
}

export const useAIAction = () => {
  return useMutation({
    mutationFn: async ({
      action,
      text,
      tone,
      query,
      documentId,
    }: AIActionParams) => {
      const response = await api.post(`/ai/${action}`, {
        text,
        tone,
        query,
        documentId,
      });
      return response.data.result;
    },
  });
};

// For document summary (cached, auto-refresh)
export const useAIDocumentSummary = (
  documentId: string,
  text: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['ai-document-summary', documentId],
    queryFn: async () => {
      const response = await api.post('/ai/document-summary', {
        text,
        documentId,
      });
      return response.data;
    },
    enabled: enabled && text.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
