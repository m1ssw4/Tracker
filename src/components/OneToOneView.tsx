import React, { useState, useMemo } from 'react';
import { OneToOneSession, Student, AttendanceStatus } from '../types';
import { TUTOR_ROSTER } from '../data/attendanceStore';
import { isOneToOneStudent, getStudentOneToOneTag, isOneToOneTag } from '../data/mockStudents';
import { ScheduleOneToOneModal } from './ScheduleOneToOneModal';
import { SendMessageModal, MessageRecipient } from './SendMessageModal';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Plus, 
  ExternalLink, 
  Video, 
  MessageSquare, 
  Filter, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Copy,
  BookOpen,
  Users,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';

interface OneToOneViewProps {
  sessions: OneToOneSession[];
  onAddSession: (session: OneToOneSession) => void;
  onUpdateSession: (session: OneToOneSession) => void;
  onDeleteSession: (sessionId: string) => void;
  allStudents: Student[];
  onLogAttendanceNote?: (studentId: string, noteText: string) => Promise<void>;
  isAdminUnlocked?: boolean;
}

export const OneToOneView: React.FC<OneToOneViewProps> = ({
  sessions,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  allStudents,
  onLogAttendanceNote,
  isAdminUnlocked = false
}) => {
  const todayStr = '2026-11-09'; // Academic calendar anchor date
  
  // Selection and Filter States
  const [selectedTutor, setSelectedTutor] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'scheduled' | 'completed'>('All');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<OneToOneSession | null>(null);
  const [messageTarget, setMessageTarget] = useState<{
    recipient: MessageRecipient;
    sessionContext: { className: string; date: string; time?: string; tutor?: string };
    initialTemplate?: 'absence' | 'late' | 'reminder' | 'custom';
  } | null>(null);
  
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState<string | null>(null);

  // All 1:1 students detected in CRM
  const oneToOneStudents = useMemo(() => {
    return allStudents.filter(isOneToOneStudent);
  }, [allStudents]);

  // Filtered 1:1 sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Tutor filter
      if (selectedTutor !== 'All' && session.tutor !== selectedTutor) {
        return false;
      }

      // Date filter
      if (selectedDate && session.date !== selectedDate) {
        return false;
      }

      // Tag filter
      if (selectedTagFilter !== 'All') {
        const cleanFilter = selectedTagFilter.toLowerCase().replace(/[`‘’']/g, "'").trim();
        const cleanTag = session.studentTag.toLowerCase().replace(/[`‘’]/g, "'").trim();
        if (cleanTag !== cleanFilter && !cleanTag.includes(cleanFilter)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'All' && session.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesStudent = session.studentName.toLowerCase().includes(q);
        const matchesTutor = session.tutor.toLowerCase().includes(q);
        const matchesTopic = (session.topic || '').toLowerCase().includes(q);
        const matchesSubject = session.subject.toLowerCase().includes(q);
        const matchesTag = session.studentTag.toLowerCase().includes(q);
        if (!matchesStudent && !matchesTutor && !matchesTopic && !matchesSubject && !matchesTag) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by date then startTime
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [sessions, selectedTutor, selectedDate, selectedTagFilter, statusFilter, searchQuery]);

  // Quick preset dates
  const handleQuickDate = (preset: 'all' | 'today' | 'tomorrow' | 'this_week') => {
    if (preset === 'all') {
      setSelectedDate('');
    } else if (preset === 'today') {
      setSelectedDate('2026-11-09');
    } else if (preset === 'tomorrow') {
      setSelectedDate('2026-11-10');
    } else if (preset === 'this_week') {
      setSelectedDate(''); // show full week
    }
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Change session attendance status
  const handleUpdateAttendanceStatus = async (session: OneToOneSession, newStatus: AttendanceStatus) => {
    const updated: OneToOneSession = {
      ...session,
      attendanceStatus: newStatus,
      status: newStatus === 'present' || newStatus === 'late' || newStatus === 'absent' ? 'completed' : session.status,
      isAttendanceSubmitted: true
    };
    onUpdateSession(updated);

    // Sync note to GoHighLevel CRM in real-time
    const noteText = `[1:1 Tutoring Roll Call] Date: ${session.date} (${session.startTime}-${session.endTime}) | Tutor: ${session.tutor} | Subject: ${session.subject} | Status: ${newStatus.toUpperCase()}${session.topic ? ` | Topic: ${session.topic}` : ''}`;
    
    setIsSubmittingNote(session.id);
    try {
      if (onLogAttendanceNote) {
        await onLogAttendanceNote(session.studentId, noteText);
      } else {
        await fetch(`/api/contacts/${encodeURIComponent(session.studentId)}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: noteText })
        });
      }
      setAttendanceNotice(`Logged 1:1 attendance (${newStatus}) to ${session.studentName}'s GoHighLevel profile`);
      setTimeout(() => setAttendanceNotice(null), 3000);
    } catch (err) {
      console.warn('Could not auto-log 1:1 attendance note to GHL', err);
    } finally {
      setIsSubmittingNote(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & 1:1 Overview */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                1:1 Private Tutoring Management
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Official Tags: <code className="font-mono text-slate-800 dark:text-slate-200">'26-'27 1:1 student</code> · <code className="font-mono text-slate-800 dark:text-slate-200">’25’26 1:1 client</code>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              1:1 Client Schedule & Tutor Allocations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Select your <strong>Tutor</strong> and <strong>Date</strong> below to inspect all scheduled private 1:1 sessions. Every student tagged with <span className="font-mono font-medium text-slate-700 dark:text-slate-300">'26-'27 1:1 student</span> or <span className="font-mono font-medium text-slate-700 dark:text-slate-300">’25’26 1:1 client</span> is synchronized with GoHighLevel CRM.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setIsScheduleModalOpen(true);
              }}
              className="w-full sm:w-auto min-h-[42px] px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule 1:1 Session</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">1:1 Clients Enrolled</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">{oneToOneStudents.length}</span>
            <span className="text-[10px] text-slate-400 block">via CRM 1:1 tags</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Scheduled Sessions</span>
            <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{sessions.length}</span>
            <span className="text-[10px] text-slate-400 block">total allocated</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Active Tutors</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">{TUTOR_ROSTER.length}</span>
            <span className="text-[10px] text-slate-400 block">available instructors</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Matching Current View</span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{filteredSessions.length}</span>
            <span className="text-[10px] text-slate-400 block">{selectedTutor !== 'All' ? selectedTutor : 'all tutors'}</span>
          </div>
        </div>
      </div>

      {/* Team Selection & Filter Toolbar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        
        {/* Row 1: Team Selectors (Tutor & Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Select Tutor */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select Tutor:</span>
            </label>
            <select
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium truncate"
            >
              <option value="All">All Tutors ({TUTOR_ROSTER.length})</option>
              {TUTOR_ROSTER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Select Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Select Date:</span>
              </span>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear Date
                </button>
              )}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Date Presets:
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                className={`min-h-[38px] px-2 py-1 text-xs rounded-lg border text-center transition-colors ${
                  selectedDate === '2026-11-09'
                    ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('tomorrow')}
                className={`min-h-[38px] px-2 py-1 text-xs rounded-lg border text-center transition-colors ${
                  selectedDate === '2026-11-10'
                    ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('all')}
                className={`min-h-[38px] px-2 py-1 text-xs rounded-lg border text-center transition-colors ${
                  !selectedDate
                    ? 'bg-indigo-600 text-white font-semibold border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                All Dates
              </button>
            </div>
          </div>

          {/* Tag Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              1:1 CRM Tag:
            </label>
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono truncate"
            >
              <option value="All">All 1:1 Tags</option>
              <option value="'26-'27 1:1 student">'26-'27 1:1 student</option>
              <option value="’25’26 1:1 client">’25’26 1:1 client</option>
              <option value="'26-'27 1:1 client">'26-'27 1:1 client</option>
              <option value="1:1 clients '25-26'">1:1 clients '25-26'</option>
            </select>
          </div>

        </div>

        {/* Row 2: Search Query & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by 1:1 student name, topic, or tutor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs min-h-[36px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              {(['All', 'scheduled', 'completed'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-[32px] px-3 py-1 text-xs rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'All' ? 'All Sessions' : st === 'scheduled' ? 'Upcoming' : 'Completed'}
                </button>
              ))}
            </div>

            {(selectedTutor !== 'All' || selectedDate || selectedTagFilter !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTutor('All');
                  setSelectedDate('');
                  setSelectedTagFilter('All');
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 shrink-0"
              >
                Reset
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Active Filter Callout Banner */}
      {(selectedTutor !== 'All' || selectedDate) && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Showing 1:1 sessions for: {selectedTutor !== 'All' ? <strong>Tutor {selectedTutor}</strong> : 'All Tutors'}
              {selectedDate && <> on <strong>{selectedDate}</strong></>}
              {' '}(<strong className="font-mono">{filteredSessions.length}</strong> matching)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setIsScheduleModalOpen(true);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs shadow-xs"
            >
              + Add Session for this Tutor/Date
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTutor('All');
                setSelectedDate('');
              }}
              className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:underline text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Attendance Toast Notice */}
      {attendanceNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{attendanceNotice}</span>
        </div>
      )}

      {/* Primary Table: Scheduled 1:1 Sessions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-3 p-4 sm:p-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Scheduled 1:1 Sessions Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filtered by selected Tutor ({selectedTutor}) and Date ({selectedDate || 'All Dates'})
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} listed
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-y border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">1:1 Student</th>
                <th className="py-2.5 px-3">CRM 1:1 Tag</th>
                <th className="py-2.5 px-3">Assigned Tutor</th>
                <th className="py-2.5 px-3">Subject & Focus</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">No 1:1 sessions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedTutor !== 'All' || selectedDate
                        ? 'Try clearing the selected tutor or date filter, or click below to schedule one.'
                        : 'No 1:1 sessions have been scheduled yet.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSession(null);
                        setIsScheduleModalOpen(true);
                      }}
                      className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule 1:1 for this selection</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const studentDetail = allStudents.find(s => s.id === session.studentId);
                  const isBusy = isSubmittingNote === session.id;

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      
                      {/* Date & Time Slot */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{session.date}</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{session.startTime} – {session.endTime}</span>
                        </div>
                        <span className={`inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          session.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>

                      {/* 1:1 Student */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {session.studentName}
                          </span>
                          <a
                            href={`https://app.smartaeducation.co.uk/v2/location/sIsXZz9eCc7dSBiVNzZj/contacts/detail/${session.studentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5"
                            title="Open contact profile in GoHighLevel CRM"
                          >
                            <ExternalLink className="w-3 h-3 text-indigo-500" />
                          </a>
                        </div>
                        {studentDetail && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            Parent: {studentDetail.parentName} ({studentDetail.parentPhone})
                          </p>
                        )}
                      </td>

                      {/* CRM 1:1 Tag */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/80 dark:border-indigo-800/80 truncate max-w-[170px]" title={session.studentTag}>
                            {session.studentTag}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTag(session.studentTag)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                            title="Copy tag"
                          >
                            {copiedTag === session.studentTag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Assigned Tutor */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {session.tutor.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                            {session.tutor}
                          </span>
                        </div>
                      </td>

                      {/* Subject & Focus */}
                      <td className="py-3 px-3 align-top max-w-[200px]">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {session.subject}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {session.topic || 'Mastery and exam questions'}
                        </span>
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                          >
                            <Video className="w-3 h-3" />
                            <span>Classroom Link</span>
                          </a>
                        )}
                      </td>

                      {/* Attendance Segmented Controls */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {(
                            [
                              { key: 'present', label: 'P', title: 'Present', active: 'bg-emerald-600 text-white font-bold' },
                              { key: 'late', label: 'L', title: 'Late', active: 'bg-amber-600 text-white font-bold' },
                              { key: 'absent', label: 'A', title: 'Absent', active: 'bg-rose-600 text-white font-bold' },
                              { key: 'excused', label: 'E', title: 'Excused', active: 'bg-slate-700 text-white font-bold' }
                            ] as const
                          ).map(item => (
                            <button
                              key={item.key}
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateAttendanceStatus(session, item.key)}
                              title={`${item.title} (Click to record & sync to GoHighLevel notes)`}
                              className={`w-7 h-7 rounded text-[11px] transition-colors flex items-center justify-center ${
                                session.attendanceStatus === item.key
                                  ? item.active
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        {isBusy && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1 font-mono">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing GHL...
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Message */}
                          <button
                            type="button"
                            onClick={() => {
                              const s = allStudents.find(st => st.id === session.studentId);
                              setMessageTarget({
                                recipient: {
                                  contactId: session.studentId,
                                  studentName: session.studentName,
                                  parentName: session.parentName || s?.parentName,
                                  phone: session.parentPhone || s?.parentPhone,
                                  email: session.parentEmail || s?.email
                                },
                                sessionContext: {
                                  className: `1:1 ${session.subject} with ${session.tutor}`,
                                  date: session.date,
                                  time: `${session.startTime} - ${session.endTime}`,
                                  tutor: session.tutor
                                },
                                initialTemplate: session.attendanceStatus === 'absent' ? 'absence' : session.attendanceStatus === 'late' ? 'late' : 'reminder'
                              });
                            }}
                            title="Send SMS / Email via GoHighLevel to Parent"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Session */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSession(session);
                              setIsScheduleModalOpen(true);
                            }}
                            title="Edit Tutor, Date, Time or Topic"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Session */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete 1:1 session for ${session.studentName} on ${session.date}?`)) {
                                onDeleteSession(session.id);
                              }
                            }}
                            title="Delete session"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 1:1 Client Roster Grid Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Recognized 1:1 Client Roster ({oneToOneStudents.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students identified by tags: <code className="font-mono text-slate-700 dark:text-slate-300">'26-'27 1:1 student</code> or <code className="font-mono text-slate-700 dark:text-slate-300">’25’26 1:1 client</code>
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {oneToOneStudents.length} Students in CRM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {oneToOneStudents.map(student => {
            const studentSessions = sessions.filter(s => s.studentId === student.id);
            const primaryTag = getStudentOneToOneTag(student);

            return (
              <div
                key={student.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${student.avatarColor}`}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {student.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Year {student.yearGroup}
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://app.smartaeducation.co.uk/v2/location/sIsXZz9eCc7dSBiVNzZj/contacts/detail/${student.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                      title="Open contact in GoHighLevel"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    </a>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <p className="truncate">Parent: <strong className="text-slate-800 dark:text-slate-200">{student.parentName}</strong></p>
                    <p className="font-mono text-[10px] text-slate-500">{student.parentPhone}</p>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 truncate max-w-full">
                      {primaryTag}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {studentSessions.length} {studentSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSession({
                        id: `121-${student.id}-${Date.now().toString(36)}`,
                        studentId: student.id,
                        studentName: student.name,
                        parentName: student.parentName,
                        parentPhone: student.parentPhone,
                        parentEmail: student.parentEmail || student.email,
                        studentTag: primaryTag,
                        date: selectedDate || todayStr,
                        startTime: '16:30',
                        endTime: '17:30',
                        tutor: selectedTutor !== 'All' ? selectedTutor : TUTOR_ROSTER[0],
                        subject: 'Chemistry',
                        topic: '1:1 GCSE Intensive Mastery',
                        status: 'scheduled',
                        attendanceStatus: 'present',
                        isAttendanceSubmitted: false
                      });
                      setIsScheduleModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule / Edit 1:1 Session Modal */}
      {isScheduleModalOpen && (
        <ScheduleOneToOneModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setEditingSession(null);
          }}
          onSave={(newOrUpdated) => {
            if (editingSession) {
              onUpdateSession(newOrUpdated);
            } else {
              onAddSession(newOrUpdated);
            }
          }}
          editingSession={editingSession}
          allStudents={allStudents}
          initialTutor={selectedTutor !== 'All' ? selectedTutor : undefined}
          initialDate={selectedDate || undefined}
        />
      )}

      {/* Direct Outbound Message Modal (SMS & Email via GoHighLevel) */}
      {messageTarget && (
        <SendMessageModal
          isOpen={!!messageTarget}
          onClose={() => setMessageTarget(null)}
          recipient={messageTarget.recipient}
          classContext={messageTarget.sessionContext}
          initialType="SMS"
          initialTemplate={messageTarget.initialTemplate || 'reminder'}
          isAdminUnlocked={isAdminUnlocked}
        />
      )}

    </div>
  );
};
