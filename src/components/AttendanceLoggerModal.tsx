import React, { useState, useEffect } from 'react';
import { LessonSession, StudentAttendanceEntry, AttendanceStatus, Student, ApiConfig } from '../types';
import { getStudentsByTag } from '../data/mockStudents';
import { X, Check, Clock, AlertCircle, CheckCircle2, Copy } from 'lucide-react';

interface AttendanceLoggerModalProps {
  session: LessonSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAttendance: (sessionId: string, entries: StudentAttendanceEntry[]) => Promise<void> | void;
  allStudents: Student[];
  apiConfig: ApiConfig;
}

export const AttendanceLoggerModal: React.FC<AttendanceLoggerModalProps> = ({
  session,
  isOpen,
  onClose,
  onSaveAttendance,
  allStudents,
  apiConfig
}) => {
  if (!isOpen || !session) return null;

  const [entries, setEntries] = useState<StudentAttendanceEntry[]>([]);
  const [copiedTag, setCopiedTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize roster based on session and enrolled students
  useEffect(() => {
    if (!session) return;
    const enrolled = getStudentsByTag(session.classTag, allStudents);
    
    // Map existing attendance or initialize
    const initialEntries: StudentAttendanceEntry[] = enrolled.map((stu) => {
      const existing = session.attendance?.find(a => a.studentId === stu.id);
      if (existing) {
        return { ...existing };
      }
      return {
        studentId: stu.id,
        studentName: stu.name,
        status: 'present',
        notes: ''
      };
    });

    setEntries(initialEntries);
  }, [session, allStudents]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setEntries(prev => prev.map(entry => {
      if (entry.studentId !== studentId) return entry;
      return {
        ...entry,
        status,
        minutesLate: status === 'late' ? (entry.minutesLate || 10) : undefined
      };
    }));
  };

  const updateMinutesLate = (studentId: string, minutes: number) => {
    setEntries(prev => prev.map(entry => {
      if (entry.studentId !== studentId) return entry;
      return { ...entry, minutesLate: minutes };
    }));
  };

  const updateNotes = (studentId: string, notes: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.studentId !== studentId) return entry;
      return { ...entry, notes };
    }));
  };

  const markAllPresent = () => {
    setEntries(prev => prev.map(entry => ({
      ...entry,
      status: 'present',
      minutesLate: undefined
    })));
  };

  const copyTagToClipboard = () => {
    navigator.clipboard.writeText(session.classTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveAttendance(session.id, entries);
    } catch (err) {
      console.error('Error saving attendance register', err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  // Metrics
  const total = entries.length;
  const presentCount = entries.filter(e => e.status === 'present').length;
  const lateCount = entries.filter(e => e.status === 'late').length;
  const absentCount = entries.filter(e => e.status === 'absent').length;
  const excusedCount = entries.filter(e => e.status === 'excused').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Attendance Register
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {session.date} ({session.dayOfWeek}) {session.startTime} – {session.endTime}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {session.className}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Tag: {session.classTag}
              </span>
              <button
                type="button"
                onClick={copyTagToClipboard}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copiedTag ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedTag ? 'Copied Tag' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Strip & Batch Actions */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
            <span>Enrolled: <strong className="font-mono text-slate-900 dark:text-white">{total}</strong></span>
            <span>·</span>
            <span>Present: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{presentCount}</strong></span>
            <span>·</span>
            <span>Late: <strong className="font-mono text-amber-600 dark:text-amber-400">{lateCount}</strong></span>
            <span>·</span>
            <span>Absent: <strong className="font-mono text-rose-600 dark:text-rose-400">{absentCount}</strong></span>
            <span>·</span>
            <span>Excused: <strong className="font-mono text-slate-500 dark:text-slate-400">{excusedCount}</strong></span>
            <span>·</span>
            <span>Rate: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{attendanceRate}%</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllPresent}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Students Register List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold">No students currently enrolled with this class tag</p>
              <p className="text-xs mt-1">Check the Students view to tag students with this class.</p>
            </div>
          ) : (
            entries.map((entry) => {
              const studentDetail = allStudents.find(s => s.id === entry.studentId);
              return (
                <div
                  key={entry.studentId}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Student Identity */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {entry.studentName}
                        </span>
                        {studentDetail && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Year {studentDetail.yearGroup}
                          </span>
                        )}
                      </div>
                      {studentDetail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {studentDetail.email} · Parent: {studentDetail.parentName} ({studentDetail.parentPhone})
                        </p>
                      )}
                    </div>

                    {/* Status Button Segmented Group */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                      {(
                        [
                          { key: 'present', label: 'Present', activeClass: 'bg-emerald-600 text-white font-semibold' },
                          { key: 'late', label: 'Late', activeClass: 'bg-amber-600 text-white font-semibold' },
                          { key: 'absent', label: 'Absent', activeClass: 'bg-rose-600 text-white font-semibold' },
                          { key: 'excused', label: 'Excused', activeClass: 'bg-slate-700 text-white font-semibold' }
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => updateStatus(entry.studentId, item.key)}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                            entry.status === item.key
                              ? item.activeClass
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contextual fields for Late & Notes */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-3 text-xs">
                    {entry.status === 'late' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-slate-600 dark:text-slate-400">Minutes late:</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={entry.minutesLate || 10}
                          onChange={(e) => updateMinutesLate(entry.studentId, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    )}

                    <div className="w-full flex-1">
                      <input
                        type="text"
                        placeholder="Add tutor note (e.g. Needs revision on moles, high participation)..."
                        value={entry.notes || ''}
                        onChange={(e) => updateNotes(entry.studentId, e.target.value)}
                        className="w-full px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">GoHighLevel CRM Live:</span>
            <span>Submitting will automatically log attendance notes to each student's contact profile in GHL</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>Logging Notes to GHL...</span>
                </>
              ) : (
                'Save & Submit Register'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
