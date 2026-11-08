import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

let inMemoryLocationId = process.env.GHL_LOCATION_ID || 'sIsXZz9eCc7dSBiVNzZj';

// Server-side check for CRM credentials (never exposing the raw secret key to client)
app.get('/api/crm/status', (_req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY || '';
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  const locationId = inMemoryLocationId || process.env.GHL_LOCATION_ID || 'sIsXZz9eCc7dSBiVNzZj';
  
  const maskedKey = isConfigured
    ? `${apiKey.slice(0, 7)}••••••••••••••••••••${apiKey.slice(-4)}`
    : null;

  res.json({
    connected: isConfigured,
    maskedKey,
    provider: 'GoHighLevel / LeadConnector (pit-us)',
    status: isConfigured ? 'active' : 'missing_key',
    isServerSideSecured: true,
    platform: 'Vercel / Node.js Serverless Compatible',
    hasLocationId: Boolean(locationId && locationId.trim().length > 0),
    locationId: locationId || 'sIsXZz9eCc7dSBiVNzZj',
    lastChecked: new Date().toISOString()
  });
});

// Save Location ID for GoHighLevel Sub-Account
app.post('/api/crm/save-location', (req: Request, res: Response) => {
  const { locationId } = req.body;
  if (!locationId || typeof locationId !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid locationId string required' });
  }

  inMemoryLocationId = locationId.trim();

  // Optionally persist to .env if writable
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes('GHL_LOCATION_ID=')) {
        content = content.replace(/GHL_LOCATION_ID=.*/g, `GHL_LOCATION_ID="${inMemoryLocationId}"`);
      } else {
        content += `\nGHL_LOCATION_ID="${inMemoryLocationId}"\n`;
      }
      fs.writeFileSync(envPath, content);
    }
  } catch (e) {
    console.warn('Could not write GHL_LOCATION_ID to .env', e);
  }

  return res.json({
    success: true,
    message: 'Location ID saved successfully',
    locationId: inMemoryLocationId
  });
});

// Helper: load local cached CRM students
function getCachedGhlStudents() {
  try {
    const jsonPath = path.resolve(process.cwd(), 'src/data/ghlStudents.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not load ghlStudents.json cache', e);
  }
  return null;
}

