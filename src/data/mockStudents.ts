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

// User specified 1:1 tags:
// '26-'27 1:1 student
// ’25’26 1:1 client
export const ONE_TO_ONE_STANDARD_TAGS = [
  "'26-'27 1:1 student",
  "’25’26 1:1 client"
] as const;

// Helper to determine if a tag indicates a 1:1 client / student
export function isOneToOneTag(tag: string): boolean {
  if (!tag) return false;
  const clean = tag.trim().toLowerCase().replace(/[`‘’]/g, "'").replace(/\s+/g, ' ');
  return clean.includes("1:1") || clean.includes("1-1") || clean.includes("121");
}

// Helper to check if a student is a 1:1 client
export function isOneToOneStudent(student: Student): boolean {
  if (!student || !Array.isArray(student.tags)) return false;
  return student.tags.some(t => isOneToOneTag(t));
}

// Get the primary 1:1 tag for a student
export function getStudentOneToOneTag(student: Student): string {
  if (!student || !Array.isArray(student.tags)) return "'26-'27 1:1 student";
  const matched = student.tags.find(t => isOneToOneTag(t));
  return matched || "'26-'27 1:1 student";
}

// Filter all 1:1 students from a list
export function getOneToOneStudents(students: Student[]): Student[] {
  return students.filter(isOneToOneStudent);
}
