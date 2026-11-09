import React from 'react';
import { Key, Moon, Sun, ShieldCheck, ShieldAlert, RefreshCw, Lock, LockOpen } from 'lucide-react';
import { ApiConfig } from '../types';

export type ActiveTab = 'schedules' | 'one-to-one' | 'attendance' | 'classes' | 'students' | 'reports';

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
    { id: 'schedules', label: 'Group Classes' },
    { id: 'one-to-one', label: '1:1 Tutoring' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'classes', label: 'Classes & Tags' },
    { id: 'students', label: 'Students' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
        
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0">
            T
          </div>
          <button
            onClick={() => onSelectTab('schedules')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap text-left hover:opacity-90 transition-opacity"
          >
            TutorTrack <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs sm:text-sm ml-0.5 sm:ml-1">'26-'27</span>
          </button>
        </div>

        {/* Zone 2: 4–5 clean single-line nav links for desktop */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium">
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onSyncCrm && (
            <button
              onClick={onSyncCrm}
              disabled={isSyncingCrm}
              title="Real-time live sync with GoHighLevel CRM"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncingCrm ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncingCrm ? 'Syncing...' : 'Sync CRM'}</span>
              <span className="sm:hidden inline">{isSyncingCrm ? '...' : 'Sync'}</span>
            </button>
          )}

          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              title={isAdminUnlocked ? "Admin Mode Active (API Connected is visible) - Click to manage or lock" : "Admin Protected - Click to enter passkey to reveal API Connected option"}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
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
              <span className="hidden sm:inline">{isAdminUnlocked ? 'Admin Mode' : 'Admin'}</span>
            </button>
          )}

          {/* CRITICAL: ONLY show API Connected option when unlocked with Admin Passkey! */}
          {isAdminUnlocked && (
            <button
              onClick={onOpenApiModal}
              title="API Integration Settings & Diagnostics (Admin Only)"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap animate-fade-in ${
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
              <span className="hidden sm:inline">{isApiConnected ? 'API Connected' : 'Connect API Key'}</span>
              <span className="sm:hidden inline">API</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile nav bar - Touch-friendly scrollable bar with active tab pills */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center overflow-x-auto gap-1.5 scroll-smooth no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap min-h-[34px] flex items-center transition-all shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
