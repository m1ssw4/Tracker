import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Send, X, CheckCircle2, AlertCircle, Sparkles, Loader2, Phone, User } from 'lucide-react';

export interface MessageRecipient {
  contactId: string;
  studentName: string;
  parentName?: string;
  phone?: string;
  email?: string;
}

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: MessageRecipient | null;
  classContext?: {
    className: string;
    date: string;
    time?: string;
    tutor?: string;
  };
  initialType?: 'SMS' | 'Email';
  initialTemplate?: 'absence' | 'late' | 'reminder' | 'custom';
  minutesLate?: number;
  onSuccess?: (notice: string) => void;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  recipient,
  classContext,
  initialType = 'SMS',
  initialTemplate = 'absence',
  minutesLate = 10,
  onSuccess
}) => {
  if (!isOpen || !recipient) return null;

  const [messageType, setMessageType] = useState<'SMS' | 'Email'>(initialType);
  const [selectedTemplate, setSelectedTemplate] = useState<'absence' | 'late' | 'reminder' | 'custom'>(initialTemplate);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const parentGreeting = recipient.parentName && recipient.parentName.trim() ? recipient.parentName.trim() : 'Parent';
  const student = recipient.studentName || 'Student';
  const className = classContext?.className || 'GCSE Tutoring Session';
  const dateStr = classContext?.date || 'today';
  const tutorName = classContext?.tutor || 'Your Tutor';

  // Template generation
  const applyTemplate = (type: 'SMS' | 'Email', template: 'absence' | 'late' | 'reminder' | 'custom') => {
    setSelectedTemplate(template);

    if (type === 'SMS') {
      if (template === 'absence') {
        setMessageText(`Hi ${parentGreeting}, ${student} was marked absent from their ${className} session today (${dateStr}). Please reach out if you need recording access or catch-up materials. - SmartaTutoring`);
      } else if (template === 'late') {
        setMessageText(`Hi ${parentGreeting}, ${student} arrived ${minutesLate} minutes late to their ${className} session today (${dateStr}). The lesson is now underway. - SmartaTutoring`);
      } else if (template === 'reminder') {
        setMessageText(`Hi ${parentGreeting}, reminder that ${student}'s live ${className} session is scheduled for ${dateStr} with ${tutorName}. Please ensure they are ready to join. - SmartaTutoring`);
      } else {
        setMessageText(`Hi ${parentGreeting}, update regarding ${student}'s GCSE studies at SmartaTutoring: `);
      }
    } else {
      // Email templates
      if (template === 'absence') {
        setSubject(`Lesson Absence Notice: ${student} - ${className}`);
        setMessageText(
`<p>Dear ${parentGreeting},</p>
<p>We wanted to let you know that <strong>${student}</strong> was marked absent from their scheduled <strong>${className}</strong> session on <strong>${dateStr}</strong>.</p>
<p>Consistent attendance is vital for GCSE mastery. If ${student} was unable to attend due to illness or other commitments, please let our team know so we can supply the lesson recording and accompanying practice workbook.</p>
<p>Best regards,<br/><strong>${tutorName} & The SmartaTutoring Team</strong></p>`
        );
      } else if (template === 'late') {
        setSubject(`Attendance Update: ${student} - ${className}`);
        setMessageText(
`<p>Dear ${parentGreeting},</p>
<p>This is a quick update to inform you that <strong>${student}</strong> joined today's <strong>${className}</strong> session approximately ${minutesLate} minutes after the start time.</p>
<p>The tutor is ensuring ${student} covers the core concepts, but please encourage timely arrival for upcoming classes to maximize lesson value.</p>
<p>Best regards,<br/><strong>${tutorName} & The SmartaTutoring Team</strong></p>`
        );
      } else if (template === 'reminder') {
        setSubject(`Upcoming Lesson Reminder: ${className}`);
        setMessageText(
`<p>Dear ${parentGreeting},</p>
<p>This is a friendly reminder that <strong>${student}</strong> has their upcoming <strong>${className}</strong> scheduled for <strong>${dateStr}</strong>.</p>
<p>Please make sure ${student} has their workbook ready, camera functioning, and joins on time via their Google Meet classroom link.</p>
<p>Looking forward to a productive lesson!<br/><strong>${tutorName} & The SmartaTutoring Team</strong></p>`
        );
      } else {
        setSubject(`GCSE Academic Update: ${student}`);
        setMessageText(`<p>Dear ${parentGreeting},</p><p>We are reaching out regarding ${student}'s GCSE progress: </p><p>Best regards,<br/>SmartaTutoring Team</p>`);
      }
    }
  };

  useEffect(() => {
    applyTemplate(messageType, initialTemplate);
  }, [recipient, messageType, initialTemplate]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (messageType === 'Email' && !subject.trim()) return;

    setIsSending(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/crm/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: recipient.contactId,
          type: messageType,
          message: messageText,
          subject: messageType === 'Email' ? subject : undefined,
          html: messageType === 'Email' ? messageText : undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `${messageType} sent successfully to ${messageType === 'SMS' ? recipient.phone || 'parent' : recipient.email || 'parent'} via GoHighLevel!`
        });

        if (onSuccess) {
          onSuccess(`${messageType} dispatched to ${recipient.studentName}'s parent in GoHighLevel`);
        }

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({
          type: 'error',
          text: data.error || `Failed to send ${messageType} via GoHighLevel`
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Network error dispatching message'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {messageType === 'SMS' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Send {messageType} via GoHighLevel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct dispatch through your CRM conversation thread
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Recipient Card */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  {recipient.studentName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                  Parent: {recipient.parentName || 'N/A'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {recipient.phone || 'No phone'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {recipient.email || 'No email'}
                </span>
              </div>
            </div>

            {/* Switch Channel: SMS vs Email */}
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => applyTemplate('SMS', selectedTemplate)}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                  messageType === 'SMS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3" /> SMS
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('Email', selectedTemplate)}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                  messageType === 'Email'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-3 h-3" /> Email
              </button>
            </div>
          </div>

          {/* Quick Template Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Choose Template:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'absence', label: 'Absence Alert' },
                { id: 'late', label: 'Late Arrival' },
                { id: 'reminder', label: 'Class Reminder' },
                { id: 'custom', label: 'Custom' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(messageType, t.id as any)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Subject Line (if Email) */}
          {messageType === 'Email' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Email Subject Line:
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. GCSE Tutoring Attendance Notice"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {messageType === 'SMS' ? 'SMS Body:' : 'Email Body (HTML supported):'}
              </label>
              {messageType === 'SMS' && (
                <span className="font-mono text-slate-400">
                  {messageText.length} characters ({Math.ceil(messageText.length / 160) || 1} SMS segment)
                </span>
              )}
            </div>
            <textarea
              rows={5}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter message text..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* Status Feedback */}
          {feedback && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              GHL Conversations API Connected
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending via GHL...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send {messageType} via GoHighLevel</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
