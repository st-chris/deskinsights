// Mock isomorphic-dompurify for Jest (no DOM)
jest.mock('isomorphic-dompurify', () => ({
  sanitize: jest.fn((html: string) =>
    html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  ), // Strip <script>
  default: {
    sanitize: jest.fn((html: string) =>
      html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    ),
  },
}));
