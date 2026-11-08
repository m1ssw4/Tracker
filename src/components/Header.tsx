import React from 'react';
import { Key, Moon, Sun, ShieldCheck, ShieldAlert, RefreshCw, Lock, LockOpen } from 'lucide-react';
import { ApiConfig } from '../types';

export type ActiveTab = 'schedules' | 'attendance' | 'classes' | 'students' | 'reports';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  apiConfig: ApiConfig;
  onOpenApiModal: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSyncCrm?: () => void;
  isSyncingCrm?: boolean;
  isAdminUnlocked?: boolean;
  onOpenAdminModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  apiConfig,
  onOpenApiModal,
  isDark,
  onToggleTheme,
  onSyncCrm,
  isSyncingCrm = false,
  isAdminUnlocked = false,
  onOpenAdminModal
}) => {
  const isApiConnected = apiConfig.status === 'connected' || apiConfig.apiKey.trim().length > 0;

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'schedules', label: 'Schedules' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'classes', label: 'Classes & Tags' },
    { id: 'students', label: 'Students' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            T
          </div>
          <button
            onClick={() => onSelectTab('schedules')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap text-left hover:opacity-90 transition-opacity"
          >
            TutorTrack <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm ml-1">'26-'27</span>
          </button>
        </div>

        {/* Zone 2: 4–5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`whitespace-nowrap transition-colors py-1 relative ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Theme Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onSyncCrm && (
            <button
              onClick={onSyncCrm}
              disabled={isSyncingCrm}
              title="Real-time live sync with GoHighLevel CRM"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncingCrm ? 'animate-spin' : ''}`} />
              <span>{isSyncingCrm ? 'Syncing...' : 'Sync CRM'}</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              title={isAdminUnlocked ? "Admin Mode Active (API Connected is visible) - Click to manage or lock" : "Admin Protected - Click to enter passkey to reveal API Connected option"}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                isAdminUnlocked
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isAdminUnlocked ? (
                <LockOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isAdminUnlocked ? 'Admin Mode' : 'Admin'}</span>
            </button>
          )}

          {/* CRITICAL: ONLY show API Connected option when unlocked with Admin Passkey! */}
          {isAdminUnlocked && (
            <button
              onClick={onOpenApiModal}
              title="API Integration Settings & Diagnostics (Admin Only)"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap animate-fade-in ${
                isApiConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm'
              }`}
            >
              {isApiConnected ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Key className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isApiConnected ? 'API Connected' : 'Connect API Key'}</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between overflow-x-auto gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
