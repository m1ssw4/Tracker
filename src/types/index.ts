export type AcademicCategory = 'Year 11' | 'Year 10' | 'Exam Prep';

export type Subject = 
  | 'Chemistry' 
  | 'Biology' 
  | 'Physics' 
  | 'Science' 
  | 'Maths' 
  | 'English Literature' 
  | 'English';

export type Tier = 'Higher' | 'Foundation' | 'GCSE' | 'Exam Prep';

export type DayOfWeek = 
  | 'Monday' 
  | 'Tuesday' 
  | 'Wednesday' 
  | 'Thursday' 
  | 'Friday' 
  | 'Saturday' 
  | 'Sunday';

export interface TutoringClass {
  id: string;
  name: string;
  tag: string;
  category: AcademicCategory;
  subject: Subject;
  tier: Tier;
  dayOfWeek: DayOfWeek;
  startTime: string; // "18:00"
  endTime: string;   // "19:00"
  timeDisplay: string;
  cohort: string;
  assignedTutor: string;
  roomOrLink: string;
  capacity: number;
  description: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface Student {
  id: string;
  name: string;
  email: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  yearGroup: 10 | 11;
  tags: string[];
  targetGrades: Record<string, string>;
  avatarColor: string;
  notes?: string;
}

export interface StudentAttendanceEntry {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  minutesLate?: number;
  notes?: string;
  timestamp?: string;
}

export interface LessonSession {
  id: string;
  classId: string;
  classTag: string;
  className: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  topic: string;
  tutor: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendance: StudentAttendanceEntry[];
  isAttendanceSubmitted: boolean;
  meetingLink?: string;
}

export interface ApiConfig {
  apiKey: string;
  provider: 'TutorCruncher' | 'Teachworks' | 'GoHighLevel' | 'HubSpot' | 'Custom Webhook' | 'Direct REST';
  endpoint: string;
  autoSync: boolean;
  lastSynced: string | null;
  status: 'connected' | 'disconnected' | 'pending_key';
}

export interface OneToOneSession {
  id: string;
  studentId: string;
  studentName: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  studentTag: string; // "'26-'27 1:1 student" | "’25’26 1:1 client" | etc.
  date: string; // YYYY-MM-DD
  dayOfWeek?: DayOfWeek;
  startTime: string; // "16:00"
  endTime: string; // "17:00"
  tutor: string;
  subject: string;
  topic?: string;
  meetingLink?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendanceStatus?: AttendanceStatus; // 'present' | 'late' | 'absent' | 'excused'
  minutesLate?: number;
  notes?: string;
  isAttendanceSubmitted?: boolean;
}
