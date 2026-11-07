import React, { useState, useMemo } from 'react';
import { TutoringClass, Student, LessonSession } from '../types';
import { TUTORING_CLASSES, normalizeTag } from '../data/classesData';
import { getStudentsByTag } from '../data/mockStudents';
import { 
  Search, 
  Copy, 
  Check, 
  Tag as TagIcon, 
  Users, 
  Calendar, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface ClassesTagsViewProps {
  allStudents: Student[];
  sessions: LessonSession[];
  onSelectClassForAttendance: (session: LessonSession) => void;
}

export const ClassesTagsView: React.FC<ClassesTagsViewProps> = ({
  allStudents,
  sessions,
  onSelectClassForAttendance
}) => {
  const [searchTag, setSearchTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Year 11' | 'Year 10' | 'Exam Prep'>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Filter classes
  const filteredClasses = useMemo(() => {
    return TUTORING_CLASSES.filter(c => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedSubject !== 'All' && c.subject !== selectedSubject) return false;

      if (searchTag.trim().length > 0) {
        const queryNorm = normalizeTag(searchTag);
        const tagNorm = normalizeTag(c.tag);
        const nameNorm = c.name.toLowerCase();
        const tutorNorm = c.assignedTutor.toLowerCase();

        return tagNorm.includes(queryNorm) || nameNorm.includes(queryNorm) || tutorNorm.includes(queryNorm);
      }

      return true;
    });
  }, [selectedCategory, selectedSubject, searchTag]);

  // Tag resolver test lookup
  const resolvedMatch = useMemo(() => {
    if (!searchTag.trim()) return null;
    const norm = normalizeTag(searchTag);
    return TUTORING_CLASSES.find(c => normalizeTag(c.tag) === norm);
  }, [searchTag]);

  return (
    <div className="space-y-6">
      
      {/* Hero / Header Card for Tags Directory */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Official Tag & Class Registry
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                27 Standardized Classes ('26-'27)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Curriculum Classes & System Tags
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Each student is enrolled by attaching the standardized tag. Use the lookup tool below or copy tags to synchronize with your tutoring CRM, email sequences, or attendance webhooks.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <p className="text-slate-400 text-[11px]">Year 11 Cohorts</p>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">16</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Year 10 Cohorts</p>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">6</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Exam Prep</p>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">5</p>
            </div>
          </div>
        </div>

        {/* Tag Quick-Lookup Test Tool */}
        <div className="pt-2">
          <label htmlFor="tagLookupInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tag Match & Lookup Bar
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="tagLookupInput"
              type="text"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="Paste or type any tag, e.g. '26-'27 year 11 higher chemistry (mon 7pm) or higher science + exam prep..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Quick Exact Match Callout if found */}
          {resolvedMatch && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Exact Tag Match:</strong> {resolvedMatch.name} · Scheduled on {resolvedMatch.timeDisplay}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyTag(resolvedMatch.tag)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 rounded font-medium border border-emerald-300 dark:border-emerald-700 text-xs shrink-0"
              >
                {copiedTag === resolvedMatch.tag ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['All', 'Year 11', 'Year 10', 'Exam Prep'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'All' ? 'All Classes (27)' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Subjects</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Science">Science</option>
              <option value="Maths">Maths</option>
              <option value="English">English</option>
              <option value="English Literature">English Literature</option>
            </select>
          </div>
        </div>

      </div>

      {/* Classes List */}
      <div className="space-y-3">
        {filteredClasses.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No classes match your query.
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const isExpanded = expandedClassId === cls.id;
            const enrolledStudents = getStudentsByTag(cls.tag, allStudents);
            
            // Find recent or upcoming session for this class
            const relatedSession = sessions.find(s => s.classId === cls.id);

            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden"
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: Class Title, Timing & Tag */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{cls.category}</span>
                      <span>·</span>
                      <span>{cls.subject}</span>
                      <span>·</span>
                      <span>{cls.timeDisplay}</span>
                      <span>·</span>
                      <span>Tutor: {cls.assignedTutor}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {cls.name}
                    </h3>

                    {/* Exact Tag with Copy */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                        <TagIcon className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>{cls.tag}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyTag(cls.tag)}
                        className="px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors flex items-center gap-1"
                      >
                        {copiedTag === cls.tag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedTag === cls.tag ? 'Copied' : 'Copy Tag'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Enrolled Count & Expand Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end">
                        <Users className="w-3.5 h-3.5" /> Enrolled
                      </span>
                      <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {enrolledStudents.length} / {cls.capacity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {relatedSession && (
                        <button
                          type="button"
                          onClick={() => onSelectClassForAttendance(relatedSession)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          Attendance
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle student roster"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                </div>

                {/* Expanded Details: Syllabus notes & Enrolled Student Roster */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Course Overview
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {cls.description}
                      </p>
                    </div>

                    {/* Students tagged with this class */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Tagged Students ({enrolledStudents.length})
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Auto-enrolled via tag: <code className="font-mono text-slate-700 dark:text-slate-300">{cls.tag}</code>
                        </span>
                      </div>

                      {enrolledStudents.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No students tagged with this class yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {enrolledStudents.map((stu) => (
                            <div
                              key={stu.id}
                              className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2.5"
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0 ${stu.avatarColor}`}>
                                {stu.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                  {stu.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  Year {stu.yearGroup} · {stu.parentName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
