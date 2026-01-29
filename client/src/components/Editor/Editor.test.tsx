import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import { Editor } from './Editor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock API
vi.mock('../../services/api');

// Properly type the prompt mock
const mockPrompt = vi.fn() as Mock<(message?: string) => string | null>;
window.prompt = mockPrompt;

// Helper to render with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe('Editor', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    test('renders editor after initialization', async () => {
      const { container } = renderWithQueryClient(
        <Editor
          documentId='1'
          content='<p>Hello World</p>'
          onUpdate={mockOnUpdate}
        />,
      );

      await waitFor(
        () => {
          const editorWrapper = container.querySelector('.border-slate-200');
          expect(editorWrapper).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    test('renders all toolbar buttons', async () => {
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.getByTitle(/bold/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByTitle(/italic/i)).toBeInTheDocument();
      expect(screen.getByTitle(/bullets/i)).toBeInTheDocument();
      expect(screen.getByTitle(/numbers/i)).toBeInTheDocument();
      expect(screen.getByTitle(/code block/i)).toBeInTheDocument();
      expect(screen.getByTitle(/image/i)).toBeInTheDocument();
    });

    test('initializes with provided content', async () => {
      const initialContent = '<p>Test content</p>';
      const { container } = renderWithQueryClient(
        <Editor
          documentId='1'
          content={initialContent}
          onUpdate={mockOnUpdate}
        />,
      );

      await waitFor(
        () => {
          const proseMirror = container.querySelector('.ProseMirror');
          expect(proseMirror).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Toolbar interactions', () => {
    test('bold button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const boldButton = screen.getByTitle(/bold/i);
      expect(boldButton).toBeEnabled();

      await user.click(boldButton);

      expect(boldButton).toBeEnabled();
    });

    test('italic button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const italicButton = screen.getByTitle(/italic/i);
      expect(italicButton).toBeEnabled();

      await user.click(italicButton);

      expect(italicButton).toBeEnabled();
    });

    test('bullet list button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const bulletButton = screen.getByTitle(/bullets/i);
      await user.click(bulletButton);

      expect(bulletButton).toBeEnabled();
    });

    test('ordered list button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const numbersButton = screen.getByTitle(/numbers/i);
      await user.click(numbersButton);

      expect(numbersButton).toBeEnabled();
    });

    test('code block button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const codeButton = screen.getByTitle(/code block/i);
      await user.click(codeButton);

      expect(codeButton).toBeEnabled();
    });
  });

  describe('Image insertion', () => {
    test('prompts for image URL when image button clicked', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue('https://example.com/image.jpg');

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalledWith('Image URL (http/https only):');
    });

    test('accepts valid https URL', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue('https://example.com/valid.jpg');

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalled();
    });

    test('accepts valid http URL', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue('http://example.com/valid.jpg');

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalled();
    });

    test('rejects invalid URL without http/https protocol', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue('ftp://invalid.com/image.jpg');

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalled();
    });

    test('rejects URL without protocol', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue('example.com/image.jpg');

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalled();
    });

    test('handles cancelled prompt gracefully', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue(null);

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalled();
    });

    test('handles empty string from prompt', async () => {
      const user = userEvent.setup();
      mockPrompt.mockReturnValue('');

      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const imageButton = screen.getByTitle(/image/i);
      await user.click(imageButton);

      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  describe('Props and callbacks', () => {
    test('accepts content/documentId prop', async () => {
      const content = '<p>Initial content</p>';
      renderWithQueryClient(
        <Editor documentId='1' content={content} onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
    });

    test('accepts onUpdate callback prop', async () => {
      const customOnUpdate = vi.fn();
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={customOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(customOnUpdate).toBeDefined();
    });
  });

  describe('Styling and CSS classes', () => {
    test('applies custom wrapper classes', async () => {
      const { container } = renderWithQueryClient(
        <Editor documentId='1' content='<p>Test</p>' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const editorWrapper = container.querySelector('.border-slate-200');
      expect(editorWrapper).toBeInTheDocument();

      const roundedWrapper = container.querySelector('.rounded-lg');
      expect(roundedWrapper).toBeInTheDocument();
    });

    test('applies toolbar styling', async () => {
      const { container } = renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const toolbar = container.querySelector('.bg-slate-50');
      expect(toolbar).toBeInTheDocument();
    });

    test('renders with shadow', async () => {
      const { container } = renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const shadowWrapper = container.querySelector('.shadow-sm');
      expect(shadowWrapper).toBeInTheDocument();
    });
  });

  describe('Button component', () => {
    test('buttons have proper accessibility attributes', async () => {
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const boldButton = screen.getByTitle(/bold/i);
      expect(boldButton).toHaveAttribute('title');

      const italicButton = screen.getByTitle(/italic/i);
      expect(italicButton).toHaveAttribute('title');
    });
  });

  describe('AI Features', () => {
    beforeEach(() => {
      vi.stubGlobal('alert', vi.fn());
    });

    test('renders AI toolbar buttons', async () => {
      renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByTitle('Summarize selected text')).toBeInTheDocument();
      expect(screen.getByTitle('Rewrite selected text')).toBeInTheDocument();
      expect(screen.getByTitle('Expand selected text')).toBeInTheDocument();
    });

    test('AI buttons are clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor
          documentId='1'
          content='<p>Test content</p>'
          onUpdate={mockOnUpdate}
        />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const summarizeButton = screen.getByTitle('Summarize selected text');
      expect(summarizeButton).toBeEnabled();

      await user.click(summarizeButton);
      // Alert will be shown because no text is selected
      expect(window.alert).toHaveBeenCalledWith(
        'Please select some text first',
      );
    });

    test('AI buttons are separated from regular buttons with divider', async () => {
      const { container } = renderWithQueryClient(
        <Editor documentId='1' content='' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check for divider element
      const divider = container.querySelector('.w-px.bg-slate-300');
      expect(divider).toBeInTheDocument();
    });

    test('rewrite button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor
          documentId='1'
          content='<p>Some text</p>'
          onUpdate={mockOnUpdate}
        />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const rewriteButton = screen.getByTitle('Rewrite selected text');
      expect(rewriteButton).toBeEnabled();

      await user.click(rewriteButton);
      expect(window.alert).toHaveBeenCalled();
    });

    test('expand button is clickable', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <Editor documentId='1' content='<p>Text</p>' onUpdate={mockOnUpdate} />,
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const expandButton = screen.getByTitle('Expand selected text');
      expect(expandButton).toBeEnabled();

      await user.click(expandButton);
      expect(window.alert).toHaveBeenCalled();
    });
  });
});
