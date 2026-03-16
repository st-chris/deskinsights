import { vi } from 'vitest';
import { createRoot } from 'react-dom/client';

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

describe('main.tsx', () => {
  it('renders app into root element', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    await import('./main');

    expect(createRoot).toHaveBeenCalledWith(root);
    expect(
      vi.mocked(createRoot).mock.results[0].value.render,
    ).toHaveBeenCalled();
  });
});
