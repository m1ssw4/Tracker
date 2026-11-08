import React, { useState, useMemo, useEffect } from 'react';
import { Student, LessonSession } from '../types';
import { TUTORING_CLASSES, normalizeTag } from '../data/classesData';
import { 
  Search, 
  GraduationCap, 
  Phone, 
  Mail, 
  Tag as TagIcon, 
  Calendar, 
  Plus, 
  Check, 
  Copy, 
  X,
  History,
  AlertCircle,
  FileText,
  Send,
  Loader2,
  MessageSquare,
  ExternalLink,
  Lock
} from 'lucide-react';
import { SendMessageModal, MessageRecipient } from './SendMessageModal';

interface StudentsViewProps {
  students: Student[];
  onUpdateStudents: (updated: Student[], updatedStudentId?: string, actionNote?: string) => void;
  sessions: LessonSession[];
  isAdminUnlocked?: boolean;
  onOpenAdminModal?: () => void;
  onRemoveTag?: (studentId: string, tag: string) => Promise<void> | void;
  onAddTag?: (studentId: string, tag: string) => Promise<void> | void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onUpdateStudents,
  sessions,
  isAdminUnlocked = false,
  onOpenAdminModal,
  onRemoveTag,
  onAddTag
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<'All' | '10' | '11'>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [editingStudentTags, setEditingStudentTags] = useState<Student | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Real-time tag modification state
  const [activeTagAction, setActiveTagAction] = useState<{ studentId: string; tag: string; action: 'removing' | 'adding' } | null>(null);
  const [tagToRemoveConfirmation, setTagToRemoveConfirmation] = useState<{ student: Student; tag: string } | null>(null);

  // GoHighLevel Contact Notes drawer state
  const [drawerTab, setDrawerTab] = useState<'attendance' | 'ghl_notes'>('attendance');
  const [ghlNotes, setGhlNotes] = useState<any[]>([]);
  const [isLoadingGhlNotes, setIsLoadingGhlNotes] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Direct SMS / Email modal state
  const [messageTarget, setMessageTarget] = useState<MessageRecipient | null>(null);

  // All 27 tags for filter dropdown
  const allTags = useMemo(() => TUTORING_CLASSES.map(c => c.tag), []);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Real-time tag removal synchronized with GHL
  const handleTriggerRemoveTag = async (student: Student, tagToRemove: string) => {
    setActiveTagAction({ studentId: student.id, tag: tagToRemove, action: 'removing' });
    try {
      if (onRemoveTag) {
        await onRemoveTag(student.id, tagToRemove);
      } else {
        const nextTags = student.tags.filter(t => normalizeTag(t) !== normalizeTag(tagToRemove) && t !== tagToRemove);
        const updated = { ...student, tags: nextTags };
        onUpdateStudents(
          students.map(s => s.id === updated.id ? updated : s),
          updated.id,
          `Removed class tag: "${tagToRemove}"`
        );
      }

      // Keep editing modal state updated
      if (editingStudentTags && editingStudentTags.id === student.id) {
        setEditingStudentTags(prev => prev ? {
          ...prev,
          tags: prev.tags.filter(t => normalizeTag(t) !== normalizeTag(tagToRemove) && t !== tagToRemove)
        } : null);
      }

      // Keep drawer state updated
      if (selectedStudentForHistory && selectedStudentForHistory.id === student.id) {
        setSelectedStudentForHistory(prev => prev ? {
          ...prev,
          tags: prev.tags.filter(t => normalizeTag(t) !== normalizeTag(tagToRemove) && t !== tagToRemove)
        } : null);
      }
    } catch (err) {
      console.error('Error removing tag in GHL', err);
    } finally {
      setActiveTagAction(null);
      setTagToRemoveConfirmation(null);
    }
  };

  // Real-time tag addition synchronized with GHL
  const handleTriggerAddTag = async (student: Student, tagToAdd: string) => {
    setActiveTagAction({ studentId: student.id, tag: tagToAdd, action: 'adding' });
    try {
      if (onAddTag) {
        await onAddTag(student.id, tagToAdd);
      } else {
        const nextTags = [...student.tags, tagToAdd];
        const updated = { ...student, tags: nextTags };
        onUpdateStudents(
          students.map(s => s.id === updated.id ? updated : s),
          updated.id,
          `Added class tag: "${tagToAdd}"`
        );
      }

      if (editingStudentTags && editingStudentTags.id === student.id) {
        setEditingStudentTags(prev => prev ? {
          ...prev,
          tags: [...prev.tags, tagToAdd]
        } : null);
      }

      if (selectedStudentForHistory && selectedStudentForHistory.id === student.id) {
        setSelectedStudentForHistory(prev => prev ? {
          ...prev,
          tags: [...prev.tags, tagToAdd]
        } : null);
      }
    } catch (err) {
      console.error('Error adding tag in GHL', err);
    } finally {
      setActiveTagAction(null);
    }
  };

