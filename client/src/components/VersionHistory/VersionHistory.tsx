import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import api from '../../services/api';
import RestoreConfirmModal from '../modals/restore-confirm-modal/RestoreConfirmModal';
import logger from '../../services/logger';

interface Version {
  versionNumber: number;
  timestamp: string;
  preview: string;
  fullPreview?: string;
}

interface VersionHistoryProps {
  documentId: string;
  onRestore: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  documentId,
  onRestore,
  isOpen,
  onClose,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedVersionToRestore, setSelectedVersionToRestore] = useState<
    number | null
  >(null);
  const [expandedVersions, setExpandedVersions] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Load versions
  useEffect(() => {
    if (!isOpen || !documentId) return;

    const fetchVersions = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/documents/${documentId}/versions`);
        setVersions(response.data);
      } catch (error) {
        logger.error('VersionHistory.LoadVersions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [isOpen, documentId]);

  const togglePreview = (versionNumber: number) => {
    setExpandedVersions((prev) =>
      prev.includes(versionNumber)
        ? prev.filter((v) => v !== versionNumber)
        : [...prev, versionNumber],
    );
  };

  const restoreVersion = async (versionNumber: number) => {
    setSelectedVersionToRestore(versionNumber);
    setShowRestoreConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pb-safe'>
      <div className='w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl bg-white flex flex-col shadow-2xl'>
        {/* Header */}
        <div className='p-6 border-b flex justify-between items-center'>
          <h3 className='text-xl font-semibold text-slate-900'>
            Version History
          </h3>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 text-2xl font-bold hover:scale-110 transition-all'
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className='p-8 text-center text-slate-500 flex-1'>
            Loading versions...
          </div>
        )}

        {/* No versions */}
        {!loading && versions.length === 0 && (
          <div className='p-8 text-center text-slate-500 flex-1'>
            No versions available
          </div>
        )}

        {/* Version Cards */}
        <div className='flex-1 overflow-auto p-4 pb-8 space-y-3'>
          {versions.map((version) => (
            <div
              key={version.versionNumber}
              className='border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white'
            >
              {/* Collapsed Header */}
              <div
                className='p-5 cursor-pointer hover:bg-slate-50 transition-colors'
                onClick={() => togglePreview(version.versionNumber)}
              >
                <div className='flex items-center justify-between mb-2'>
                  <span className='font-semibold text-slate-900 text-lg bg-slate-100 px-3 py-1 rounded-full'>
                    Version {version.versionNumber}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${
                      expandedVersions.includes(version.versionNumber)
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </div>
                <p className='text-xs text-slate-500 mb-3'>
                  {new Date(version.timestamp).toLocaleString()}
                </p>
                <p className='text-sm text-slate-700 leading-relaxed line-clamp-2'>
                  {version.preview}
                </p>
              </div>

              {/* Expanded Preview */}
              {expandedVersions.includes(version.versionNumber) && (
                <div className='border-t bg-slate-50'>
                  <div className='p-6 max-h-80 overflow-auto'>
                    <div
                      className='prose prose-sm prose-slate max-w-none mb-6 leading-relaxed'
                      dangerouslySetInnerHTML={{
                        __html: version.fullPreview || version.preview,
                      }}
                    />
                  </div>
                  <div className='p-4 bg-linear-to-r from-blue-50 to-indigo-50 border-t'>
                    <button
                      onClick={() => restoreVersion(version.versionNumber)}
                      className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-all text-sm'
                    >
                      Restore Version {version.versionNumber}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className='p-6 border-t bg-slate-50 rounded-b-2xl'>
          <p className='text-xs text-slate-500 text-center'>
            Only last 10 versions shown. Older versions automatically deleted.
          </p>
        </div>
      </div>

      <RestoreConfirmModal
        isOpen={showRestoreConfirm}
        versionNumber={selectedVersionToRestore || 0}
        onConfirm={async () => {
          if (!selectedVersionToRestore) return;

          try {
            const response = await api.post(
              `/documents/${documentId}/versions/${selectedVersionToRestore}/restore`,
            );
            onRestore(response.data.content);
            onClose();
          } catch (error) {
            logger.error('VersionHistory.RestoreVersion', error);
          } finally {
            setShowRestoreConfirm(false);
            setSelectedVersionToRestore(null);
          }
        }}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setSelectedVersionToRestore(null);
        }}
      />
    </div>
  );
};
