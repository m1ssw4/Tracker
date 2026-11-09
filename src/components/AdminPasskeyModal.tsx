import React, { useState, useEffect } from 'react';
import { Lock, LockOpen, Key, Shield, ShieldCheck, X, Eye, EyeOff, AlertCircle, CheckCircle2, RotateCcw, Sliders } from 'lucide-react';

interface AdminPasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminUnlocked: boolean;
  onSetAdminUnlocked: (unlocked: boolean) => void;
  onNotify?: (message: string) => void;
  onOpenApiModal?: () => void;
}

const DEFAULT_PASSKEY = 'smarta2026';
const STORAGE_KEY = 'tutortrack_admin_passkey';

export const getStoredPasskey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_PASSKEY;
};

export const AdminPasskeyModal: React.FC<AdminPasskeyModalProps> = ({
  isOpen,
  onClose,
  isAdminUnlocked,
  onSetAdminUnlocked,
  onNotify,
  onOpenApiModal
}) => {
  if (!isOpen) return null;

  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isChangingPasskey, setIsChangingPasskey] = useState(false);
  
  // Change passkey inputs
  const [currentPasskeyVerify, setCurrentPasskeyVerify] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmNewPasskey, setConfirmNewPasskey] = useState('');

  useEffect(() => {
    setPasskeyInput('');
    setCurrentPasskeyVerify('');
    setNewPasskey('');
    setConfirmNewPasskey('');
    setError(null);
    setSuccess(null);
    setIsChangingPasskey(false);
  }, [isOpen]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredPasskey();
    if (passkeyInput.trim() === stored) {
      onSetAdminUnlocked(true);
      setSuccess('Admin privilege unlocked! The "API Connected" button is now visible in the header.');
      if (onNotify) onNotify('Admin mode unlocked - "API Connected" option is now visible');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setError('Incorrect passkey. Please try again.');
    }
  };

  const handleLock = () => {
    onSetAdminUnlocked(false);
    setSuccess('Admin privilege locked. "API Connected" button is now hidden.');
    if (onNotify) onNotify('Admin mode locked - "API Connected" option is hidden');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleChangePasskey = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredPasskey();

    if (currentPasskeyVerify.trim() !== stored) {
      setError('Current passkey is incorrect.');
      return;
    }

    if (!newPasskey.trim() || newPasskey.trim().length < 4) {
      setError('New passkey must be at least 4 characters.');
      return;
    }

    if (newPasskey.trim() !== confirmNewPasskey.trim()) {
      setError('New passkey and confirmation do not match.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, newPasskey.trim());
    setSuccess('Passkey changed successfully! Remember your new passkey.');
    setIsChangingPasskey(false);
    setCurrentPasskeyVerify('');
    setNewPasskey('');
    setConfirmNewPasskey('');
    setError(null);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSuccess(`Passkey reset to default: "${DEFAULT_PASSKEY}"`);
    setIsChangingPasskey(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isAdminUnlocked 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' 
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
            }`}>
              {isAdminUnlocked ? <LockOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin Privilege & API Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdminUnlocked ? 'Admin Mode is currently Active' : 'Protected by Admin Passkey'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Privacy Notice Banner */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>API Connected Option Visibility</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When <strong>Locked</strong>, the <strong>API Connected</strong> button and GoHighLevel integration setup dialog are hidden from the navigation bar so students, tutors, and general users cannot see or modify your API keys and endpoints.
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Current State Actions */}
          {isAdminUnlocked ? (
            <div className="space-y-4 pt-1">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">Admin Mode Active</span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">"API Connected" option is visible in the header</span>
                </div>
                <button
                  type="button"
                  onClick={handleLock}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Hide API Option</span>
                </button>
              </div>

              {onOpenApiModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenApiModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Open API Integration & Settings</span>
                </button>
              )}

              {!isChangingPasskey ? (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setIsChangingPasskey(true); setError(null); setSuccess(null); }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Key className="w-3.5 h-3.5" /> Change Admin Passkey
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* Locked state -> Enter Passkey to Unlock */
            !isChangingPasskey && (
              <form onSubmit={handleUnlock} className="space-y-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Enter Admin Passkey:
                  </label>
                  <div className="relative">
                    <input
                      type={showPasskey ? 'text' : 'password'}
                      required
                      autoFocus
                      value={passkeyInput}
                      onChange={(e) => { setPasskeyInput(e.target.value); setError(null); }}
                      placeholder="Enter passkey to reveal API Connected..."
                      className="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasskey(!showPasskey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default passkey: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{DEFAULT_PASSKEY}</code> (can be customized once unlocked)
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <LockOpen className="w-3.5 h-3.5" />
                    <span>Reveal API Connected</span>
                  </button>
                </div>
              </form>
            )
          )}

          {/* Form to change passkey */}
          {isChangingPasskey && (
            <form onSubmit={handleChangePasskey} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Change Admin Passkey</span>
                <button
                  type="button"
                  onClick={() => setIsChangingPasskey(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Back
                </button>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Current Passkey:</label>
                <input
                  type="password"
                  required
                  value={currentPasskeyVerify}
                  onChange={(e) => setCurrentPasskeyVerify(e.target.value)}
                  placeholder="Enter current passkey..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">New Passkey (min 4 characters):</label>
                <input
                  type="password"
                  required
                  value={newPasskey}
                  onChange={(e) => setNewPasskey(e.target.value)}
                  placeholder="Enter new passkey..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Confirm New Passkey:</label>
                <input
                  type="password"
                  required
                  value={confirmNewPasskey}
                  onChange={(e) => setConfirmNewPasskey(e.target.value)}
                  placeholder="Re-enter new passkey..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to default ({DEFAULT_PASSKEY})
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPasskey(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    Save Passkey
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
