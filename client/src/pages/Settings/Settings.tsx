import { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { selectWorkspaces } from '../../reducers/workspace/selectors';
import {
  Sun,
  Moon,
  LayoutDashboard,
  ClipboardList,
  Upload,
  CheckCircle,
} from 'lucide-react';

const Settings = () => {
  const { items } = useAppSelector(selectWorkspaces);

  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // View preference state
  const [defaultView, setDefaultView] = useState(() => {
    const saved = localStorage.getItem('defaultView');
    return saved || 'dashboard';
  });

  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Apply theme on mount and change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle default view change
  const handleViewChange = (view: string) => {
    setDefaultView(view);
    localStorage.setItem('defaultView', view);
  };

  // Export workspaces as JSON
  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      workspaces: items,
      totalCount: items.length,
    };

    const jsonData = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const jsonURL = URL.createObjectURL(jsonData);
    const link = document.createElement('a');
    link.href = jsonURL;
    link.download = `deskinsights-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(jsonURL);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-slate-900'>Settings</h1>
        <p className='text-sm text-slate-600'>
          Manage your preferences and data
        </p>
      </div>

      {/* Success message */}
      {showExportSuccess && (
        <div className='flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800'>
          <CheckCircle className='h-4 w-4 shrink-0' />
          Data exported successfully!
        </div>
      )}

      {/* Appearance Section */}
      <div className='rounded-2xl border border-amber-100 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4'>
          Appearance
        </h2>

        <div className='space-y-4'>
          {/* Theme Toggle */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-medium text-slate-900'>Theme</h3>
              <p className='text-xs text-slate-600 mt-1'>
                Choose between light and dark mode
              </p>
            </div>
            <button
              onClick={handleThemeToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className='flex items-center gap-2 text-sm'>
            <Sun
              className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-amber-500'}`}
            />
            <span
              className={
                isDarkMode ? 'text-slate-400' : 'text-slate-900 font-medium'
              }
            >
              Light
            </span>
            <span className='text-slate-300'>|</span>
            <Moon
              className={`h-4 w-4 ${isDarkMode ? 'text-amber-500' : 'text-slate-400'}`}
            />
            <span
              className={
                isDarkMode ? 'text-slate-900 font-medium' : 'text-slate-400'
              }
            >
              Dark
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className='rounded-2xl border border-amber-100 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4'>
          Preferences
        </h2>

        <div className='space-y-4'>
          {/* Default View */}
          <div>
            <h3 className='text-sm font-medium text-slate-900 mb-2'>
              Default Landing Page
            </h3>
            <p className='text-xs text-slate-600 mb-3'>
              Choose which page to see when you open DeskInsights
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  defaultView === 'dashboard'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200'
                }`}
              >
                <LayoutDashboard className='h-4 w-4' />
                Dashboard
              </button>
              <button
                onClick={() => handleViewChange('workspaces')}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  defaultView === 'workspaces'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200'
                }`}
              >
                <ClipboardList className='h-4 w-4' />
                Workspaces
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className='rounded-2xl border border-amber-100 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4'>
          Data Management
        </h2>

        <div className='space-y-4'>
          {/* Export Data */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-medium text-slate-900'>
                Export Your Data
              </h3>
              <p className='text-xs text-slate-600 mt-1'>
                Download all your workspaces as JSON ({items.length}{' '}
                {items.length === 1 ? 'workspace' : 'workspaces'})
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={items.length === 0}
              className='inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                         bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md
                         hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-40
                         disabled:cursor-not-allowed'
            >
              <Upload className='h-4 w-4' />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className='rounded-2xl border border-amber-100 bg-white p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4'>About</h2>
        <div className='space-y-2 text-sm text-slate-600'>
          <p>
            <strong className='text-slate-900'>DeskInsights</strong> - A
            workspace management application
          </p>
          <p className='text-xs'>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
