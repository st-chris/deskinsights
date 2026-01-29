import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
  allowImages?: boolean;
}

export const sanitizeHtml = (dirty: string, options: SanitizeOptions = {}) => {
  const { allowImages = true } = options;

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'strong',
      'em',
      'u',
      's',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'blockquote',
      'code',
      'pre',
      ...(allowImages ? ['img'] : []),
    ],
    ALLOWED_ATTR: ['href', 'title', ...(allowImages ? ['src', 'alt'] : [])],
    ALLOW_DATA_ATTR: false,
  });
};

// Specific helper for document content
export const sanitizeDocumentContent = (html: string) =>
  sanitizeHtml(html, { allowImages: true });

// Specific helper for titles (no HTML allowed)
export const sanitizeTitle = (title: string) =>
  DOMPurify.sanitize(title, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
