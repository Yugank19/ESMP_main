"use client";

import { useEffect, useState } from 'react';
import {
  Play, Upload, CheckCircle, XCircle, RotateCcw, FlaskConical,
  Clock, ChevronRight, FileText, User, AlertCircle, Check, X,
  ArrowRight, Loader2, History, Eye
} from 'lucide-react';
import {
  startTask, submitForReview, sendToTesting, passTesting,
  failTesting, approveTask, rejectTask, getTaskWorkflow
} from '@/lib/task-workflow-api';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  TODO:               { label: 'To Do',             color: '#64748b', bg: '#f1f5f9',  icon: Clock },
  IN_PROGRESS:        { label: 'In Progress',        color: '#2563eb', bg: '#eff6ff',  icon: Play },
  READY_FOR_REVIEW:   { label: 'Ready for Review',   color: '#d97706', bg: '#fffbeb',  icon: Eye },
  READY_FOR_TESTING:  { label: 'Ready for Testing',  color: '#7c3aed', bg: '#f5f3ff',  icon: FlaskConical },
  APPROVED:           { label: 'Approved',           color: '#059669', bg: '#ecfdf5',  icon: CheckCircle },
  DONE:               { label: 'Done',               color: '#059669', bg: '#ecfdf5',  icon: CheckCircle },
  REWORK_REQUIRED:    { label: 'Rework Required',    color: '#dc2626', bg: '#fef2f2',  icon: RotateCcw },
  CANCELLED:          { label: 'Cancelled',          color: '#94a3b8', bg: '#f8fafc',  icon: XCircle },
};

// ── Lifecycle steps ───────────────────────────────────────────────────────────
const LIFECYCLE = ['TODO', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'READY_FOR_TESTING', 'DONE'];

interface Props {
  task: any;
  currentUser: any;
  memberRole: string;
  onStatusChange: () => void;
}

