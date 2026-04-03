"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, Search, Edit2, UserX, X, Check,
  Mail, Phone, Building, Briefcase, RefreshCw, AlertCircle,
  ShieldCheck, ArrowRight, Loader2
, ArrowLeft} from 'lucide-react';
import { getEmployees, getDepartments, createEmployee, updateEmployee, deactivateEmployee, sendEmployeeOtp, verifyEmployeeOtp } from '@/lib/employees-api';

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

const STATUS_STYLE: Record<string, { label: string; dot: string; text: string }> = {
  ACTIVE:   { label: 'Active',   dot: '#00875A', text: '#00875A' },
  INACTIVE: { label: 'Inactive', dot: '#DE350B', text: '#DE350B' },
  PENDING:  { label: 'Pending',  dot: '#FF8B00', text: '#FF8B00' },
};

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

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    const role = (u.roles?.[0] || '').toUpperCase();
    if (!['MANAGER', 'ADMIN'].includes(role)) { router.push('/dashboard'); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [emp, depts] = await Promise.all([getEmployees(), getDepartments()]);
      setEmployees(Array.isArray(emp) ? emp : []);
      // Only override hardcoded list if API returns valid data
      if (Array.isArray(depts) && depts.length > 0) setDepartments(depts);
    } catch {}
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  function openAddModal() {
    setAddStep('email');
    setAddEmail('');
    setAddOtp('');
    setAddForm({ name: '', email: '', phone: '', department: '', designation: '' });
    setShowAdd(true);
  }

  function startCooldown() {
    setOtpCooldown(60);
    const t = setInterval(() => setOtpCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.endsWith('@gmail.com')) { showToast('Only @gmail.com addresses are allowed'); return; }
    setSubmitting(true);
    try {
      const res = await sendEmployeeOtp(addEmail);
      if (res.statusCode && res.statusCode >= 400) {
        showToast(res.message || 'Failed to send OTP');
      } else {
        setAddStep('otp');
        startCooldown();
        showToast('OTP sent to employee email');
      }
    } catch { showToast('Failed to send OTP — check API connection'); }
    setSubmitting(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (addOtp.length !== 6) { showToast('Enter the 6-digit OTP'); return; }
    setSubmitting(true);
    try {
      const res = await verifyEmployeeOtp(addEmail, addOtp);
      if (res.statusCode && res.statusCode >= 400) {
        showToast(res.message || 'Invalid OTP');
      } else {
        setAddForm(f => ({ ...f, email: addEmail }));
        setAddStep('details');
      }
    } catch { showToast('OTP verification failed'); }
    setSubmitting(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name || !addForm.department || !addForm.designation) return;
    setSubmitting(true);
    try {
      const res = await createEmployee({ ...addForm, email: addEmail });
      if (res.statusCode && res.statusCode >= 400) {
        showToast(res.message || 'Failed to create employee');
      } else {
        showToast(res.message || 'Employee created successfully');
        setShowAdd(false);
        setAddForm({ name: '', email: '', phone: '', department: '', designation: '' });
        load();
      }
    } catch { showToast('Error creating employee'); }
    setSubmitting(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateEmployee(editTarget.id, editForm);
      showToast('Employee updated successfully');
      setEditTarget(null);
      load();
    } catch { showToast('Failed to update employee'); }
    setSubmitting(false);
  }

  async function handleDeactivate(emp: any) {
    if (!confirm(`Deactivate ${emp.name}? They will lose access to ESMP.`)) return;
    try {
      await deactivateEmployee(emp.id);
      showToast(`${emp.name} has been deactivated`);
      load();
    } catch { showToast('Failed to deactivate employee'); }
  }

  function openEdit(emp: any) {
    setEditTarget(emp);
    setEditForm({ name: emp.name, phone: emp.phone || '', department: emp.department, designation: emp.designation, status: emp.status });
  }

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || e.department === filterDept;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'ACTIVE').length,
    inactive: employees.filter(e => e.status === 'INACTIVE').length,
    pending: employees.filter(e => e.must_change_password).length,
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded shadow-2xl text-sm font-medium text-white"
          style={{ backgroundColor: '#172B4D', minWidth: 280 }}>
          <Check className="h-4 w-4 text-green-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Employee Management</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Create and manage employee accounts for your team</p>
          </div>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--jira-blue)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
          <UserPlus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.total, color: '#0052CC', bg: '#DEEBFF' },
          { label: 'Active', value: stats.active, color: '#00875A', bg: '#E3FCEF' },
          { label: 'Inactive', value: stats.inactive, color: '#DE350B', bg: '#FFEBE6' },
          { label: 'Awaiting Password Change', value: stats.pending, color: '#FF8B00', bg: '#FFFAE6' },
        ].map(c => (
          <div key={c.label} className="rounded p-4" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="border rounded px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button onClick={load} className="p-2 border rounded transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}>
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {employees.length === 0 ? 'No employees yet' : 'No employees match your filters'}
            </p>
            {employees.length === 0 && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Click "Add Employee" to create the first employee account
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg-surface-2)' }}>
                  {['Employee', 'Department', 'Designation', 'Contact', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => {
                  const st = STATUS_STYLE[emp.status] || STATUS_STYLE.ACTIVE;
                  return (
                    <tr key={emp.id} style={{ borderBottom: `1px solid var(--border)` }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: 'var(--jira-blue)' }}>
                            {emp.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{emp.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{emp.department}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{emp.designation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {emp.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
                          <span className="text-xs font-semibold" style={{ color: st.text }}>{st.label}</span>
                          {emp.must_change_password && (
                            <span title="Awaiting first login" className="ml-1">
                              <AlertCircle className="h-3.5 w-3.5" style={{ color: '#FF8B00' }} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(emp.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(emp)} title="Edit"
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-3)'; e.currentTarget.style.color = 'var(--jira-blue)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {emp.status === 'ACTIVE' && (
                            <button onClick={() => handleDeactivate(emp)} title="Deactivate"
                              className="p-1.5 rounded transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#FFEBE6'; e.currentTarget.style.color = '#DE350B'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                              <UserX className="h-4 w-4" />
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

      {/* Add Employee Modal — 3 steps: Email → OTP → Details */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Add New Employee</h2>
              <button onClick={() => setShowAdd(false)}>
                <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {[{ label: 'Email', step: 'email' }, { label: 'Verify OTP', step: 'otp' }, { label: 'Details', step: 'details' }].map((s, i) => {
                const steps = ['email', 'otp', 'details'];
                const current = steps.indexOf(addStep);
                const isDone = i < current;
                const isActive = i === current;
                return (
                  <div key={s.step} className="flex items-center gap-1.5 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDone ? 'bg-green-500 text-white' : isActive ? 'text-white' : 'text-[#97A0AF]'}`}
                      style={{ backgroundColor: isDone ? '#00875A' : isActive ? 'var(--jira-blue)' : 'var(--bg-surface-3)' }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className="text-xs font-medium" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
                    {i < 2 && <div className="flex-1 h-px" style={{ background: isDone ? '#00875A' : 'var(--border)' }} />}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Email */}
            {addStep === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Enter the employee's Gmail address. An OTP will be sent to verify it.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Employee Gmail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    <input required type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                      placeholder="employee@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 border rounded text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 rounded text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--jira-blue)' }}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {submitting ? 'Sending...' : 'Send OTP'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-2.5 rounded text-sm border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </form>
            )}

            {/* Step 2: OTP */}
            {addStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Enter the 6-digit OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{addEmail}</strong>
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Verification Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={addOtp}
                    onChange={e => setAddOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border rounded text-2xl font-bold text-center tracking-[0.5em] outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--jira-blue)' }} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Check the employee's Gmail inbox and spam folder.</p>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting || addOtp.length !== 6}
                    className="flex-1 py-2.5 rounded text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--jira-blue)' }}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {submitting ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button type="button" onClick={async () => {
                    if (otpCooldown > 0 || submitting) return;
                    setSubmitting(true);
                    try {
                      await sendEmployeeOtp(addEmail);
                      startCooldown();
                      showToast('OTP resent');
                    } catch { showToast('Failed to resend OTP'); }
                    setSubmitting(false);
                  }} disabled={otpCooldown > 0 || submitting}
                    className="px-4 py-2.5 rounded text-sm border disabled:opacity-40"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Resend'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Details */}
            {addStep === 'details' && (
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="flex items-center gap-2 p-2.5 rounded" style={{ background: '#E3FCEF', border: '1px solid #00875A' }}>
                  <Check className="h-4 w-4 shrink-0" style={{ color: '#00875A' }} />
                  <p className="text-xs font-semibold" style={{ color: '#00875A' }}>Email verified: {addEmail}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="John Smith"
                        className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                      <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 555 0000"
                        className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Department *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                      <select required value={addForm.department} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        <option value="">Select department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Designation *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                      <select required value={addForm.designation} onChange={e => setAddForm(f => ({ ...f, designation: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        <option value="">Select designation</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="rounded p-3 flex items-start gap-2" style={{ background: '#DEEBFF', border: '1px solid #4C9AFF' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#0052CC' }} />
                  <p className="text-xs" style={{ color: '#0052CC' }}>
                    A temporary password will be generated and emailed to the employee. Role is automatically set to <strong>Employee</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 rounded text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--jira-blue)' }}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    {submitting ? 'Creating...' : 'Create Employee Account'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-2.5 rounded text-sm border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Edit Employee</h2>
              <button onClick={() => setEditTarget(null)}>
                <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Department</label>
                  <select value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Designation</label>
                  <select value={editForm.designation} onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 rounded text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--jira-blue)' }}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 py-2 rounded text-sm border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
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
