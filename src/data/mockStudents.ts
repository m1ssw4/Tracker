import { Student } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  // --- Year 11 Students ---
  {
    id: 'stu-101',
    name: 'Oliver Harrison',
    email: 'oliver.harrison@studentmail.co.uk',
    parentName: 'Rachel Harrison',
    parentPhone: '+44 7700 900142',
    parentEmail: 'rachel.harrison@gmail.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher chemistry (mon 7pm)",
      "'26-'27 higher science + exam prep sessions",
      "'26-'27 year 11 higher maths (1)(wed 6pm)",
      "'26-'27 higher maths + exam prep sessions"
    ],
    targetGrades: { 'Chemistry': '8', 'Maths': '9', 'Science': '8-8' },
    avatarColor: 'bg-indigo-600',
    notes: 'Aiming for triple 9s in STEM. Excellent focus in chemistry electrolysis.'
  },
  {
    id: 'stu-102',
    name: 'Amara Patel',
    email: 'amara.patel@studentmail.co.uk',
    parentName: 'Sunita Patel',
    parentPhone: '+44 7700 900281',
    parentEmail: 'sunita.patel@outlook.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher chemistry (mon 7pm)",
      "'26-'27 year 11 higher biology (wed 7pm)",
      "'26-'27 higher science + exam prep sessions"
    ],
    targetGrades: { 'Chemistry': '8', 'Biology': '9' },
    avatarColor: 'bg-emerald-600',
    notes: 'Medicine applicant; high participation and very punctual.'
  },
  {
    id: 'stu-103',
    name: 'Lucas Wright',
    email: 'lucas.wright@studentmail.co.uk',
    parentName: 'David Wright',
    parentPhone: '+44 7700 900355',
    parentEmail: 'dwright@btinternet.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher physics (tue 7pm)",
      "'26-'27 year 11 higher maths (2)(thurs 6pm)",
      "'26-'27 higher maths + exam prep sessions"
    ],
    targetGrades: { 'Physics': '8', 'Maths': '8' },
    avatarColor: 'bg-blue-600',
    notes: 'Solid algebra skills; needs extra reinforcement on electromagnetism.'
  },
  {
    id: 'stu-104',
    name: 'Maya Kowalski',
    email: 'maya.kowalski@studentmail.co.uk',
    parentName: 'Ania Kowalski',
    parentPhone: '+44 7700 900412',
    parentEmail: 'akowalski@yahoo.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher biology (wed 7pm)",
      "'26-'27 year 11 english literature (1)(tuesday 6pm)",
      "'26-'27 english + exam prep sessions"
    ],
    targetGrades: { 'Biology': '8', 'English Lit': '9' },
    avatarColor: 'bg-rose-600',
    notes: 'Superb essay analysis on Macbeth. Consistent homework submission.'
  },
  {
    id: 'stu-105',
    name: 'Ethan Brooks',
    email: 'ethan.brooks@studentmail.co.uk',
    parentName: 'Mark Brooks',
    parentPhone: '+44 7700 900599',
    parentEmail: 'm.brooks@brookseng.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher science (1)(mon 6pm)",
      "'26-'27 year 11 higher maths (1)(wed 6pm)",
      "'26-'27 higher science + exam prep sessions"
    ],
    targetGrades: { 'Combined Science': '8-8', 'Maths': '8' },
    avatarColor: 'bg-amber-600',
    notes: 'Working through circle theorems; active contributor in cohort 1.'
  },
  {
    id: 'stu-106',
    name: 'Zara Al-Mansoor',
    email: 'zara.almansoor@studentmail.co.uk',
    parentName: 'Tariq Al-Mansoor',
    parentPhone: '+44 7700 900644',
    parentEmail: 'tariq.mansoor@gmail.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher science (2)(tues 7pm)",
      "'26-'27 year 11 english (1)(thurs 7pm)",
      "'26-'27 english + exam prep sessions"
    ],
    targetGrades: { 'Combined Science': '7-7', 'English': '8' },
    avatarColor: 'bg-teal-600',
    notes: 'Improved analytical paragraphs by 2 grades since September.'
  },
  {
    id: 'stu-107',
    name: 'George Davies',
    email: 'george.davies@studentmail.co.uk',
    parentName: 'Helen Davies',
    parentPhone: '+44 7700 900720',
    parentEmail: 'helen.davies@sky.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 foundation science (1)(tue 7pm)",
      "'26-'27 year 11 foundation maths (1)(thurs 7pm)",
      "'26-'27 foundation science + exam prep sessions"
    ],
    targetGrades: { 'Science': '5-5', 'Maths': '5' },
    avatarColor: 'bg-cyan-600',
    notes: 'Making steady progress on unit conversions and linear equations.'
  },
  {
    id: 'stu-108',
    name: 'Freya Campbell',
    email: 'freya.campbell@studentmail.co.uk',
    parentName: 'Fiona Campbell',
    parentPhone: '+44 7700 900812',
    parentEmail: 'fiona.campbell@icloud.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 foundation science (2)(thurs 6pm)",
      "'26-'27 year 11 foundation maths (2)(tue 6pm)",
      "'26-'27 foundation maths + exam prep sessions"
    ],
    targetGrades: { 'Science': '5-5', 'Maths': '5' },
    avatarColor: 'bg-purple-600',
    notes: 'Responds well to visual revision cards and step-by-step ratio models.'
  },
  {
    id: 'stu-109',
    name: 'Leo Tanaka',
    email: 'leo.tanaka@studentmail.co.uk',
    parentName: 'Kenji Tanaka',
    parentPhone: '+44 7700 900933',
    parentEmail: 'kenji.tanaka@corpmail.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher maths (2)(thurs 6pm)",
      "'26-'27 year 11 higher physics (tue 7pm)",
      "'26-'27 higher maths + exam prep sessions"
    ],
    targetGrades: { 'Maths': '9', 'Physics': '9' },
    avatarColor: 'bg-blue-700',
    notes: 'Preparing for UKMT challenge alongside GCSEs. Always 5 minutes early.'
  },
  {
    id: 'stu-110',
    name: 'Chloe Evans',
    email: 'chloe.evans@studentmail.co.uk',
    parentName: 'Gareth Evans',
    parentPhone: '+44 7700 901044',
    parentEmail: 'gareth.evans@walesnet.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 english literature (1)(tuesday 6pm)",
      "'26-'27 year 11 english (2)(wed 6pm)",
      "'26-'27 english + exam prep sessions"
    ],
    targetGrades: { 'English Lit': '8', 'English Lang': '8' },
    avatarColor: 'bg-fuchsia-600',
    notes: 'Exceptional creative writing voice; working on 19th-century contextual points.'
  },
  {
    id: 'stu-111',
    name: 'Noah Gallagher',
    email: 'noah.gallagher@studentmail.co.uk',
    parentName: 'Sarah Gallagher',
    parentPhone: '+44 7700 901155',
    parentEmail: 's.gallagher@gmail.com',
    yearGroup: 11,
    tags: [
      "’26-’27 year 11 english literature (2)(wednesday 7pm)",
      "'26-'27 year 11 english (3)(mon 6pm)"
    ],
    targetGrades: { 'English Lit': '7', 'English Lang': '7' },
    avatarColor: 'bg-orange-600',
    notes: 'High engagement during An Inspector Calls character debates.'
  },
  {
    id: 'stu-112',
    name: 'Jessica Taylor',
    email: 'jessica.taylor@studentmail.co.uk',
    parentName: 'Simon Taylor',
    parentPhone: '+44 7700 901266',
    parentEmail: 'simon.taylor@live.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher chemistry (mon 7pm)",
      "'26-'27 year 11 higher biology (wed 7pm)",
      "'26-'27 year 11 higher science (1)(mon 6pm)"
    ],
    targetGrades: { 'Chemistry': '8', 'Biology': '8' },
    avatarColor: 'bg-pink-600',
    notes: 'Consistent attendance across Monday & Wednesday evening blocks.'
  },
  {
    id: 'stu-113',
    name: 'Tariq Hussain',
    email: 'tariq.hussain@studentmail.co.uk',
    parentName: 'Farhan Hussain',
    parentPhone: '+44 7700 901377',
    parentEmail: 'farhan.hussain@techhub.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher science (2)(tues 7pm)",
      "'26-'27 year 11 higher maths (1)(wed 6pm)",
      "'26-'27 higher science + exam prep sessions"
    ],
    targetGrades: { 'Science': '8-8', 'Maths': '8' },
    avatarColor: 'bg-emerald-700',
    notes: 'Great improvement on 6-mark biology questions.'
  },
  {
    id: 'stu-114',
    name: 'Ruby Wilkinson',
    email: 'ruby.wilkinson@studentmail.co.uk',
    parentName: 'Claire Wilkinson',
    parentPhone: '+44 7700 901488',
    parentEmail: 'claire.wilkinson@outlook.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 foundation science (1)(tue 7pm)",
      "'26-'27 year 11 foundation maths (2)(tue 6pm)",
      "'26-'27 foundation maths + exam prep sessions"
    ],
    targetGrades: { 'Science': '5-5', 'Maths': '5' },
    avatarColor: 'bg-violet-600',
    notes: 'Attends Tuesday double block (6pm Maths then 7pm Science).'
  },
  {
    id: 'stu-115',
    name: 'Callum Murphy',
    email: 'callum.murphy@studentmail.co.uk',
    parentName: 'Paul Murphy',
    parentPhone: '+44 7700 901599',
    parentEmail: 'paul.murphy@construct.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 foundation science (2)(thurs 6pm)",
      "'26-'27 year 11 foundation maths (1)(thurs 7pm)",
      "'26-'27 foundation science + exam prep sessions"
    ],
    targetGrades: { 'Science': '5-5', 'Maths': '5' },
    avatarColor: 'bg-slate-600',
    notes: 'Attends Thursday double block (6pm Science then 7pm Maths).'
  },
  {
    id: 'stu-116',
    name: 'Isla MacDonald',
    email: 'isla.macdonald@studentmail.co.uk',
    parentName: 'Craig MacDonald',
    parentPhone: '+44 7700 901611',
    parentEmail: 'craig.mac@edinburgh.co.uk',
    yearGroup: 11,
    tags: [
      "’26-’27 year 11 english literature (2)(wednesday 7pm)",
      "'26-'27 year 11 english (1)(thurs 7pm)",
      "'26-'27 english + exam prep sessions"
    ],
    targetGrades: { 'English Lit': '8', 'English Lang': '8' },
    avatarColor: 'bg-amber-700',
    notes: 'Insightful connections across the Power and Conflict poetry cluster.'
  },
  {
    id: 'stu-117',
    name: 'Archie Scott',
    email: 'archie.scott@studentmail.co.uk',
    parentName: 'Emma Scott',
    parentPhone: '+44 7700 901722',
    parentEmail: 'emma.scott@gmail.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 english (3)(mon 6pm)",
      "'26-'27 year 11 higher maths (1)(wed 6pm)",
      "'26-'27 higher maths + exam prep sessions"
    ],
    targetGrades: { 'English': '7', 'Maths': '8' },
    avatarColor: 'bg-cyan-700',
    notes: 'Very analytical, needs to watch pacing in timed English tests.'
  },
  {
    id: 'stu-118',
    name: 'Sienna Phillips',
    email: 'sienna.phillips@studentmail.co.uk',
    parentName: 'Martin Phillips',
    parentPhone: '+44 7700 901833',
    parentEmail: 'mphillips@lawchambers.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 english (2)(wed 6pm)",
      "'26-'27 year 11 higher physics (tue 7pm)",
      "'26-'27 english + exam prep sessions"
    ],
    targetGrades: { 'English': '8', 'Physics': '8' },
    avatarColor: 'bg-emerald-600',
    notes: 'Well organized notebook and diligent revision tracker.'
  },

  // --- Year 10 Students ---
  {
    id: 'stu-201',
    name: 'Harry Jenkins',
    email: 'harry.jenkins@studentmail.co.uk',
    parentName: 'Laura Jenkins',
    parentPhone: '+44 7700 902144',
    parentEmail: 'laura.jenkins@gmail.com',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 english (1)(mon 7pm)",
      "'26-'27 year 10 maths (1)(tue 6pm)"
    ],
    targetGrades: { 'English': '7', 'Maths': '8' },
    avatarColor: 'bg-blue-600',
    notes: 'Starting Year 10 strong; asks thoughtful questions in Maths linear graphs.'
  },
  {
    id: 'stu-202',
    name: 'Zoe Richardson',
    email: 'zoe.richardson@studentmail.co.uk',
    parentName: 'Peter Richardson',
    parentPhone: '+44 7700 902255',
    parentEmail: 'peter.r@btconnect.com',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 english (2)(tue 7pm)",
      "'26-'27 year 10 science (1)(wed 6pm)"
    ],
    targetGrades: { 'English': '8', 'Science': '8' },
    avatarColor: 'bg-teal-600',
    notes: 'Excellent science practical understanding; active notes taker.'
  },
  {
    id: 'stu-203',
    name: 'Benjamin Clarke',
    email: 'benjamin.clarke@studentmail.co.uk',
    parentName: 'Joanne Clarke',
    parentPhone: '+44 7700 902366',
    parentEmail: 'j.clarke@nhs.net',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 maths (1)(tue 6pm)",
      "'26-'27 year 10 science (1)(wed 6pm)"
    ],
    targetGrades: { 'Maths': '8', 'Science': '8' },
    avatarColor: 'bg-rose-700',
    notes: 'Consistent Tuesday/Wednesday attendance. Aiming for Grade 9 in Maths.'
  },
  {
    id: 'stu-204',
    name: 'Aisha Begum',
    email: 'aisha.begum@studentmail.co.uk',
    parentName: 'Mohammed Begum',
    parentPhone: '+44 7700 902477',
    parentEmail: 'm.begum@birmingham.gov.uk',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 english (1)(mon 7pm)",
      "'26-'27 year 10 science (2)(thurs 7pm)"
    ],
    targetGrades: { 'English': '8', 'Science': '7' },
    avatarColor: 'bg-purple-700',
    notes: 'High score in autumn progress test. Diligent homework completion.'
  },
  {
    id: 'stu-205',
    name: 'Finley O’Connor',
    email: 'finley.oconnor@studentmail.co.uk',
    parentName: 'Sean O’Connor',
    parentPhone: '+44 7700 902588',
    parentEmail: 'soconnor@dublin.co.uk',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 maths (2)(wed 7pm)",
      "'26-'27 year 10 science (2)(thurs 7pm)"
    ],
    targetGrades: { 'Maths': '7', 'Science': '7' },
    avatarColor: 'bg-indigo-700',
    notes: 'Practicing algebra factorisation methods; reliable attendee.'
  },
  {
    id: 'stu-206',
    name: 'Grace Miller',
    email: 'grace.miller@studentmail.co.uk',
    parentName: 'Victoria Miller',
    parentPhone: '+44 7700 902699',
    parentEmail: 'v.miller@milleraccountancy.co.uk',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 english (2)(tue 7pm)",
      "'26-'27 year 10 maths (2)(wed 7pm)"
    ],
    targetGrades: { 'English': '8', 'Maths': '8' },
    avatarColor: 'bg-amber-600',
    notes: 'Strong descriptive writing vocabulary and rapid quadratic mental math.'
  },
  {
    id: 'stu-207',
    name: 'Daniel Foster',
    email: 'daniel.foster@studentmail.co.uk',
    parentName: 'Andrew Foster',
    parentPhone: '+44 7700 902711',
    parentEmail: 'afoster@bristolmail.com',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 science (1)(wed 6pm)",
      "'26-'27 year 10 maths (1)(tue 6pm)"
    ],
    targetGrades: { 'Science': '7', 'Maths': '7' },
    avatarColor: 'bg-emerald-600',
    notes: 'Shows good dedication in physics formula calculations.'
  },
  {
    id: 'stu-208',
    name: 'Molly Cooper',
    email: 'molly.cooper@studentmail.co.uk',
    parentName: 'Gemma Cooper',
    parentPhone: '+44 7700 902822',
    parentEmail: 'gcooper@education.org.uk',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 english (1)(mon 7pm)",
      "'26-'27 year 10 maths (2)(wed 7pm)"
    ],
    targetGrades: { 'English': '9', 'Maths': '7' },
    avatarColor: 'bg-fuchsia-700',
    notes: 'Outstanding contribution to Monday English reading discussions.'
  },

  // --- Additional High Achievers across cohorts ---
  {
    id: 'stu-301',
    name: 'Samuel Adebayo',
    email: 'samuel.adebayo@studentmail.co.uk',
    parentName: 'Adeola Adebayo',
    parentPhone: '+44 7700 903101',
    parentEmail: 'adeola.adebayo@gmail.com',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher science (1)(mon 6pm)",
      "'26-'27 year 11 higher maths (2)(thurs 6pm)",
      "'26-'27 higher maths + exam prep sessions"
    ],
    targetGrades: { 'Science': '8-8', 'Maths': '9' },
    avatarColor: 'bg-blue-800',
    notes: 'Mastered circle theorem proofs; participates actively.'
  },
  {
    id: 'stu-302',
    name: 'Emily Sanderson',
    email: 'emily.sanderson@studentmail.co.uk',
    parentName: 'Richard Sanderson',
    parentPhone: '+44 7700 903202',
    parentEmail: 'richard.sanderson@leeds.ac.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 higher chemistry (mon 7pm)",
      "'26-'27 year 11 higher physics (tue 7pm)",
      "'26-'27 higher science + exam prep sessions"
    ],
    targetGrades: { 'Chemistry': '9', 'Physics': '9' },
    avatarColor: 'bg-cyan-600',
    notes: 'Flawless calculations in moles and titration questions.'
  },
  {
    id: 'stu-303',
    name: 'Kian Morgan',
    email: 'kian.morgan@studentmail.co.uk',
    parentName: 'Owen Morgan',
    parentPhone: '+44 7700 903303',
    parentEmail: 'owen.morgan@cymru.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 foundation maths (1)(thurs 7pm)",
      "'26-'27 foundation maths + exam prep sessions"
    ],
    targetGrades: { 'Maths': '5' },
    avatarColor: 'bg-emerald-800',
    notes: 'Confidence growing steadily in percentages and compound interest.'
  },
  {
    id: 'stu-304',
    name: 'Layla Bennett',
    email: 'layla.bennett@studentmail.co.uk',
    parentName: 'Stephanie Bennett',
    parentPhone: '+44 7700 903404',
    parentEmail: 'stephanie.b@solicitors.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 english literature (1)(tuesday 6pm)",
      "’26-’27 year 11 english literature (2)(wednesday 7pm)",
      "'26-'27 english + exam prep sessions"
    ],
    targetGrades: { 'English Lit': '9' },
    avatarColor: 'bg-purple-800',
    notes: 'Attends double literature sessions for deep comparative essays.'
  },
  {
    id: 'stu-305',
    name: 'Harrison Price',
    email: 'harrison.price@studentmail.co.uk',
    parentName: 'Gary Price',
    parentPhone: '+44 7700 903505',
    parentEmail: 'gary.price@automotive.co.uk',
    yearGroup: 11,
    tags: [
      "'26-'27 year 11 foundation science (2)(thurs 6pm)",
      "'26-'27 foundation science + exam prep sessions"
    ],
    targetGrades: { 'Science': '5-5' },
    avatarColor: 'bg-slate-700',
    notes: 'Good retention on required practical definitions and variables.'
  },
  {
    id: 'stu-306',
    name: 'Phoebe Fletcher',
    email: 'phoebe.fletcher@studentmail.co.uk',
    parentName: 'Natalie Fletcher',
    parentPhone: '+44 7700 903606',
    parentEmail: 'natalie.f@manchester.gov.uk',
    yearGroup: 10,
    tags: [
      "'26-'27 year 10 science (2)(thurs 7pm)",
      "'26-'27 year 10 english (2)(tue 7pm)"
    ],
    targetGrades: { 'Science': '8', 'English': '8' },
    avatarColor: 'bg-indigo-600',
    notes: 'Thorough answers in chemical reaction rate experiments.'
  }
];

// Helper to get students enrolled in a class given its tag
export function getStudentsByTag(tag: string, students: Student[]): Student[] {
  const cleanTag = tag.trim().toLowerCase().replace(/[‘’]/g, "'");
  return students.filter(student => 
    student.tags.some(t => {
      const cleanStudentTag = t.trim().toLowerCase().replace(/[‘’]/g, "'");
      return cleanStudentTag === cleanTag || 
             cleanStudentTag.includes(cleanTag) || 
             cleanTag.includes(cleanStudentTag);
    })
  );
}
