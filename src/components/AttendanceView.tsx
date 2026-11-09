import React, { useState, useMemo } from 'react';
import { LessonSession, StudentAttendanceEntry, Student, ApiConfig } from '../types';
import { TUTORING_CLASSES, normalizeTag } from '../data/classesData';
import { getStudentsByTag } from '../data/mockStudents';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface AttendanceViewProps {
  sessions: LessonSession[];
  onOpenAttendanceModal: (session: LessonSession) => void;
  allStudents: Student[];
  apiConfig: ApiConfig;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  sessions,
  onOpenAttendanceModal,
  allStudents,
  apiConfig
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'completed' | 'scheduled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Selected session to view in full detail below
  const [focusedSessionId, setFocusedSessionId] = useState<string>(sessions[0]?.id || '');

  const allTags = useMemo(() => TUTORING_CLASSES.map(c => c.tag), []);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (statusFilter !== 'All' && session.status !== statusFilter) return false;

      if (selectedTag !== 'All') {
        if (normalizeTag(session.classTag) !== normalizeTag(selectedTag)) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = session.className.toLowerCase().includes(q);
        const matchesTag = session.classTag.toLowerCase().includes(q);
        const matchesTutor = session.tutor.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesTutor) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, statusFilter, selectedTag, searchQuery]);

  const focusedSession = useMemo(() => {
    return sessions.find(s => s.id === focusedSessionId) || filteredSessions[0] || null;
  }, [sessions, focusedSessionId, filteredSessions]);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Student Attendance Registers
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Live & Historic Roll Call
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Class Attendance Management by Tag
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select any class session to record attendance, note late arrivals, or review past submitted registers.
          </p>
        </div>

        {/* API connection indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
          <ShieldCheck className={`w-4 h-4 ${apiConfig.apiKey ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="text-slate-600 dark:text-slate-300">
            {apiConfig.apiKey ? 'Syncing to ' + apiConfig.provider : 'Local Storage Mode'}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search session by name, tag or tutor..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs min-h-[36px]"
          />
        </div>

        {/* Tag filter dropdown & Status */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Tag filter dropdown */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Tag:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs sm:max-w-[220px] truncate min-h-[36px]"
            >
              <option value="All">All 27 Tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            {(['All', 'completed', 'scheduled'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`min-h-[32px] px-2.5 sm:px-3 py-1 rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'All' ? 'All' : st === 'completed' ? 'Logged' : 'Upcoming'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Two Column Layout: Sessions List on Left, Detail / Live Register on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sessions List (5 Cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No sessions match your filter.
            </div>
          ) : (
            filteredSessions.map((sess) => {
              const isSelected = focusedSession?.id === sess.id;
              const isCompleted = sess.status === 'completed';
              const enrolledStudents = getStudentsByTag(sess.classTag, allStudents);
              const presentCount = sess.attendance?.filter(a => a.status === 'present').length ?? 0;
              const lateCount = sess.attendance?.filter(a => a.status === 'late').length ?? 0;
              const attended = presentCount + lateCount;

              return (
                <div
                  key={sess.id}
                  onClick={() => setFocusedSessionId(sess.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {sess.date} ({sess.dayOfWeek}) · {sess.startTime}
                    </span>
                    <span className={`font-semibold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isCompleted ? 'Logged' : 'Scheduled'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {sess.className}
                  </h4>

                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {sess.classTag}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {isCompleted ? `${attended}/${enrolledStudents.length} attended` : `${enrolledStudents.length} enrolled`}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                      View Register <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Session Attendance Register (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          {focusedSession ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">
                      {focusedSession.date} ({focusedSession.dayOfWeek})
                    </span>
                    <span>·</span>
                    <span>{focusedSession.startTime} – {focusedSession.endTime}</span>
                    <span>·</span>
                    <span>Tutor: {focusedSession.tutor}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {focusedSession.className}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {focusedSession.classTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTag(focusedSession.classTag)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedTag === focusedSession.classTag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTag === focusedSession.classTag ? 'Copied' : 'Copy Tag'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAttendanceModal(focusedSession)}
                  className="w-full sm:w-auto min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{focusedSession.isAttendanceSubmitted ? 'Update Attendance' : 'Take Roll Call'}</span>
                </button>
              </div>

              {/* Roster & Attendance Status Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Enrolled Roster & Logs
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Status: {focusedSession.isAttendanceSubmitted ? (
                      <strong className="text-emerald-600 dark:text-emerald-400">Submitted</strong>
                    ) : (
                      <strong className="text-amber-600 dark:text-amber-400">Pending Tutor Action</strong>
                    )}
                  </span>
                </div>

                {focusedSession.attendance?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No students tagged with this class. Use the Students tab to tag students.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {focusedSession.attendance.map((entry) => {
                      const studentDetail = allStudents.find(s => s.id === entry.studentId);
                      return (
                        <div
                          key={entry.studentId}
                          className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {entry.studentName}
                              </span>
                              {studentDetail && (
                                <span className="text-slate-500 dark:text-slate-400">
                                  Year {studentDetail.yearGroup}
                                </span>
                              )}
                            </div>
                            {entry.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                                Note: {entry.notes}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {entry.status === 'late' && entry.minutesLate && (
                              <span className="font-mono text-amber-600 dark:text-amber-400 text-[11px]">
                                +{entry.minutesLate}m
                              </span>
                            )}
                            <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                              entry.status === 'present' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                              entry.status === 'late' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                              entry.status === 'absent' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                              'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a session from the list to view its register.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
