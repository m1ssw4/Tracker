import { Student } from '../types';
import ghlData from './ghlStudents.json';

// Seeded with real contacts from GoHighLevel CRM (Location: sIsXZz9eCc7dSBiVNzZj)
export const INITIAL_STUDENTS: Student[] = ghlData as Student[];

// Helper to get students enrolled in a class given its tag (robust normalization of all quote and tick variants)
export function getStudentsByTag(tag: string, students: Student[]): Student[] {
  const cleanTag = tag.trim().toLowerCase().replace(/[`‘’]/g, "'").replace(/\s+/g, ' ');
  return students.filter(student => 
    student.tags.some(t => {
      const cleanStudentTag = t.trim().toLowerCase().replace(/[`‘’]/g, "'").replace(/\s+/g, ' ');
      return cleanStudentTag === cleanTag || 
             cleanStudentTag.includes(cleanTag) || 
             cleanTag.includes(cleanStudentTag);
    })
  );
}
