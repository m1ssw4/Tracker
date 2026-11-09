import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

const DEFAULT_CRM_API_KEY = 'pit-us-522a3e6c-fe1e-48e6-90f3-e904a5de38e5';
const getApiKey = () => process.env.CRM_API_KEY || DEFAULT_CRM_API_KEY;

let inMemoryLocationId = process.env.GHL_LOCATION_ID || 'sIsXZz9eCc7dSBiVNzZj';

// Server-side check for CRM credentials (never exposing the raw secret key to client)
app.get('/api/crm/status', (_req: Request, res: Response) => {
  const apiKey = getApiKey();
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

// In-memory short cache for real-time CRM student queries (10-second TTL)
let liveStudentsCache: { timestamp: number; data: any[] } | null = null;

// Fetch Real Contacts from GoHighLevel CRM (Real-time live sync)
app.get('/api/contacts', async (req: Request, res: Response) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'CRM_API_KEY is not configured on the server'
    });
  }

  const locationId = (req.query.locationId as string) || inMemoryLocationId || process.env.GHL_LOCATION_ID || 'sIsXZz9eCc7dSBiVNzZj';
  const forceRefresh = req.query.force === 'true' || req.query.refresh === 'true';

  // Use short in-memory cache if not forced and less than 10 seconds old
  if (!forceRefresh && liveStudentsCache && (Date.now() - liveStudentsCache.timestamp < 10000)) {
    return res.json({
      success: true,
      count: liveStudentsCache.data.length,
      locationId: locationId.trim(),
      students: liveStudentsCache.data,
      source: 'GoHighLevel Real-Time Cache'
    });
  }

  try {
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

    // Queries to discover all group classes, subjects, cohorts & 1:1 clients in GHL
    const SEARCH_QUERIES = [
      '1:1',
      'group student',
      'literature',
      'chemistry',
      'biology',
      'physics',
      'maths',
      'science',
      'english',
      'exam prep',
      'year 10',
      'year 11',
      'foundation',
      'higher'
    ];

    const fetchGhlQuery = async (queryTerm: string) => {
      try {
        const url = `https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(locationId.trim())}&query=${encodeURIComponent(queryTerm)}&limit=100`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Version': '2021-07-28'
          }
        });
        if (!res.ok) return [];
        const json: any = await res.json();
        return Array.isArray(json.contacts) ? json.contacts : [];
      } catch (e) {
        return [];
      }
    };

    // Parallel fetch across all targeted subject queries and 1:1 queries in GHL
    const queryResults = await Promise.all(SEARCH_QUERIES.map(q => fetchGhlQuery(q)));
    const allContactsMap = new Map<string, any>();
    queryResults.flat().forEach(c => {
      if (c && c.id) {
        allContactsMap.set(c.id, c);
      }
    });

    const normalizeTagStr = (t: string) => t.toLowerCase().replace(/[`‘’]/g, "'").trim();

    // Filter strictly for students active for '26-'27 OR returnees who availed again for '26-'27
    const enrolledContacts = Array.from(allContactsMap.values()).filter((c: any) => {
      const cTags = (c.tags || []).map((t: string) => normalizeTagStr(t));
      
      const hasWon2627 = cTags.some((t: string) => t.includes("won '26-'27") || t.includes("won `26-`27") || (t.includes('won') && t.includes('26') && t.includes('27')));
      const has2627_121 = cTags.some((t: string) => t.includes("'26-'27 1:1 client") || t.includes("'26-'27 1:1 student"));
      const has2627_Group = cTags.some((t: string) => t.includes("'26-'27 group") || t.includes("'26-'27 year") || t.includes("'26-'27"));

      const isOffboarded = cTags.some((t: string) => t === 'offboarded');
      if (isOffboarded && !hasWon2627) return false;

      // Must be active for 26-27 or a returnee who availed for 26-27
      return hasWon2627 || has2627_121 || has2627_Group;
    });

    const avatarColors = [
      'bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 
      'bg-amber-600', 'bg-purple-600', 'bg-teal-600', 'bg-cyan-600'
    ];

    const mappedStudents = enrolledContacts.map((c: any, index: number) => {
      // 1. Student Name: prioritize {{contact.childs_name}} (ID: uAEjr7NT6blcALwFUbkK)
      const childNameField = (c.customFields || []).find((f: any) => 
        f.id === 'uAEjr7NT6blcALwFUbkK' || 
        f.fieldKey === 'contact.childs_name' || 
        f.name === "Child's Name" ||
        /child.*name/i.test(f.fieldKey || f.name || '')
      );
      // Fallback: Child's Full Name (ID: t4o6XYzWSW2vqxJdtBzi)
      const childFullNameField = (c.customFields || []).find((f: any) => 
        f.id === 't4o6XYzWSW2vqxJdtBzi' || 
        f.fieldKey === 'contact.childs_full_name' || 
        f.name === "Child's Full Name"
      );
      // Fallback: Student First & Last Name (ID: w8IiqpaheyGSIUnG0S61)
      const studentField = (c.customFields || []).find((f: any) => 
        f.id === 'w8IiqpaheyGSIUnG0S61' || 
        f.fieldKey === 'contact.student_first__last_name' || 
        f.name === 'Student First & Last Name'
      );

      // Parent Name: {{contact.first_name}}
      const parentFirstName = c.firstName?.trim() || '';
      const parentFullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.contactName?.trim() || 'Parent';
      const parentName = parentFirstName || parentFullName;
      
      let candidateName = childNameField?.value?.trim() || 
                           childFullNameField?.value?.trim() || 
                           studentField?.value?.trim();
      
      // If student field isn't explicitly filled, check if contact name is suitable
      if (!candidateName) {
        candidateName = c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ');
      }

      // Safeguard: Never allow internal team/setter names to be assigned as student name
      if (!candidateName || /rebecca\s+collins/i.test(candidateName) || /charlie\s+fortt/i.test(candidateName)) {
        candidateName = `${parentName} (Student)`;
      }

      const tags = Array.isArray(c.tags) ? c.tags : [];
      const hasYear11 = tags.some((t: string) => t.toLowerCase().includes('year 11') || t.toLowerCase().includes('y11'));
      const yearGroup = hasYear11 ? 11 : 10;

      return {
        id: c.id,
        name: candidateName,
        email: c.email || `${candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@smarta.co.uk`,
        parentName: parentName,
        parentPhone: c.phone || '+44 7700 900000',
        parentEmail: c.email || '',
        yearGroup: yearGroup as 10 | 11,
        tags: tags,
        targetGrades: { 'GCSE': hasYear11 ? 'Target 8-9' : 'Target 7-8' },
        avatarColor: avatarColors[index % avatarColors.length],
        notes: `GoHighLevel Contact (${c.id})`
      };
    });

    if (mappedStudents.length > 0) {
      liveStudentsCache = { timestamp: Date.now(), data: mappedStudents };

      // Update disk cache file as well for cold restarts
      try {
        const jsonPath = path.resolve(process.cwd(), 'src/data/ghlStudents.json');
        fs.writeFileSync(jsonPath, JSON.stringify(mappedStudents, null, 2));
      } catch (writeErr) {
        console.warn('Could not persist live students to ghlStudents.json', writeErr);
      }

      return res.json({
        success: true,
        count: mappedStudents.length,
        locationId: locationId.trim(),
        students: mappedStudents,
        source: 'GoHighLevel Real-Time Live Sync',
        fetchedAt: new Date().toISOString()
      });
    }

    // Fallback if network issue
    const cached = getCachedGhlStudents();
    return res.json({
      success: true,
      count: cached?.length || 0,
      locationId: locationId.trim(),
      students: cached || [],
      source: 'GoHighLevel Fallback Cache'
    });

  } catch (error: any) {
    const cached = getCachedGhlStudents();
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
  const apiKey = getApiKey();
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
  const apiKey = getApiKey();
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
  const apiKey = getApiKey();
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

// Helper to update cached student tags immediately
function updateCachedStudentTags(contactId: string, updatedTags: string[]) {
  if (liveStudentsCache && Array.isArray(liveStudentsCache.data)) {
    const student = liveStudentsCache.data.find(s => s.id === contactId);
    if (student) {
      student.tags = updatedTags;
    }
    try {
      const jsonPath = path.resolve(process.cwd(), 'src/data/ghlStudents.json');
      fs.writeFileSync(jsonPath, JSON.stringify(liveStudentsCache.data, null, 2));
    } catch (e) {
      console.warn('Failed to update ghlStudents.json on tag change', e);
    }
  }
}

// Remove tag(s) from a GoHighLevel contact in real-time
const handleRemoveContactTag = async (req: Request, res: Response) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CRM_API_KEY not configured on server' });
  }

  const { contactId } = req.params;
  const tag = req.body?.tag || (req.query?.tag as string);
  const tags = req.body?.tags || (tag ? [tag] : []);

  if (!Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one tag is required to remove' });
  }

  try {
    const ghlRes = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/tags`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ tags })
    });

    if (!ghlRes.ok) {
      const errText = await ghlRes.text();
      return res.status(ghlRes.status).json({
        success: false,
        error: `GoHighLevel API error (${ghlRes.status}): ${errText}`
      });
    }

    const data: any = await ghlRes.json();
    const remainingTags = Array.isArray(data?.tags) ? data.tags : [];

    // Update in-memory cache and persisted cache immediately
    updateCachedStudentTags(contactId, remainingTags);

    // Add note to contact timeline in GoHighLevel
    try {
      const noteBody = `🏷️ Class Tag Removed via TutorTrack: "${tags.join('", "')}"\nRemaining Tags: ${remainingTags.join(', ') || 'None'}`;
      await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ body: noteBody })
      });
    } catch (noteErr) {
      console.warn('Could not post tag removal note to GHL', noteErr);
    }

    return res.json({
      success: true,
      contactId,
      removedTags: tags,
      updatedTags: remainingTags,
      message: `Successfully removed tag(s) from GoHighLevel in real-time!`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Failed to remove tag in GoHighLevel: ${err?.message}`
    });
  }
};

app.delete('/api/contacts/:contactId/tags', handleRemoveContactTag);
app.post('/api/contacts/:contactId/tags/remove', handleRemoveContactTag);

// Add tag(s) to a GoHighLevel contact in real-time
app.post('/api/contacts/:contactId/tags', async (req: Request, res: Response) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CRM_API_KEY not configured on server' });
  }

  const { contactId } = req.params;
  const tag = req.body?.tag;
  const tags = req.body?.tags || (tag ? [tag] : []);

  if (!Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one tag is required to add' });
  }

  try {
    const ghlRes = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ tags })
    });

    if (!ghlRes.ok) {
      const errText = await ghlRes.text();
      return res.status(ghlRes.status).json({
        success: false,
        error: `GoHighLevel API error (${ghlRes.status}): ${errText}`
      });
    }

    const data: any = await ghlRes.json();
    const updatedTags = Array.isArray(data?.tags) ? data.tags : [];

    updateCachedStudentTags(contactId, updatedTags);

    try {
      const noteBody = `🏷️ Class Tag Added via TutorTrack: "${tags.join('", "')}"\nActive Tags: ${updatedTags.join(', ')}`;
      await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ body: noteBody })
      });
    } catch (noteErr) {
      console.warn('Could not post tag addition note to GHL', noteErr);
    }

    return res.json({
      success: true,
      contactId,
      addedTags: tags,
      updatedTags,
      message: `Successfully added tag(s) to GoHighLevel in real-time!`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Failed to add tag in GoHighLevel: ${err?.message}`
    });
  }
});
// Send real SMS or Email to a student / parent via GoHighLevel Conversations API
app.post('/api/crm/send-message', async (req: Request, res: Response) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CRM_API_KEY not configured on server' });
  }

  const { contactId, type, message, subject, html } = req.body;
  if (!contactId) {
    return res.status(400).json({ success: false, error: 'contactId is required' });
  }

  const msgType = type === 'Email' ? 'Email' : 'SMS';

  if (msgType === 'SMS' && (!message || !message.trim())) {
    return res.status(400).json({ success: false, error: 'message text is required for SMS' });
  }

  if (msgType === 'Email' && (!subject || !subject.trim())) {
    return res.status(400).json({ success: false, error: 'subject is required for Email' });
  }

  try {
    const payload: any = {
      type: msgType,
      contactId: contactId.trim()
    };

    if (msgType === 'SMS') {
      payload.message = message.trim();
    } else {
      payload.subject = subject.trim();
      payload.html = html || message || `<p>${subject}</p>`;
    }

    const ghlRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!ghlRes.ok) {
      const errText = await ghlRes.text();
      return res.status(ghlRes.status).json({
        success: false,
        error: `GoHighLevel ${ghlRes.status}: ${errText}`
      });
    }

    const data: any = await ghlRes.json();
    return res.json({
      success: true,
      type: msgType,
      contactId,
      messageId: data.messageId || data.id,
      msg: data.msg || `${msgType} sent successfully via GoHighLevel!`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Failed to dispatch message: ${err?.message}`
    });
  }
});

// Send batch SMS or Email (e.g. class broadcasts, lesson reminders, absence notifications)
app.post('/api/crm/send-batch-messages', async (req: Request, res: Response) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CRM_API_KEY not configured on server' });
  }

  const { recipients, type, message, subject, html } = req.body;
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, error: 'recipients array is required' });
  }

  const msgType = type === 'Email' ? 'Email' : 'SMS';
  const results: Array<{ contactId: string; name?: string; status: 'sent' | 'failed'; error?: string }> = [];

  for (const recipient of recipients) {
    const contactId = typeof recipient === 'string' ? recipient : recipient.contactId || recipient.id;
    const recipientName = typeof recipient === 'object' ? recipient.name : undefined;
    if (!contactId) continue;

    try {
      const personalizedMsg = message ? message.replace(/\{name\}/gi, recipientName || 'Student') : '';
      const payload: any = {
        type: msgType,
        contactId: contactId.trim()
      };

      if (msgType === 'SMS') {
        payload.message = personalizedMsg.trim();
      } else {
        payload.subject = (subject || 'GCSE Tutoring Update').replace(/\{name\}/gi, recipientName || 'Student');
        payload.html = html ? html.replace(/\{name\}/gi, recipientName || 'Student') : `<p>${personalizedMsg}</p>`;
      }

      const ghlRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (ghlRes.ok) {
        results.push({ contactId, name: recipientName, status: 'sent' });
      } else {
        const errText = await ghlRes.text();
        results.push({ contactId, name: recipientName, status: 'failed', error: errText.slice(0, 100) });
      }
    } catch (e: any) {
      results.push({ contactId, name: recipientName, status: 'failed', error: e?.message });
    }
  }

  const sentCount = results.filter(r => r.status === 'sent').length;
  return res.json({
    success: true,
    type: msgType,
    total: recipients.length,
    sentCount,
    failedCount: recipients.length - sentCount,
    details: results,
    msg: `Successfully delivered ${sentCount} of ${recipients.length} ${msgType} message(s) via GoHighLevel!`
  });
});
// Server-side test connection ping
app.post('/api/crm/test-ping', async (req: Request, res: Response) => {
  const apiKey = getApiKey();
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
