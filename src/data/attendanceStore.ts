import { LessonSession, StudentAttendanceEntry, ApiConfig, Student, OneToOneSession } from '../types';
import { TUTORING_CLASSES } from './classesData';
import { INITIAL_STUDENTS, getStudentsByTag } from './mockStudents';

const STORAGE_KEY_SESSIONS = 'tutortrack_sessions_2627_ghl_v9';
const STORAGE_KEY_API_CONFIG = 'tutortrack_api_config_2627_v1';
const STORAGE_KEY_STUDENTS = 'tutortrack_students_2627_ghl_v9';
const STORAGE_KEY_ONE_TO_ONE = 'tutortrack_one_to_one_sessions_2627_v3';

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
    ['tutortrack_students_2627_ghl_v1', 'tutortrack_students_2627_ghl_v2', 'tutortrack_students_2627_ghl_v3', 'tutortrack_students_2627_ghl_v4', 'tutortrack_students_2627_ghl_v5', 'tutortrack_students_2627_ghl_v6', 'tutortrack_students_2627_ghl_v7', 'tutortrack_students_2627_ghl_v8'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) {
      const parsed: Student[] = JSON.parse(raw);
      const hasStaleSetter = parsed.some(s => /rebecca\s+collins/i.test(s.name));
      // Ensure we have at least the full roster count
      if (!hasStaleSetter && parsed.length >= INITIAL_STUDENTS.length) {
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

// ----------------------------------------------------
// 1:1 SESSIONS MANAGEMENT & PERSISTENCE
// ----------------------------------------------------

export const TUTOR_ROSTER = [
  'Richard "Rich" Handley',
  'Jake Sewell',
  'Ellie Wright',
  'Edwin Munoz',
  'Kelly Barraclough-Dunn',
  'Toni Mann',
  'Gemma Louise Koksal'
] as const;

export function generateInitialOneToOneSessions(): OneToOneSession[] {
  return [
    {
      id: '121-hailey-mon-1',
      studentId: 'xTmiNJ49FpZcR66TKG2l',
      studentName: 'Hailey',
      parentName: 'faith hikwa',
      parentPhone: '+447472882222',
      parentEmail: 'fthkhumalo@yahoo.co.uk',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-09',
      dayOfWeek: 'Monday',
      startTime: '16:30',
      endTime: '17:30',
      tutor: 'Richard "Rich" Handley',
      subject: 'Chemistry',
      topic: 'GCSE Quantitative Calculations & Moles',
      meetingLink: 'https://meet.google.com/smarta-1on1-chem',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Focus on titration formulas and exam question drills.'
    },
    {
      id: '121-harry-mon-1',
      studentId: 'IzD5Zng5FCUQxYkHGSEq',
      studentName: 'Harry',
      parentName: 'sarah tilley',
      parentPhone: '+447865090254',
      parentEmail: 'sarahtilley@live.co.uk',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-09',
      dayOfWeek: 'Monday',
      startTime: '18:00',
      endTime: '19:00',
      tutor: 'Richard "Rich" Handley',
      subject: 'Chemistry',
      topic: 'Electrolysis of Aqueous Solutions & Half Equations',
      meetingLink: 'https://meet.google.com/smarta-1on1-chem',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Predicted grade 8 focus on higher tier quantitative questions.'
    },
    {
      id: '121-charlie-mon-1',
      studentId: 'JI4ANEmMpLvynyA7j4jS',
      studentName: 'Charlie',
      parentName: 'clancy marschner',
      parentPhone: '+447548437821',
      parentEmail: 'clancymarschner@gmail.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-09',
      dayOfWeek: 'Monday',
      startTime: '17:45',
      endTime: '18:45',
      tutor: 'Jake Sewell',
      subject: 'Maths',
      topic: 'Higher Tier Algebraic Proofs & Circle Theorems',
      meetingLink: 'https://meet.google.com/smarta-1on1-maths',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Preparing for November mock assessments.'
    },
    {
      id: '121-kiana-tue-1',
      studentId: 'iqLn48H8WSEhEUCoSUk9',
      studentName: 'Kiana',
      parentName: 'ghazaleh hajreza tehrani',
      parentPhone: '+447919037036',
      parentEmail: 'kiana.tabei@gmail.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-10',
      dayOfWeek: 'Tuesday',
      startTime: '16:00',
      endTime: '17:00',
      tutor: 'Kelly Barraclough-Dunn',
      subject: 'Maths',
      topic: 'Simultaneous Equations & Quadratic Graphs',
      meetingLink: 'https://meet.google.com/smarta-1on1-maths',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Aiming for grades 8/9; building independent problem solving.'
    },
    {
      id: '121-maya-tue-1',
      studentId: 'XSGhmx9Q3AnDtGjX8zdF',
      studentName: 'Maya',
      parentName: 'malgorzata balewska',
      parentPhone: '+447894221997',
      parentEmail: 'balewska@btinternet.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-10',
      dayOfWeek: 'Tuesday',
      startTime: '17:15',
      endTime: '18:15',
      tutor: 'Toni Mann',
      subject: 'English',
      topic: 'Macbeth & Jekyll and Hyde Key Theme Analysis',
      meetingLink: 'https://meet.google.com/smarta-1on1-eng',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Focus on sophisticated literary vocabulary & 30-mark essay structure.'
    },
    {
      id: '121-shay-wed-1',
      studentId: 'FnB2Cjsv5kdI1ANT6iw5',
      studentName: 'Shay',
      parentName: 'tejal patel',
      parentPhone: '+447961186946',
      parentEmail: 'patelt185@gmail.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-11',
      dayOfWeek: 'Wednesday',
      startTime: '17:00',
      endTime: '18:00',
      tutor: 'Ellie Wright',
      subject: 'Physics',
      topic: 'Wave Speed Calculations & Refraction',
      meetingLink: 'https://meet.google.com/smarta-1on1-phys',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Exam technique on 6-mark response structure.'
    },
    {
      id: '121-sienna-wed-1',
      studentId: 'LED6cXkn3ybMbBsGzEWO',
      studentName: 'Sienna',
      parentName: 'steven leith',
      parentPhone: '+447816295838',
      parentEmail: 'sleith@talktalk.net',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-11',
      dayOfWeek: 'Wednesday',
      startTime: '18:15',
      endTime: '19:15',
      tutor: 'Gemma Louise Koksal',
      subject: 'English',
      topic: 'An Inspector Calls: Priestley’s Social Message',
      meetingLink: 'https://meet.google.com/smarta-1on1-eng',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Developing high-level contextual critique.'
    },
    {
      id: '121-amy-thu-1',
      studentId: 'KDqozTvqbpR0F1R1mkIB',
      studentName: 'Amy',
      parentName: 'lucy hardwidge',
      parentPhone: '+447738473330',
      parentEmail: 'lucyhardwidge@hotmail.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-12',
      dayOfWeek: 'Thursday',
      startTime: '16:00',
      endTime: '17:00',
      tutor: 'Edwin Munoz',
      subject: 'Science',
      topic: 'Inheritance, Punnett Squares & Genetic Crosses',
      meetingLink: 'https://meet.google.com/smarta-1on1-sci',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Reviewing genetics key terms and exam diagram questions.'
    },
    {
      id: '121-nicola-thu-1',
      studentId: 'sNiSNcjaTLh5pir0NMaV',
      studentName: 'Nicola',
      parentName: 'monika zbrog',
      parentPhone: '+447912510376',
      parentEmail: 'monikazbrog@gmail.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-12',
      dayOfWeek: 'Thursday',
      startTime: '17:30',
      endTime: '18:30',
      tutor: 'Jake Sewell',
      subject: 'Maths',
      topic: 'Trigonometry & Pythagoras in 3D Shapes',
      meetingLink: 'https://meet.google.com/smarta-1on1-maths',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Focus on 4-mark geometry questions.'
    },
    {
      id: '121-michelle-fri-1',
      studentId: 'J546Ukdi4t9rjzWZroRr',
      studentName: 'Michelle',
      parentName: 'temi olurin-oniyelu',
      parentPhone: '+447521037922',
      parentEmail: 'temiolurin@yahoo.co.uk',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-13',
      dayOfWeek: 'Friday',
      startTime: '16:30',
      endTime: '17:30',
      tutor: 'Kelly Barraclough-Dunn',
      subject: 'Science',
      topic: 'Atomic Structure & Chemical Bonding',
      meetingLink: 'https://meet.google.com/smarta-1on1-sci',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Covalent vs Ionic bonding dot-and-cross diagrams.'
    },
    {
      id: '121-chloe-fri-1',
      studentId: 'Rbspi0IP1p6cpxsyxm72',
      studentName: 'Chloe',
      parentName: 'helen ellam',
      parentPhone: '+447887854544',
      parentEmail: 'helenellam@live.co.uk',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-13',
      dayOfWeek: 'Friday',
      startTime: '17:45',
      endTime: '18:45',
      tutor: 'Richard "Rich" Handley',
      subject: 'Chemistry',
      topic: 'Acids, Alkalis & Neutralisation Reactions',
      meetingLink: 'https://meet.google.com/smarta-1on1-chem',
      status: 'scheduled',
      attendanceStatus: 'present',
      isAttendanceSubmitted: false,
      notes: 'Required practical write-up drills.'
    },
    // Past completed sessions
    {
      id: '121-hailey-past-1',
      studentId: 'xTmiNJ49FpZcR66TKG2l',
      studentName: 'Hailey',
      parentName: 'faith hikwa',
      parentPhone: '+447472882222',
      parentEmail: 'fthkhumalo@yahoo.co.uk',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-02',
      dayOfWeek: 'Monday',
      startTime: '16:30',
      endTime: '17:30',
      tutor: 'Richard "Rich" Handley',
      subject: 'Chemistry',
      topic: 'Periodic Table Trends & Transition Metals',
      meetingLink: 'https://meet.google.com/smarta-1on1-chem',
      status: 'completed',
      attendanceStatus: 'present',
      isAttendanceSubmitted: true,
      notes: 'Excellent participation. Completed all mole calculation worksheet problems accurately.'
    },
    {
      id: '121-charlie-past-1',
      studentId: 'JI4ANEmMpLvynyA7j4jS',
      studentName: 'Charlie',
      parentName: 'clancy marschner',
      parentPhone: '+447548437821',
      parentEmail: 'clancymarschner@gmail.com',
      studentTag: "'26-'27 1:1 client",
      date: '2026-11-03',
      dayOfWeek: 'Tuesday',
      startTime: '17:45',
      endTime: '18:45',
      tutor: 'Jake Sewell',
      subject: 'Maths',
      topic: 'Quadratic Equations & Completing the Square',
      meetingLink: 'https://meet.google.com/smarta-1on1-maths',
      status: 'completed',
      attendanceStatus: 'present',
      isAttendanceSubmitted: true,
      notes: 'Mastered completing the square method. Advancing to quadratic formula proofs.'
    },
    {
      id: '121-ethan-past-1',
      studentId: 'K9U0vKpCdpPCbrHqNVL1',
      studentName: 'Ethan Reed',
      parentName: 'victoria',
      parentPhone: '+447817361605',
      parentEmail: 'vickireed@btinternet.com',
      studentTag: "’25’26 1:1 client",
      date: '2026-11-04',
      dayOfWeek: 'Wednesday',
      startTime: '16:00',
      endTime: '17:00',
      tutor: 'Edwin Munoz',
      subject: 'Science',
      topic: 'Photosynthesis Rate & Limiting Factors',
      meetingLink: 'https://meet.google.com/smarta-1on1-sci',
      status: 'completed',
      attendanceStatus: 'late',
      minutesLate: 10,
      isAttendanceSubmitted: true,
      notes: 'Arrived 10 mins late due to school travel delay. Caught up quickly on graph interpretation.'
    }
  ];
}

export function loadSavedOneToOneSessions(): OneToOneSession[] {
  try {
    ['tutortrack_one_to_one_sessions_2627_v1', 'tutortrack_one_to_one_sessions_2627_v2'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const raw = localStorage.getItem(STORAGE_KEY_ONE_TO_ONE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved 1:1 sessions', e);
  }
  const initial = generateInitialOneToOneSessions();
  saveOneToOneSessions(initial);
  return initial;
}

export function saveOneToOneSessions(sessions: OneToOneSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ONE_TO_ONE, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save 1:1 sessions', e);
  }
}
