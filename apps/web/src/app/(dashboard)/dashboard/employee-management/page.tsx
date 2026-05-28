"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, Search, Edit2, UserX, X, Check,
  Mail, Phone, Building, Briefcase, RefreshCw, AlertCircle,
  ShieldCheck, ArrowRight, Loader2, ArrowLeft, ChevronRight,
  Shield, Zap, Activity, Globe, MoreHorizontal, CheckCircle2,
  Lock, Terminal
} from 'lucide-react';
import { getEmployees, getDepartments, createEmployee, updateEmployee, deactivateEmployee, sendEmployeeOtp, verifyEmployeeOtp } from '@/lib/employees-api';
import { cn } from '@/lib/utils';

const DESIGNATIONS = [
  'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager',
  'QA Engineer', 'DevOps Engineer', 'UI/UX Designer', 'Product Manager',
  'HR Manager', 'HR Executive', 'Finance Analyst', 'Finance Manager',
  'Marketing Executive', 'Sales Executive', 'Operations Manager',
  'IT Support', 'System Administrator', 'Data Analyst', 'Business Analyst',
];

const DEPARTMENTS = [
  'Engineering', 'HR', 'Finance', 'Marketing', 'Operations',
  'Sales', 'Design', 'Legal', 'IT', 'Support',
];

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE:   { label: 'ACTIVE',   bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  INACTIVE: { label: 'INACTIVE', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
  PENDING:  { label: 'PENDING',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
};

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

export default function EmployeeManagementPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addStep, setAddStep] = useState<'email' | 'otp' | 'details'>('email');
  const [addEmail, setAddEmail] = useState('');
  const [addOtp, setAddOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', department: '', designation: '',
  });
  const [editForm, setEditForm] = useState({
    name: '', phone: '', department: '', designation: '', status: 'ACTIVE',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emp, depts] = await Promise.all([getEmployees(), getDepartments()]);
      setEmployees(Array.isArray(emp) ? emp : []);
      if (Array.isArray(depts) && depts.length > 0) setDepartments(depts);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    const role = (u.roles?.[0] || '').toUpperCase();
    if (!['MANAGER', 'ADMIN'].includes(role)) { router.push('/dashboard'); return; }
    load();
  }, [load, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  function startCooldown() {
    setOtpCooldown(60);
    const t = setInterval(() => setOtpCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.endsWith('@gmail.com')) { showToast('Only Gmail addresses are allowed'); return; }
    setSubmitting(true);
    try {
      const res = await sendEmployeeOtp(addEmail);
      if (res.statusCode && res.statusCode >= 400) {
        showToast(res.message || 'Failed to send verification code');
      } else {
        setAddStep('otp');
        startCooldown();
        showToast('Verification code sent!');
      }
    } catch { showToast('Failed to send email. Please try again.'); }
    finally { setSubmitting(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (addOtp.length !== 6) { showToast('Please enter the 6-digit code'); return; }
    setSubmitting(true);
    try {
      const res = await verifyEmployeeOtp(addEmail, addOtp);
      if (res.statusCode && res.statusCode >= 400) {
        showToast(res.message || 'Verification failed. Please try again.');
      } else {
        setAddForm(f => ({ ...f, email: addEmail }));
        setAddStep('details');
        showToast('Email verified!');
      }
    } catch { showToast('Verification error. Please try again.'); }
    finally { setSubmitting(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name || !addForm.department || !addForm.designation) return;
    setSubmitting(true);
    try {
      const res = await createEmployee({ ...addForm, email: addEmail });
      if (res.statusCode && res.statusCode >= 400) {
        showToast(res.message || 'Failed to create employee account');
      } else {
        showToast('Employee added successfully!');
        setShowAdd(false);
        setAddForm({ name: '', email: '', phone: '', department: '', designation: '' });
        load();
      }
    } catch { showToast('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateEmployee(editTarget.id, editForm);
      showToast('Employee updated successfully!');
      setEditTarget(null);
      load();
    } catch { showToast('Failed to update employee'); }
    finally { setSubmitting(false); }
  }

  async function handleDeactivate(emp: any) {
    if (!confirm(`Deactivate ${emp.name}? They will lose access to the system.`)) return;
    try {
      await deactivateEmployee(emp.id);
      showToast('Employee deactivated');
      load();
    } catch { showToast('Failed to deactivate employee'); }
  }

  const filtered = employees.filter(e => {
    const ms = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const md = !filterDept || e.department === filterDept;
    const mt = !filterStatus || e.status === filterStatus;
    return ms && md && mt;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'ACTIVE').length,
    inactive: employees.filter(e => e.status === 'INACTIVE').length,
    pending: employees.filter(e => e.must_change_password).length,
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification Terminal */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-slate-900 text-white rounded-[3px] shadow-2xl animate-in slide-in-from-right-8 duration-300 border-l-4 border-l-[var(--color-primary)]">
          <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{toast}</span>
          <button onClick={() => setToast('')} className="ml-4 opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2.5 rounded-[3px] bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Employee Management</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Manage employee accounts, departments, and access</p>
          </div>
        </div>
        <button onClick={() => { setAddStep('email'); setShowAdd(true); }}
          className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
          <UserPlus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* High-Fidelity Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Employees', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', desc: 'Registered employee accounts' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Currently active employees' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', desc: 'Deactivated accounts' },
          { label: 'Pending Setup', value: stats.pending, icon: Lock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'Awaiting first login' },
        ].map(c => (
          <div key={c.label} className="card p-6 border-[var(--border)] hover:border-[var(--color-primary)] transition-all group">
            <div className="flex items-start justify-between mb-4">
                 <div className={cn("w-12 h-12 rounded-[3px] flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110", c.bg, c.border)}>
                    <c.icon className={cn("h-6 w-6", c.color)} />
                 </div>
                 <Zap className="h-4 w-4 text-slate-100 group-hover:text-blue-100 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{c.value}</p>
              <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest mt-1">{c.label}</p>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter mt-1 opacity-60">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Filter Terminal */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[320px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-[var(--border)] rounded-[3px] text-[11px] font-bold uppercase tracking-[0.2em] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] shadow-sm transition-all" />
        </div>
        <div className="relative group">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-primary)]" />
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="bg-white border border-[var(--border)] rounded-[3px] pl-12 pr-10 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none appearance-none cursor-pointer shadow-sm transition-all hover:bg-slate-50">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none rotate-90" />
        </div>
        <div className="relative group">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-primary)]" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-[var(--border)] rounded-[3px] pl-12 pr-10 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none appearance-none cursor-pointer shadow-sm transition-all hover:bg-slate-50">
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none rotate-90" />
        </div>
        <button onClick={load} className="p-4 bg-white border border-[var(--border)] rounded-[3px] text-slate-400 hover:text-[var(--color-primary)] hover:border-blue-300 transition-all shadow-sm">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Personnel Data Grid */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Loading...</span>
             </div>
        ) : filtered.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center opacity-30">
            <Users className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">No Employees Found</h3>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No employees match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
                  {['Employee', 'Department', 'Job Title', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(emp => {
                  const st = STATUS_STYLE[emp.status] || STATUS_STYLE.ACTIVE;
                  return (
                    <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[3px] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-black shadow-inner transition-transform group-hover:scale-110">
                            {emp.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-tight group-hover:text-[var(--color-primary)] transition-colors">{emp.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-tighter lowercase">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2.5">
                          <Building className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{emp.department}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{emp.designation}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {emp.phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="h-3.5 w-3.5 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{emp.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", st.bg, st.text, st.border)}>
                               {st.label}
                          </span>
                          {emp.must_change_password && (
                            <div title="Awaiting first login">
                               <Lock className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter tabular-nums">{new Date(emp.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditTarget(emp); setEditForm({ name: emp.name, phone: emp.phone || '', department: emp.department, designation: emp.designation, status: emp.status }); }}
                            className="p-2 rounded-[2px] bg-white border border-[var(--border)] text-slate-400 hover:text-[var(--color-primary)] hover:border-blue-300 transition-all shadow-sm">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {emp.status === 'ACTIVE' && (
                            <button onClick={() => handleDeactivate(emp)}
                              className="p-2 rounded-[2px] bg-red-50 border border-red-100 text-red-400 hover:text-red-700 hover:bg-red-100 transition-all shadow-sm">
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recruitment Modal — Multi-Step Auth Flow */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <div>
                  <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                      <UserPlus className="h-4 w-4 text-[var(--color-primary)]" /> Add New Employee
                  </h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-[3px] hover:bg-white border border-transparent transition-all">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Tactical Step Indicator */}
            <div className="px-10 py-6 bg-slate-50/50 flex items-center gap-4">
              {[
                  { id: 'email', icon: Mail, label: 'Email' },
                  { id: 'otp', icon: ShieldCheck, label: 'Verify' },
                  { id: 'details', icon: Users, label: 'Details' }
              ].map((s, i) => {
                const steps = ['email', 'otp', 'details'];
                const current = steps.indexOf(addStep);
                const isDone = i < current;
                const isActive = i === current;
                return (
                  <div key={s.id} className="flex items-center gap-3 flex-1 last:flex-none">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all border-2 shadow-sm",
                        isDone ? "bg-emerald-500 border-emerald-500 text-white" : isActive ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white scale-110 shadow-lg" : "bg-white border-slate-200 text-slate-300"
                    )}>
                      {isDone ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    {i < 2 && <div className={cn("flex-1 h-0.5 rounded-full mx-2", isDone ? "bg-emerald-500" : "bg-slate-200")} />}
                  </div>
                );
              })}
            </div>

            <div className="p-10">
                {addStep === 'email' && (
                  <form onSubmit={handleSendOtp} className="space-y-6">
                    <div>
                         <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Enter Email Address</h3>
                         <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Only Gmail addresses are accepted</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Gmail Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input required type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                          placeholder="employee@gmail.com"
                          className={cn(inputClass, "pl-12 lowercase")} />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={submitting}
                        className="jira-button jira-button-primary h-12 flex-1 gap-3 font-bold uppercase text-[10px] disabled:opacity-50">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Send Verification Code
                      </button>
                      <button type="button" onClick={() => setShowAdd(false)} className="jira-button border border-[var(--border)] h-12 flex-1 bg-white text-[var(--text-muted)] font-bold uppercase text-[10px]">Cancel</button>
                    </div>
                  </form>
                )}

                {addStep === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="text-center">
                         <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                              <ShieldCheck className="h-8 w-8 text-[var(--color-primary)]" />
                         </div>
                         <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Check Your Email</h3>
                         <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">We sent a 6-digit code to {addEmail}</p>
                    </div>
                    <div className="space-y-1.5 text-center">
                      <label className={labelClass}>Verification Code</label>
                      <input type="text" inputMode="numeric" maxLength={6} value={addOtp}
                        onChange={e => setAddOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full bg-slate-50 border border-[var(--border)] rounded-[3px] py-4 text-3xl font-black text-center tracking-[0.6em] outline-none focus:border-[var(--color-primary)] text-[var(--color-primary)]" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={submitting || addOtp.length !== 6}
                        className="jira-button jira-button-primary h-12 flex-1 gap-3 font-bold uppercase text-[10px] disabled:opacity-50">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                        Verify Code
                      </button>
                      <button type="button" onClick={async () => {
                        if (otpCooldown > 0 || submitting) return;
                        setSubmitting(true);
                        try { await sendEmployeeOtp(addEmail); startCooldown(); showToast('New code sent!'); } catch { } finally { setSubmitting(false); }
                      }} disabled={otpCooldown > 0 || submitting}
                        className="jira-button border border-[var(--border)] h-12 flex-1 bg-white text-[var(--text-muted)] font-bold uppercase text-[10px] disabled:opacity-30">
                        {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                )}

                {addStep === 'details' && (
                  <form onSubmit={handleAdd} className="space-y-6">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[3px] flex items-center gap-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div>
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Email Verified</p>
                          <p className="text-[11px] font-bold text-emerald-600 tracking-tight">{addEmail}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Full Name *</label>
                        <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Full name" className={cn(inputClass, "uppercase")} />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Phone Number</label>
                        <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+1 555 0000" className={inputClass} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Department *</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                          <select required value={addForm.department} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))}
                            className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                            <option value="">Select department</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 rotate-90" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Job Title *</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                          <select required value={addForm.designation} onChange={e => setAddForm(f => ({ ...f, designation: e.target.value }))}
                            className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                            <option value="">Select job title</option>
                            {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-[3px] border-l-4 border-l-blue-500">
                      <p className="text-sm font-medium text-blue-700 leading-relaxed">
                        Login credentials will be generated and sent to the employee's email address.
                      </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={submitting}
                        className="jira-button jira-button-primary h-12 flex-1 gap-3 font-bold uppercase text-[10px] disabled:opacity-50">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Add Employee
                      </button>
                      <button type="button" onClick={() => setShowAdd(false)} className="jira-button border border-[var(--border)] h-12 flex-1 bg-white text-[var(--text-muted)] font-bold uppercase text-[10px]">Cancel</button>
                    </div>
                  </form>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Registry Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                  <Edit2 className="h-4 w-4 text-[var(--color-primary)]" /> Update Record
              </h2>
              <button onClick={() => setEditTarget(null)} className="p-1 px-1.5 hover:bg-white border border-transparent rounded-[3px]">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className={labelClass}>Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={cn(inputClass, "uppercase")} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Phone Number</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Department</label>
                  <select value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                    className={cn(inputClass, "appearance-none bg-slate-50")}>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Job Title</label>
                  <select value={editForm.designation} onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))}
                    className={cn(inputClass, "appearance-none bg-slate-50")}>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className={cn(inputClass, "appearance-none bg-slate-50")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button type="submit" disabled={submitting}
                  className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditTarget(null)}
                  className="jira-button border border-[var(--border)] h-12 flex-1 font-bold uppercase text-[10px] bg-white text-[var(--text-muted)]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
