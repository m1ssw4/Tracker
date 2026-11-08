import { LessonSession, StudentAttendanceEntry, ApiConfig, Student } from '../types';
import { TUTORING_CLASSES } from './classesData';
import { INITIAL_STUDENTS, getStudentsByTag } from './mockStudents';

const STORAGE_KEY_SESSIONS = 'tutortrack_sessions_2627_ghl_v8';
const STORAGE_KEY_API_CONFIG = 'tutortrack_api_config_2627_v1';
const STORAGE_KEY_STUDENTS = 'tutortrack_students_2627_ghl_v8';

// Map day of week to date offset relative to Monday 2026-11-02 (Past week) and Monday 2026-11-09 (Current/Upcoming week)
const DAY_OFFSETS: Record<string, number> = {
  'Monday': 0,
  'Tuesday': 1,
  'Wednesday': 2,
  'Thursday': 3,
  'Friday': 4,
  'Saturday': 5,
  'Sunday': 6,
};

function formatIsoDate(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// Generate base schedule for two academic cycles:
// Past Cycle: Nov 2 - Nov 8, 2026 (Completed sessions with realistic attendance records)
// Current/Upcoming Cycle: Nov 9 - Nov 15, 2026 (Upcoming scheduled sessions)
export function generateInitialSessions(): LessonSession[] {
  const sessions: LessonSession[] = [];
  const pastMonday = new Date('2026-11-02T00:00:00Z');
  const currentMonday = new Date('2026-11-09T00:00:00Z');

  // Past sessions (Completed)
  TUTORING_CLASSES.forEach((cls, idx) => {
    const dayOffset = DAY_OFFSETS[cls.dayOfWeek] ?? 0;
    const sessionDate = formatIsoDate(pastMonday, dayOffset);
    const enrolledStudents = getStudentsByTag(cls.tag, INITIAL_STUDENTS);

    // Generate realistic past attendance
    const attendanceEntries: StudentAttendanceEntry[] = enrolledStudents.map((stu, sIdx) => {
      // Deterministic variety based on IDs
      const hash = (idx * 7 + sIdx * 11) % 10;
      if (hash === 9) {
        return {
          studentId: stu.id,
          studentName: stu.name,
          status: 'absent',
          notes: 'Unexcused absence, parent notified via SMS.',
          timestamp: `${sessionDate}T${cls.startTime}:00Z`
        };
      } else if (hash === 8) {
        return {
          studentId: stu.id,
          studentName: stu.name,
          status: 'excused',
          notes: 'Excused: School fixtures / orchestra rehearsal.',
          timestamp: `${sessionDate}T${cls.startTime}:00Z`
        };
      } else if (hash === 7) {
        return {
          studentId: stu.id,
          studentName: stu.name,
          status: 'late',
          minutesLate: 10,
          notes: 'Delayed by traffic / school detention.',
          timestamp: `${sessionDate}T${cls.startTime}:00Z`
        };
      } else {
        return {
          studentId: stu.id,
          studentName: stu.name,
          status: 'present',
          notes: hash === 0 ? 'Excellent verbal contributions' : undefined,
          timestamp: `${sessionDate}T${cls.startTime}:00Z`
        };
      }
    });

    sessions.push({
      id: `session-past-${cls.id}-${sessionDate}`,
      classId: cls.id,
      classTag: cls.tag,
      className: cls.name,
      date: sessionDate,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      endTime: cls.endTime,
      topic: `${cls.subject}: Core Module Review & Timed Drills`,
      tutor: cls.assignedTutor,
      status: 'completed',
      attendance: attendanceEntries,
      isAttendanceSubmitted: true,
      meetingLink: cls.roomOrLink
    });
  });

  // Upcoming sessions (Scheduled)
  TUTORING_CLASSES.forEach((cls) => {
    const dayOffset = DAY_OFFSETS[cls.dayOfWeek] ?? 0;
    const sessionDate = formatIsoDate(currentMonday, dayOffset);
    const enrolledStudents = getStudentsByTag(cls.tag, INITIAL_STUDENTS);

    // Initial empty/pending attendance entries
    const attendanceEntries: StudentAttendanceEntry[] = enrolledStudents.map(stu => ({
      studentId: stu.id,
      studentName: stu.name,
      status: 'present'
    }));

    sessions.push({
      id: `session-upcoming-${cls.id}-${sessionDate}`,
      classId: cls.id,
      classTag: cls.tag,
      className: cls.name,
      date: sessionDate,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      endTime: cls.endTime,
      topic: `${cls.subject}: Advanced Exam Questions & Masterclass`,
      tutor: cls.assignedTutor,
      status: 'scheduled',
      attendance: attendanceEntries,
      isAttendanceSubmitted: false,
      meetingLink: cls.roomOrLink
    });
  });

  return sessions;
}

// Local Storage Helpers
export function loadSavedSessions(): LessonSession[] {
  try {
    ['tutortrack_sessions_2627_ghl_v1', 'tutortrack_sessions_2627_ghl_v2', 'tutortrack_sessions_2627_ghl_v3', 'tutortrack_sessions_2627_ghl_v4', 'tutortrack_sessions_2627_ghl_v5', 'tutortrack_sessions_2627_ghl_v6', 'tutortrack_sessions_2627_ghl_v7'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed: LessonSession[] = JSON.parse(raw);
      // Check if any attendance entry has stale Rebecca Collins name
      const hasStaleSetter = parsed.some(sess => 
        sess.attendance?.some(a => /rebecca\s+collins/i.test(a.studentName))
      );
      if (!hasStaleSetter && parsed.length > 0) {
        // Synchronize tutor with authentic instructors from TUTORING_CLASSES
        return parsed.map(sess => {
          const classDef = TUTORING_CLASSES.find(c => 
            c.id === sess.classId || 
            c.tag.trim().toLowerCase() === sess.classTag.trim().toLowerCase()
          );
          if (classDef && classDef.assignedTutor) {
            return { ...sess, tutor: classDef.assignedTutor };
          }
          return sess;
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse saved sessions', e);
  }
  const initial = generateInitialSessions();
  saveSessions(initial);
  return initial;
}

export function saveSessions(sessions: LessonSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

export function loadSavedStudents(): Student[] {
  try {
    ['tutortrack_students_2627_ghl_v1', 'tutortrack_students_2627_ghl_v2', 'tutortrack_students_2627_ghl_v3', 'tutortrack_students_2627_ghl_v4', 'tutortrack_students_2627_ghl_v5', 'tutortrack_students_2627_ghl_v6', 'tutortrack_students_2627_ghl_v7'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) {
      const parsed: Student[] = JSON.parse(raw);
      const hasStaleSetter = parsed.some(s => /rebecca\s+collins/i.test(s.name));
      if (!hasStaleSetter && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved students', e);
  }
  const initial = INITIAL_STUDENTS;
  saveStudents(initial);
  return initial;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students', e);
  }
}

export function loadApiConfig(): ApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_API_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse API config', e);
  }
  return {
    apiKey: '',
    provider: 'TutorCruncher',
    endpoint: 'https://api.tutorsystem.com/v2/webhooks/attendance-sync',
    autoSync: false,
    lastSynced: null,
    status: 'pending_key'
  };
}

export function saveApiConfig(config: ApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save API config', e);
  }
}