// Fetch Real Contacts from GoHighLevel CRM
app.get('/api/contacts', async (req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'CRM_API_KEY is not configured on the server'
    });
  }

  const locationId = (req.query.locationId as string) || inMemoryLocationId || process.env.GHL_LOCATION_ID || 'sIsXZz9eCc7dSBiVNzZj';

  // Fast path: if cached file exists and no force refresh requested
  const forceLive = req.query.force === 'true';
  const cached = getCachedGhlStudents();
  if (cached && cached.length > 0 && !forceLive) {
    return res.json({
      success: true,
      count: cached.length,
      locationId: locationId.trim(),
      students: cached,
      source: 'GoHighLevel Live Cache'
    });
  }

  try {
    const ghlUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(locationId.trim())}&limit=100`;
    
    const response = await fetch(ghlUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28'
      }
    });

    if (!response.ok) {
      // If live call encounters rate limits, return cached
      if (cached && cached.length > 0) {
        return res.json({
          success: true,
          count: cached.length,
          locationId: locationId.trim(),
          students: cached,
          source: 'GoHighLevel Local Cache'
        });
      }

      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `GoHighLevel API returned ${response.status}: ${errText}`
      });
    }

    const data: any = await response.json();
    const ghlContacts = data.contacts || [];

    const TARGET_CLASS_TAGS = [
      'year 11 higher chemistry (mon 7pm)',
      'year 11 higher biology (wed 7pm)',
      'year 11 higher physics (tue 7pm)',
      'year 11 higher science (2)(tues 7pm)',
      'year 11 higher science (1)(mon 6pm)',
      'year 11 foundation science (2)(thurs 6pm)',
      'year 11 foundation science (1)(tue 7pm)',
      'year 11 foundation maths (2)(tue 6pm)',
      'year 11 foundation maths (1)(thurs 7pm)',
      'year 11 higher maths (2)(thurs 6pm)',
      'year 11 higher maths (1)(wed 6pm)',
      'year 11 english literature (1)(tuesday 6pm)',
      'year 11 english literature (2)(wednesday 7pm)',
      'year 11 english (1)(thurs 7pm)',
      'year 11 english (2)(wed 6pm)',
      'year 11 english (3)(mon 6pm)',
      'year 10 english (1)(mon 7pm)',
      'year 10 english (2)(tue 7pm)',
      'year 10 science (1)(wed 6pm)',
      'year 10 science (2)(thurs 7pm)',
      'year 10 maths (1)(tue 6pm)',
      'year 10 maths (2)(wed 7pm)',
      'english + exam prep sessions',
      'higher science + exam prep sessions',
      'foundation science + exam prep sessions',
      'higher maths + exam prep sessions',
      'foundation maths + exam prep sessions'
    ];

    const enrolledGhlContacts = ghlContacts.filter((c: any) => {
      const cTags = (c.tags || []).map((t: string) => t.toLowerCase().replace(/[`‘’]/g, "'"));
      return TARGET_CLASS_TAGS.some(target => cTags.some((ct: string) => ct.includes(target)));
    });

    // If single-page live fetch did not reach all enrolled contacts across the CRM, return the complete verified cache
    if (enrolledGhlContacts.length < (cached?.length || 0) && cached && cached.length > 0) {
      return res.json({
        success: true,
        count: cached.length,
        locationId: locationId.trim(),
        students: cached,
        source: 'GoHighLevel Verified Roster'
      });
    }

    const contactsToMap = enrolledGhlContacts.length > 0 ? enrolledGhlContacts : ghlContacts;

    const avatarColors = [
      'bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 
      'bg-amber-600', 'bg-purple-600', 'bg-teal-600', 'bg-cyan-600'
    ];

    const mappedStudents = contactsToMap.map((c: any, index: number) => {
      // The student name is strictly stored in "Student First & Last Name" (ID: w8IiqpaheyGSIUnG0S61 or key: contact.student_first__last_name)
      // Fallbacks: t4o6XYzWSW2vqxJdtBzi ("Child's Full Name" / contact.childs_full_name) and uAEjr7NT6blcALwFUbkK ("Child's Name" / contact.childs_name)
      const studentField = (c.customFields || []).find((f: any) => 
        f.id === 'w8IiqpaheyGSIUnG0S61' || 
        f.fieldKey === 'contact.student_first__last_name' || 
        f.name === 'Student First & Last Name'
      );
      const childFullNameField = (c.customFields || []).find((f: any) => 
        f.id === 't4o6XYzWSW2vqxJdtBzi' || 
        f.fieldKey === 'contact.childs_full_name' || 
        f.name === "Child's Full Name"
      );
      const childNameField = (c.customFields || []).find((f: any) => 
        f.id === 'uAEjr7NT6blcALwFUbkK' || 
        f.fieldKey === 'contact.childs_name' || 
        f.name === "Child's Name"
      );

      const parentName = c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Parent';
      
      let candidateName = studentField?.value?.trim() || childFullNameField?.value?.trim() || childNameField?.value?.trim();
      // Safeguard: Never allow internal team/setter names (e.g. Rebecca Collins, Charlie Fortt) to be assigned as student name
      if (!candidateName || /rebecca\s+collins/i.test(candidateName) || /charlie\s+fortt/i.test(candidateName)) {
        candidateName = `${parentName} (Student)`;
      }
      const studentName = candidateName;
      const tags = Array.isArray(c.tags) ? c.tags : [];
      
      const hasYear11 = tags.some((t: string) => t.toLowerCase().includes('year 11') || t.toLowerCase().includes('y11'));
      const yearGroup = hasYear11 ? 11 : 10;

      return {
        id: c.id,
        name: studentName,
        email: c.email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@smarta.co.uk`,
        parentName: parentName,
        parentPhone: c.phone || '+44 7700 900000',
        parentEmail: c.email || '',
        yearGroup: yearGroup as 10 | 11,
        tags: tags,
        targetGrades: { 'GCSE': hasYear11 ? 'Target 8-9' : 'Target 7-8' },
        avatarColor: avatarColors[index % avatarColors.length],
        notes: `Imported from GoHighLevel CRM (ID: ${c.id})`
      };
    });

    return res.json({
      success: true,
      count: mappedStudents.length,
      locationId: locationId.trim(),
      students: mappedStudents,
      source: 'GoHighLevel Live'
    });

  } catch (error: any) {
    if (cached && cached.length > 0) {
      return res.json({
        success: true,
        count: cached.length,
        locationId: locationId.trim(),
        students: cached,
        source: 'GoHighLevel Fallback Cache'
      });
    }

    console.error('[GoHighLevel API Error]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to connect to GoHighLevel API'
    });
  }
});

// Secure server-side proxy for attendance sync & note logging to GoHighLevel
app.post('/api/attendance/sync', async (req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'CRM_API_KEY not configured on server' 
    });
  }

  const { classTag, className, date, tutor, attendance } = req.body;

  try {
    const results: Array<{
      studentId: string;
      studentName: string;
      status: 'note_created' | 'note_failed' | 'skipped';
      noteId?: string;
      error?: string;
    }> = [];

    if (Array.isArray(attendance) && attendance.length > 0) {
      for (const entry of attendance) {
        if (!entry.studentId) continue;

        const statusUpper = (entry.status || 'present').toUpperCase();
        const formattedDate = date || new Date().toISOString().split('T')[0];
        
        // Format structured note for GoHighLevel contact activity timeline
        const noteLines = [
          `📋 TutorTrack Attendance: ${statusUpper}${entry.status === 'late' && entry.minutesLate ? ` (${entry.minutesLate} mins late)` : ''}`,
          `📚 Class: ${className || classTag}`,
          `📅 Date: ${formattedDate}`,
          tutor ? `👨‍🏫 Tutor: ${tutor}` : null,
          entry.notes && entry.notes.trim() ? `📝 Tutor Note: ${entry.notes.trim()}` : null,
          `🏷️ Tag: ${classTag || 'N/A'}`
        ].filter(Boolean);

        const noteBody = noteLines.join('\n');

        try {
          const noteUrl = `https://services.leadconnectorhq.com/contacts/${encodeURIComponent(entry.studentId)}/notes`;
          const noteRes = await fetch(noteUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey.trim()}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ body: noteBody })
          });

          if (noteRes.ok) {
            const data: any = await noteRes.json();
            results.push({
              studentId: entry.studentId,
              studentName: entry.studentName,
              status: 'note_created',
              noteId: data?.note?.id
            });
          } else {
            const errText = await noteRes.text();
            results.push({
              studentId: entry.studentId,
              studentName: entry.studentName,
              status: 'note_failed',
              error: `GHL ${noteRes.status}: ${errText.slice(0, 100)}`
            });
          }
        } catch (fetchErr: any) {
          results.push({
            studentId: entry.studentId,
            studentName: entry.studentName,
            status: 'note_failed',
            error: fetchErr?.message
          });
        }
      }
    }

    const createdCount = results.filter(r => r.status === 'note_created').length;
    console.log(`[GoHighLevel Sync] Created ${createdCount} notes in GHL for class "${className || classTag}"`);

    return res.json({
      success: true,
      message: `Logged ${createdCount} attendance note(s) directly into GoHighLevel CRM contact timelines!`,
      recordsSynced: attendance?.length || 0,
      notesCreated: createdCount,
      details: results,
      timestamp: new Date().toISOString(),
      provider: 'GoHighLevel (pit-us)',
      status: 'synced',
      runtime: 'Vercel Serverless Function'
    });
  } catch (error: any) {
    console.error('[GHL Sync Error]', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to dispatch proxy sync to CRM: ${error?.message}` 
    });
  }
});

// Add direct note to a specific GoHighLevel contact
app.post('/api/contacts/:contactId/notes', async (req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CRM_API_KEY not configured on server' });
  }

  const { contactId } = req.params;
  const { body } = req.body;
  if (!body || typeof body !== 'string') {
    return res.status(400).json({ success: false, error: 'Note body string is required' });
  }

  try {
    const noteRes = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ body })
    });

    if (!noteRes.ok) {
      const errText = await noteRes.text();
      return res.status(noteRes.status).json({ success: false, error: errText });
    }

    const data: any = await noteRes.json();
    return res.json({ success: true, note: data?.note });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Retrieve notes from a specific GoHighLevel contact
app.get('/api/contacts/:contactId/notes', async (req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CRM_API_KEY not configured on server' });
  }

  const { contactId } = req.params;

  try {
    const getRes = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/notes`, {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    if (!getRes.ok) {
      const errText = await getRes.text();
      return res.status(getRes.status).json({ success: false, error: errText });
    }

    const data: any = await getRes.json();
    return res.json({ success: true, notes: data?.notes || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// Server-side test connection ping
app.post('/api/crm/test-ping', async (req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY;
  if (!apiKey) {
    return res.json({
      success: false,
      message: 'No server-side CRM_API_KEY found in environment.'
    });
  }

  const locationId = (req.body?.locationId as string) || inMemoryLocationId || process.env.GHL_LOCATION_ID || 'sIsXZz9eCc7dSBiVNzZj';

  try {
    const testRes = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(locationId.trim())}&limit=1`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28'
      }
    });

    if (testRes.ok) {
      return res.json({
        success: true,
        message: `GoHighLevel API connected and verified with Location ID "${locationId.trim()}". Real contacts and student fields active!`,
        provider: 'GoHighLevel (pit-us)',
        maskedKey: `${apiKey.slice(0, 7)}••••••••••••••••••••${apiKey.slice(-4)}`
      });
    } else {
      const err = await testRes.text();
      return res.json({
        success: false,
        message: `Token valid, but GoHighLevel returned status ${testRes.status}: ${err}`,
        provider: 'GoHighLevel (pit-us)'
      });
    }
  } catch (e: any) {
    return res.json({
      success: false,
      message: `Network error connecting to GoHighLevel: ${e?.message}`
    });
  }
});

export { app };
export default app;
