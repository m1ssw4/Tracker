import React, { useMemo, useState } from 'react';
import { LessonSession, Student, TutoringClass } from '../types';
import { TUTORING_CLASSES } from '../data/classesData';
import { getStudentsByTag } from '../data/mockStudents';
import { 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users,
  Search,
  Copy,
  Check
} from 'lucide-react';

interface AnalyticsReportsViewProps {
  sessions: LessonSession[];
  students: Student[];
}

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  sessions,
  students
}) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Year 11' | 'Year 10' | 'Exam Prep'>('All');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Completed sessions
  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.isAttendanceSubmitted);
  }, [sessions]);

  // Overall attendance statistics
  const summary = useMemo(() => {
    let totalEntries = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    completedSessions.forEach(sess => {
      sess.attendance?.forEach(a => {
        totalEntries++;
        if (a.status === 'present') presentCount++;
        else if (a.status === 'late') lateCount++;
        else if (a.status === 'absent') absentCount++;
        else if (a.status === 'excused') excusedCount++;
      });
    });

    const attended = presentCount + lateCount;
    const overallRate = totalEntries > 0 ? Math.round((attended / totalEntries) * 100) : 100;
    const punctualityRate = attended > 0 ? Math.round((presentCount / attended) * 100) : 100;

    return {
      totalEntries,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      overallRate,
      punctualityRate,
      completedCount: completedSessions.length
    };
  }, [completedSessions]);

  // Per-class attendance metrics
  const classStats = useMemo(() => {
    return TUTORING_CLASSES.map(cls => {
      const classSessions = completedSessions.filter(s => s.classId === cls.id);
      let enrolledCount = getStudentsByTag(cls.tag, students).length;
      let totalMarks = 0;
      let presentMarks = 0;
      let lateMarks = 0;
      let absentMarks = 0;

      classSessions.forEach(s => {
        s.attendance?.forEach(a => {
          totalMarks++;
          if (a.status === 'present') presentMarks++;
          else if (a.status === 'late') lateMarks++;
          else if (a.status === 'absent') absentMarks++;
        });
      });

      const attendedMarks = presentMarks + lateMarks;
      const rate = totalMarks > 0 ? Math.round((attendedMarks / totalMarks) * 100) : 100;

      return {
        ...cls,
        sessionsLogged: classSessions.length,
        enrolledCount,
        rate,
        presentMarks,
        lateMarks,
        absentMarks
      };
    });
  }, [completedSessions, students]);

  // Filtered classes
  const filteredClassStats = useMemo(() => {
    if (filterCategory === 'All') return classStats;
    return classStats.filter(c => c.category === filterCategory);
  }, [classStats, filterCategory]);

  // At-risk students (<80% attendance)
  const atRiskStudents = useMemo(() => {
    const list: { student: Student; rate: number; attended: number; total: number }[] = [];

    students.forEach(stu => {
      let total = 0;
      let attended = 0;

      completedSessions.forEach(s => {
        const entry = s.attendance?.find(a => a.studentId === stu.id);
        if (entry) {
          total++;
          if (entry.status === 'present' || entry.status === 'late') attended++;
        }
      });

      if (total >= 1) {
        const rate = Math.round((attended / total) * 100);
        if (rate < 80) {
          list.push({ student: stu, rate, attended, total });
        }
      }
    });

    return list.sort((a, b) => a.rate - b.rate);
  }, [students, completedSessions]);

  // CSV Export
  const exportCsv = () => {
    const headers = ['Class Name', 'Class Tag', 'Category', 'Subject', 'Tutor', 'Enrolled', 'Sessions Completed', 'Attendance %', 'Presents', 'Lates', 'Absents'];
    const rows = classStats.map(c => [
      `"${c.name}"`,
      `"${c.tag}"`,
      `"${c.category}"`,
      `"${c.subject}"`,
      `"${c.assignedTutor}"`,
      c.enrolledCount,
      c.sessionsLogged,
      `${c.rate}%`,
      c.presentMarks,
      c.lateMarks,
      c.absentMarks
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tutortrack_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Export Actions */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Academic Attendance Performance
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Audit Period: '26-'27 Term
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Attendance Analytics & Compliance Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated attendance logs across all 27 class tags, student retention rates, and punctuality breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
          <button
            onClick={exportCsv}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Overall Attendance Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.overallRate}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary.presentCount + summary.lateCount} of {summary.totalEntries} student checks
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Punctuality Rate</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.punctualityRate}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary.lateCount} students arrived late
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Completed Registers</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.completedCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Across 27 distinct class tags
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">At-Risk Follow-ups</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {atRiskStudents.length}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Students below 80% attendance
          </span>
        </div>

      </div>

      {/* At-risk student alert section if any */}
      {atRiskStudents.length > 0 && (
        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Attendance Intervention Watchlist (Below 80%)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {atRiskStudents.map(({ student, rate, attended, total }) => (
              <div
                key={student.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{student.name}</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{rate}%</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Attended {attended} of {total} sessions · Year {student.yearGroup}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono pt-1">
                  Parent: {student.parentName} ({student.parentPhone})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class Tag Attendance Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Class Breakdown by Tag
          </h3>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['All', 'Year 11', 'Year 10', 'Exam Prep'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filterCategory === cat
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-y border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Class Name</th>
                <th className="py-2.5 px-3">Standardized Tag</th>
                <th className="py-2.5 px-3">Schedule Slot</th>
                <th className="py-2.5 px-3 text-right">Enrolled</th>
                <th className="py-2.5 px-3 text-right">Attendance %</th>
                <th className="py-2.5 px-3 text-right">Present / Late / Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClassStats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.assignedTutor}</p>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]">{c.tag}</span>
                      <button
                        onClick={() => copyTag(c.tag)}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Copy Tag"
                      >
                        {copiedTag === c.tag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {c.timeDisplay}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                    {c.enrolledCount}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={
                      c.rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                      c.rate >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    }>
                      {c.rate}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400">{c.presentMarks}P</span>
                    {' / '}
                    <span className="text-amber-600 dark:text-amber-400">{c.lateMarks}L</span>
                    {' / '}
                    <span className="text-rose-600 dark:text-rose-400">{c.absentMarks}A</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