  // Compute attendance stats per student across past sessions
  const studentAttendanceStats = useMemo(() => {
    const stats: Record<string, { total: number; attended: number; late: number; absent: number; rate: number }> = {};

    students.forEach(stu => {
      let total = 0;
      let attended = 0;
      let late = 0;
      let absent = 0;

      sessions.forEach(sess => {
        if (!sess.isAttendanceSubmitted) return;
        const entry = sess.attendance?.find(a => a.studentId === stu.id);
        if (entry) {
          total++;
          if (entry.status === 'present') attended++;
          else if (entry.status === 'late') { attended++; late++; }
          else if (entry.status === 'absent') absent++;
        }
      });

      const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
      stats[stu.id] = { total, attended, late, absent, rate };
    });

    return stats;
  }, [students, sessions]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(stu => {
      if (yearFilter !== 'All' && stu.yearGroup.toString() !== yearFilter) return false;

      if (tagFilter !== 'All') {
        const normFilter = normalizeTag(tagFilter);
        const hasTag = stu.tags.some(t => normalizeTag(t) === normFilter);
        if (!hasTag) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = stu.name.toLowerCase().includes(q);
        const matchesEmail = stu.email.toLowerCase().includes(q);
        const matchesParent = stu.parentName.toLowerCase().includes(q);
        const matchesTag = stu.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesParent && !matchesTag) return false;
      }

      return true;
    });
  }, [students, yearFilter, tagFilter, searchQuery]);

  // Fetch live GoHighLevel notes
  const fetchGhlNotes = async (contactId: string) => {
    setIsLoadingGhlNotes(true);
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(contactId)}/notes`);
      if (res.ok) {
        const data = await res.json();
        setGhlNotes(data.notes || []);
      }
    } catch (e) {
      console.warn('Failed to load GHL notes', e);
    } finally {
      setIsLoadingGhlNotes(false);
    }
  };

  useEffect(() => {
    if (selectedStudentForHistory) {
      fetchGhlNotes(selectedStudentForHistory.id);
    } else {
      setGhlNotes([]);
      setNewNoteInput('');
      setDrawerTab('attendance');
    }
  }, [selectedStudentForHistory]);

  const handleAddManualNote = async () => {
    if (!selectedStudentForHistory || !newNoteInput.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(selectedStudentForHistory.id)}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newNoteInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setGhlNotes(prev => [data.note, ...prev]);
        }
        setNewNoteInput('');
      }
    } catch (e) {
      console.error('Failed to post manual note to GHL', e);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Manage tags on student
  const handleToggleTag = (tagToAddOrRemove: string) => {
    if (!editingStudentTags) return;
    const exists = editingStudentTags.tags.some(t => normalizeTag(t) === normalizeTag(tagToAddOrRemove));
    let nextTags: string[];
    if (exists) {
      nextTags = editingStudentTags.tags.filter(t => normalizeTag(t) !== normalizeTag(tagToAddOrRemove));
    } else {
      nextTags = [...editingStudentTags.tags, tagToAddOrRemove];
    }

    const updated = { ...editingStudentTags, tags: nextTags };
    setEditingStudentTags(updated);

    onUpdateStudents(
      students.map(s => s.id === updated.id ? updated : s),
      updated.id,
      exists ? `Removed class tag: "${tagToAddOrRemove}"` : `Added class tag: "${tagToAddOrRemove}"`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Control bar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, parent contact, or class tag..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Year:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['All', '11', '10'] as const).map(yr => (
                <button
                  key={yr}
                  onClick={() => setYearFilter(yr)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    yearFilter === yr
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {yr === 'All' ? 'All Years' : `Year ${yr}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter by tag dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Filter by Class Tag:</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono max-w-xs truncate"
            >
              <option value="All">All Tags (Show All Students)</option>
              {allTags.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {tagFilter !== 'All' && (
              <button
                onClick={() => setTagFilter('All')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear Tag Filter
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {filteredStudents.length} of {students.length} students enrolled
          </div>
        </div>

      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No students match your criteria.
          </div>
        ) : (
          filteredStudents.map((stu) => {
            const stats = studentAttendanceStats[stu.id] || { total: 0, attended: 0, late: 0, absent: 0, rate: 100 };
            
            return (
              <div
                key={stu.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header & Basic Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 ${stu.avatarColor}`}>
                      {stu.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {stu.name}
                        </h3>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Year {stu.yearGroup}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {stu.email}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Rate Pill (Clean unboxed text) */}
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Attendance</span>
                    <span className={`text-base font-bold font-mono ${
                      stats.rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                      stats.rate >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {stats.rate}%
                    </span>
                  </div>
                </div>

                {/* Target Grades & Contact */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-2 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <strong>Targets:</strong> {Object.entries(stu.targetGrades).map(([subj, gr]) => `${subj} (Gr ${gr})`).join(' · ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Parent: {stu.parentName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" /> {stu.parentPhone}
                    </span>
                  </div>
                </div>

                {/* Assigned Tags List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <TagIcon className="w-3 h-3 text-indigo-500" />
                      Class Tags ({stu.tags.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingStudentTags(stu)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Manage Tags
                    </button>
                  </div>

                  <div className="space-y-1">
                    {stu.tags.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No class tags assigned</p>
                    ) : (
                      stu.tags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center justify-between px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 group hover:bg-slate-200/60 dark:hover:bg-slate-750 transition-colors"
                        >
                          <span className="truncate max-w-[210px] sm:max-w-[300px]" title={tag}>{tag}</span>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyTag(tag)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded transition-colors"
                              title="Copy tag"
                            >
                              {copiedTag === tag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setTagToRemoveConfirmation({ student: stu, tag })}
                              disabled={activeTagAction?.studentId === stu.id && activeTagAction?.tag === tag}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-0.5 rounded transition-colors"
                              title={`Remove tag "${tag}" and reflect in GoHighLevel in real-time`}
                            >
                              {activeTagAction?.studentId === stu.id && activeTagAction?.tag === tag ? (
                                <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {stats.total} sessions logged · {stats.late} late · {stats.absent} absences
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://app.smartaeducation.co.uk/v2/location/sIsXZz9eCc7dSBiVNzZj/contacts/detail/${stu.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                      title="Open contact profile in GoHighLevel CRM"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500" /> GHL Contact
                    </a>
                    <button
                      type="button"
                      onClick={() => setMessageTarget({
                        contactId: stu.id,
                        studentName: stu.name,
                        parentName: stu.parentName,
                        phone: stu.parentPhone,
                        email: stu.email
                      })}
                      className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Send SMS / Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForHistory(stu)}
                      className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <History className="w-3.5 h-3.5" /> Full Attendance Log
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Student Attendance History & GoHighLevel Notes Drawer */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedStudentForHistory.name}
                  </h3>
                  <a
                    href={`https://app.smartaeducation.co.uk/v2/location/sIsXZz9eCc7dSBiVNzZj/contacts/detail/${selectedStudentForHistory.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors flex items-center gap-1"
                    title="Open contact in GoHighLevel CRM"
                  >
                    <span>GHL: {selectedStudentForHistory.id}</span>
                    <ExternalLink className="w-3 h-3 text-indigo-500" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Year {selectedStudentForHistory.yearGroup} · Parent: {selectedStudentForHistory.parentName} ({selectedStudentForHistory.parentPhone})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://app.smartaeducation.co.uk/v2/location/sIsXZz9eCc7dSBiVNzZj/contacts/detail/${selectedStudentForHistory.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Open this contact record in GoHighLevel"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Go to GHL Contact</span>
                </a>
                <button
                  type="button"
                  onClick={() => setMessageTarget({
                    contactId: selectedStudentForHistory.id,
                    studentName: selectedStudentForHistory.name,
                    parentName: selectedStudentForHistory.parentName,
                    phone: selectedStudentForHistory.parentPhone,
                    email: selectedStudentForHistory.email
                  })}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send SMS / Email</span>
                </button>
                <button
                  onClick={() => setSelectedStudentForHistory(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Attendance History vs GoHighLevel CRM Notes */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4 text-xs font-medium">
              <button
                onClick={() => setDrawerTab('attendance')}
                className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                  drawerTab === 'attendance'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Attendance Sessions ({sessions.filter(s => s.attendance?.some(a => a.studentId === selectedStudentForHistory.id)).length})
              </button>

              <button
                onClick={() => setDrawerTab('ghl_notes')}
                className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                  drawerTab === 'ghl_notes'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                GoHighLevel CRM Notes ({ghlNotes.length})
                {isLoadingGhlNotes && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </button>
            </div>

            {/* Tab 1: Attendance History */}
            {drawerTab === 'attendance' && (
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                {sessions.filter(s => s.attendance?.some(a => a.studentId === selectedStudentForHistory.id)).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No attendance entries recorded yet for this student.
                  </p>
                ) : (
                  sessions
                    .filter(s => s.attendance?.some(a => a.studentId === selectedStudentForHistory.id))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((sess) => {
                      const entry = sess.attendance.find(a => a.studentId === selectedStudentForHistory.id);
                      if (!entry) return null;
                      return (
                        <div
                          key={sess.id}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {sess.className}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono">
                                {sess.date} ({sess.dayOfWeek})
                              </span>
                            </div>
                            {entry.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                                "{entry.notes}"
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <span className={`px-2.5 py-1 rounded font-semibold text-xs ${
                              entry.status === 'present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                              entry.status === 'late' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                              entry.status === 'absent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {entry.status.toUpperCase()}{entry.minutesLate ? ` (${entry.minutesLate}m)` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Tab 2: GoHighLevel CRM Notes */}
            {drawerTab === 'ghl_notes' && (
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Note composer directly to GoHighLevel */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Add Note to GoHighLevel Contact</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                      ● Live CRM Sync Active
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Enter academic note, parent update, or student follow-up..."
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isAddingNote || !newNoteInput.trim()}
                      onClick={handleAddManualNote}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {isAddingNote ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Posting to GHL...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Add Note to GHL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {isLoadingGhlNotes ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading notes from GoHighLevel CRM...</span>
                  </div>
                ) : ghlNotes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notes recorded in GoHighLevel for this contact yet. Use the composer above to post one!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {ghlNotes.map((n: any, idx: number) => (
                      <div
                        key={n.id || idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            {n.dateAdded ? new Date(n.dateAdded).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent Note'}
                          </span>
                          <span className="font-mono text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                            GHL Note
                          </span>
                        </div>
                        <div 
                          className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: typeof n.body === 'string' && n.body.includes('<') 
                              ? n.body 
                              : (n.bodyText || n.body || '')
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Student Tags Modal */}
      {editingStudentTags && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Manage Tags: {editingStudentTags.name}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-Time GHL Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adding or removing tags updates the contact in GoHighLevel and class rosters immediately.
                </p>
              </div>
              <button
                onClick={() => setEditingStudentTags(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Active Assigned Tags Strip */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
                  Currently Assigned Tags ({editingStudentTags.tags.length}):
                </span>
                {editingStudentTags.tags.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No class tags currently assigned to this student.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {editingStudentTags.tags.map(t => {
                      const isRemoving = activeTagAction?.studentId === editingStudentTags.id && activeTagAction?.tag === t;
                      return (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono group"
                        >
                          <span className="truncate max-w-[200px]">{t}</span>
                          <button
                            type="button"
                            onClick={() => handleTriggerRemoveTag(editingStudentTags, t)}
                            disabled={isRemoving}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded p-0.5 transition-colors ml-1"
                            title="Remove tag and sync to GoHighLevel"
                          >
                            {isRemoving ? <Loader2 className="w-3 h-3 animate-spin text-rose-500" /> : <X className="w-3 h-3" />}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* All Official Classes */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Cohort to Enroll / Unenroll:
                </div>
                {TUTORING_CLASSES.map(cls => {
                  const isSelected = editingStudentTags.tags.some(t => normalizeTag(t) === normalizeTag(cls.tag));
                  const isBusy = activeTagAction?.studentId === editingStudentTags.id && activeTagAction?.tag === cls.tag;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        if (isSelected) {
                          handleTriggerRemoveTag(editingStudentTags, cls.tag);
                        } else {
                          handleTriggerAddTag(editingStudentTags, cls.tag);
                        }
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{cls.name}</p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{cls.tag}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {isSelected ? 'Enrolled (Click to Remove)' : 'Click to Enroll'}
                        </span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setEditingStudentTags(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Removing Tag */}
      {tagToRemoveConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove Tag from GoHighLevel?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student: <strong>{tagToRemoveConfirmation.student.name}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                Tag to remove:
              </div>
              <div className="font-mono font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded border border-rose-200 dark:border-rose-900/60 break-all">
                {tagToRemoveConfirmation.tag}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 leading-relaxed">
                ⚡ This will delete this tag from the contact in <strong>GoHighLevel</strong> in real-time and unenroll them from the corresponding class session register.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTagToRemoveConfirmation(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={activeTagAction !== null}
                onClick={() => handleTriggerRemoveTag(tagToRemoveConfirmation.student, tagToRemoveConfirmation.tag)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
              >
                {activeTagAction !== null ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing from GHL...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Tag in GHL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Outbound Message Modal (SMS & Email via GoHighLevel) */}
      {messageTarget && (
        <SendMessageModal
          isOpen={!!messageTarget}
          onClose={() => setMessageTarget(null)}
          recipient={messageTarget}
          initialType="SMS"
          initialTemplate="reminder"
          isAdminUnlocked={isAdminUnlocked}
        />
      )}

    </div>
  );
};
