# TutorTrack '26-'27 — Attendance & Schedule Dashboard

Full-stack attendance tracking and lesson scheduling dashboard for 27 standardized Year 10, Year 11, and GCSE Exam Prep classes. Built with React 19, Vite, Tailwind CSS v4, and Express / Vercel Serverless proxy architecture.

---

## Vercel Deployment Guide

This project is configured for **one-click deployment on Vercel**.

### Step 1: Push or Import to GitHub
Ensure the codebase is in your GitHub/GitLab repository.

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New" > "Project"**.
2. Select your repository and click **Import**.
3. Vercel will automatically detect the **Vite** framework from `vercel.json`.

### Step 3: Configure Environment Variables
In the **Environment Variables** section on Vercel, add:
- **`CRM_API_KEY`**: `pit-us-522a3e6c-fe1e-48e6-90f3-e904a5de38e5` (or your preferred CRM / TutorCruncher token)

### Step 4: Deploy
Click **Deploy**.
- **Frontend**: Built via `vite build` to `/dist` and served with SPA routing rewrites.
- **Serverless API**: The `/api` directory is deployed automatically as a Node.js serverless function, handling `/api/crm/status` and `/api/attendance/sync` without exposing your secret API key to the browser.

---

## Class & Tag Architecture

The application is indexed around the 27 standardized classes and tags:

- **Year 11 (16 Classes)**: Chemistry, Biology, Physics, Higher Science (1 & 2), Foundation Science (1 & 2), Higher Maths (1 & 2), Foundation Maths (1 & 2), English Literature (1 & 2), English (1, 2, 3).
- **Year 10 (6 Classes)**: English (1 & 2), Science (1 & 2), Maths (1 & 2).
- **Exam Prep (5 Sessions)**: English, Higher Science, Foundation Science, Higher Maths, Foundation Maths.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