export default function TaskWorkflowPanel({ task, currentUser, memberRole, onStatusChange }: Props) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showFailTest, setShowFailTest] = useState(false);
  const [submitForm, setSubmitForm] = useState({ description: '', files: [] as any[] });
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState('');

  const isLeader = memberRole === 'LEADER';
  const isAssignee = task.assignees?.some((a: any) => a.user_id === currentUser?.id);
  const status = task.status || 'TODO';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;

  useEffect(() => { loadWorkflow(); }, [task.id]);

  async function loadWorkflow() {
    try {
      const data = await getTaskWorkflow(task.id);
      setWorkflow(data);
    } catch {}
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function doAction(action: () => Promise<any>, successMsg: string) {
    setActionLoading(successMsg);
    try {
      const res = await action();
      if (res.message || res.id) {
        showToast(successMsg);
        onStatusChange();
        loadWorkflow();
      } else {
        showToast(res.message || 'Action failed');
      }
    } catch { showToast('Action failed. Please try again.'); }
    setActionLoading('');
  }

  const latestSubmission = workflow?.submissions?.[0];
  const latestReview = workflow?.reviews?.[0];

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white"
          style={{ background: '#0f172a', minWidth: 260 }}>
          <Check className="h-4 w-4 text-green-400 shrink-0" />{toast}
        </div>
      )}

      {/* Status badge + lifecycle */}
      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <cfg.icon className="h-4 w-4" style={{ color: cfg.color }} />
            <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
            {status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-1">
          {LIFECYCLE.map((s, i) => {
            const idx = LIFECYCLE.indexOf(status);
            const done = i < idx || (status === 'DONE' && i === LIFECYCLE.length - 1);
            const active = s === status || (status === 'REWORK_REQUIRED' && s === 'IN_PROGRESS');
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: done || active ? '#2563eb' : 'var(--bg-surface-3)' }} />
                {i < LIFECYCLE.length - 1 && (
                  <ChevronRight className="h-3 w-3 shrink-0" style={{ color: done ? '#2563eb' : 'var(--text-muted)' }} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
          {LIFECYCLE.map(s => <span key={s}>{STATUS_CONFIG[s]?.label}</span>)}
        </div>
      </div>

      {/* ── Action buttons based on role + status ── */}
      <div className="space-y-2">

        {/* Employee: Start task */}
        {isAssignee && (status === 'TODO' || status === 'REWORK_REQUIRED') && (
          <button onClick={() => doAction(() => startTask(task.id), 'Task started!')}
            disabled={!!actionLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
            {actionLoading === 'Task started!' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {status === 'REWORK_REQUIRED' ? 'Start Rework' : 'Start Working'}
          </button>
        )}

        {/* Employee: Submit for review */}
        {isAssignee && (status === 'IN_PROGRESS' || status === 'REWORK_REQUIRED') && (
          <button onClick={() => setShowSubmit(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: '#d97706', boxShadow: '0 2px 8px rgba(217,119,6,0.25)' }}>
            <Upload className="h-4 w-4" /> Submit for Review
          </button>
        )}

        {/* Leader: Send to testing */}
        {isLeader && status === 'READY_FOR_REVIEW' && (
          <button onClick={() => doAction(() => sendToTesting(task.id), 'Sent to testing!')}
            disabled={!!actionLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: '#7c3aed' }}>
            {actionLoading === 'Sent to testing!' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            Send to QA/Testing
          </button>
        )}

        {/* Tester: Pass/Fail testing */}
        {status === 'READY_FOR_TESTING' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => doAction(() => passTesting(task.id, 'Testing passed'), 'Testing passed!')}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#059669' }}>
              <CheckCircle className="h-4 w-4" /> Pass Testing
            </button>
            <button onClick={() => setShowFailTest(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: '#dc2626' }}>
              <XCircle className="h-4 w-4" /> Fail Testing
            </button>
          </div>
        )}

        {/* Leader: Approve / Reject */}
        {isLeader && status === 'READY_FOR_REVIEW' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => doAction(() => approveTask(task.id, 'Work approved'), 'Task approved!')}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#059669' }}>
              {actionLoading === 'Task approved!' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve
            </button>
            <button onClick={() => setShowReject(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: '#dc2626' }}>
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </div>
        )}

        {/* Done state */}
        {status === 'DONE' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            <CheckCircle className="h-4 w-4" /> Task completed and approved!
          </div>
        )}
      </div>

      {/* Latest submission */}
      {latestSubmission && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4" style={{ color: '#d97706' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Latest Submission (v{latestSubmission.version})
            </span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
              {new Date(latestSubmission.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: '#2563eb' }}>
              {latestSubmission.submitter?.name?.[0] || '?'}
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {latestSubmission.submitter?.name}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {latestSubmission.description}
          </p>
          {latestSubmission.files?.length > 0 && (
            <div className="mt-3 space-y-1">
              {latestSubmission.files.map((f: any, i: number) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:underline"
                  style={{ background: 'var(--bg-surface-2)', color: '#2563eb' }}>
                  <FileText className="h-3.5 w-3.5" /> {f.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Latest review feedback */}
      {latestReview && latestReview.feedback && (
        <div className="rounded-xl border p-4"
          style={{
            background: latestReview.action === 'APPROVED' ? '#ecfdf5' : '#fef2f2',
            borderColor: latestReview.action === 'APPROVED' ? '#a7f3d0' : '#fecaca',
          }}>
          <div className="flex items-center gap-2 mb-2">
            {latestReview.action === 'APPROVED'
              ? <CheckCircle className="h-4 w-4 text-green-600" />
              : <AlertCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm font-semibold"
              style={{ color: latestReview.action === 'APPROVED' ? '#059669' : '#dc2626' }}>
              {latestReview.action === 'APPROVED' ? 'Approved' : 'Feedback from reviewer'}
            </span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
              by {latestReview.reviewer?.name}
            </span>
          </div>
          <p className="text-sm" style={{ color: latestReview.action === 'APPROVED' ? '#059669' : '#dc2626' }}>
            {latestReview.feedback}
          </p>
        </div>
      )}

      {/* Activity history */}
      {workflow?.history?.length > 0 && (
        <div className="rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <History className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Activity History</span>
          </div>
          <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
            {workflow.history.map((h: any) => (
              <div key={h.id} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5"
                  style={{ background: '#2563eb' }}>
                  {h.user?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-semibold">{h.user?.name}</span> changed{' '}
                    <span className="font-medium">{h.field}</span>:{' '}
                    <span style={{ color: 'var(--text-muted)' }}>{h.old_value}</span>
                    <ArrowRight className="h-3 w-3 inline mx-1" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-semibold" style={{ color: '#2563eb' }}>{h.new_value}</span>
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(h.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit for Review Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Submit Work for Review</h3>
              <button onClick={() => setShowSubmit(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Work Description *
                </label>
                <textarea rows={5} value={submitForm.description}
                  onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what you completed, what was changed, and any notes for the reviewer..."
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Upload className="h-4 w-4" />
                <span>File attachments — use the Files tab to upload, then reference them here</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => doAction(
                    () => submitForReview(task.id, submitForm),
                    'Work submitted for review!'
                  ).then(() => setShowSubmit(false))}
                  disabled={!submitForm.description.trim() || !!actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: '#d97706' }}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Submit for Review
                </button>
                <button onClick={() => setShowSubmit(false)}
                  className="px-4 py-2.5 rounded-xl text-sm border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Reject & Request Rework</h3>
              <button onClick={() => setShowReject(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Feedback for employee *
                </label>
                <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="Explain what needs to be fixed or improved..."
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => doAction(() => rejectTask(task.id, feedback), 'Task rejected, rework requested').then(() => { setShowReject(false); setFeedback(''); })}
                  disabled={!feedback.trim() || !!actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: '#dc2626' }}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject & Request Rework
                </button>
                <button onClick={() => setShowReject(false)}
                  className="px-4 py-2.5 rounded-xl text-sm border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fail Testing Modal */}
      {showFailTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Fail Testing — Report Issues</h3>
              <button onClick={() => setShowFailTest(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Describe the issues found during testing..."
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              <div className="flex gap-3">
                <button
                  onClick={() => doAction(() => failTesting(task.id, feedback), 'Testing failed, sent back for rework').then(() => { setShowFailTest(false); setFeedback(''); })}
                  disabled={!feedback.trim() || !!actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#dc2626' }}>
                  Report Failure
                </button>
                <button onClick={() => setShowFailTest(false)}
                  className="px-4 py-2.5 rounded-xl text-sm border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
