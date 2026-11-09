import React, { useState, useEffect } from 'react';
import { OneToOneSession, Student, DayOfWeek, AttendanceStatus } from '../types';
import { TUTOR_ROSTER } from '../data/attendanceStore';
import { isOneToOneStudent, getStudentOneToOneTag } from '../data/mockStudents';
import { X, Calendar, Clock, User, BookOpen, Video, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScheduleOneToOneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: OneToOneSession) => void;
  editingSession?: OneToOneSession | null;
  allStudents: Student[];
  initialTutor?: string;
  initialDate?: string;
}

const SUBJECTS = [
  'Chemistry',
  'Maths',
  'Biology',
  'Physics',
  'Science',
  'English',
  'English Literature',
  'Exam Prep'
];

const DAY_NAMES: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ScheduleOneToOneModal: React.FC<ScheduleOneToOneModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSession,
  allStudents,
  initialTutor,
  initialDate
}) => {
  if (!isOpen) return null;

  // Filter 1:1 students first, with fallback to all students
  const oneToOneStudents = allStudents.filter(isOneToOneStudent);
  const eligibleStudents = oneToOneStudents.length > 0 ? oneToOneStudents : allStudents;

  const defaultStudent = editingSession 
    ? eligibleStudents.find(s => s.id === editingSession.studentId) || eligibleStudents[0]
    : eligibleStudents[0];

  const todayStr = new Date().toISOString().split('T')[0];

  const [studentId, setStudentId] = useState(editingSession?.studentId || defaultStudent?.id || '');
  const [tutor, setTutor] = useState(editingSession?.tutor || initialTutor || TUTOR_ROSTER[0]);
  const [date, setDate] = useState(editingSession?.date || initialDate || todayStr);
  const [startTime, setStartTime] = useState(editingSession?.startTime || '16:30');
  const [endTime, setEndTime] = useState(editingSession?.endTime || '17:30');
  const [subject, setSubject] = useState(editingSession?.subject || 'Chemistry');
  const [topic, setTopic] = useState(editingSession?.topic || 'GCSE Exam Technique & Drills');
  const [meetingLink, setMeetingLink] = useState(editingSession?.meetingLink || 'https://meet.google.com/smarta-1on1');
  const [notes, setNotes] = useState(editingSession?.notes || '');
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>(
    editingSession?.status || 'scheduled'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSession) {
      setStudentId(editingSession.studentId);
      setTutor(editingSession.tutor);
      setDate(editingSession.date);
      setStartTime(editingSession.startTime);
      setEndTime(editingSession.endTime);
      setSubject(editingSession.subject);
      setTopic(editingSession.topic || '');
      setMeetingLink(editingSession.meetingLink || '');
      setNotes(editingSession.notes || '');
      setStatus(editingSession.status);
    } else {
      if (initialTutor && initialTutor !== 'All') setTutor(initialTutor);
      if (initialDate && initialDate !== 'All') setDate(initialDate);
    }
  }, [editingSession, initialTutor, initialDate]);

  const selectedStudent = allStudents.find(s => s.id === studentId) || defaultStudent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError('Please select a student.');
      return;
    }
    if (!tutor.trim()) {
      setError('Please select or specify a tutor.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please specify start and end time.');
      return;
    }

    // Determine Day of Week
    const d = new Date(date + 'T00:00:00Z');
    const dayOfWeek = DAY_NAMES[d.getUTCDay()] || 'Monday';

    const studentTag = selectedStudent 
      ? getStudentOneToOneTag(selectedStudent) 
      : "'26-'27 1:1 student";

    const sessionPayload: OneToOneSession = {
      id: editingSession?.id || `121-${studentId}-${date}-${Date.now().toString(36)}`,
      studentId: selectedStudent?.id || studentId,
      studentName: selectedStudent?.name || '1:1 Student',
      parentName: selectedStudent?.parentName,
      parentPhone: selectedStudent?.parentPhone,
      parentEmail: selectedStudent?.parentEmail || selectedStudent?.email,
      studentTag,
      date,
      dayOfWeek,
      startTime,
      endTime,
      tutor: tutor.trim(),
      subject,
      topic: topic.trim() || `${subject}: 1:1 Mastery Session`,
      meetingLink: meetingLink.trim() || undefined,
      status,
      attendanceStatus: editingSession?.attendanceStatus || 'present',
      minutesLate: editingSession?.minutesLate,
      notes: notes.trim() || undefined,
      isAttendanceSubmitted: editingSession?.isAttendanceSubmitted || false
    };

    onSave(sessionPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {editingSession ? 'Edit 1:1 Scheduled Session' : 'Schedule 1:1 Tutoring Session'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Select Tutor & Date for 1:1 student client
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>1:1 Student Client:</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs min-h-[38px]"
            >
              {eligibleStudents.map(stu => {
                const tag = getStudentOneToOneTag(stu);
                return (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} (Year {stu.yearGroup}) · Tag: {tag}
                  </option>
                );
              })}
            </select>
            {selectedStudent && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Parent: <strong className="text-slate-700 dark:text-slate-300">{selectedStudent.parentName}</strong> ({selectedStudent.parentPhone})</span>
                <span>·</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                  {getStudentOneToOneTag(selectedStudent)}
                </span>
              </div>
            )}
          </div>

          {/* Row: Tutor & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Tutor Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Selected Tutor:</span>
              </label>
              <select
                value={tutor}
                onChange={(e) => setTutor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs min-h-[38px]"
              >
                {TUTOR_ROSTER.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Scheduled Date:</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs min-h-[38px]"
              />
            </div>
          </div>

          {/* Row: Time Slots & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Start Time:</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs min-h-[38px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>End Time:</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs min-h-[38px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-500" />
                <span>Subject:</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs min-h-[38px]"
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic / Focus */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lesson Topic / Academic Focus:</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Higher Tier Algebra, Titrations & Moles, Monoclonal Antibodies..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs min-h-[38px]"
            />
          </div>

          {/* Online Classroom Link */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-500" />
              <span>Google Meet / Classroom Link:</span>
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs min-h-[38px]"
            />
          </div>

          {/* Session Status & Internal Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Session Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs min-h-[38px]"
              >
                <option value="scheduled">Scheduled / Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tutor Notes / Prep:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Check homework sheet 4, test question 8"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs min-h-[38px]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 sm:border-transparent rounded-lg flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingSession ? 'Save Changes' : 'Confirm & Schedule 1:1 Session'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
