import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { OpenAI } from 'openai';
import { GoogleGenAI } from '@google/genai'; // ← New import
import logger from '../utils/logger';

// OpenAI setup
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Gemini setup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({}) : null;

// Check at least one provider is configured
if (!openai && !genAI) {
  throw new Error('AI Connection is not configured properly.');
}

// Helper to choose provider
const getAIProvider = () => {
  return genAI ? 'gemini' : 'openai';
};

interface AIRequestBody {
  text: string;
  tone?: string;
}

interface SummaryResponse {
  summary: string;
  insights: string[];
}

interface DocumentSummaryRequestBody {
  text: string;
  documentId?: string;
}

interface ChatRequestBody {
  text: string;
  query: string;
  documentId?: string;
}

const parseGeminiText = (
  text: string | undefined | null,
  fallback = '',
): string => (text || fallback).replace(/\\n/g, '\n');

// Summarize text
export const summarizeText = asyncHandler(
  async (
    request: Request<object, object, AIRequestBody>,
    response: Response,
  ): Promise<void> => {
    const { text } = request.body;

    if (!text) {
      response.status(400).json({ error: 'Text is required' });
      return;
    }

    const provider = getAIProvider();
    let result: string;

    if (provider === 'gemini' && genAI) {
      const geminiResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful assistant that summarizes documents concisely.\n\nSummarize this text:\n\n${text}`,
      });

      result = parseGeminiText(geminiResponse.text);

      logger.info('AI.Summarize', {
        provider: 'gemini',
        textLength: text.length,
      });
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that summarizes documents concisely.',
          },
          {
            role: 'user',
            content: `Summarize this text:\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      result = completion.choices[0].message.content || '';

      logger.info('AI.Summarize', {
        provider: 'openai',
        textLength: text.length,
        tokensUsed: completion.usage?.total_tokens,
      });
    } else {
      response.status(500).json({ error: 'No AI provider available' });
      return;
    }

    response.json({ result });
  },
);

// Rewrite text
export const rewriteText = asyncHandler(
  async (
    request: Request<object, object, AIRequestBody>,
    response: Response,
  ): Promise<void> => {
    const { text, tone = 'professional' } = request.body;

    if (!text) {
      response.status(400).json({ error: 'Text is required' });
      return;
    }

    const provider = getAIProvider();
    let result: string;

    if (provider === 'gemini' && genAI) {
      const geminiResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rewrite the following text in a ${tone} tone while preserving its meaning:\n\n${text}`,
      });

      result = parseGeminiText(geminiResponse.text);

      logger.info('AI.Rewrite', {
        provider: 'gemini',
        tone,
        textLength: text.length,
      });
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Rewrite text in a ${tone} tone while preserving meaning.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      result = completion.choices[0].message.content || '';

      logger.info('AI.Rewrite', {
        provider: 'openai',
        tone,
        textLength: text.length,
        tokensUsed: completion.usage?.total_tokens,
      });
    } else {
      response.status(500).json({ error: 'No AI provider available' });
      return;
    }

    response.json({ result });
  },
);

// Expand text
export const expandText = asyncHandler(
  async (
    request: Request<object, object, AIRequestBody>,
    response: Response,
  ): Promise<void> => {
    const { text } = request.body;

    if (!text) {
      response.status(400).json({ error: 'Text is required' });
      return;
    }

    const provider = getAIProvider();
    let result: string;

    if (provider === 'gemini' && genAI) {
      const geminiResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Expand the following text with more detail and context:\n\n${text}`,
      });

      result = parseGeminiText(geminiResponse.text);

      logger.info('AI.Expand', { provider: 'gemini', textLength: text.length });
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Expand this text with more detail and context.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      result = completion.choices[0].message.content || '';

      logger.info('AI.Expand', {
        provider: 'openai',
        textLength: text.length,
        tokensUsed: completion.usage?.total_tokens,
      });
    } else {
      response.status(500).json({ error: 'No AI provider available' });
      return;
    }

    response.json({ result });
  },
);

// Generate document summary
export const generateDocumentSummary = asyncHandler(
  async (
    request: Request<object, object, DocumentSummaryRequestBody>,
    response: Response,
  ): Promise<void> => {
    const { text, documentId } = request.body;

    if (!text || text.trim().length === 0) {
      response.status(400).json({ error: 'Text is required' });
      return;
    }

    const maxLength = 10000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    const provider = getAIProvider();
    let parsed: SummaryResponse;

    if (provider === 'gemini' && genAI) {
      const prompt = `You are a helpful assistant that summarizes documents and extracts key insights.
Provide a concise 2-3 sentence summary and 3-5 bullet point insights.
Format your response as JSON with keys "summary" (string) and "insights" (array of strings).

Document:
${truncatedText}`;

      const geminiResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const responseText = geminiResponse.text || '{}';
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      try {
        parsed = JSON.parse(cleanedText) as SummaryResponse;
      } catch {
        parsed = { summary: 'Unable to generate summary', insights: [] };
      }

      logger.info('AI.DocumentSummary', {
        provider: 'gemini',
        documentId,
        textLength: text.length,
      });
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that summarizes documents and extracts key insights. 
          Provide a concise 2-3 sentence summary and 3-5 bullet point insights.
          Format your response as JSON with keys "summary" (string) and "insights" (array of strings).`,
          },
          {
            role: 'user',
            content: `Summarize this document and extract key insights:\n\n${truncatedText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;

      try {
        parsed = JSON.parse(result || '{}') as SummaryResponse;
      } catch {
        parsed = { summary: 'Unable to generate summary', insights: [] };
      }

      logger.info('AI.DocumentSummary', {
        provider: 'openai',
        documentId,
        textLength: text.length,
        tokensUsed: completion.usage?.total_tokens,
      });
    } else {
      response.status(500).json({ error: 'No AI provider available' });
      return;
    }

    response.json({
      summary: parsed.summary || 'Unable to generate summary',
      insights: parsed.insights || [],
    });
  },
);

// Chat with document
export const chatWithDocument = asyncHandler(
  async (
    request: Request<object, object, ChatRequestBody>,
    response: Response,
  ): Promise<void> => {
    const { text, query, documentId } = request.body;

    if (!query || query.trim().length === 0) {
      response.status(400).json({ error: 'Query is required' });
      return;
    }

    if (!text || text.trim().length === 0) {
      response.status(400).json({ error: 'Document text is required' });
      return;
    }

    const maxLength = 8000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    const provider = getAIProvider();
    let result: string;

    if (provider === 'gemini' && genAI) {
      const prompt = `You are a helpful assistant that answers questions about documents.
Use the provided document context to answer questions accurately and concisely.
If the answer is not in the document, say so clearly.

Document content:
${truncatedText}

Question: ${query}`;

      const geminiResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      result = parseGeminiText(geminiResponse.text, 'Unable to generate response');

      logger.info('AI.Chat', {
        provider: 'gemini',
        documentId,
        queryLength: query.length,
      });
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions about documents. 
          Use the provided document context to answer questions accurately and concisely.
          If the answer is not in the document, say so clearly.`,
          },
          {
            role: 'user',
            content: `Document content:\n${truncatedText}\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      result =
        completion.choices[0].message.content || 'Unable to generate response';

      logger.info('AI.Chat', {
        provider: 'openai',
        documentId,
        queryLength: query.length,
        tokensUsed: completion.usage?.total_tokens,
      });
    } else {
      response.status(500).json({ error: 'No AI provider available' });
      return;
    }

    response.json({ result });
  },
);
