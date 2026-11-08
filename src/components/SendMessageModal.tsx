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

  // Parent Name: {{contact.first_name}}, Student Name: {{contact.childs_name}}
  const parentGreeting = recipient.parentName && recipient.parentName.trim() ? recipient.parentName.trim() : 'Parent';
  const student = recipient.studentName && recipient.studentName.trim() ? recipient.studentName.trim() : 'your child';
  const className = classContext?.className || 'GCSE Tutoring Session';
  const dateStr = classContext?.date || 'today';

  // Helper to build content for a specific type and template without "Your Tutor"
  const getContentFor = (type: 'SMS' | 'Email', template: 'absence' | 'late' | 'reminder' | 'custom') => {
    if (type === 'SMS') {
      if (template === 'absence') {
        return {
          subject: '',
          body: `Hi ${parentGreeting}, ${student} was marked absent from their ${className} session today (${dateStr}). Please reach out if you need recording access or catch-up materials. - SmartaTutoring`
        };
      } else if (template === 'late') {
        return {
          subject: '',
          body: `Hi ${parentGreeting}, ${student} arrived ${minutesLate} minutes late to their ${className} session today (${dateStr}). The lesson is now underway. - SmartaTutoring`
        };
      } else if (template === 'reminder') {
        return {
          subject: '',
          body: `Hi ${parentGreeting}, reminder that ${student}'s live ${className} session is scheduled for ${dateStr}. Please ensure they are ready to join. - SmartaTutoring`
        };
      } else {
        return {
          subject: '',
          body: `Hi ${parentGreeting}, update regarding ${student}'s GCSE studies at SmartaTutoring: `
        };
      }
    } else {
      // Email templates
      if (template === 'absence') {
        return {
          subject: `Lesson Absence Notice: ${student} - ${className}`,
          body: `<p>Dear ${parentGreeting},</p>
<p>We wanted to let you know that <strong>${student}</strong> was marked absent from their scheduled <strong>${className}</strong> session on <strong>${dateStr}</strong>.</p>
<p>Consistent attendance is vital for GCSE mastery. If ${student} was unable to attend due to illness or other commitments, please let our team know so we can supply the lesson recording and accompanying practice workbook.</p>
<p>Best regards,<br/><strong>The SmartaTutoring Team</strong></p>`
        };
      } else if (template === 'late') {
        return {
          subject: `Attendance Update: ${student} - ${className}`,
          body: `<p>Dear ${parentGreeting},</p>
<p>This is a quick update to inform you that <strong>${student}</strong> joined today's <strong>${className}</strong> session approximately ${minutesLate} minutes after the start time.</p>
<p>The lesson is actively covering core concepts, and we encourage timely arrival for upcoming classes to maximize lesson value.</p>
<p>Best regards,<br/><strong>The SmartaTutoring Team</strong></p>`
        };
      } else if (template === 'reminder') {
        return {
          subject: `Upcoming Lesson Reminder: ${className}`,
          body: `<p>Dear ${parentGreeting},</p>
<p>This is a friendly reminder that <strong>${student}</strong> has their upcoming <strong>${className}</strong> scheduled for <strong>${dateStr}</strong>.</p>
<p>Please make sure ${student} has their workbook ready, camera functioning, and joins on time via their Google Meet classroom link.</p>
<p>Looking forward to a productive lesson!<br/><strong>The SmartaTutoring Team</strong></p>`
        };
      } else {
        return {
          subject: `GCSE Academic Update: ${student}`,
          body: `<p>Dear ${parentGreeting},</p>
<p>We are reaching out regarding ${student}'s GCSE progress:</p>
<p>Best regards,<br/><strong>The SmartaTutoring Team</strong></p>`
        };
      }
    }
  };

  // Switch channel handler
  const handleSwitchChannel = (newType: 'SMS' | 'Email') => {
    setMessageType(newType);
    const content = getContentFor(newType, selectedTemplate);
    setMessageText(content.body);
    if (newType === 'Email') {
      setSubject(content.subject);
    }
  };

  // Switch template handler
  const handleSwitchTemplate = (newTemplate: 'absence' | 'late' | 'reminder' | 'custom') => {
    setSelectedTemplate(newTemplate);
    const content = getContentFor(messageType, newTemplate);
    setMessageText(content.body);
    if (messageType === 'Email') {
      setSubject(content.subject);
    }
  };

  // Sync when recipient or initialType/template opens
  useEffect(() => {
    if (recipient) {
      setMessageType(initialType);
      setSelectedTemplate(initialTemplate);
      const content = getContentFor(initialType, initialTemplate);
      setMessageText(content.body);
      if (initialType === 'Email') {
        setSubject(content.subject);
      }
      setFeedback(null);
    }
  }, [recipient?.contactId, initialType, initialTemplate]);

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
          text: `${messageType} sent successfully to ${messageType === 'SMS' ? recipient.phone || 'parent phone' : recipient.email || 'parent email'} via GoHighLevel!`
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {messageType === 'SMS' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Send {messageType === 'SMS' ? 'SMS' : 'Email'} via GoHighLevel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct dispatch through your CRM conversation thread ({messageType})
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
          
          {/* Recipient Card with Channel Toggle */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  {recipient.studentName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                  Parent: {recipient.parentName || 'N/A'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <span className={`flex items-center gap-1 font-mono ${messageType === 'SMS' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}>
                  <Phone className="w-3 h-3 text-slate-400" />
                  {recipient.phone || 'No phone'}
                </span>
                <span>·</span>
                <span className={`flex items-center gap-1 font-mono ${messageType === 'Email' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}>
                  <Mail className="w-3 h-3 text-slate-400" />
                  {recipient.email || 'No email'}
                </span>
              </div>
            </div>

            {/* Switch Channel: SMS vs Email */}
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => handleSwitchChannel('SMS')}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-all ${
                  messageType === 'SMS'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>SMS</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchChannel('Email')}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-all ${
                  messageType === 'Email'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Quick Template Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Choose Template:</span>
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
                  onClick={() => handleSwitchTemplate(t.id as any)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Subject Line (Only shown in Email mode) */}
          {messageType === 'Email' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-500" />
                  <span>Subject Line:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Required for Email</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Lesson Absence Notice: Student Name"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
              />
            </div>
          )}

          {/* Message Content Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                {messageType === 'SMS' ? (
                  <>
                    <MessageSquare className="w-3 h-3 text-indigo-500" />
                    <span>SMS Body:</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3 text-indigo-500" />
                    <span>Email Body (HTML supported):</span>
                  </>
                )}
              </label>
              {messageType === 'SMS' ? (
                <span className="font-mono text-slate-400">
                  {messageText.length} characters ({Math.ceil(messageText.length / 160) || 1} SMS segment)
                </span>
              ) : (
                <span className="text-slate-400 font-mono text-[10px]">
                  HTML formatted email
                </span>
              )}
            </div>

            {/* Quick GHL Merge Tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pb-0.5">
              <span className="font-medium">Insert CRM Field:</span>
              <button
                type="button"
                onClick={() => setMessageText(prev => prev + ' {{contact.first_name}}')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono border border-slate-200 dark:border-slate-700 transition-colors"
                title="Inserts {{contact.first_name}} (Parent Name)"
              >
                + Parent: {"{{contact.first_name}}"}
              </button>
              <button
                type="button"
                onClick={() => setMessageText(prev => prev + ' {{contact.childs_name}}')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono border border-slate-200 dark:border-slate-700 transition-colors"
                title="Inserts {{contact.childs_name}} (Student Name)"
              >
                + Student: {"{{contact.childs_name}}"}
              </button>
            </div>
            <textarea
              rows={messageType === 'Email' ? 6 : 4}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={messageType === 'SMS' ? 'Enter SMS text...' : 'Enter email body (HTML supported)...'}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"
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
                disabled={isSending || !messageText.trim() || (messageType === 'Email' && !subject.trim())}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending {messageType} via GHL...</span>
                  </>
                ) : (
                  <>
                    {messageType === 'SMS' ? <Send className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>Send {messageType === 'SMS' ? 'SMS' : 'Email'} via GoHighLevel</span>
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
