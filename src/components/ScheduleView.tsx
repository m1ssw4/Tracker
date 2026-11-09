import React, { useState, useMemo } from 'react';
import { LessonSession, AcademicCategory, Subject, DayOfWeek, Student } from '../types';
import { TUTORING_CLASSES, normalizeTag } from '../data/classesData';
import { getStudentsByTag } from '../data/mockStudents';
import { 
  Calendar, 
  Clock, 
  Search, 
  Video, 
  CheckCircle2, 
  UserCheck, 
  Copy, 
  Check, 
  CalendarDays,
  ListFilter,
  Columns2,
  Columns3,
  List
} from 'lucide-react';

interface ScheduleViewProps {
  sessions: LessonSession[];
  onOpenAttendance: (session: LessonSession) => void;
  allStudents: Student[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  sessions,
  onOpenAttendance,
  allStudents
}) => {
  const [viewMode, setViewMode] = useState<'agenda' | 'timetable'>('agenda');
  const [gridLayout, setGridLayout] = useState<'2-col' | '3-col' | '1-col'>('2-col');
  const [selectedCategory, setSelectedCategory] = useState<AcademicCategory | 'All'>('All');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // All 27 unique tags from classes for quick dropdown
  const allTags = useMemo(() => {
    return TUTORING_CLASSES.map(c => c.tag);
  }, []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const cls = TUTORING_CLASSES.find(c => c.id === session.classId);
      if (!cls) return true;

      // Category filter
      if (selectedCategory !== 'All' && cls.category !== selectedCategory) return false;

      // Subject filter
      if (selectedSubject !== 'All' && cls.subject !== selectedSubject) return false;

      // Day filter
      if (selectedDay !== 'All' && cls.dayOfWeek !== selectedDay) return false;

      // Specific tag filter dropdown
      if (selectedTagFilter !== 'All') {
        if (normalizeTag(session.classTag) !== normalizeTag(selectedTagFilter)) {
          return false;
        }
      }

      // Search query (matches name, tag, tutor, or topic)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesName = session.className.toLowerCase().includes(query);
        const matchesTag = session.classTag.toLowerCase().includes(query);
        const matchesTutor = session.tutor.toLowerCase().includes(query);
        const matchesTopic = session.topic.toLowerCase().includes(query);
        if (!matchesName && !matchesTag && !matchesTutor && !matchesTopic) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by date then start time
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [sessions, selectedCategory, selectedSubject, selectedDay, selectedTagFilter, searchQuery]);

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Group by day for timetable view
  const timetableByDay = useMemo(() => {
    const grouped: Record<string, LessonSession[]> = {};
    daysList.forEach(d => { grouped[d] = []; });
    filteredSessions.forEach(s => {
      if (grouped[s.dayOfWeek]) {
        grouped[s.dayOfWeek].push(s);
      }
    });
    return grouped;
  }, [filteredSessions, daysList]);

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Control Toolbar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        
        {/* Row 1: Search & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search by tag or keywords */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by class name, tag (e.g. 'mon 7pm', 'exam prep'), or tutor..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Agenda View</span>
            </button>
            <button
              onClick={() => setViewMode('timetable')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'timetable'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timetable Grid</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Year 11', 'Year 10', 'Exam Prep'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'All' ? 'All Classes (27)' : cat}
              </button>
            ))}
          </div>

          {/* Dropdown Filters: Specific Tag, Subject, Day */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            
            {/* Tag Selector Dropdown */}
            <div className="col-span-2 sm:col-span-1 flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Tag:</span>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="w-full sm:w-auto min-h-[36px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono sm:max-w-[200px] truncate"
              >
                <option value="All">All 27 Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject | 'All')}
              className="min-h-[36px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Subjects</option>
              <option value="Maths">Maths</option>
              <option value="Science">Science</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="English">English</option>
              <option value="English Literature">English Literature</option>
            </select>

            {/* Day Selector */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek | 'All')}
              className="min-h-[36px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Days</option>
              {daysList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Reset Filters button if any active */}
            {(selectedCategory !== 'All' || selectedSubject !== 'All' || selectedDay !== 'All' || selectedTagFilter !== 'All' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedSubject('All');
                  setSelectedDay('All');
                  setSelectedTagFilter('All');
                  setSearchQuery('');
                }}
                className="col-span-2 sm:col-span-1 min-h-[36px] text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 flex items-center justify-center sm:justify-start"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Showing count indicator & Grid Layout Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Showing <strong className="font-mono text-slate-900 dark:text-white">{filteredSessions.length}</strong> scheduled sessions</span>
          <span>·</span>
          <span>Academic Year 2026–2027</span>
        </div>

        {viewMode === 'agenda' && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] text-slate-400 font-medium">Layout:</span>
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setGridLayout('2-col')}
                title="2-Column Grid (Balanced)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  gridLayout === '2-col'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>2 Columns</span>
              </button>

              <button
                type="button"
                onClick={() => setGridLayout('3-col')}
                title="3-Column Grid (Compact / Wide screens)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  gridLayout === '3-col'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>3 Columns</span>
              </button>

              <button
                type="button"
                onClick={() => setGridLayout('1-col')}
                title="1-Column Full Width List"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  gridLayout === '1-col'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View 1: Agenda Feed (Multi-column responsive grid by default) */}
      {viewMode === 'agenda' && (
        <div className={`grid gap-4 ${
          gridLayout === '3-col'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : gridLayout === '2-col'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1'
        }`}>
          {filteredSessions.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <ListFilter className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No sessions match your filter</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting the tag or subject filter above.</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const enrolledStudents = getStudentsByTag(session.classTag, allStudents);
              const presentCount = session.attendance?.filter(a => a.status === 'present').length ?? 0;
              const lateCount = session.attendance?.filter(a => a.status === 'late').length ?? 0;
              const totalAttended = presentCount + lateCount;
              const isPast = session.status === 'completed';

              // Single Column / List View
              if (gridLayout === '1-col') {
                return (
                  <div
                    key={session.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          {session.dayOfWeek} · {session.startTime} – {session.endTime}
                        </span>
                        <span>·</span>
                        <span>{session.date}</span>
                        <span>·</span>
                        <span>Tutor: {session.tutor}</span>
                        {isPast && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Register Submitted
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {session.className}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {session.classTag}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyTag(session.classTag)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          {copiedTag === session.classTag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedTag === session.classTag ? 'Copied' : 'Copy Tag'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>{enrolledStudents.length} students enrolled</span>
                        <span>·</span>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {enrolledStudents.slice(0, 5).map((stu) => (
                            <span
                              key={stu.id}
                              title={stu.name}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${stu.avatarColor} ring-1 ring-white dark:ring-slate-900`}
                            >
                              {stu.name.charAt(0)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      {isPast && (
                        <div className="text-right">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Attendance Logged</span>
                          <p className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                            {totalAttended}/{enrolledStudents.length} Attended ({enrolledStudents.length > 0 ? Math.round((totalAttended / enrolledStudents.length) * 100) : 0}%)
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                            title="Join Class Room"
                          >
                            <Video className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenAttendance(session)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                            isPast
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isPast ? 'Edit Attendance' : 'Take Attendance'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Multi-column Card Layout (2-Column or 3-Column)
              return (
                <div
                  key={session.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 hover:shadow-xs"
                >
                  {/* Top Block: Meta, Name, Tag & Roster */}
                  <div className="space-y-3">
                    {/* Time & Register Tag */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        {session.dayOfWeek} · {session.startTime} – {session.endTime}
                      </span>
                      {isPast ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium text-[11px] flex items-center gap-1 shrink-0 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Class Name */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {session.className}
                    </h3>

                    {/* Exact Tag with Copy Action */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 max-w-full truncate">
                        {session.classTag}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyTag(session.classTag)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                        title="Copy tag for CRM or webhook"
                      >
                        {copiedTag === session.classTag ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedTag === session.classTag ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Tutor & Enrolled Students row */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="truncate pr-2">
                        Tutor: <strong className="text-slate-700 dark:text-slate-300 font-medium">{session.tutor}</strong>
                      </span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono">{enrolledStudents.length} enrolled</span>
                        {enrolledStudents.length > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {enrolledStudents.slice(0, 4).map((stu) => (
                              <span
                                key={stu.id}
                                title={stu.name}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${stu.avatarColor} ring-1 ring-white dark:ring-slate-900`}
                              >
                                {stu.name.charAt(0)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions & Attendance KPI */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Attendance</span>
                      {isPast ? (
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {totalAttended}/{enrolledStudents.length} Attended ({enrolledStudents.length > 0 ? Math.round((totalAttended / enrolledStudents.length) * 100) : 0}%)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                          {enrolledStudents.length} Enrolled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {session.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                          title="Online Classroom"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenAttendance(session)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                          isPast
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isPast ? 'Edit Attendance' : 'Take Attendance'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View 2: Weekly Timetable Grid */}
      {viewMode === 'timetable' && (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 min-w-[280px] md:min-w-[720px]">
          {daysList.map((day) => {
            const daySessions = timetableByDay[day] || [];
            return (
              <div
                key={day}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[360px]"
              >
                {/* Day Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {day}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {/* Day Sessions List */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {daySessions.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center text-xs text-slate-400">
                      No classes scheduled
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30 transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-medium">{session.startTime}</span>
                          <span className="truncate max-w-[100px]">{session.tutor.split(' ')[0]}</span>
                        </div>

                        <p className="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                          {session.className}
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                            {session.classTag.split('(')[0]}...
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenAttendance(session)}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Roll Call
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

    </div>
  );
};
