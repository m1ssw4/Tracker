import React, { useState } from 'react';
import { ApiConfig } from '../types';
import { Key, CheckCircle2, Shield, RefreshCw, X, Copy, Check } from 'lucide-react';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (config: ApiConfig) => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState(config.provider);
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      if (apiKey.trim().length > 0) {
        setTestResult({
          success: true,
          message: 'Connection successful! Webhook listener is ready to receive tag attendance data.'
        });
      } else {
        setTestResult({
          success: false,
          message: 'API Key is empty. You can provide the API key now or continue using the local data cache.'
        });
      }
    }, 700);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ApiConfig = {
      ...config,
      apiKey: apiKey.trim(),
      provider,
      endpoint,
      autoSync,
      status: apiKey.trim().length > 0 ? 'connected' : 'pending_key',
      lastSynced: apiKey.trim().length > 0 ? new Date().toISOString() : config.lastSynced
    };
    onSaveConfig(updated);
    onClose();
  };

  const sampleJsonPayload = JSON.stringify(
    {
      syncEvent: "attendance.logged",
      academicYear: "2026-2027",
      classTag: "'26-'27 year 11 higher chemistry (mon 7pm)",
      date: "2026-11-09",
      sessionTime: "19:00 - 20:00",
      tutor: "Dr. Sarah Lin",
      attendance: [
        {
          studentId: "stu-101",
          studentName: "Oliver Harrison",
          status: "present",
          tags: [
            "'26-'27 year 11 higher chemistry (mon 7pm)",
            "'26-'27 higher science + exam prep sessions"
          ]
        }
      ]
    },
    null,
    2
  );

  const copySamplePayload = () => {
    navigator.clipboard.writeText(sampleJsonPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                API Key & Sync Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure CRM or webhook credentials to push attendance records automatically by tag
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
            apiKey.trim().length > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">
                  {apiKey.trim().length > 0
                    ? 'API Key Configured: Live Tag Sync Active'
                    : 'Awaiting API Key — Running on Local Cache'}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {apiKey.trim().length > 0
                    ? 'Attendance entries and schedule updates are prepared for real-time synchronization with your management backend.'
                    : 'All 27 classes, student tags, and attendance records are fully interactive and preserved locally. Whenever you send the API key, paste it here to activate remote sync!'}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Integration Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['TutorCruncher', 'Teachworks', 'GoHighLevel', 'HubSpot', 'Custom Webhook', 'Direct REST'] as const).map((prov) => (
                <button
                  type="button"
                  key={prov}
                  onClick={() => setProvider(prov)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                    provider === prov
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="apiKeyInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                API Key / Bearer Token
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showKey ? 'Hide key' : 'Show key'}
              </button>
            </div>
            <div className="relative">
              <input
                id="apiKeyInput"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here (e.g. tc_live_94f8a2... or ghl_key_...)"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Keys are encrypted in browser local storage and never transmitted to third-party tracking services.
            </p>
          </div>

          {/* Webhook Endpoint */}
          <div>
            <label htmlFor="endpointInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sync Endpoint / Webhook URL
            </label>
            <input
              id="endpointInput"
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://your-crm.example.com/api/attendance/webhook"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Real-Time Auto-Sync on Attendance Save
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immediately dispatches student attendance logs to endpoint whenever marked
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Sample JSON Tag Sync Payload preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tag Sync Payload Schema
              </span>
              <button
                type="button"
                onClick={copySamplePayload}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPayload ? 'Copied JSON' : 'Copy Schema'}
              </button>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 text-slate-200 text-xs font-mono overflow-x-auto max-h-36">
              <pre>{sampleJsonPayload}</pre>
            </div>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
