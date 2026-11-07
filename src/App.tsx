import React, { useState, useEffect } from 'react';
import { 
  LessonSession, 
  Student, 
  ApiConfig, 
  StudentAttendanceEntry 
} from './types';
import { 
  loadSavedSessions, 
  saveSessions, 
  loadSavedStudents, 
  saveStudents, 
  loadApiConfig, 
  saveApiConfig 
} from './data/attendanceStore';
import { Header, ActiveTab } from './components/Header';
import { ScheduleView } from './components/ScheduleView';
import { AttendanceView } from './components/AttendanceView';
import { ClassesTagsView } from './components/ClassesTagsView';
import { StudentsView } from './components/StudentsView';
import { AnalyticsReportsView } from './components/AnalyticsReportsView';
import { AttendanceLoggerModal } from './components/AttendanceLoggerModal';
import { ApiIntegrationModal } from './components/ApiIntegrationModal';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedules');
  const [sessions, setSessions] = useState<LessonSession[]>(() => loadSavedSessions());
  const [students, setStudents] = useState<Student[]>(() => loadSavedStudents());
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => loadApiConfig());
  
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tutortrack_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Modal states
  const [activeAttendanceSession, setActiveAttendanceSession] = useState<LessonSession | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('tutortrack_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('tutortrack_theme', 'light');
    }
  }, [isDark]);

  const [hasLocationId, setHasLocationId] = useState(true);

  // Sync server-side CRM status and load real GHL students on mount
  useEffect(() => {
    fetch('/api/crm/status')
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setApiConfig(prev => ({
            ...prev,
            status: 'connected',
            provider: 'GoHighLevel',
            endpoint: '/api/attendance/sync'
          }));
          setHasLocationId(Boolean(data.hasLocationId));
        }
      })
      .catch(() => {});

    // Automatically pull real contacts from GoHighLevel
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          handleImportCrmStudents(data.students);
        }
      })
      .catch((err) => {
        console.warn('Initial GHL contacts sync fallback', err);
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenAttendanceModal = (session: LessonSession) => {
    setActiveAttendanceSession(session);
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async (sessionId: string, entries: StudentAttendanceEntry[]) => {
    const sessionObj = sessions.find(s => s.id === sessionId);
    const className = sessionObj ? sessionObj.className : 'Session';

    const updatedSessions = sessions.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        attendance: entries,
        isAttendanceSubmitted: true,
        status: 'completed' as const
      };
    });

    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // Dispatch background sync to server-side proxy
    try {
      if (sessionObj) {
        await fetch('/api/attendance/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionObj.id,
            classTag: sessionObj.classTag,
            className: sessionObj.className,
            date: sessionObj.date,
            attendance: entries
          })
        });
      }
    } catch (err) {
      console.warn('Proxy sync notification skipped', err);
    }

    showToast(`Attendance register successfully saved & synced for ${className}`);
  };

  const handleImportCrmStudents = (crmStudents: Student[]) => {
    setStudents(crmStudents);
    saveStudents(crmStudents);
    setHasLocationId(true);

    // Update sessions to enroll the real students with matching tags
    const updatedSessions = sessions.map(sess => {
      // Find students that have this session's tag
      const matched = crmStudents.filter(stu => 
        stu.tags.some(t => {
          const cleanT = t.trim().toLowerCase().replace(/[‘’]/g, "'");
          const cleanSessTag = sess.classTag.trim().toLowerCase().replace(/[‘’]/g, "'");
          return cleanT === cleanSessTag || cleanT.includes(cleanSessTag) || cleanSessTag.includes(cleanT);
        })
      );

      const newAttendance: StudentAttendanceEntry[] = matched.map(stu => {
        const existing = sess.attendance?.find(a => a.studentId === stu.id);
        return existing || {
          studentId: stu.id,
          studentName: stu.name,
          status: 'present'
        };
      });

      return {
        ...sess,
        attendance: newAttendance
      };
    });

    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    showToast(`Loaded ${crmStudents.length} real students from GoHighLevel CRM!`);
  };

  const handleUpdateStudents = (updated: Student[]) => {
    setStudents(updated);
    saveStudents(updated);
    showToast('Student roster and class tags updated');
  };

  const handleSaveApiConfig = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    saveApiConfig(newConfig);
    showToast(newConfig.apiKey ? 'API credentials active. Ready for live sync.' : 'Configuration saved in local storage mode.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Header compliant with Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        apiConfig={apiConfig}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Location ID sync prompt banner if not yet provided */}
      {!hasLocationId && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>GoHighLevel Connected:</strong> Currently showing baseline class roster. Enter your GoHighLevel <strong>Location ID</strong> to pull your live CRM contacts and tags onto this page.
            </span>
          </div>
          <button
            onClick={() => setIsApiModalOpen(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shadow-xs shrink-0 transition-colors text-xs self-start sm:self-auto"
          >
            Pull Live CRM Contacts
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'schedules' && (
          <ScheduleView
            sessions={sessions}
            onOpenAttendance={handleOpenAttendanceModal}
            allStudents={students}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            sessions={sessions}
            onOpenAttendanceModal={handleOpenAttendanceModal}
            allStudents={students}
            apiConfig={apiConfig}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesTagsView
            allStudents={students}
            sessions={sessions}
            onSelectClassForAttendance={(sess) => {
              setActiveAttendanceSession(sess);
              setIsAttendanceModalOpen(true);
            }}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            onUpdateStudents={handleUpdateStudents}
            sessions={sessions}
          />
        )}

        {activeTab === 'reports' && (
          <AnalyticsReportsView
            sessions={sessions}
            students={students}
          />
        )}
      </main>

      {/* Modals */}
      <AttendanceLoggerModal
        session={activeAttendanceSession}
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setActiveAttendanceSession(null);
        }}
        onSaveAttendance={handleSaveAttendance}
        allStudents={students}
        apiConfig={apiConfig}
      />

      <ApiIntegrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
        onImportContacts={handleImportCrmStudents}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-xl border border-slate-700 dark:border-slate-300 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 text-slate-400 hover:text-white dark:hover:text-slate-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quiet Footer with system info and API readiness */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            TutorTrack '26-'27 Academic Portal · Tracking Year 10, Year 11 & GCSE Exam Prep Cohorts
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              {apiConfig.apiKey ? 'API Integration Connected' : 'Local Storage Cache (Awaiting API Key)'}
            </span>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Configure API
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
