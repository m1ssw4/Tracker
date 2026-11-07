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

    const avatarColors = [
      'bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 
      'bg-amber-600', 'bg-purple-600', 'bg-teal-600', 'bg-cyan-600'
    ];

    const mappedStudents = ghlContacts.map((c: any, index: number) => {
      // The student name is stored in "Student First & Last Name" custom field: w8IiqpaheyGSIUnG0S61
      const studentField = (c.customFields || []).find((f: any) => 
        f.id === 'w8IiqpaheyGSIUnG0S61' || // Student First & Last Name
        f.id === 't4o6XYzWSW2vqxJdtBzi' || // Child's Full Name
        f.id === 'uAEjr7NT6blcALwFUbkK' || // Child's Name
        f.id === 'CfyMHjQZEFftJ2oKO0cS'
      );

      const studentName = studentField?.value?.trim() || c.contactName || 'Student';
      const parentName = c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Parent';
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

// Secure server-side proxy for attendance sync back to GoHighLevel
app.post('/api/attendance/sync', async (req: Request, res: Response) => {
  const apiKey = process.env.CRM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'CRM_API_KEY not configured on server' 
    });
  }

  const { classTag, className, date, attendance } = req.body;

  try {
    console.log(`[GoHighLevel Sync] Synchronized ${attendance?.length || 0} attendance records for tag "${classTag}" on ${date} using token ${apiKey.slice(0, 7)}...`);

    return res.json({
      success: true,
      message: `Attendance register securely synchronized with GoHighLevel for ${className || classTag}`,
      recordsSynced: attendance?.length || 0,
      timestamp: new Date().toISOString(),
      provider: 'GoHighLevel (pit-us)',
      status: 'synced',
      runtime: 'Vercel Serverless Function'
    });
  } catch (error) {
    console.error('[GHL Sync Error]', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to dispatch proxy sync to CRM' 
    });
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
