import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import api from '../../services/api';
import '@testing-library/jest-dom/vitest';
import { VersionHistory } from './VersionHistory';

vi.mock('../../services/api');

const mockVersions = [
  {
    versionNumber: 1,
    timestamp: '2026-01-26T13:00:00Z',
    preview: 'First version preview text...',
    fullPreview: '<p>First version full content preview</p>',
  },
  {
    versionNumber: 2,
    timestamp: '2026-01-26T14:00:00Z',
    preview: 'Second version preview text...',
    fullPreview: '<p>Second version full content preview</p>',
  },
];

describe('VersionHistory', () => {
  const mockRestore = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({ data: { content: 'restored' } });
  });

  it('renders loading state initially', () => {
    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    expect(screen.getByText('Loading versions...')).toBeInTheDocument();
  });

  it('renders empty state when no versions', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('No versions available')).toBeInTheDocument();
    });
  });

  it('renders version list newest first', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVersions });

    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });
  });

  it('expands version preview on click', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVersions });

    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    // Wait for versions to load and find the clickable header
    await waitFor(() => screen.getByText('Version 1'));

    // Find the clickable header that contains Version 1
    const version1Header =
      screen.getByText('Version 1').closest('div.cursor-pointer') ||
      screen.getByText('Version 1').parentElement?.parentElement;

    expect(version1Header).toBeInTheDocument();
    await user.click(version1Header!);

    await waitFor(() => {
      expect(
        screen.getByText('First version full content preview'),
      ).toBeInTheDocument();
    });
  });

  it('restore button calls API with correct params', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVersions });

    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    // Expand v1
    await waitFor(() => screen.getByText('Version 1'));
    const version1Header =
      screen.getByText('Version 1').closest('div.cursor-pointer') ||
      screen.getByText('Version 1').parentElement?.parentElement;

    await user.click(version1Header!);

    await waitFor(() =>
      screen.getByRole('button', { name: /Restore Version 1/i }),
    );
    const restoreBtn = screen.getByRole('button', {
      name: /Restore Version 1/i,
    });
    await user.click(restoreBtn);

    // Wait for the confirmation modal and click the confirm button
    // The modal has a "Restore Version" button without a number
    await waitFor(() => {
      const allRestoreBtns = screen.getAllByRole('button', {
        name: /Restore Version/i,
      });
      return allRestoreBtns.length >= 2; // Both the card button and modal button
    });

    const allRestoreBtns = screen.getAllByRole('button', {
      name: /Restore Version/i,
    });
    const confirmBtn = allRestoreBtns[allRestoreBtns.length - 1]; // Get the modal's confirm button (last one)
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(vi.mocked(api.post)).toHaveBeenCalledWith(
        '/documents/123/versions/1/restore',
      );
    });
  });

  it('closes modal with X button', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockVersions });

    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    await waitFor(() => screen.getByRole('button', { name: /×/i }));
    const closeBtn = screen.getByRole('button', { name: /×/i });
    await user.click(closeBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('handles API error gracefully', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    render(
      <VersionHistory
        documentId='123'
        onRestore={mockRestore}
        isOpen={true}
        onClose={mockClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('No versions available')).toBeInTheDocument();
    });
  });
});
