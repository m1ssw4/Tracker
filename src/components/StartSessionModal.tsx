import React, { useState, useEffect } from 'react';
import { OneToOneSession, Student } from '../types';
import { 
  Video, 
  Send, 
  Phone, 
  Mail, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Loader2,
  Clock,
  Calendar,
  User,
  Radio
} from 'lucide-react';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: OneToOneSession | null;
  studentDetail?: Student | null;
  onSessionStarted: (updatedSession: OneToOneSession) => void;
  onLogAttendanceNote?: (studentId: string, noteText: string) => Promise<void>;
  isAdminUnlocked?: boolean;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  studentDetail,
  onSessionStarted,
  onLogAttendanceNote,
  isAdminUnlocked = false
}) => {
  if (!isOpen || !session) return null;

  const parentName = session.parentName || studentDetail?.parentName || 'Parent';
  const parentPhone = session.parentPhone || studentDetail?.parentPhone || '';
  const parentEmail = session.parentEmail || studentDetail?.parentEmail || studentDetail?.email || '';
  const studentName = session.studentName;
  const tutor = session.tutor;
  const subject = session.subject;

  const [channel, setChannel] = useState<'both' | 'sms' | 'email'>('both');
  const [meetingLink, setMeetingLink] = useState(
    session.meetingLink || 'https://meet.google.com/smarta-1on1'
  );
  const [markInProgress, setMarkInProgress] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dynamic message previews
  const defaultSms = `Hi ${parentName}, ${studentName}'s 1:1 ${subject} session with ${tutor} is starting now! Please join here: ${meetingLink} - SmartaTutoring`;
  const defaultEmailSubject = `1:1 ${subject} Session Starting Now: ${studentName} with ${tutor}`;

  const [smsText, setSmsText] = useState(defaultSms);
  const [emailSubject, setEmailSubject] = useState(defaultEmailSubject);

  useEffect(() => {
    setSmsText(`Hi ${parentName}, ${studentName}'s 1:1 ${subject} session with ${tutor} is starting now! Please join here: ${meetingLink} - SmartaTutoring`);
    setEmailSubject(`1:1 ${subject} Session Starting Now: ${studentName} with ${tutor}`);
  }, [parentName, studentName, subject, tutor, meetingLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(null as any), 2000);
  };

  const handleSendAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingLink.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a valid classroom meeting link.' });
      return;
    }

    if (channel === 'sms' && !parentPhone) {
      setFeedback({ type: 'error', text: 'No parent phone number found for SMS delivery.' });
      return;
    }

    if (channel === 'email' && !parentEmail) {
      setFeedback({ type: 'error', text: 'No parent email address found for email delivery.' });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1e1b4b; font-size: 20px;">SmartaTutoring · 1:1 Private Session</h2>
        </div>
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">Dear <strong>${parentName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
          <strong>${studentName}</strong>'s private 1:1 <strong>${subject}</strong> tutoring session with <strong>${tutor}</strong> is starting now!
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Session Details</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Tutor:</strong> ${tutor}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Topic:</strong> ${session.topic || 'Mastery and exam questions'}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Date & Time:</strong> ${session.date} (${session.startTime} – ${session.endTime})</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${meetingLink.trim()}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
            👉 Join 1:1 Classroom Session
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b; word-break: break-all; margin: 16px 0 0;">
          Direct classroom link: <a href="${meetingLink.trim()}" style="color: #4f46e5;">${meetingLink.trim()}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          Best regards,<br/>
          <strong>The SmartaTutoring Academic Team</strong>
        </p>
      </div>
    `;

    try {
      const sendTasks: Promise<any>[] = [];

      // SMS Dispatch
      if ((channel === 'both' || channel === 'sms') && parentPhone) {
        sendTasks.push(
          fetch('/api/crm/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactId: session.studentId,
              type: 'SMS',
              message: smsText.trim()
            })
          }).then(r => r.json())
        );
      }

      // Email Dispatch
      if ((channel === 'both' || channel === 'email') && parentEmail) {
        sendTasks.push(
          fetch('/api/crm/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactId: session.studentId,
              type: 'Email',
              subject: emailSubject.trim(),
              html: emailHtml
            })
          }).then(r => r.json())
        );
      }

      const results = await Promise.all(sendTasks);
      const anySuccess = results.some(res => res?.success);

      // Auto-log note to GoHighLevel contact timeline
      const channelsSent = channel === 'both' 
        ? 'SMS and Email' 
        : channel === 'sms' ? 'SMS' : 'Email';
      
      const logBody = `🚀 1:1 Tutoring Session Started | Classroom link sent to parent (${parentName}) via ${channelsSent}.\nTutor: ${tutor} | Subject: ${subject}\nMeeting Link: ${meetingLink.trim()}`;

      try {
        if (onLogAttendanceNote) {
          await onLogAttendanceNote(session.studentId, logBody);
        } else {
          await fetch(`/api/contacts/${encodeURIComponent(session.studentId)}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: logBody })
          });
        }
      } catch (noteErr) {
        console.warn('Could not post session start note to GHL', noteErr);
      }

      // Update session payload
      const updatedSession: OneToOneSession = {
        ...session,
        meetingLink: meetingLink.trim(),
        status: markInProgress ? 'in_progress' : session.status
      };

      onSessionStarted(updatedSession);

      setFeedback({
        type: 'success',
        text: `Classroom link sent to parent via ${channelsSent}! Session is now ${markInProgress ? 'In Progress' : 'active'}.`
      });

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error starting 1:1 session & sending link', err);
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to dispatch message via GoHighLevel.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                Start 1:1 Session & Send Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Dispatch classroom link to parent via GoHighLevel SMS and Email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendAndStart} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Session Summary Card */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{studentName}</span>
                <span className="text-slate-400 font-normal">· {subject}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-semibold uppercase tracking-wider">
                {session.status === 'in_progress' ? 'In Progress' : 'Starting Now'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{session.startTime} – {session.endTime} ({session.date})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tutor: <strong>{tutor}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                Parent: <strong className="text-slate-800 dark:text-slate-200">{parentName}</strong>
              </span>
              <div className="flex items-center gap-2">
                {parentPhone && (
                  <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {parentPhone}
                  </span>
                )}
                {parentEmail && (
                  <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {parentEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Classroom Meeting Link */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-500" />
                <span>Classroom Meeting Link (Google Meet / Zoom):</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy'}</span>
              </button>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/smarta-1on1"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 hover:text-indigo-600 dark:text-slate-300 shrink-0"
                title="Test Meeting Link in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Delivery Channel Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Send Link Through:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('both')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  channel === 'both'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <span>📱 + ✉️</span>
                  <span>Both (SMS & Email)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Recommended for instant delivery
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  channel === 'sms'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>SMS Only</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {parentPhone || 'No phone'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  channel === 'email'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Email Only</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {parentEmail || 'No email'}
                </p>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Message Content Preview:
            </span>

            {(channel === 'both' || channel === 'sms') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Phone className="w-3 h-3 text-indigo-500" /> SMS to {parentPhone || 'parent'}
                  </span>
                  <span>{smsText.length} chars</span>
                </div>
                <textarea
                  rows={2}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {(channel === 'both' || channel === 'email') && (
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  <Mail className="w-3 h-3 text-indigo-500" /> Email Subject:
                </div>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <p>Includes formatted header, student & subject summary, and direct <strong>Join 1:1 Classroom Session</strong> button.</p>
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={markInProgress}
                onChange={(e) => setMarkInProgress(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Update session status to <strong>"In Progress"</strong> upon sending link
              </span>
            </label>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link via GHL...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Link & Start Session</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
